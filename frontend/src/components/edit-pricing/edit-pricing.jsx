import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './edit-pricing.css';

const EditPricingModal = ({ isOpen, onClose, propertyData, onPricingUpdated }) => {
  const [formData, setFormData] = useState({
    season_start_date: '',
    season_end_date: '',
    special_offer_note: '',
    shift_pricing: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const shiftTypes = ['Day', 'Night', 'Full Day', 'Full Night'];

  useEffect(() => {
    if (propertyData && propertyData.pricing && isOpen) {
      const { pricing } = propertyData;
      setFormData({
        season_start_date: pricing.season_start_date ? new Date(pricing.season_start_date).toISOString().split('T')[0] : '',
        season_end_date: pricing.season_end_date ? new Date(pricing.season_end_date).toISOString().split('T')[0] : '',
        special_offer_note: pricing.special_offer_note || '',
        shift_pricing: pricing.shift_pricing || []
      });
    } else if (isOpen) {
      // Initialize with empty data if no pricing exists
      const defaultShiftPricing = [];
      daysOfWeek.forEach(day => {
        shiftTypes.forEach(shift => {
          defaultShiftPricing.push({
            day_of_week: day,
            shift_type: shift,
            price: ''
          });
        });
      });
      setFormData({
        season_start_date: '',
        season_end_date: '',
        special_offer_note: '',
        shift_pricing: defaultShiftPricing
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

  const handleShiftPriceChange = (dayIndex, shiftIndex, value) => {
    const updatedShiftPricing = [...formData.shift_pricing];
    const globalIndex = dayIndex * shiftTypes.length + shiftIndex;
    
    if (!updatedShiftPricing[globalIndex]) {
      updatedShiftPricing[globalIndex] = {
        day_of_week: daysOfWeek[dayIndex],
        shift_type: shiftTypes[shiftIndex],
        price: value
      };
    } else {
      updatedShiftPricing[globalIndex].price = value;
    }
    
    setFormData(prev => ({
      ...prev,
      shift_pricing: updatedShiftPricing
    }));
  };

  const getShiftPrice = (dayIndex, shiftIndex) => {
    const globalIndex = dayIndex * shiftTypes.length + shiftIndex;
    return formData.shift_pricing[globalIndex]?.price || '';
  };

  const resetForm = () => {
    if (propertyData && propertyData.pricing) {
      const { pricing } = propertyData;
      setFormData({
        season_start_date: pricing.season_start_date ? new Date(pricing.season_start_date).toISOString().split('T')[0] : '',
        season_end_date: pricing.season_end_date ? new Date(pricing.season_end_date).toISOString().split('T')[0] : '',
        special_offer_note: pricing.special_offer_note || '',
        shift_pricing: pricing.shift_pricing || []
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

      // Filter out empty shift pricing entries
      const validShiftPricing = formData.shift_pricing.filter(shift => 
        shift.price && !isNaN(parseFloat(shift.price))
      );

      const pricingData = {
        season_start_date: formData.season_start_date,
        season_end_date: formData.season_end_date,
        special_offer_note: formData.special_offer_note,
        shift_pricing: validShiftPricing
      };

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      
      await axios.post(`${backendUrl}/api/properties/edit/pricing`, {
        property_id: propertyData.property.property_id,
        pricing_data: pricingData
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setSuccess('Pricing updated successfully!');
      setTimeout(() => {
        onPricingUpdated();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error updating pricing:', err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else if (err.response) {
        setError(err.response.data.error || 'Failed to update pricing');
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
    <div className="pricing-modal-overlay">
      <div className="pricing-modal-container">
        <div className="pricing-modal-header">
          <h2>Edit Pricing</h2>
          <button className="pricing-modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="pricing-modal-form">
          {error && <div className="pricing-modal-error">{error}</div>}
          {success && <div className="pricing-modal-success">{success}</div>}
          
          <div className="pricing-modal-info">
            <p>💰 Configure your property pricing. Set season dates and prices for different shifts.</p>
          </div>

          <div className="pricing-modal-basic-info">
            <h3>Season Information</h3>
            <div className="pricing-modal-form-grid">
              <div className="pricing-modal-form-group">
                <label htmlFor="season_start_date">Season Start Date *</label>
                <input
                  type="date"
                  id="season_start_date"
                  name="season_start_date"
                  value={formData.season_start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="pricing-modal-form-group">
                <label htmlFor="season_end_date">Season End Date *</label>
                <input
                  type="date"
                  id="season_end_date"
                  name="season_end_date"
                  value={formData.season_end_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="pricing-modal-form-group pricing-modal-full-width">
                <label htmlFor="special_offer_note">Special Offers Note</label>
                <textarea
                  id="special_offer_note"
                  name="special_offer_note"
                  value={formData.special_offer_note}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Enter any special offers or notes about pricing..."
                />
              </div>
            </div>
          </div>

          <div className="pricing-modal-shift-pricing">
            <h3>Shift-based Pricing</h3>
            <p className="pricing-modal-shift-note">Set prices for different days and shift types. Leave empty if not applicable.</p>
            
            <div className="pricing-modal-pricing-grid">
              <div className="pricing-modal-grid-header">
                <div className="pricing-modal-day-header">Day</div>
                {shiftTypes.map(shift => (
                  <div key={shift} className="pricing-modal-shift-header">{shift}</div>
                ))}
              </div>
              
              {daysOfWeek.map((day, dayIndex) => (
                <div key={day} className="pricing-modal-pricing-row">
                  <div className="pricing-modal-day-label">
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </div>
                  {shiftTypes.map((shift, shiftIndex) => (
                    <div key={`${day}-${shift}`} className="pricing-modal-price-input">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={getShiftPrice(dayIndex, shiftIndex)}
                        onChange={(e) => handleShiftPriceChange(dayIndex, shiftIndex, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="pricing-modal-form-actions">
            <button type="button" onClick={onClose} className="pricing-modal-cancel-btn">
              Cancel
            </button>
            <button type="button" onClick={resetForm} className="pricing-modal-reset-btn">
              Reset to Original
            </button>
            <button type="submit" disabled={loading} className="pricing-modal-submit-btn">
              {loading ? 'Updating...' : 'Update Pricing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPricingModal;