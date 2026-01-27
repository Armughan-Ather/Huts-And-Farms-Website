import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './edit-property.css';

const EditPropertyModal = ({ isOpen, onClose, propertyData, onPropertyUpdated }) => {
  const [formData, setFormData] = useState({
    property_id: '',
    name: '',
    description: '',
    address: '',
    city: '',
    province: '',
    country: '',
    contact_person: '',
    contact_number: '',
    email: '',
    max_occupancy: '',
    username: '',
    password: '',
    type: '',
    advance_percentage: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (propertyData && propertyData.property) {
      const { property } = propertyData;
      setFormData({
        property_id: property.property_id || '',
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        province: property.province || '',
        country: property.country || '',
        contact_person: property.contact_person || '',
        contact_number: property.contact_number || '',
        email: property.email || '',
        max_occupancy: property.max_occupancy ? property.max_occupancy.toString() : '',
        username: property.username || '',
        password: '',
        type: property.type || '',
        advance_percentage: property.advance_percentage ? property.advance_percentage.toString() : ''
      });
    }
  }, [propertyData, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    if (propertyData && propertyData.property) {
      const { property } = propertyData;
      setFormData({
        property_id: property.property_id || '',
        name: property.name || '',
        description: property.description || '',
        address: property.address || '',
        city: property.city || '',
        province: property.province || '',
        country: property.country || '',
        contact_person: property.contact_person || '',
        contact_number: property.contact_number || '',
        email: property.email || '',
        max_occupancy: property.max_occupancy ? property.max_occupancy.toString() : '',
        username: property.username || '',
        password: '',
        type: property.type || '',
        advance_percentage: property.advance_percentage ? property.advance_percentage.toString() : ''
      });
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

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      
      // Only send fields that have values (excluding empty password)
      const updateData = {};
      
      // Always include property_id for owner access
      updateData.property_id = formData.property_id;
      
      Object.keys(formData).forEach(key => {
        if (key === 'property_id') {
          // Already added above
          return;
        } else if (key === 'password') {
          // Only include password if it's not empty
          if (formData[key] && formData[key].toString().trim() !== '') {
            updateData[key] = formData[key];
          }
        } else if (formData[key] !== null && formData[key] !== undefined && formData[key].toString().trim() !== '') {
          updateData[key] = formData[key];
        }
      });

      await axios.post(`${backendUrl}/api/properties/edit`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Property updated successfully!');
      setTimeout(() => {
        onPropertyUpdated();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error updating property:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to update property');
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
    <div className="edit-modal-overlay">
      <div className="edit-modal-container">
        <div className="edit-modal-header">
          <h2>Edit Property</h2>
          <button className="edit-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="edit-modal-form">
          {error && <div className="edit-modal-error">{error}</div>}
          {success && <div className="edit-modal-success">{success}</div>}
          
          <div className="edit-modal-info">
            <p>✏️ Edit any field below. All fields are pre-populated with current values. Only modified fields will be updated.</p>
          </div>

          <div className="edit-modal-form-grid">
            <div className="edit-modal-form-group">
              <label htmlFor="name">Property Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="type">Property Type *</label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Type</option>
                <option value="hut">Hut</option>
                <option value="farm">Farm</option>
              </select>
            </div>

            <div className="edit-modal-form-group edit-modal-full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="province">Province</label>
              <input
                type="text"
                id="province"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="country">Country</label>
              <input
                type="text"
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="contact_person">Contact Person</label>
              <input
                type="text"
                id="contact_person"
                name="contact_person"
                value={formData.contact_person}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="contact_number">Contact Number</label>
              <input
                type="tel"
                id="contact_number"
                name="contact_number"
                value={formData.contact_number}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="max_occupancy">Max Occupancy</label>
              <input
                type="number"
                id="max_occupancy"
                name="max_occupancy"
                value={formData.max_occupancy}
                onChange={handleInputChange}
                min="1"
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="advance_percentage">Advance Percentage (%)</label>
              <input
                type="number"
                id="advance_percentage"
                name="advance_percentage"
                value={formData.advance_percentage}
                onChange={handleInputChange}
                min="0"
                max="100"
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
              />
            </div>

            <div className="edit-modal-form-group">
              <label htmlFor="password">New Password (leave empty to keep current)</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter new password or leave empty"
              />
            </div>
          </div>

          <div className="edit-modal-form-actions">
            <button type="button" onClick={onClose} className="edit-modal-cancel-btn">
              Cancel
            </button>
            <button type="button" onClick={resetForm} className="edit-modal-reset-btn">
              Reset to Original
            </button>
            <button type="submit" disabled={loading} className="edit-modal-submit-btn">
              {loading ? 'Updating...' : 'Update Property'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPropertyModal;