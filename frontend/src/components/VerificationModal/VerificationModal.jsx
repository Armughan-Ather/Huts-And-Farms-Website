import React, { useState, useEffect } from 'react';
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
import './VerificationModal.css';

const VerificationModal = ({ 
  isOpen, 
  onClose, 
  type = 'verification', // 'verification' or 'reset_password'
  email,
  onSuccess,
  onResendCode
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [canResend, setCanResend] = useState(false);

  // Timer for resend functionality
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  // Reset timer when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(60); // 60 seconds countdown
      setCanResend(false);
      setCode('');
      setError('');
      setSuccess('');
    }
  }, [isOpen]);

  const isVerificationType = type === 'verification';
  const isResetPasswordType = type === 'reset_password';

  const modalConfig = {
    verification: {
      title: 'Verify Your Email',
      subtitle: 'Enter the 6-digit code sent to your email',
      icon: 'envelope-open',
      submitText: 'Verify & Complete Registration',
      apiEndpoint: '/api/users/signup/verify-code'
    },
    reset_password: {
      title: 'Enter Reset Code',
      subtitle: 'Enter the 6-digit code sent to your email',
      icon: 'key',
      submitText: 'Verify Code',
      apiEndpoint: '/api/users/forgot-password/verify-code'
    }
  };

  const config = modalConfig[type];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}${config.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          code: code
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        
        // Call success callback with the response data and the code
        setTimeout(() => {
          onSuccess({ ...data, verifiedCode: code });
        }, 1500);
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    setLoading(true);
    setError('');
    
    try {
      await onResendCode();
      setTimeLeft(60);
      setCanResend(false);
      setSuccess('New code sent to your email!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setError('');
  };

  const handleDigitChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 1) {
      const newCode = code.split('');
      newCode[index] = value;
      const updatedCode = newCode.join('').slice(0, 6);
      setCode(updatedCode);
      setError('');

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = e.target.parentNode.children[index + 1];
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    // Handle backspace
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = e.target.parentNode.children[index - 1];
      if (prevInput) prevInput.focus();
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      const prevInput = e.target.parentNode.children[index - 1];
      if (prevInput) prevInput.focus();
    }
    
    if (e.key === 'ArrowRight' && index < 5) {
      const nextInput = e.target.parentNode.children[index + 1];
      if (nextInput) nextInput.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    setCode(pastedData);
    setError('');
    
    // Focus the last filled input or the next empty one
    const targetIndex = Math.min(pastedData.length, 5);
    const targetInput = e.target.parentNode.children[targetIndex];
    if (targetInput) targetInput.focus();
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <MDBModal open={isOpen} onClose={handleClose} staticBackdrop>
      <MDBModalDialog centered className="verification-modal-page-dialog">
        <MDBModalContent className="verification-modal-page-content">
          <MDBModalHeader className="verification-modal-page-header">
            <div className="verification-modal-page-header-content">
              <div className="verification-modal-page-icon-container">
                <MDBIcon fas icon={config.icon} className="verification-modal-page-icon" />
              </div>
              <div>
                <MDBModalTitle className="verification-modal-page-title">
                  {config.title}
                </MDBModalTitle>
                <p className="verification-modal-page-subtitle">
                  {config.subtitle}
                </p>
              </div>
            </div>
            {!loading && (
              <button
                type="button"
                className="verification-modal-page-close-btn"
                onClick={handleClose}
                aria-label="Close"
              >
                <MDBIcon fas icon="times" />
              </button>
            )}
          </MDBModalHeader>

          <MDBModalBody className="verification-modal-page-body">
            <div className="verification-modal-page-email-info">
              <MDBIcon fas icon="envelope" className="verification-modal-page-email-icon" />
              <span>Code sent to: <strong>{email}</strong></span>
            </div>

            {error && (
              <div className="verification-modal-page-error-alert">
                <MDBIcon fas icon="exclamation-circle" className="verification-modal-page-error-icon" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="verification-modal-page-success-alert">
                <MDBIcon fas icon="check-circle" className="verification-modal-page-success-icon" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="verification-modal-page-form">
              <div className="verification-modal-page-input-group">
                <div className="verification-modal-page-code-display">
                  {[...Array(6)].map((_, index) => (
                    <input
                      key={index}
                      type="text"
                      maxLength="1"
                      className={`verification-modal-page-code-digit ${
                        code[index] ? 'verification-modal-page-code-digit-filled' : ''
                      }`}
                      value={code[index] || ''}
                      onChange={(e) => handleDigitChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      onPaste={handlePaste}
                      disabled={loading}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
              </div>

              <div className="verification-modal-page-resend-section">
                <p className="verification-modal-page-resend-text">
                  Didn't receive the code?
                </p>
                <button
                  type="button"
                  className={`verification-modal-page-resend-btn ${
                    !canResend ? 'verification-modal-page-resend-btn-disabled' : ''
                  }`}
                  onClick={handleResendCode}
                  disabled={!canResend || loading}
                >
                  {canResend ? (
                    <>
                      <MDBIcon fas icon="redo" className="me-2" />
                      Resend Code
                    </>
                  ) : (
                    <>
                      <MDBIcon fas icon="clock" className="me-2" />
                      Resend in {timeLeft}s
                    </>
                  )}
                </button>
              </div>
            </form>
          </MDBModalBody>

          <MDBModalFooter className="verification-modal-page-footer">
            <MDBBtn
              color="secondary"
              outline
              onClick={handleClose}
              disabled={loading}
              className="verification-modal-page-cancel-btn"
            >
              Cancel
            </MDBBtn>
            <MDBBtn
              color="primary"
              onClick={handleSubmit}
              disabled={loading || code.length !== 6}
              className="verification-modal-page-submit-btn"
            >
              {loading ? (
                <>
                  <MDBSpinner size="sm" role="status" tag="span" className="me-2" />
                  Verifying...
                </>
              ) : (
                <>
                  <MDBIcon fas icon="check" className="me-2" />
                  {config.submitText}
                </>
              )}
            </MDBBtn>
          </MDBModalFooter>
        </MDBModalContent>
      </MDBModalDialog>
    </MDBModal>
  );
};

export default VerificationModal;