import React from 'react';
import './ChatResponseRenderer.css';

/**
 * Component to render structured chat responses from the backend
 * Handles different response types: info, questions, media, property_list, booking_confirmation, error
 */
const ChatResponseRenderer = ({ responses, onImageClick, onQuestionSubmit, sessionData }) => {
  if (!responses || !Array.isArray(responses)) {
    return null;
  }

  return (
    <div className="chat-response-container">
      {responses.map((response, index) => (
        <div key={index} className="chat-response-item">
          {renderResponseByType(response, onImageClick, onQuestionSubmit, sessionData)}
        </div>
      ))}
    </div>
  );
};

const renderResponseByType = (response, onImageClick, onQuestionSubmit, sessionData) => {
  switch (response.type) {
    case 'info':
      return <InfoResponse response={response} />;
    case 'questions':
      return <QuestionsResponse response={response} onSubmit={onQuestionSubmit} sessionData={sessionData} />;
    case 'media':
      return <MediaResponse response={response} onImageClick={onImageClick} />;
    case 'property_list':
      return <PropertyListResponse response={response} />;
    case 'booking_confirmation':
      return <BookingConfirmationResponse response={response} />;
    case 'error':
      return <ErrorResponse response={response} />;
    default:
      return <div className="response-text">{response.main_message}</div>;
  }
};

