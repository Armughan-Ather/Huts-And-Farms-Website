import React, { useState, useEffect } from 'react';
import axios from 'axios';
import EditPropertyModal from '../edit-property/edit-property';
import MediaManager from '../../components/media-manager/media-manager';
import EditPricingModal from '../../components/edit-pricing/edit-pricing';
import EditAmenitiesModal from '../../components/edit-amenities/edit-amenities';
import './dashboard.css';

// Pricing Display Component with Sorting
const PricingDisplay = ({ shiftPricing }) => {
  const [sortBy, setSortBy] = useState('default');
  const [sortOrder, setSortOrder] = useState('asc');

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shiftTypes = ['Day', 'Night', 'Full Day', 'Full Night'];

  const handleSort = (type) => {
    if (sortBy === type) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(type);
      setSortOrder('asc');
    }
  };

  const getSortedPricing = () => {
    let sortedData = [...shiftPricing];

    if (sortBy === 'default') {
      // Sort by day order first, then by shift order
      sortedData.sort((a, b) => {
        const dayIndexA = daysOfWeek.indexOf(a.day_of_week.toLowerCase());
        const dayIndexB = daysOfWeek.indexOf(b.day_of_week.toLowerCase());
        
        if (dayIndexA !== dayIndexB) {
          return dayIndexA - dayIndexB;
        }
        
        const shiftIndexA = shiftTypes.indexOf(a.shift_type);
        const shiftIndexB = shiftTypes.indexOf(b.shift_type);
        return shiftIndexA - shiftIndexB;
      });
    } else if (sortBy === 'day') {
      sortedData.sort((a, b) => {
        const dayIndexA = daysOfWeek.indexOf(a.day_of_week.toLowerCase());
        const dayIndexB = daysOfWeek.indexOf(b.day_of_week.toLowerCase());
        
        if (sortOrder === 'asc') {
          return dayIndexA - dayIndexB;
        } else {
          return dayIndexB - dayIndexA;
        }
      });
    } else if (sortBy === 'shift') {
      sortedData.sort((a, b) => {
        const shiftIndexA = shiftTypes.indexOf(a.shift_type);
        const shiftIndexB = shiftTypes.indexOf(b.shift_type);
        
        if (sortOrder === 'asc') {
          return shiftIndexA - shiftIndexB;
        } else {
          return shiftIndexB - shiftIndexA;
        }
      });
    } else if (sortBy === 'price') {
      sortedData.sort((a, b) => {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        
        if (sortOrder === 'asc') {
          return priceA - priceB;
        } else {
          return priceB - priceA;
        }
      });
    }

    return sortedData;
  };

  return (
    <div className="dashboard-page-shift-pricing">
      <div className="dashboard-page-pricing-sort-header">
        <h4>Shift-based Pricing</h4>
        <div className="dashboard-page-sort-controls">
          <span className="dashboard-page-sort-label">Sort by:</span>
          <button
            className={`dashboard-page-sort-btn ${sortBy === 'default' ? 'active' : ''}`}
            onClick={() => setSortBy('default')}
          >
            Default
          </button>
          <button
            className={`dashboard-page-sort-btn ${sortBy === 'day' ? 'active' : ''}`}
            onClick={() => handleSort('day')}
          >
            Day {sortBy === 'day' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`dashboard-page-sort-btn ${sortBy === 'shift' ? 'active' : ''}`}
            onClick={() => handleSort('shift')}
          >
            Shift {sortBy === 'shift' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            className={`dashboard-page-sort-btn ${sortBy === 'price' ? 'active' : ''}`}
            onClick={() => handleSort('price')}
          >
            Price {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>
      
      <div className="dashboard-page-shift-pricing-header">
        <div className="dashboard-page-header-item">Day of Week</div>
        <div className="dashboard-page-header-item">Shift Type</div>
        <div className="dashboard-page-header-item">Price</div>
      </div>
      
      <div className="dashboard-page-shift-grid">
        {getSortedPricing().map((shift, index) => (
          <div key={index} className="dashboard-page-shift-item">
            <span className="dashboard-page-day">{shift.day_of_week.charAt(0).toUpperCase() + shift.day_of_week.slice(1)}</span>
            <span className="dashboard-page-shift">{shift.shift_type}</span>
            <span className="dashboard-page-price">${shift.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [propertyData, setPropertyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [showAmenitiesModal, setShowAmenitiesModal] = useState(false);

  useEffect(() => {
    fetchPropertyData();
  }, []);

  const fetchPropertyData = async () => {
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
      let apiUrl = `${backendUrl}/api/properties`;
      
      // Add property_id parameter if present (for owner access)
      if (propertyId) {
        apiUrl += `?property_id=${propertyId}`;
      }
      
      const response = await axios.get(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setPropertyData(response.data);
      setLoading(false);
    } catch (err) {
      console.log('Error fetching property data:', err);

      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
        localStorage.removeItem('propertyToken');
        localStorage.removeItem('propertyData');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to fetch property data');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handlePropertyUpdated = () => {
    fetchPropertyData();
  };

  const handleMediaUpdated = () => {
    fetchPropertyData();
  };

  const handlePricingUpdated = () => {
    fetchPropertyData();
  };

  const handleAmenitiesUpdated = () => {
    fetchPropertyData();
  };

  const handleBookings = () => {
    // Navigate to bookings page
    window.location.href = '/bookings';
  };

  const handleLogout = () => {
    // Check if user is logged in as owner (has ownerToken)
    const ownerToken = localStorage.getItem('ownerToken');
    
    if (ownerToken) {
      // Owner is logged in - remove property tokens and go back to owner dashboard
      localStorage.removeItem('propertyToken');
      localStorage.removeItem('propertyData');
      window.location.href = '/owner-dashboard';
    } else {
      // Direct property login - remove property tokens and go to login
      localStorage.removeItem('propertyToken');
      localStorage.removeItem('propertyData');
      window.location.href = '/admin-login';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-page-loading">
        <div className="dashboard-page-loading-spinner">
          <div className="dashboard-page-spinner"></div>
          <span>Loading property details...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page-error">
        <div className="dashboard-page-error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="dashboard-page-retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className="dashboard-page-error">
        <div className="dashboard-page-error-container">
          <h2>No Data</h2>
          <p>No property data found.</p>
        </div>
      </div>
    );
  }

  const { property, pricing, amenities, images, videos, owner_username } = propertyData;

  return (
    <div className="dashboard-page-container">
      {/* Header */}
      <div className="dashboard-page-header">
        <div className="dashboard-page-header-content">
          <div className="dashboard-page-header-left">
            <div className="dashboard-page-logo">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="white"/>
              </svg>
            </div>
            <div className="dashboard-page-title-section">
              <h1 className="dashboard-page-property-name">{property.name}</h1>
              <p className="dashboard-page-property-type">{property.type} Property</p>
            </div>
          </div>
          <div className="dashboard-page-header-right">
            <button onClick={handleEdit} className="dashboard-page-edit-button">
              ✏️ Edit Property
            </button>
            <button onClick={handleBookings} className="dashboard-page-bookings-button">
              📅 View Bookings
            </button>
            <button onClick={handleLogout} className="dashboard-page-logout-button">
              🚪 Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-page-tabs">
        <button
          className={`dashboard-page-tab-button ${activeTab === 'overview' ? 'dashboard-page-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`dashboard-page-tab-button ${activeTab === 'details' ? 'dashboard-page-active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`dashboard-page-tab-button ${activeTab === 'pricing' ? 'dashboard-page-active' : ''}`}
          onClick={() => setActiveTab('pricing')}
        >
          Pricing
        </button>
        <button
          className={`dashboard-page-tab-button ${activeTab === 'amenities' ? 'dashboard-page-active' : ''}`}
          onClick={() => setActiveTab('amenities')}
        >
          Amenities
        </button>
        <button
          className={`dashboard-page-tab-button ${activeTab === 'media' ? 'dashboard-page-active' : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Media
        </button>
      </div>

      {/* Content Area */}
      <div className="dashboard-page-content">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="dashboard-page-tab-content">
            <div className="dashboard-page-overview-grid">
              <div className="dashboard-page-overview-card">
                <h3>Basic Information</h3>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Name:</span>
                  <span className="dashboard-page-value">{property.name}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Type:</span>
                  <span className="dashboard-page-value">{property.type}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Description:</span>
                  <span className="dashboard-page-value">{property.description || 'No description available'}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Max Occupancy:</span>
                  <span className="dashboard-page-value">{property.max_occupancy} people</span>
                </div>
              </div>

              <div className="dashboard-page-overview-card">
                <h3>Location</h3>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Address:</span>
                  <span className="dashboard-page-value">{property.address}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">City:</span>
                  <span className="dashboard-page-value">{property.city}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Province:</span>
                  <span className="dashboard-page-value">{property.province}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Country:</span>
                  <span className="dashboard-page-value">{property.country}</span>
                </div>
              </div>

              <div className="dashboard-page-overview-card">
                <h3>Contact Information</h3>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Contact Person:</span>
                  <span className="dashboard-page-value">{property.contact_person}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Phone:</span>
                  <span className="dashboard-page-value">{property.contact_number}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Email:</span>
                  <span className="dashboard-page-value">{property.email}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Owner:</span>
                  <span className="dashboard-page-value">{owner_username || 'Not specified'}</span>
                </div>
              </div>

              <div className="dashboard-page-overview-card">
                <h3>Business Details</h3>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Advance Payment:</span>
                  <span className="dashboard-page-value">{property.advance_percentage}%</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Created:</span>
                  <span className="dashboard-page-value">{new Date(property.created_at).toLocaleDateString()}</span>
                </div>
                <div className="dashboard-page-info-item">
                  <span className="dashboard-page-label">Last Updated:</span>
                  <span className="dashboard-page-value">{new Date(property.updated_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="dashboard-page-tab-content">
            <div className="dashboard-page-details-section">
              <h3>Property Details</h3>
              <div className="dashboard-page-details-grid">
                <div className="dashboard-page-detail-item">
                  <strong>Property ID:</strong> {property.property_id}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Username:</strong> {property.username}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Description:</strong> {property.description || 'No description available'}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Address:</strong> {property.address}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>City:</strong> {property.city}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Province:</strong> {property.province}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Country:</strong> {property.country}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Contact Person:</strong> {property.contact_person}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Contact Number:</strong> {property.contact_number}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Email:</strong> {property.email}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Max Occupancy:</strong> {property.max_occupancy} people
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Type:</strong> {property.type}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Advance Percentage:</strong> {property.advance_percentage}%
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Created At:</strong> {new Date(property.created_at).toLocaleString()}
                </div>
                <div className="dashboard-page-detail-item">
                  <strong>Updated At:</strong> {new Date(property.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Tab */}
        {activeTab === 'pricing' && (
          <div className="dashboard-page-tab-content">
            {pricing ? (
              <div className="dashboard-page-pricing-section">
                <div className="dashboard-page-pricing-header">
                  <h3>Pricing Information</h3>
                  <button 
                    onClick={() => setShowPricingModal(true)} 
                    className="dashboard-page-edit-pricing-btn"
                  >
                    ✏️ Edit Pricing
                  </button>
                </div>
                <div className="dashboard-page-pricing-card">
                  <div className="dashboard-page-pricing-info">
                    <div className="dashboard-page-info-item">
                      <span className="dashboard-page-label">Season Start:</span>
                      <span className="dashboard-page-value">{new Date(pricing.season_start_date).toLocaleDateString()}</span>
                    </div>
                    <div className="dashboard-page-info-item">
                      <span className="dashboard-page-label">Season End:</span>
                      <span className="dashboard-page-value">{new Date(pricing.season_end_date).toLocaleDateString()}</span>
                    </div>
                    <div className="dashboard-page-info-item">
                      <span className="dashboard-page-label">Special Offers:</span>
                      <span className="dashboard-page-value">{pricing.special_offer_note || 'No special offers'}</span>
                    </div>
                  </div>

                  {pricing.shift_pricing && pricing.shift_pricing.length > 0 && (
                    <PricingDisplay shiftPricing={pricing.shift_pricing} />
                  )}
                </div>
              </div>
            ) : (
              <div className="dashboard-page-no-data">
                <p>No pricing information available.</p>
                <button 
                  onClick={() => setShowPricingModal(true)} 
                  className="dashboard-page-add-pricing-btn"
                >
                  💰 Add Pricing
                </button>
              </div>
            )}
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div className="dashboard-page-tab-content">
            {amenities && amenities.length > 0 ? (
              <div className="dashboard-page-amenities-section">
                <div className="dashboard-page-amenities-header">
                  <h3>Amenities</h3>
                  <button 
                    onClick={() => setShowAmenitiesModal(true)} 
                    className="dashboard-page-edit-amenities-btn"
                  >
                    ✏️ Edit Amenities
                  </button>
                </div>
                <div className="dashboard-page-amenities-grid">
                  {amenities.map((amenity, index) => (
                    <div key={index} className="dashboard-page-amenity-item">
                      <span className="dashboard-page-amenity-type">{amenity.type}</span>
                      <span className="dashboard-page-amenity-value">{amenity.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="dashboard-page-no-data">
                <p>No amenities information available.</p>
                <button 
                  onClick={() => setShowAmenitiesModal(true)} 
                  className="dashboard-page-add-amenities-btn"
                >
                  🏠 Add Amenities
                </button>
              </div>
            )}
          </div>
        )}

        {/* Media Tab */}
        {activeTab === 'media' && (
          <div className="dashboard-page-tab-content">
            <MediaManager
              propertyData={propertyData}
              onMediaUpdated={handleMediaUpdated}
            />
          </div>
        )}
      </div>

      {/* Edit Property Modal */}
      <EditPropertyModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        propertyData={propertyData}
        onPropertyUpdated={handlePropertyUpdated}
      />

      {/* Edit Pricing Modal */}
      <EditPricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        propertyData={propertyData}
        onPricingUpdated={handlePricingUpdated}
      />

      {/* Edit Amenities Modal */}
      <EditAmenitiesModal
        isOpen={showAmenitiesModal}
        onClose={() => setShowAmenitiesModal(false)}
        propertyData={propertyData}
        onAmenitiesUpdated={handleAmenitiesUpdated}
      />
    </div>
  );
};

export default Dashboard; 