import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './edit-amenities.css';

const EditAmenitiesModal = ({ isOpen, onClose, propertyData, onAmenitiesUpdated }) => {
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Common amenity types for suggestions
  const commonAmenityTypes = [
    'wifi', 'parking', 'pool', 'gym', 'kitchen', 'laundry', 'air_conditioning', 
    'heating', 'tv', 'balcony', 'garden', 'fireplace', 'hot_tub', 'bbq', 
    'pet_friendly', 'smoking_allowed', 'wheelchair_accessible', 'security', 
    'cleaning_service', 'breakfast'
  ];

  useEffect(() => {
    if (propertyData && isOpen) {
      if (propertyData.amenities && propertyData.amenities.length > 0) {
        setAmenities([...propertyData.amenities]);
      } else {
        // Start with one empty amenity
        setAmenities([{ type: '', value: '' }]);
      }
    }
  }, [propertyData, isOpen]);

  const handleAmenityChange = (index, field, value) => {
    const updatedAmenities = [...amenities];
    updatedAmenities[index] = {
      ...updatedAmenities[index],
      [field]: value
    };
    setAmenities(updatedAmenities);
  };

  const addAmenity = () => {
    setAmenities([...amenities, { type: '', value: '' }]);
  };

  const removeAmenity = (index) => {
    if (amenities.length > 1) {
      const updatedAmenities = amenities.filter((_, i) => i !== index);
      setAmenities(updatedAmenities);
    }
  };

  const resetForm = () => {
    if (propertyData && propertyData.amenities && propertyData.amenities.length > 0) {
      setAmenities([...propertyData.amenities]);
    } else {
      setAmenities([{ type: '', value: '' }]);
    }
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('propertyToken');
      if (!token) {
        setError('No authentication token found. Please login again.');
        setLoading(false);
        return;
      }

      // Filter out empty amenities
      const validAmenities = amenities.filter(amenity => 
        amenity.type && amenity.type.trim() !== '' && 
        amenity.value && amenity.value.trim() !== ''
      );

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      await axios.post(`${backendUrl}/api/properties/edit/amenities`, {
        property_id: propertyData.property.property_id,
        amenities: validAmenities
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Amenities updated successfully!');
      setTimeout(() => {
        onAmenitiesUpdated();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error updating amenities:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to update amenities');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="amenities-modal-overlay">
      <div className="amenities-modal-container">
        <div className="amenities-modal-header">
          <h2>Edit Amenities</h2>
          <button className="amenities-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="amenities-modal-form">
          {error && <div className="amenities-modal-error">{error}</div>}
          {success && <div className="amenities-modal-success">{success}</div>}
          
          <div className="amenities-modal-info">
            <p>🏠 Add or edit property amenities. Each amenity should have a type and description.</p>
          </div>

          <div className="amenities-modal-list">
            <h3>Property Amenities</h3>
            
            {amenities.map((amenity, index) => (
              <div key={index} className="amenities-modal-item">
                <div className="amenities-modal-item-content">
                  <div className="amenities-modal-form-group">
                    <label htmlFor={`type-${index}`}>Amenity Type *</label>
                    <input
                      type="text"
                      id={`type-${index}`}
                      value={amenity.type}
                      onChange={(e) => handleAmenityChange(index, 'type', e.target.value)}
                      placeholder="e.g., wifi, parking, pool"
                      list={`amenity-types-${index}`}
                      required
                    />
                    <datalist id={`amenity-types-${index}`}>
                      {commonAmenityTypes.map(type => (
                        <option key={type} value={type} />
                      ))}
                    </datalist>
                  </div>

                  <div className="amenities-modal-form-group">
                    <label htmlFor={`value-${index}`}>Description *</label>
                    <input
                      type="text"
                      id={`value-${index}`}
                      value={amenity.value}
                      onChange={(e) => handleAmenityChange(index, 'value', e.target.value)}
                      placeholder="e.g., Free high-speed WiFi, Free parking available"
                      required
                    />
                  </div>

                  <div className="amenities-modal-item-actions">
                    <button
                      type="button"
                      onClick={() => removeAmenity(index)}
                      className="amenities-modal-remove-btn"
                      disabled={amenities.length === 1}
                      title="Remove amenity"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addAmenity}
              className="amenities-modal-add-btn"
            >
              ➕ Add Another Amenity
            </button>
          </div>

          <div className="amenities-modal-suggestions">
            <h4>Common Amenity Types:</h4>
            <div className="amenities-modal-suggestion-tags">
              {commonAmenityTypes.slice(0, 10).map(type => (
                <button
                  key={type}
                  type="button"
                  className="amenities-modal-suggestion-tag"
                  onClick={() => {
                    const emptyIndex = amenities.findIndex(a => !a.type);
                    if (emptyIndex !== -1) {
                      handleAmenityChange(emptyIndex, 'type', type);
                    } else {
                      setAmenities([...amenities, { type, value: '' }]);
                    }
                  }}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="amenities-modal-form-actions">
            <button type="button" onClick={onClose} className="amenities-modal-cancel-btn">
              Cancel
            </button>
            <button type="button" onClick={resetForm} className="amenities-modal-reset-btn">
              Reset to Original
            </button>
            <button type="submit" disabled={loading} className="amenities-modal-submit-btn">
              {loading ? 'Updating...' : 'Update Amenities'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAmenitiesModal;