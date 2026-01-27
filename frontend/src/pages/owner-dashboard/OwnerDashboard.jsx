import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OwnerDashboard.css';

const OwnerDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [ownerData, setOwnerData] = useState(null);

  useEffect(() => {
    const storedOwnerData = localStorage.getItem('ownerData');
    if (storedOwnerData) {
      setOwnerData(JSON.parse(storedOwnerData));
    }
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('ownerToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.get(`${backendUrl}/api/owners/properties`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProperties(response.data.properties);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching properties:', err);
      
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('ownerToken');
        localStorage.removeItem('ownerData');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to fetch properties');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handlePropertyClick = (property) => {
    // Store property data and redirect to property dashboard
    localStorage.setItem('propertyToken', localStorage.getItem('ownerToken'));
    localStorage.setItem('propertyData', JSON.stringify(property));
    // Pass property_id as a URL parameter for owner access
    window.location.href = `/dashboard?property_id=${property.property_id}`;
  };

  const handleLogout = () => {
    localStorage.removeItem('ownerToken');
    localStorage.removeItem('ownerData');
    window.location.href = '/admin-login';
  };

  if (loading) {
    return (
      <div className="owner-dashboard-page-loading">
        <div className="owner-dashboard-page-loading-spinner">
          <div className="owner-dashboard-page-spinner"></div>
          <span>Loading properties...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="owner-dashboard-page-error">
        <div className="owner-dashboard-page-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="owner-dashboard-page-retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="owner-dashboard-page-container">
      {/* Header */}
      <div className="owner-dashboard-page-header">
        <div className="owner-dashboard-page-header-content">
          <div className="owner-dashboard-page-header-left">
            <h1 className="owner-dashboard-page-title">Owner Dashboard</h1>
            <p className="owner-dashboard-page-subtitle">
              Welcome back, {ownerData?.first_name} {ownerData?.last_name}
            </p>
          </div>
          <div className="owner-dashboard-page-header-right">
            <button onClick={handleLogout} className="owner-dashboard-page-logout-button">
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
      <div className="owner-dashboard-page-stats">
        <div className="owner-dashboard-page-stats-grid">
          <div className="owner-dashboard-page-stat-card">
            <div className="owner-dashboard-page-stat-number">{properties.length}</div>
            <div className="owner-dashboard-page-stat-label">Total Properties</div>
          </div>
          <div className="owner-dashboard-page-stat-card">
            <div className="owner-dashboard-page-stat-number">
              {properties.filter(p => p.type === 'Farmhouse').length}
            </div>
            <div className="owner-dashboard-page-stat-label">Farmhouses</div>
          </div>
          <div className="owner-dashboard-page-stat-card">
            <div className="owner-dashboard-page-stat-number">
              {properties.filter(p => p.type === 'Hut').length}
            </div>
            <div className="owner-dashboard-page-stat-label">Huts</div>
          </div>
          <div className="owner-dashboard-page-stat-card">
            <div className="owner-dashboard-page-stat-number">
              {ownerData?.email || 'N/A'}
            </div>
            <div className="owner-dashboard-page-stat-label">Contact Email</div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="owner-dashboard-page-content">
        <div className="owner-dashboard-page-section-header">
          <h2>Your Properties</h2>
          <p>Click on any property to manage its bookings and details</p>
        </div>

        {properties.length > 0 ? (
          <div className="owner-dashboard-page-properties-grid">
            {properties.map((property) => (
              <div
                key={property.property_id}
                className="owner-dashboard-page-property-card"
                onClick={() => handlePropertyClick(property)}
              >
                <div className="owner-dashboard-page-property-header">
                  <div className="owner-dashboard-page-property-type">
                    {property.type}
                  </div>
                  <div className="owner-dashboard-page-property-status">
                    Active
                  </div>
                </div>
                
                <div className="owner-dashboard-page-property-content">
                  <h3 className="owner-dashboard-page-property-name">{property.name}</h3>
                  <p className="owner-dashboard-page-property-location">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.3639 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {property.address}
                  </p>
                  <p className="owner-dashboard-page-property-username">
                    Username: <span>{property.username}</span>
                  </p>
                </div>

                <div className="owner-dashboard-page-property-footer">
                  <div className="owner-dashboard-page-property-date">
                    Created: {new Date(property.created_at).toLocaleDateString()}
                  </div>
                  <div className="owner-dashboard-page-property-arrow">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="owner-dashboard-page-no-properties">
            <div className="owner-dashboard-page-no-data-content">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No Properties Found</h3>
              <p>You don't have any properties registered yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;