// Info Response Component
const InfoResponse = ({ response }) => {
  const { main_message, info } = response;

  return (
    <div className="info-response">
      {main_message && <p className="response-message">{main_message}</p>}
      
      {info && Object.keys(info).length > 0 && (
        <div className="info-details">
          {info.location && (
            <div className="info-item">
              <i className="fas fa-map-marker-alt"></i>
              <span><strong>Location:</strong> {info.location}</span>
            </div>
          )}
          
          {info.facilities && Array.isArray(info.facilities) && (
            <div className="info-item">
              <i className="fas fa-check-circle"></i>
              <div>
                <strong>Facilities:</strong>
                <ul className="facilities-list">
                  {info.facilities.map((facility, idx) => (
                    <li key={idx}>{facility}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          {info.capacity && (
            <div className="info-item">
              <i className="fas fa-users"></i>
              <span><strong>Capacity:</strong> {info.capacity}</span>
            </div>
          )}
          
          {info.pricing && (
            <div className="info-item">
              <i className="fas fa-tag"></i>
              <div>
                <strong>Pricing:</strong>
                <div className="pricing-details">
                  {Object.entries(info.pricing).map(([key, value]) => (
                    <div key={key} className="pricing-row">
                      <span className="pricing-label">{key.replace(/_/g, ' ')}:</span>
                      <span className="pricing-value">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {info.description && (
            <div className="info-item">
              <i className="fas fa-info-circle"></i>
              <span><strong>Description:</strong> {info.description}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Questions Response Component
const QuestionsResponse = ({ response, onSubmit, sessionData }) => {
  const { main_message, questions } = response;
  const [formData, setFormData] = React.useState({});
  const [errors, setErrors] = React.useState({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  // Pre-fill form with session data on mount
  React.useEffect(() => {
    if (sessionData && questions) {
      const prefilled = {};
      questions.forEach(q => {
        // Map question IDs to session data
        if (q.id === 'property_type' && sessionData.property_type) {
          prefilled[q.id] = sessionData.property_type;
        } else if (q.id === 'booking_date' && sessionData.booking_date) {
          prefilled[q.id] = sessionData.booking_date;
        } else if (q.id === 'shift_type' && sessionData.shift_type) {
          prefilled[q.id] = sessionData.shift_type;
        } else if (q.id === 'guest_count' && sessionData.max_occupancy) {
          prefilled[q.id] = sessionData.max_occupancy;
        }
      });
      setFormData(prefilled);
    }
  }, [sessionData, questions]);

  const handleInputChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
    // Clear error when user starts typing
    if (errors[questionId]) {
      setErrors(prev => ({
        ...prev,
        [questionId]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    questions
      .filter(question => question.type !== 'price_range')
      .forEach(question => {
        const value = formData[question.id];
        
        // Skip validation if user selected "Not now"
        if (value === 'Not now') {
          return;
        }
        
        if (question.required) {
          // Check if value exists
          if (!value || value.toString().trim() === '') {
            newErrors[question.id] = 'This field is required';
          } 
          // Validate number type
          else if (question.type === 'number') {
            const numValue = Number(value);
            if (isNaN(numValue) || numValue <= 0) {
              newErrors[question.id] = 'Please enter a valid positive number';
            }
          } 
          // Validate date type
          else if (question.type === 'date') {
            if (!isValidDate(value)) {
              newErrors[question.id] = 'Please enter a valid date';
            } else {
              // Check if date is not in the past
              const selectedDate = new Date(value);
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              if (selectedDate < today) {
                newErrors[question.id] = 'Please select a future date';
              }
            }
          }
          // Validate choice type
          else if (question.type === 'choice' && question.options) {
            if (!question.options.includes(value)) {
              newErrors[question.id] = 'Please select a valid option';
            }
          }
        }
      });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Check if form is complete (all fields either filled or skipped)
  const isFormComplete = () => {
    return questions
      .filter(question => question.type !== 'price_range')
      .every(question => {
        const value = formData[question.id];
        // Field is complete if it has a value OR is marked as "Not now"
        return value && value.toString().trim() !== '';
      });
  };

  const isValidDate = (dateString) => {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setIsSubmitted(true);
    
    // Format response with questions for optional fields that were skipped
    const responseText = questions
      .filter(question => question.type !== 'price_range')
      .map((q) => {
        const value = formData[q.id];
        if (!value && !q.required) {
          // For optional fields that were skipped, show "Question: Not now"
          return `${q.text}: Not now`;
        }
        // For filled fields, show "Question: Answer"
        return value ? `${q.text}: ${value}` : '';
      }).filter(Boolean).join(', ');
    
    // Call the onSubmit callback - this will send automatically
    if (onSubmit) {
      onSubmit(responseText);
    }
  };

  const handleSkipOptional = (questionId) => {
    // Mark optional field as "skipped"
    setFormData(prev => ({
      ...prev,
      [questionId]: 'Not now'
    }));
  };

  // If form is submitted, show answers instead of form
  if (isSubmitted) {
    return (
      <div className="questions-response submitted">
        {main_message && <p className="response-message">{main_message}</p>}
        <div className="submitted-answers">
          {questions
            .filter(question => question.type !== 'price_range')
            .map((question, idx) => {
              const value = formData[question.id];
              if (!value || value === 'Not now') return null;
              
              return (
                <div key={idx} className="answer-item">
                  <span className="answer-label">{question.text}:</span>
                  <span className="answer-value">{value}</span>
                </div>
              );
            })}
        </div>
      </div>
    );
  }

  return (
    <div className="questions-response">
      {main_message && <p className="response-message">{main_message}</p>}
      
      <form onSubmit={handleSubmit} className="questions-form">
        {questions && questions.length > 0 && (
          <div className="questions-list">
            {questions
              .filter(question => question.type !== 'price_range')
              .map((question, idx) => (
              <div key={idx} className="question-item">
                <label className="question-label">
                  <span className="question-text">
                    {/* Remove number from UI display */}
                    {question.text}
                    {question.required && <span className="required-badge">Required</span>}
                  </span>
                  
                  {question.type === 'date' && (
                    <>
                      <input
                        type="date"
                        className={`question-input ${errors[question.id] ? 'error' : ''}`}
                        value={formData[question.id] === 'Not now' ? '' : (formData[question.id] || '')}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        placeholder={question.placeholder}
                        disabled={formData[question.id] === 'Not now' || isSubmitted}
                      />
                      {!question.required && formData[question.id] !== 'Not now' && !isSubmitted && (
                        <button
                          type="button"
                          className="skip-button"
                          onClick={() => handleSkipOptional(question.id)}
                        >
                          Not now
                        </button>
                      )}
                      {formData[question.id] === 'Not now' && !isSubmitted && (
                        <div className="skipped-indicator">
                          Skipped - <button type="button" className="undo-skip" onClick={() => handleInputChange(question.id, '')}>Undo</button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {question.type === 'choice' && question.options && (
                    <>
                      <select
                        className={`question-select ${errors[question.id] ? 'error' : ''}`}
                        value={formData[question.id] === 'Not now' ? '' : (formData[question.id] || '')}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        disabled={formData[question.id] === 'Not now' || isSubmitted}
                      >
                        <option value="">Select an option...</option>
                        {question.options.map((option, optIdx) => (
                          <option key={optIdx} value={option}>{option}</option>
                        ))}
                      </select>
                      {!question.required && formData[question.id] !== 'Not now' && !isSubmitted && (
                        <button
                          type="button"
                          className="skip-button"
                          onClick={() => handleSkipOptional(question.id)}
                        >
                          Not now
                        </button>
                      )}
                      {formData[question.id] === 'Not now' && !isSubmitted && (
                        <div className="skipped-indicator">
                          Skipped - <button type="button" className="undo-skip" onClick={() => handleInputChange(question.id, '')}>Undo</button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {question.type === 'number' && (
                    <>
                      <input
                        type="number"
                        className={`question-input ${errors[question.id] ? 'error' : ''}`}
                        value={formData[question.id] === 'Not now' ? '' : (formData[question.id] || '')}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        placeholder={question.placeholder || 'Enter a number'}
                        min="1"
                        disabled={formData[question.id] === 'Not now' || isSubmitted}
                      />
                      {!question.required && formData[question.id] !== 'Not now' && !isSubmitted && (
                        <button
                          type="button"
                          className="skip-button"
                          onClick={() => handleSkipOptional(question.id)}
                        >
                          Not now
                        </button>
                      )}
                      {formData[question.id] === 'Not now' && !isSubmitted && (
                        <div className="skipped-indicator">
                          Skipped - <button type="button" className="undo-skip" onClick={() => handleInputChange(question.id, '')}>Undo</button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {question.type === 'text' && (
                    <>
                      <input
                        type="text"
                        className={`question-input ${errors[question.id] ? 'error' : ''}`}
                        value={formData[question.id] === 'Not now' ? '' : (formData[question.id] || '')}
                        onChange={(e) => handleInputChange(question.id, e.target.value)}
                        placeholder={question.placeholder || 'Enter text'}
                        disabled={formData[question.id] === 'Not now' || isSubmitted}
                      />
                      {!question.required && formData[question.id] !== 'Not now' && !isSubmitted && (
                        <button
                          type="button"
                          className="skip-button"
                          onClick={() => handleSkipOptional(question.id)}
                        >
                          Not now
                        </button>
                      )}
                      {formData[question.id] === 'Not now' && !isSubmitted && (
                        <div className="skipped-indicator">
                          Skipped - <button type="button" className="undo-skip" onClick={() => handleInputChange(question.id, '')}>Undo</button>
                        </div>
                      )}
                    </>
                  )}
                  
                  {errors[question.id] && (
                    <span className="error-message">{errors[question.id]}</span>
                  )}
                </label>
                
                <div className="question-type-hint">
                  {getQuestionTypeHint(question.type)}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting || !isFormComplete() || isSubmitted}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
};

const getQuestionTypeHint = (type) => {
  const hints = {
    date: '📅 Date input',
    choice: '🔘 Select one option',
    number: '🔢 Number input',
    text: '✏️ Text input'
  };
  return hints[type] || '';
};

// Media Response Component
const MediaResponse = ({ response, onImageClick }) => {
  const { main_message, media } = response;

  return (
    <div className="media-response">
      {main_message && <p className="response-message">{main_message}</p>}
      
      {media && (
        <div className="media-container">
          {media.images && media.images.length > 0 && (
            <div className="media-grid">
              {media.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Image ${idx + 1}`}
                  className="media-image"
                  loading="lazy"
                  onClick={() => onImageClick && onImageClick(img)}
                />
              ))}
            </div>
          )}
          
          {media.videos && media.videos.length > 0 && (
            <div className="media-grid">
              {media.videos.map((vid, idx) => (
                <video
                  key={idx}
                  src={vid}
                  controls
                  preload="metadata"
                  className="media-video"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Property List Response Component
const PropertyListResponse = ({ response }) => {
  const { main_message, properties } = response;

  return (
    <div className="property-list-response">
      {main_message && <p className="response-message">{main_message}</p>}
      
      {properties && properties.length > 0 && (
        <div className="properties-grid">
          {properties.map((property, idx) => (
            <div key={idx} className="property-card">
              <div className="property-header">
                <h4 className="property-name">{property.name}</h4>
                <span className="property-price">Rs. {property.price.toLocaleString()}</span>
              </div>
              
              {property.location && (
                <div className="property-detail">
                  <i className="fas fa-map-marker-alt"></i>
                  <span>{property.location}</span>
                </div>
              )}
              
              {property.capacity && (
                <div className="property-detail">
                  <i className="fas fa-users"></i>
                  <span>Up to {property.capacity} guests</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Booking Confirmation Response Component
const BookingConfirmationResponse = ({ response }) => {
  const { main_message, booking_id, amount, payment_instructions, property_name, booking_date, shift_type } = response;

  return (
    <div className="booking-confirmation-response">
      {main_message && <p className="response-message success-message">{main_message}</p>}
      
      <div className="booking-details-card">
        <div className="booking-detail-row">
          <span className="detail-label">Booking ID:</span>
          <code className="booking-id">{booking_id}</code>
        </div>
        
        <div className="booking-detail-row">
          <span className="detail-label">Property:</span>
          <span className="detail-value">{property_name}</span>
        </div>
        
        <div className="booking-detail-row">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{booking_date}</span>
        </div>
        
        <div className="booking-detail-row">
          <span className="detail-label">Shift:</span>
          <span className="detail-value">{shift_type}</span>
        </div>
        
        <div className="booking-detail-row highlight">
          <span className="detail-label">Amount:</span>
          <span className="detail-value amount">Rs. {amount.toLocaleString()}</span>
        </div>
      </div>
      
      {payment_instructions && (
        <div className="payment-instructions">
          <h5><i className="fas fa-credit-card"></i> Payment Instructions</h5>
          <p>{payment_instructions}</p>
        </div>
      )}
    </div>
  );
};

// Error Response Component
const ErrorResponse = ({ response }) => {
  const { main_message, error_code } = response;

  return (
    <div className="error-response">
      <div className="error-icon">
        <i className="fas fa-exclamation-circle"></i>
      </div>
      <p className="error-message">{main_message}</p>
      {error_code && <span className="error-code">Error Code: {error_code}</span>}
    </div>
  );
};

export default ChatResponseRenderer;
