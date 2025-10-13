import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MDBContainer,
  MDBRow,
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBInput,
  MDBBtn,
  MDBIcon,
  MDBSpinner
} from 'mdb-react-ui-kit';
import './UserSignup.css';

const UserSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    password: '',
    confirmPassword: '',
    cnic: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }

    // Phone validation
    const phoneRegex = /^(\+92|0)?[0-9]{10}$/;
    if (!formData.phone_number) {
      errors.phone_number = 'Phone number is required';
    } else if (!phoneRegex.test(formData.phone_number.replace(/[\s-]/g, ''))) {
      errors.phone_number = 'Please enter a valid phone number';
    }

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

    // CNIC validation (optional but must be valid if provided)
    if (formData.cnic && !/^\d{13}$/.test(formData.cnic.replace(/-/g, ''))) {
      errors.cnic = 'CNIC must be exactly 13 digits';
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
      // Prepare data for API
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone_number: formData.phone_number.replace(/[\s-]/g, ''),
        password: formData.password,
        cnic: formData.cnic ? formData.cnic.replace(/-/g, '') : undefined
      };

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        
        // Show success message for 2 seconds then redirect to login
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(data.error || data.details || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="user-signup-page-wrapper">
        <div className="user-signup-page-background-overlay"></div>
        <MDBContainer fluid className="user-signup-page-container">
          <div className="user-signup-page-success-container">
            <div className="user-signup-page-success-icon">
              <MDBIcon fas icon="check-circle" />
            </div>
            <h2 className="user-signup-page-success-title">Registration Successful!</h2>
            <p className="user-signup-page-success-text">
              Your account has been created successfully. Redirecting to login...
            </p>
            <MDBSpinner color="light" className="mt-3" />
          </div>
        </MDBContainer>
      </div>
    );
  }

  return (
    <div className="user-signup-page-wrapper">
      <div className="user-signup-page-background-overlay"></div>
      
      <MDBContainer fluid className="user-signup-page-container">
        <MDBRow className="user-signup-page-row">
          <MDBCol md="6" className="user-signup-page-left-section d-none d-md-flex">
            <div className="user-signup-page-branding">
              <div className="user-signup-page-logo-container">
                <MDBIcon fas icon="home" className="user-signup-page-logo-icon" />
              </div>
              <h1 className="user-signup-page-brand-title">Huts & Farms</h1>
              <p className="user-signup-page-brand-subtitle">
                Join us today and do instant booking of Huts & Farms!
              </p>
              <div className="user-signup-page-features">
                <div className="user-signup-page-feature-item">
                  <MDBIcon fas icon="user-shield" className="user-signup-page-feature-icon" />
                  <span>Secure Account Protection</span>
                </div>
                <div className="user-signup-page-feature-item">
                  <MDBIcon fas icon="bolt" className="user-signup-page-feature-icon" />
                  <span>Quick & Easy Setup</span>
                </div>
                <div className="user-signup-page-feature-item">
                  <MDBIcon fas icon="headset" className="user-signup-page-feature-icon" />
                  <span>24/7 Availability</span>
                </div>
                {/* <div className="user-signup-page-feature-item">
                  <MDBIcon fas icon="chart-line" className="user-signup-page-feature-icon" />
                  <span>Track Your Properties</span>
                </div> */}
              </div>
            </div>
          </MDBCol>

          <MDBCol md="6" className="user-signup-page-right-section">
            <MDBCard className="user-signup-page-card">
              <MDBCardBody className="user-signup-page-card-body">
                <div className="user-signup-page-mobile-logo d-md-none">
                  <MDBIcon fas icon="home" className="user-signup-page-mobile-logo-icon" />
                  <h2>Huts & Farms</h2>
                </div>

                <div className="user-signup-page-header">
                  <h2 className="user-signup-page-title">Create Account</h2>
                  <p className="user-signup-page-subtitle">Sign up to get started with Huts & Farms</p>
                </div>

                {error && (
                  <div className="user-signup-page-error-alert">
                    <MDBIcon fas icon="exclamation-circle" className="user-signup-page-error-icon" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="user-signup-page-form">
                  <div className="user-signup-page-input-group">
                    <MDBInput
                      type="text"
                      name="name"
                      label="Full Name *"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="user-signup-page-input"
                      size="lg"
                    />
                    {validationErrors.name && (
                      <small className="user-signup-page-error-text">{validationErrors.name}</small>
                    )}
                  </div>

                  <div className="user-signup-page-input-group">
                    <MDBInput
                      type="email"
                      name="email"
                      label="Email Address *"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="user-signup-page-input"
                      size="lg"
                    />
                    {validationErrors.email && (
                      <small className="user-signup-page-error-text">{validationErrors.email}</small>
                    )}
                  </div>

                  <div className="user-signup-page-input-group">
                    <MDBInput
                      type="tel"
                      name="phone_number"
                      label="Phone Number *"
                      value={formData.phone_number}
                      onChange={handleChange}
                      required
                      className="user-signup-page-input"
                      size="lg"
                      placeholder="03001234567"
                    />
                    {validationErrors.phone_number && (
                      <small className="user-signup-page-error-text">{validationErrors.phone_number}</small>
                    )}
                  </div>

                  <div className="user-signup-page-input-group">
                    <MDBInput
                      type="text"
                      name="cnic"
                      label="CNIC (Optional)"
                      value={formData.cnic}
                      onChange={handleChange}
                      className="user-signup-page-input"
                      size="lg"
                      placeholder="1234567890123"
                    />
                    {validationErrors.cnic && (
                      <small className="user-signup-page-error-text">{validationErrors.cnic}</small>
                    )}
                  </div>

                  <div className="user-signup-page-input-group">
                    <div className="user-signup-page-password-wrapper">
                      <MDBInput
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        label="Password *"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="user-signup-page-input"
                        size="lg"
                      />
                      <button
                        type="button"
                        className="user-signup-page-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <MDBIcon fas icon={showPassword ? 'eye-slash' : 'eye'} />
                      </button>
                    </div>
                    {validationErrors.password && (
                      <small className="user-signup-page-error-text">{validationErrors.password}</small>
                    )}
                  </div>

                  <div className="user-signup-page-input-group">
                    <div className="user-signup-page-password-wrapper">
                      <MDBInput
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        label="Confirm Password *"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        className="user-signup-page-input"
                        size="lg"
                      />
                      <button
                        type="button"
                        className="user-signup-page-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        <MDBIcon fas icon={showConfirmPassword ? 'eye-slash' : 'eye'} />
                      </button>
                    </div>
                    {validationErrors.confirmPassword && (
                      <small className="user-signup-page-error-text">{validationErrors.confirmPassword}</small>
                    )}
                  </div>

                  {/* <div className="user-signup-page-terms">
                    <input type="checkbox" id="terms" required className="user-signup-page-checkbox" />
                    <label htmlFor="terms">
                      I agree to the <a href="/terms">Terms & Conditions</a> and <a href="/privacy">Privacy Policy</a>
                    </label>
                  </div> */}

                  <MDBBtn
                    type="submit"
                    className="user-signup-page-submit-btn"
                    size="lg"
                    block
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <MDBSpinner size="sm" role="status" tag="span" className="me-2" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <MDBIcon fas icon="user-plus" className="me-2" />
                        Create Account
                      </>
                    )}
                  </MDBBtn>
                </form>

                <div className="user-signup-page-divider">
                  <span>OR</span>
                </div>
{/* 
                <div className="user-signup-page-social-buttons">
                  <button className="user-signup-page-social-btn user-signup-page-google-btn">
                    <MDBIcon fab icon="google" className="me-2" />
                    Google
                  </button>
                  <button className="user-signup-page-social-btn user-signup-page-facebook-btn">
                    <MDBIcon fab icon="facebook-f" className="me-2" />
                    Facebook
                  </button>
                </div> */}

                <div className="user-signup-page-login-link">
                  Already have an account? <a href="/login">Login here</a>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
};

export default UserSignup;