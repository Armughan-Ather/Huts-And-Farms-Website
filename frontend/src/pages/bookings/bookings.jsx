import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  // Filters & sorting
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterShift, setFilterShift] = useState('');
  const [sortOrder, setSortOrder] = useState('closest');
  // Row selection for details
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Form state - keeping for potential future use

  useEffect(() => {
    fetchBookings();
  }, []);

  // One-time completion trigger
  useEffect(() => {
    const completePastBookings = async () => {
      try {
        const token = localStorage.getItem('propertyToken');
        if (!token) return;
        
        // Get property_id from URL parameters if present (for owner access)
        const urlParams = new URLSearchParams(window.location.search);
        let propertyId = urlParams.get('property_id');
        
        // If no property_id in URL, try to get it from stored property data (for owner access)
        if (!propertyId) {
          const propertyData = localStorage.getItem('propertyData');
          if (propertyData) {
            try {
              const parsedPropertyData = JSON.parse(propertyData);
              propertyId = parsedPropertyData.property_id;
            } catch (e) {
              console.log('Error parsing property data:', e);
            }
          }
        }
        
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const requestBody = propertyId ? { property_id: propertyId } : {};
        
        await axios.post(`${backendUrl}/api/bookings/complete`, requestBody, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        // Refresh after completion attempt
        fetchBookings();
      } catch (e) {
        // Silent fail to avoid blocking page
        console.log('Complete bookings check failed:', e?.response?.data || e.message);
      }
    };
    completePastBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('propertyToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      // Get property_id from URL parameters if present (for owner access)
      const urlParams = new URLSearchParams(window.location.search);
      let propertyId = urlParams.get('property_id');
      
      // If no property_id in URL, try to get it from stored property data (for owner access)
      if (!propertyId) {
        const propertyData = localStorage.getItem('propertyData');
        if (propertyData) {
          try {
            const parsedPropertyData = JSON.parse(propertyData);
            propertyId = parsedPropertyData.property_id;
          } catch (e) {
            console.log('Error parsing property data:', e);
          }
        }
      }
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      let apiUrl = `${backendUrl}/api/bookings/`;
      
      // Add property_id parameter if present (for owner access)
      if (propertyId) {
        apiUrl += `?property_id=${propertyId}`;
        console.log('Making request with property_id:', propertyId);
      } else {
        console.log('Making request without property_id (will get all properties for owner)');
      }
      
      console.log('API URL:', apiUrl);
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setBookings(response.data.bookings);
      setLoading(false);
    } catch (err) {
      console.log('Error fetching bookings:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('propertyToken');
        localStorage.removeItem('propertyData');
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

  const handleBackToDashboard = () => {
    // Get property_id from URL parameters or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    let propertyId = urlParams.get('property_id');
    
    if (!propertyId) {
      const propertyData = localStorage.getItem('propertyData');
      if (propertyData) {
        try {
          const parsedPropertyData = JSON.parse(propertyData);
          propertyId = parsedPropertyData.property_id;
        } catch (e) {
          console.log('Error parsing property data:', e);
        }
      }
    }
    
    // Navigate to dashboard with property_id if available
    if (propertyId) {
      window.location.href = `/dashboard?property_id=${propertyId}`;
    } else {
      window.location.href = '/dashboard';
    }
  };

  const handleAddNewBooking = () => {
    window.location.href = '/add-booking';
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [bookingId]: true }));
    setActionError('');
    setActionSuccess('');

    try {
      const token = localStorage.getItem('propertyToken');
      if (!token) {
        setActionError('No authentication token found. Please login again.');
        setActionLoading(prev => ({ ...prev, [bookingId]: false }));
        return;
      }

      // Get property_id from URL parameters if present (for owner access)
      const urlParams = new URLSearchParams(window.location.search);
      let propertyId = urlParams.get('property_id');
      
      // If no property_id in URL, try to get it from stored property data (for owner access)
      if (!propertyId) {
        const propertyData = localStorage.getItem('propertyData');
        if (propertyData) {
          try {
            const parsedPropertyData = JSON.parse(propertyData);
            propertyId = parsedPropertyData.property_id;
          } catch (e) {
            console.log('Error parsing property data:', e);
          }
        }
      }

      // For non-Bot bookings: Use local backend (just update status, no notification)
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const requestBody = { booking_id: bookingId, status: newStatus };
      if (propertyId) {
        requestBody.property_id = propertyId;
      }

      await axios.post(`${backendUrl}/api/bookings/update-status-local`, 
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setActionSuccess(`Booking status updated to ${newStatus} successfully!`);
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
      
      // Update the selected booking if it's the same one
      if (selectedBooking && selectedBooking.booking_id === bookingId) {
        setSelectedBooking(prev => ({ ...prev, status: newStatus }));
      }
      
      // Refresh bookings list
      setTimeout(() => {
        fetchBookings();
        setActionSuccess('');
      }, 2000);

    } catch (err) {
      console.log('Error updating booking status:', err);
      setActionLoading(prev => ({ ...prev, [bookingId]: false }));
      
      if (err.response?.data?.error) {
        setActionError(err.response.data.error);
      } else if (err.response?.data?.details) {
        setActionError(err.response.data.details);
      } else if (err.response) {
        setActionError('Failed to update booking status. Please try again.');
      } else if (err.request) {
        setActionError('Network error. Please check your connection and try again.');
      } else {
        setActionError('An unexpected error occurred. Please try again.');
      }
    }
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

  const getShiftTypeColor = (shiftType) => {
    switch (shiftType?.toLowerCase()) {
      case 'day':
        return '#10b981';
      case 'night':
        return '#1e293b';
      case 'full day':
        return '#3b82f6';
      case 'full night':
        return '#8b5cf6';
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

  // Start with tab filter
  let filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status?.toLowerCase() === activeTab;
  });
  // Apply search/filters
  filteredBookings = filteredBookings.filter((booking) => {
    const email = (booking.user_email || booking.userEmail || '').toLowerCase();
    const phone = (booking.user_phone_number || booking.userPhoneNumber || '').toLowerCase();
    const emailMatch = filterEmail ? email.includes(filterEmail.toLowerCase()) : true;
    const phoneMatch = filterPhone ? phone.includes(filterPhone.toLowerCase()) : true;
    const dateMatch = filterDate ? (booking.booking_date ? new Date(booking.booking_date).toISOString().slice(0,10) === filterDate : false) : true;
    const shiftMatch = filterShift ? (booking.shift_type || '').toLowerCase() === filterShift.toLowerCase() : true;
    return emailMatch && phoneMatch && dateMatch && shiftMatch;
  });
  // Sort by booking_date
  filteredBookings.sort((a, b) => {
    const da = a.booking_date ? new Date(a.booking_date).getTime() : 0;
    const db = b.booking_date ? new Date(b.booking_date).getTime() : 0;
    return sortOrder === 'closest' ? da - db : db - da;
  });

  if (loading) {
    return (
      <div className="booking-page-loading">
        <div className="booking-page-loading-spinner">
          <div className="booking-page-spinner"></div>
          <span>Loading bookings...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="booking-page-error">
        <div className="booking-page-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="booking-page-retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page-container">
      {/* Header */}
      <div className="booking-page-header">
        <div className="booking-page-header-content">
          <div className="booking-page-header-left">
            <h1 className="booking-page-page-title">Property Bookings</h1>
            <p className="booking-page-page-subtitle">Manage and view all your property bookings</p>
          </div>
          <div className="booking-page-header-right">
            <button onClick={handleAddNewBooking} className="booking-page-add-booking-button">
              ➕ Add New Booking
            </button>
            <button onClick={handleBackToDashboard} className="booking-page-back-button">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>

      

      {/* Stats Cards */}
      <div className="booking-page-stats">
        <div className="booking-page-stats-grid">
          <div className="booking-page-stat-card">
            <div className="booking-page-stat-number">{bookings.length}</div>
            <div className="booking-page-stat-label">Total Bookings</div>
          </div>
          <div className="booking-page-stat-card">
            <div className="booking-page-stat-number">
              {bookings.filter(b => b.status?.toLowerCase() === 'confirmed').length}
            </div>
            <div className="booking-page-stat-label">Confirmed</div>
          </div>
          <div className="booking-page-stat-card">
            <div className="booking-page-stat-number">
              {bookings.filter(b => b.status?.toLowerCase() === 'pending').length}
            </div>
            <div className="booking-page-stat-label">Pending</div>
          </div>
          <div className="booking-page-stat-card">
            <div className="booking-page-stat-number">
              {bookings.filter(b => b.status?.toLowerCase() === 'completed').length}
            </div>
            <div className="booking-page-stat-label">Completed</div>
          </div>
          <div className="booking-page-stat-card">
            <div className="booking-page-stat-number">
              {bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length}
            </div>
            <div className="booking-page-stat-label">Cancelled</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="booking-page-tabs">
        <button 
          className={`booking-page-tab-button ${activeTab === 'all' ? 'booking-page-active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Bookings ({bookings.length})
        </button>
        <button 
          className={`booking-page-tab-button ${activeTab === 'confirmed' ? 'booking-page-active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          Confirmed ({bookings.filter(b => b.status?.toLowerCase() === 'confirmed').length})
        </button>
        <button 
          className={`booking-page-tab-button ${activeTab === 'pending' ? 'booking-page-active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending ({bookings.filter(b => b.status?.toLowerCase() === 'pending').length})
        </button>
        <button 
          className={`booking-page-tab-button ${activeTab === 'completed' ? 'booking-page-active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({bookings.filter(b => b.status?.toLowerCase() === 'completed').length})
        </button>
        <button 
          className={`booking-page-tab-button ${activeTab === 'cancelled' ? 'booking-page-active' : ''}`}
          onClick={() => setActiveTab('cancelled')}
        >
          Cancelled ({bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length})
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="booking-page-filters">
        <div className="booking-page-filters-inner">
          <div className="booking-page-filters-row">
            <input
              type="text"
              className="booking-page-filter-input"
              placeholder="Search by email"
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
            />
            <input
              type="text"
              className="booking-page-filter-input"
              placeholder="Search by phone"
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
            />
            <input
              type="date"
              className="booking-page-filter-input"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <select
              className="booking-page-filter-select"
              value={filterShift}
              onChange={(e) => setFilterShift(e.target.value)}
            >
              <option value="">All shifts</option>
              <option value="Day">Day</option>
              <option value="Night">Night</option>
              <option value="Full Day">Full Day</option>
              <option value="Full Night">Full Night</option>
            </select>
            <select
              className="booking-page-filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="closest">Sort: Closest date</option>
              <option value="farthest">Sort: Farthest date</option>
            </select>
            <button
              className="booking-page-filter-clear"
              onClick={() => { setFilterEmail(''); setFilterPhone(''); setFilterDate(''); setFilterShift(''); setSortOrder('closest'); }}
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {(actionSuccess || actionError) && (
        <div className="booking-page-messages">
          {actionSuccess && (
            <div className="booking-page-success-message">
              {actionSuccess}
            </div>
          )}
          {actionError && (
            <div className="booking-page-error-message">
              {actionError}
            </div>
          )}
        </div>
      )}

      {/* Bookings Table (Desktop/Tablet) */}
      <div className="booking-page-content">
        {filteredBookings.length > 0 ? (
          <>
            <div className="booking-page-table-container">
            <table className="booking-page-table">
              <thead className="booking-page-table-header">
                <tr>
                  <th className="booking-page-table-th">Booking ID</th>
                  <th className="booking-page-table-th">Status</th>
                  <th className="booking-page-table-th">Customer Email</th>
                  <th className="booking-page-table-th">Booking Date</th>
                  <th className="booking-page-table-th">Shift Type</th>
                  <th className="booking-page-table-th">Total Cost</th>
                  <th className="booking-page-table-th">Source</th>
                  <th className="booking-page-table-th">Booked At</th>
                </tr>
              </thead>
              <tbody className="booking-page-table-body">
                {filteredBookings.map((booking) => (
                  <tr key={booking.booking_id} className="booking-page-table-row" onClick={() => setSelectedBooking(booking)} style={{ cursor: 'pointer' }}>
                    <td className="booking-page-table-td">
                      <span className="booking-page-booking-id-value">#{booking.booking_id}</span>
                    </td>
                    <td className="booking-page-table-td">
                      <span 
                        className="booking-page-status-badge"
                        style={{ backgroundColor: getStatusColor(booking.status) }}
                      >
                        {booking.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="booking-page-table-td">
                      <span className="booking-page-customer-email">{booking.user_email || 'No email provided'}</span>
                    </td>
                    <td className="booking-page-table-td">
                      {formatDate(booking.booking_date)}
                    </td>
                    <td className="booking-page-table-td">
                      <span 
                        className="booking-page-shift-type-badge"
                        style={{ backgroundColor: getShiftTypeColor(booking.shift_type) }}
                      >
                        {booking.shift_type || 'Not specified'}
                      </span>
                    </td>
                    <td className="booking-page-table-td">
                      <span className="booking-page-cost">${booking.total_cost?.toLocaleString() || '0'}</span>
                    </td>
                    <td className="booking-page-table-td">
                      {booking.booking_source || 'Direct'}
                    </td>
                    <td className="booking-page-table-td">
                      {formatDateTime(booking.booked_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
            {/* Mobile List View */}
            <div className="booking-page-mobile-list">
            {filteredBookings.map((booking) => (
              <div
                key={booking.booking_id}
                className="booking-page-mobile-card"
                onClick={() => setSelectedBooking(booking)}
              >
                <div className="booking-page-mobile-row booking-page-mobile-top">
                  <div className="booking-page-mobile-id">#{booking.booking_id}</div>
                  <div
                    className="booking-page-status-badge"
                    style={{ backgroundColor: getStatusColor(booking.status) }}
                  >
                    {booking.status || 'Unknown'}
                  </div>
                </div>
                <div className="booking-page-mobile-row">
                  <div className="booking-page-mobile-label">Email</div>
                  <div className="booking-page-mobile-value booking-page-customer-email">
                    {booking.user_email || 'No email provided'}
                  </div>
                </div>
                <div className="booking-page-mobile-row">
                  <div className="booking-page-mobile-label">Date</div>
                  <div className="booking-page-mobile-value">{formatDate(booking.booking_date)}</div>
                </div>
                <div className="booking-page-mobile-row">
                  <div className="booking-page-mobile-label">Shift</div>
                  <div
                    className="booking-page-shift-type-badge"
                    style={{ backgroundColor: getShiftTypeColor(booking.shift_type) }}
                  >
                    {booking.shift_type || 'Not specified'}
                  </div>
                </div>
                <div className="booking-page-mobile-row">
                  <div className="booking-page-mobile-label">Total</div>
                  <div className="booking-page-mobile-value booking-page-cost">
                    ${booking.total_cost?.toLocaleString() || '0'}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        ) : (
          <div className="booking-page-no-bookings">
            <div className="booking-page-no-data-content">
              <h3>No Bookings Found</h3>
              <p>
                {activeTab === 'all' 
                  ? 'You don\'t have any bookings yet.'
                  : `No ${activeTab} bookings found.`
                }
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="booking-page-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="booking-page-modal booking-page-enhanced-modal" onClick={(e) => e.stopPropagation()}>
            <div className="booking-page-modal-header">
              <h2>Booking Details</h2>
              <button 
                className="booking-page-modal-close" 
                onClick={() => setSelectedBooking(null)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            <div className="booking-page-details-body">
              {/* Customer Information */}
              <div className="booking-page-details-section">
                <h3 className="booking-page-section-title">Customer Information</h3>
                <div className="booking-page-details-grid">
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Name</span>
                    <span className="booking-page-details-value">{selectedBooking.user_name || 'N/A'}</span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Email</span>
                    <span className="booking-page-details-value">{selectedBooking.user_email || 'N/A'}</span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">CNIC</span>
                    <span className="booking-page-details-value">{selectedBooking.user_cnic || 'N/A'}</span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Phone</span>
                    <span className="booking-page-details-value">{selectedBooking.user_phone_number || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="booking-page-details-section">
                <h3 className="booking-page-section-title">Booking Information</h3>
                <div className="booking-page-details-grid">
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Booking ID</span>
                    <span className="booking-page-details-value booking-page-booking-id">#{selectedBooking.booking_id}</span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Booking Date</span>
                    <span className="booking-page-details-value">{formatDate(selectedBooking.booking_date)}</span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Shift Type</span>
                    <span 
                      className="booking-page-details-value booking-page-shift-badge"
                      style={{ backgroundColor: getShiftTypeColor(selectedBooking.shift_type) }}
                    >
                      {selectedBooking.shift_type || 'Not specified'}
                    </span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Total Cost</span>
                    <span className="booking-page-details-value booking-page-cost-large">
                      Rs. {selectedBooking.total_cost?.toLocaleString() || '0'}
                    </span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Booking Source</span>
                    <span className="booking-page-details-value">{selectedBooking.booking_source || 'Direct'}</span>
                  </div>
                  <div className="booking-page-details-item">
                    <span className="booking-page-details-label">Booked At</span>
                    <span className="booking-page-details-value">{formatDateTime(selectedBooking.booked_at)}</span>
                  </div>
                </div>
              </div>

              {/* Status Management */}
              <div className="booking-page-details-section">
                <h3 className="booking-page-section-title">Status Management</h3>
                <div className="booking-page-status-management">
                  <div className="booking-page-current-status">
                    <span className="booking-page-details-label">Current Status:</span>
                    <span 
                      className="booking-page-status-badge booking-page-status-large"
                      style={{ backgroundColor: getStatusColor(selectedBooking.status) }}
                    >
                      {selectedBooking.status || 'Unknown'}
                    </span>
                  </div>
                  {selectedBooking.booking_source !== 'Bot' ? (
                    <div className="booking-page-status-actions">
                      <button
                        onClick={() => handleStatusChange(selectedBooking.booking_id, 'Pending')}
                        disabled={selectedBooking.status === 'Pending' || actionLoading[selectedBooking.booking_id]}
                        className="booking-page-status-btn booking-page-pending-btn"
                      >
                        Set Pending
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedBooking.booking_id, 'Confirmed')}
                        disabled={selectedBooking.status === 'Confirmed' || actionLoading[selectedBooking.booking_id]}
                        className="booking-page-status-btn booking-page-confirmed-btn"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedBooking.booking_id, 'Cancelled')}
                        disabled={selectedBooking.status === 'Cancelled' || actionLoading[selectedBooking.booking_id]}
                        className="booking-page-status-btn booking-page-cancelled-btn"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleStatusChange(selectedBooking.booking_id, 'Completed')}
                        disabled={selectedBooking.status === 'Completed' || actionLoading[selectedBooking.booking_id]}
                        className="booking-page-status-btn booking-page-completed-btn"
                      >
                        Complete
                      </button>
                    </div>
                  ) : (
                    <div className="booking-page-bot-notice">
                      <p className="booking-page-bot-message">
                        This is a Bot booking. Status updates are managed through the Admin Panel.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="booking-page-details-footer">
                <button className="booking-page-back-button" onClick={() => setSelectedBooking(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Bookings; 