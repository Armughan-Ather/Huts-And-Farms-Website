import React, { useState } from 'react';
import {
  MDBModal,
  MDBModalDialog,
  MDBModalContent,
  MDBModalHeader,
  MDBModalTitle,
  MDBModalBody,
  MDBModalFooter,
  MDBBtn,
  MDBInput,
  MDBIcon,
  MDBSpinner
} from 'mdb-react-ui-kit';
import './ResetPasswordModal.css';

const ResetPasswordModal = ({ 
  isOpen, 
  onClose, 
  email,
  code,
  onSuccess 
}) => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    setError('');
    
    // Clear specific validation error when user types
    if (validationErrors[name]) {
      setValidationErrors({
        ...validationErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};

    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/forgot-password/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code,
          password: formData.password,
          confirmPassword: formData.confirmPassword
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Call success callback
        onSuccess(data);
      } else {
        setError(data.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Reset password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({ password: '', confirmPassword: '' });
      setError('');
      setValidationErrors({});
      onClose();
    }
  };

  return (
    <MDBModal open={isOpen} onClose={handleClose} staticBackdrop>
      <MDBModalDialog centered className="reset-password-modal-page-dialog">
        <MDBModalContent className="reset-password-modal-page-content">
          <MDBModalHeader className="reset-password-modal-page-header">
            <div className="reset-password-modal-page-header-content">
              <div className="reset-password-modal-page-icon-container">
                <MDBIcon fas icon="key" className="reset-password-modal-page-icon" />
              </div>
              <div>
                <MDBModalTitle className="reset-password-modal-page-title">
                  Reset Password
                </MDBModalTitle>
                <p className="reset-password-modal-page-subtitle">
                  Enter your new password
                </p>
              </div>
            </div>
            {!loading && (
              <button
                type="button"
                className="reset-password-modal-page-close-btn"
                onClick={handleClose}
                aria-label="Close"
              >
                <MDBIcon fas icon="times" />
              </button>
            )}
          </MDBModalHeader>

          <MDBModalBody className="reset-password-modal-page-body">
            <div className="reset-password-modal-page-email-info">
              <MDBIcon fas icon="envelope" className="reset-password-modal-page-email-icon" />
              <span>Resetting password for: <strong>{email}</strong></span>
            </div>

            {error && (
              <div className="reset-password-modal-page-error-alert">
                <MDBIcon fas icon="exclamation-circle" className="reset-password-modal-page-error-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="reset-password-modal-page-form">
              <div className="reset-password-modal-page-input-group">
                <div className="reset-password-modal-page-password-wrapper">
                  <MDBInput
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    label="New Password"
                    value={formData.password}
                    onChange={handleChange}
                    className="reset-password-modal-page-input"
                    size="lg"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="reset-password-modal-page-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <MDBIcon fas icon={showPassword ? 'eye-slash' : 'eye'} />
                  </button>
                </div>
                {validationErrors.password && (
                  <small className="reset-password-modal-page-error-text">{validationErrors.password}</small>
                )}
              </div>

              <div className="reset-password-modal-page-input-group">
                <div className="reset-password-modal-page-password-wrapper">
                  <MDBInput
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    label="Confirm New Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="reset-password-modal-page-input"
                    size="lg"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    className="reset-password-modal-page-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MDBIcon fas icon={showConfirmPassword ? 'eye-slash' : 'eye'} />
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <small className="reset-password-modal-page-error-text">{validationErrors.confirmPassword}</small>
                )}
              </div>

              <div className="reset-password-modal-page-password-requirements">
                <h6 className="reset-password-modal-page-requirements-title">
                  <MDBIcon fas icon="shield-alt" className="me-2" />
                  Password Requirements:
                </h6>
                <ul className="reset-password-modal-page-requirements-list">
                  <li className={formData.password.length >= 6 ? 'reset-password-modal-page-requirement-met' : ''}>
                    <MDBIcon fas icon={formData.password.length >= 6 ? 'check' : 'times'} className="me-2" />
                    At least 6 characters
                  </li>
                  <li className={formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? 'reset-password-modal-page-requirement-met' : ''}>
                    <MDBIcon fas icon={formData.password && formData.confirmPassword && formData.password === formData.confirmPassword ? 'check' : 'times'} className="me-2" />
                    Passwords match
                  </li>
                </ul>
              </div>
            </form>
          </MDBModalBody>

          <MDBModalFooter className="reset-password-modal-page-footer">
            <MDBBtn
              color="secondary"
              outline
              onClick={handleClose}
              disabled={loading}
              className="reset-password-modal-page-cancel-btn"
            >
              Cancel
            </MDBBtn>
            <MDBBtn
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !formData.password || !formData.confirmPassword}
              className="reset-password-modal-page-submit-btn"
            >
              {loading ? (
                <>
                  <MDBSpinner size="sm" role="status" tag="span" className="me-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <MDBIcon fas icon="check" className="me-2" />
                  Reset Password
                </>
              )}
            </MDBBtn>
          </MDBModalFooter>
        </MDBModalContent>
      </MDBModalDialog>
    </MDBModal>
  );
};

export default ResetPasswordModal;