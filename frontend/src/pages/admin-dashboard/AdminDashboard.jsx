import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({});
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const storedAdminData = localStorage.getItem('adminData');
    if (storedAdminData) {
      setAdminData(JSON.parse(storedAdminData));
    }
    fetchDashboardStats();
    fetchBotBookings();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/admin/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setStats(response.data.stats);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchBotBookings = async (status = 'all') => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/admin/bookings?status=${status}&limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setBookings(response.data.bookings);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to fetch bookings');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setLoading(true);
    fetchBotBookings(tab);
  };

  const handleStatusUpdate = async (bookingId, newStatus, rejectionReason = '', adminNotes = '') => {
    setActionLoading(prev => ({ ...prev, [bookingId]: true }));
    setActionError('');
    setActionSuccess('');

    try {
      const fastApiBase = import.meta.env.VITE_FAST_API_BASE || 'http://localhost:8000';
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const token = localStorage.getItem('adminToken');
      
      // Step 1: Update status in local database first
      await axios.post(`${backendUrl}/api/admin/bookings/update-status`, 
        { booking_id: bookingId, status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Step 2: Update status and send notifications via Fast API
      const requestBody = {
        booking_id: bookingId,
        status: newStatus,
        admin_notes: adminNotes || `Booking ${newStatus.toLowerCase()} by admin`
      };

      // Add rejection reason for cancelled bookings
      if (newStatus === 'Cancelled' && rejectionReason) {
        requestBody.rejection_reason = rejectionReason;
      }

      try {
        const response = await axios.post(`${fastApiBase}/api/admin/bookings/update-status`, 
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.success) {
          const notificationMsg = response.data.user_notified 
            ? ` User notified via ${response.data.notification_method}.`
            : ' No user notification sent.';
          setActionSuccess(`Booking status updated to ${response.data.booking_status} successfully!${notificationMsg}`);
        } else {
          console.warn('Fast API update failed but local status updated:', response.data.error);
          setActionSuccess(`Booking status updated to ${newStatus} successfully! (Notification may have failed)`);
        }
      } catch (fastApiError) {
        console.warn('Fast API notification failed:', fastApiError);
        setActionSuccess(`Booking status updated to ${newStatus} successfully! (User notification failed - please check Fast API backend)`);
      }

      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
      
      // Reload the page to ensure fresh data
      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.log('Error updating booking status:', err);
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
      
      if (err.response?.data?.detail) {
        setActionError(err.response.data.detail);
      } else if (err.response?.data?.error) {
        setActionError(err.response.data.error);
      } else if (err.message) {
        setActionError(err.message);
      } else if (err.response) {
        setActionError('Failed to update booking status. Please try again.');
      } else if (err.request) {
        setActionError('Network error. Please check your connection and try again.');
      } else {
        setActionError('An unexpected error occurred. Please try again.');
      }
    }
  };

  const handleRejectBooking = (bookingId) => {
    setRejectBookingId(bookingId);
    setRejectionReason('');
    setAdminNotes('');
    setShowRejectModal(true);
  };

  const handleConfirmBooking = (bookingId) => {
    handleStatusUpdate(bookingId, 'Confirmed', '', 'Booking confirmed by admin');
  };

  // Helper functions for common status updates
  const confirmBooking = async (bookingId, adminNotes = '') => {
    return await handleStatusUpdate(bookingId, 'Confirmed', '', adminNotes);
  };

  const cancelBooking = async (bookingId, rejectionReason, adminNotes = '') => {
    return await handleStatusUpdate(bookingId, 'Cancelled', rejectionReason, adminNotes);
  };

  const markBookingCompleted = async (bookingId, adminNotes = '') => {
    return await handleStatusUpdate(bookingId, 'Completed', '', adminNotes);
  };

  const resetBookingToPending = async (bookingId, adminNotes = '') => {
    return await handleStatusUpdate(bookingId, 'Pending', '', adminNotes);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      setActionError('Please enter a rejection reason');
      return;
    }

    setShowRejectModal(false);
    await handleStatusUpdate(rejectBookingId, 'Cancelled', rejectionReason, adminNotes);
  };

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectBookingId('');
    setRejectionReason('');
    setAdminNotes('');
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    window.location.href = '/admin-login';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return '#10b981';
      case 'pending':
        return '#f59e0b';
      case 'cancelled':
        return '#ef4444';
      case 'completed':
        return '#3b82f6';
      default:
        return '#64748b';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && bookings.length === 0) {
    return (
      <div className="admin-dashboard-page-loading">
        <div className="admin-dashboard-page-loading-spinner">
          <div className="admin-dashboard-page-spinner"></div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard-page-error">
        <div className="admin-dashboard-page-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="admin-dashboard-page-retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page-container">
      {/* Header */}
      <div className="admin-dashboard-page-header">
        <div className="admin-dashboard-page-header-content">
          <div className="admin-dashboard-page-header-left">
            <h1 className="admin-dashboard-page-title">Admin Dashboard</h1>
            <p className="admin-dashboard-page-subtitle">
              Welcome back, {adminData?.username} - Bot Bookings Management
            </p>
          </div>
          <div className="admin-dashboard-page-header-right">
            <button onClick={handleLogout} className="admin-dashboard-page-logout-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="admin-dashboard-page-stats">
        <div className="admin-dashboard-page-stats-grid">
          <div className="admin-dashboard-page-stat-card">
            <div className="admin-dashboard-page-stat-number">{stats.total || 0}</div>
            <div className="admin-dashboard-page-stat-label">Total Bot Bookings</div>
          </div>
          <div className="admin-dashboard-page-stat-card">
            <div className="admin-dashboard-page-stat-number">{stats.pending || 0}</div>
            <div className="admin-dashboard-page-stat-label">Pending</div>
          </div>
          <div className="admin-dashboard-page-stat-card">
            <div className="admin-dashboard-page-stat-number">{stats.confirmed || 0}</div>
            <div className="admin-dashboard-page-stat-label">Confirmed</div>
          </div>
          <div className="admin-dashboard-page-stat-card">
            <div className="admin-dashboard-page-stat-number">{stats.completed || 0}</div>
            <div className="admin-dashboard-page-stat-label">Completed</div>
          </div>
          <div className="admin-dashboard-page-stat-card">
            <div className="admin-dashboard-page-stat-number">{stats.cancelled || 0}</div>
            <div className="admin-dashboard-page-stat-label">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-dashboard-page-tabs">
        <button 
          className={`admin-dashboard-page-tab-button ${activeTab === 'all' ? 'admin-dashboard-page-active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Bookings ({stats.total || 0})
        </button>
        <button 
          className={`admin-dashboard-page-tab-button ${activeTab === 'pending' ? 'admin-dashboard-page-active' : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          Pending ({stats.pending || 0})
        </button>
        <button 
          className={`admin-dashboard-page-tab-button ${activeTab === 'confirmed' ? 'admin-dashboard-page-active' : ''}`}
          onClick={() => handleTabChange('confirmed')}
        >
          Confirmed ({stats.confirmed || 0})
        </button>
        <button 
          className={`admin-dashboard-page-tab-button ${activeTab === 'completed' ? 'admin-dashboard-page-active' : ''}`}
          onClick={() => handleTabChange('completed')}
        >
          Completed ({stats.completed || 0})
        </button>
        <button 
          className={`admin-dashboard-page-tab-button ${activeTab === 'cancelled' ? 'admin-dashboard-page-active' : ''}`}
          onClick={() => handleTabChange('cancelled')}
        >
          Cancelled ({stats.cancelled || 0})
        </button>
      </div>

      {/* Success/Error Messages */}
      {(actionSuccess || actionError) && (
        <div className="admin-dashboard-page-messages">
          {actionSuccess && (
            <div className="admin-dashboard-page-success-message">
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="admin-dashboard-page-error-message">
              {actionError}
            </div>
          )}
        </div>
      )}

      {/* Bookings Content */}
      <div className="admin-dashboard-page-content">
        {loading ? (
          <div className="admin-dashboard-page-loading-content">
            <div className="admin-dashboard-page-spinner"></div>
            <span>Loading bookings...</span>
          </div>
        ) : bookings.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="admin-dashboard-page-table-container">
              <table className="admin-dashboard-page-table">
                <thead className="admin-dashboard-page-table-header">
                  <tr>
                    <th className="admin-dashboard-page-table-th">Booking ID</th>
                    <th className="admin-dashboard-page-table-th">Status</th>
                    <th className="admin-dashboard-page-table-th">Customer</th>
                    <th className="admin-dashboard-page-table-th">Property</th>
                    <th className="admin-dashboard-page-table-th">Date & Shift</th>
                    <th className="admin-dashboard-page-table-th">Total Cost</th>
                    <th className="admin-dashboard-page-table-th">Booked At</th>
                  </tr>
                </thead>
                <tbody className="admin-dashboard-page-table-body">
                  {bookings.map((booking) => (
                    <tr 
                      key={booking.booking_id} 
                      className="admin-dashboard-page-table-row" 
                      onClick={() => setSelectedBooking(booking)} 
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="admin-dashboard-page-table-td">
                        <span className="admin-dashboard-page-booking-id">#{booking.booking_id}</span>
                      </td>
                      <td className="admin-dashboard-page-table-td">
                        <span 
                          className="admin-dashboard-page-status-badge"
                          style={{ backgroundColor: getStatusColor(booking.status) }}
                        >
                          {booking.status || 'Unknown'}
                        </span>
                      </td>
                      <td className="admin-dashboard-page-table-td">
                        <div className="admin-dashboard-page-customer-info">
                          <div className="admin-dashboard-page-customer-name">{booking.user_name}</div>
                          <div className="admin-dashboard-page-customer-email">{booking.user_email}</div>
                        </div>
                      </td>
                      <td className="admin-dashboard-page-table-td">
                        <div className="admin-dashboard-page-property-info">
                          <div className="admin-dashboard-page-property-name">{booking.property_name}</div>
                          <div className="admin-dashboard-page-property-location">{booking.property_location}</div>
                        </div>
                      </td>
                      <td className="admin-dashboard-page-table-td">
                        <div className="admin-dashboard-page-booking-details">
                          <div className="admin-dashboard-page-booking-date">{formatDate(booking.booking_date)}</div>
                          <div className="admin-dashboard-page-booking-shift">{booking.shift_type}</div>
                        </div>
                      </td>
                      <td className="admin-dashboard-page-table-td">
                        <span className="admin-dashboard-page-cost">Rs. {booking.total_cost?.toLocaleString() || '0'}</span>
                      </td>
                      <td className="admin-dashboard-page-table-td">
                        {formatDateTime(booking.booked_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="admin-dashboard-page-mobile-list">
              {bookings.map((booking) => (
                <div
                  key={booking.booking_id}
                  className="admin-dashboard-page-mobile-card"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="admin-dashboard-page-mobile-header">
                    <span className="admin-dashboard-page-booking-id">#{booking.booking_id}</span>
                    <span 
                      className="admin-dashboard-page-status-badge"
                      style={{ backgroundColor: getStatusColor(booking.status) }}
                    >
                      {booking.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="admin-dashboard-page-mobile-content">
                    <div className="admin-dashboard-page-mobile-row">
                      <span className="admin-dashboard-page-mobile-label">Customer:</span>
                      <span className="admin-dashboard-page-mobile-value">{booking.user_name}</span>
                    </div>
                    <div className="admin-dashboard-page-mobile-row">
                      <span className="admin-dashboard-page-mobile-label">Property:</span>
                      <span className="admin-dashboard-page-mobile-value">{booking.property_name}</span>
                    </div>
                    <div className="admin-dashboard-page-mobile-row">
                      <span className="admin-dashboard-page-mobile-label">Date:</span>
                      <span className="admin-dashboard-page-mobile-value">{formatDate(booking.booking_date)}</span>
                    </div>
                    <div className="admin-dashboard-page-mobile-row">
                      <span className="admin-dashboard-page-mobile-label">Cost:</span>
                      <span className="admin-dashboard-page-mobile-value">Rs. {booking.total_cost?.toLocaleString() || '0'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="admin-dashboard-page-no-bookings">
            <div className="admin-dashboard-page-no-data-content">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C6.46957 5 5.96086 5.21071 5.58579 5.58579C5.21071 5.96086 5 6.46957 5 7V19C5 19.5304 5.21071 20.0391 5.58579 20.4142C5.96086 20.7893 6.46957 21 7 21H17C17.5304 21 18.0391 20.7893 18.4142 20.4142C18.7893 20.0391 19 19.5304 19 19V7C19 6.46957 18.7893 5.96086 18.4142 5.58579C18.0391 5.21071 17.5304 5 17 5H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 5C9 4.46957 9.21071 3.96086 9.58579 3.58579C9.96086 3.21071 10.4696 3 11 3H13C13.5304 3 14.0391 3.21071 14.4142 3.58579C14.7893 3.96086 15 4.46957 15 5C15 5.53043 14.7893 6.03914 14.4142 6.41421C14.0391 6.78929 13.5304 7 13 7H11C10.4696 7 9.96086 6.78929 9.58579 6.41421C9.21071 6.03914 9 5.53043 9 5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No Bot Bookings Found</h3>
              <p>
                {activeTab === 'all' 
                  ? 'No bot bookings have been made yet.'
                  : `No ${activeTab} bot bookings found.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="admin-dashboard-page-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="admin-dashboard-page-modal admin-dashboard-page-enhanced-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-dashboard-page-modal-header">
              <h2>Bot Booking Details</h2>
              <button 
                className="admin-dashboard-page-modal-close" 
                onClick={() => setSelectedBooking(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="admin-dashboard-page-details-body">
              {/* Customer Information */}
              <div className="admin-dashboard-page-details-section">
                <h3 className="admin-dashboard-page-section-title">Customer Information</h3>
                <div className="admin-dashboard-page-details-grid">
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Name</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.user_name || 'N/A'}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Email</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.user_email || 'N/A'}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">CNIC</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.user_cnic || 'N/A'}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Phone</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.user_phone_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="admin-dashboard-page-details-section">
                <h3 className="admin-dashboard-page-section-title">Booking Information</h3>
                <div className="admin-dashboard-page-details-grid">
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Booking ID</span>
                    <span className="admin-dashboard-page-details-value admin-dashboard-page-booking-id">#{selectedBooking.booking_id}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Property</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.property_name}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Location</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.property_location}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Booking Date</span>
                    <span className="admin-dashboard-page-details-value">{formatDate(selectedBooking.booking_date)}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Shift Type</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.shift_type || 'Not specified'}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Total Cost</span>
                    <span className="admin-dashboard-page-details-value admin-dashboard-page-cost-large">
                      Rs. {selectedBooking.total_cost?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Source</span>
                    <span className="admin-dashboard-page-details-value">{selectedBooking.booking_source}</span>
                  </div>
                  <div className="admin-dashboard-page-details-item">
                    <span className="admin-dashboard-page-details-label">Booked At</span>
                    <span className="admin-dashboard-page-details-value">{formatDateTime(selectedBooking.booked_at)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Screenshot */}
              {selectedBooking.payment_screenshot_url && (
                <div className="admin-dashboard-page-details-section">
                  <h3 className="admin-dashboard-page-section-title">Payment Screenshot</h3>
                  <div className="admin-dashboard-page-payment-screenshot">
                    <img 
                      src={selectedBooking.payment_screenshot_url} 
                      alt="Payment Screenshot" 
                      className="admin-dashboard-page-screenshot-image"
                      onClick={() => window.open(selectedBooking.payment_screenshot_url, '_blank')}
                    />
                    <p className="admin-dashboard-page-screenshot-hint">Click image to view full size</p>
                  </div>
                </div>
              )}

              {/* Status Management */}
              <div className="admin-dashboard-page-details-section">
                <h3 className="admin-dashboard-page-section-title">Status Management</h3>
                <div className="admin-dashboard-page-status-management">
                  <div className="admin-dashboard-page-current-status">
                    <span className="admin-dashboard-page-details-label">Current Status:</span>
                    <span 
                      className="admin-dashboard-page-status-badge admin-dashboard-page-status-large"
                      style={{ backgroundColor: getStatusColor(selectedBooking.status) }}
                    >
                      {selectedBooking.status || 'Unknown'}
                    </span>
                  </div>
                  <div className="admin-dashboard-page-status-actions">
                    <button
                      onClick={() => resetBookingToPending(selectedBooking.booking_id)}
                      disabled={selectedBooking.status === 'Pending' || actionLoading[selectedBooking.booking_id]}
                      className="admin-dashboard-page-status-btn admin-dashboard-page-pending-btn"
                    >
                      Set Pending
                    </button>
                    <button
                      onClick={() => handleConfirmBooking(selectedBooking.booking_id)}
                      disabled={selectedBooking.status === 'Confirmed' || actionLoading[selectedBooking.booking_id]}
                      className="admin-dashboard-page-status-btn admin-dashboard-page-confirmed-btn"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleRejectBooking(selectedBooking.booking_id)}
                      disabled={selectedBooking.status === 'Cancelled' || actionLoading[selectedBooking.booking_id]}
                      className="admin-dashboard-page-status-btn admin-dashboard-page-cancelled-btn"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => markBookingCompleted(selectedBooking.booking_id)}
                      disabled={selectedBooking.status === 'Completed' || actionLoading[selectedBooking.booking_id]}
                      className="admin-dashboard-page-status-btn admin-dashboard-page-completed-btn"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              </div>

              <div className="admin-dashboard-page-details-footer">
                <button className="admin-dashboard-page-back-button" onClick={() => setSelectedBooking(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="admin-dashboard-page-modal-overlay">
          <div className="admin-dashboard-page-modal">
            <div className="admin-dashboard-page-modal-header">
              <h3>Reject Booking</h3>
              <button onClick={closeRejectModal} className="admin-dashboard-page-modal-close">×</button>
            </div>
            <div className="admin-dashboard-page-modal-body">
              <div className="admin-dashboard-page-form-group">
                <label>Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter rejection reason..."
                  required
                  rows="3"
                  className="admin-dashboard-page-textarea"
                />
              </div>
              <div className="admin-dashboard-page-form-group">
                <label>Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Additional notes..."
                  rows="2"
                  className="admin-dashboard-page-textarea"
                />
              </div>
            </div>
            <div className="admin-dashboard-page-modal-footer">
              <button onClick={closeRejectModal} className="admin-dashboard-page-btn-secondary">
                Cancel
              </button>
              <button 
                onClick={submitRejection} 
                className="admin-dashboard-page-btn-danger"
                disabled={!rejectionReason.trim()}
              >
                Reject Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;