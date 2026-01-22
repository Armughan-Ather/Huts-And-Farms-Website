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
import './ForgotPasswordModal.css';

const ForgotPasswordModal = ({ 
  isOpen, 
  onClose, 
  onCodeSent 
}) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/forgot-password/send-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();

      if (response.ok) {
        // Call success callback with email
        onCodeSent(email.trim().toLowerCase());
      } else {
        setError(data.error || 'Failed to send reset code. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Forgot password error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setEmail('');
      setError('');
      onClose();
    }
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError('');
  };

  return (
    <MDBModal open={isOpen} onClose={handleClose} staticBackdrop>
      <MDBModalDialog centered className="forgot-password-modal-page-dialog">
        <MDBModalContent className="forgot-password-modal-page-content">
          <MDBModalHeader className="forgot-password-modal-page-header">
            <div className="forgot-password-modal-page-header-content">
              <div className="forgot-password-modal-page-icon-container">
                <MDBIcon fas icon="lock" className="forgot-password-modal-page-icon" />
              </div>
              <div>
                <MDBModalTitle className="forgot-password-modal-page-title">
                  Forgot Password?
                </MDBModalTitle>
                <p className="forgot-password-modal-page-subtitle">
                  Enter your email to receive a reset code
                </p>
              </div>
            </div>
            {!loading && (
              <button
                type="button"
                className="forgot-password-modal-page-close-btn"
                onClick={handleClose}
                aria-label="Close"
              >
                <MDBIcon fas icon="times" />
              </button>
            )}
          </MDBModalHeader>

          <MDBModalBody className="forgot-password-modal-page-body">
            <div className="forgot-password-modal-page-info">
              <MDBIcon fas icon="info-circle" className="forgot-password-modal-page-info-icon" />
              <span>We'll send a 6-digit verification code to your email address</span>
            </div>

            {error && (
              <div className="forgot-password-modal-page-error-alert">
                <MDBIcon fas icon="exclamation-circle" className="forgot-password-modal-page-error-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="forgot-password-modal-page-form">
              <div className="forgot-password-modal-page-input-group">
                <MDBInput
                  type="email"
                  label="Email Address"
                  value={email}
                  onChange={handleEmailChange}
                  className="forgot-password-modal-page-input"
                  size="lg"
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
            </form>
          </MDBModalBody>

          <MDBModalFooter className="forgot-password-modal-page-footer">
            <MDBBtn
              color="secondary"
              outline
              onClick={handleClose}
              disabled={loading}
              className="forgot-password-modal-page-cancel-btn"
            >
              Cancel
            </MDBBtn>
            <MDBBtn
              color="primary"
              onClick={handleSubmit}
              disabled={loading || !email}
              className="forgot-password-modal-page-submit-btn"
            >
              {loading ? (
                <>
                  <MDBSpinner size="sm" role="status" tag="span" className="me-2" />
                  Sending...
                </>
              ) : (
                <>
                  <MDBIcon fas icon="paper-plane" className="me-2" />
                  Send Reset Code
                </>
              )}
            </MDBBtn>
          </MDBModalFooter>
        </MDBModalContent>
      </MDBModalDialog>
    </MDBModal>
  );
};

export default ForgotPasswordModal;