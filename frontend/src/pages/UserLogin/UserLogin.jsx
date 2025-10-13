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
import './UserLogin.css';

const UserLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        console.log('Login successful:', data);
        // Redirect to dashboard or home
        navigate('/chat');
        
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-login-page-wrapper">
      <div className="user-login-page-background-overlay"></div>
      
      <MDBContainer fluid className="user-login-page-container">
        <MDBRow className="user-login-page-row">
          <MDBCol md="6" className="user-login-page-left-section d-none d-md-flex">
            <div className="user-login-page-branding">
              <div className="user-login-page-logo-container">
                <MDBIcon fas icon="home" className="user-login-page-logo-icon" />
              </div>
              <h1 className="user-login-page-brand-title">Huts & Farms</h1>
              <p className="user-login-page-brand-subtitle">
                Do your Huts & Farms booking with us!
              </p>
              <div className="user-login-page-features">
                <div className="user-login-page-feature-item">
                  <MDBIcon fas icon="check-circle" className="user-login-page-feature-icon" />
                  <span>Secure & Trusted Platform</span>
                </div>
                <div className="user-login-page-feature-item">
                  <MDBIcon fas icon="check-circle" className="user-login-page-feature-icon" />
                  <span>One place for everything</span>
                </div>
                <div className="user-login-page-feature-item">
                  <MDBIcon fas icon="check-circle" className="user-login-page-feature-icon" />
                  <span>24/7 Customer Support</span>
                </div>
              </div>
            </div>
          </MDBCol>

          <MDBCol md="6" className="user-login-page-right-section">
            <MDBCard className="user-login-page-card">
              <MDBCardBody className="user-login-page-card-body">
                <div className="user-login-page-mobile-logo d-md-none">
                  <MDBIcon fas icon="home" className="user-login-page-mobile-logo-icon" />
                  <h2>Huts & Farms</h2>
                </div>

                <div className="user-login-page-header">
                  <h2 className="user-login-page-title">Welcome Back!</h2>
                  <p className="user-login-page-subtitle">Please login to your account</p>
                </div>

                {error && (
                  <div className="user-login-page-error-alert">
                    <MDBIcon fas icon="exclamation-circle" className="user-login-page-error-icon" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="user-login-page-form">
                  <div className="user-login-page-input-group">
                    <MDBInput
                      type="email"
                      name="email"
                      label="Email Address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="user-login-page-input"
                      size="lg"
                    />
                  </div>

                  <div className="user-login-page-input-group">
                    <div className="user-login-page-password-wrapper">
                      <MDBInput
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        label="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        className="user-login-page-input"
                        size="lg"
                      />
                      <button
                        type="button"
                        className="user-login-page-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        <MDBIcon fas icon={showPassword ? 'eye-slash' : 'eye'} />
                      </button>
                    </div>
                  </div>

                  {/* <div className="user-login-page-options">
                    <div className="user-login-page-remember">
                      <input type="checkbox" id="remember" className="user-login-page-checkbox" />
                      <label htmlFor="remember">Remember me</label>
                    </div>
                    <a href="/forgot-password" className="user-login-page-forgot-link">
                      Forgot Password?
                    </a>
                  </div> */}

                  <MDBBtn
                    type="submit"
                    className="user-login-page-submit-btn"
                    size="lg"
                    block
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <MDBSpinner size="sm" role="status" tag="span" className="me-2" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <MDBIcon fas icon="sign-in-alt" className="me-2" />
                        Login
                      </>
                    )}
                  </MDBBtn>
                </form>

                <div className="user-login-page-divider">
                  <span>OR</span>
                </div>
{/* 
                <div className="user-login-page-social-buttons">
                  <button className="user-login-page-social-btn user-login-page-google-btn">
                    <MDBIcon fab icon="google" className="me-2" />
                    Google
                  </button>
                  <button className="user-login-page-social-btn user-login-page-facebook-btn">
                    <MDBIcon fab icon="facebook-f" className="me-2" />
                    Facebook
                  </button>
                </div> */}

                <div className="user-login-page-register-link">
                  Don't have an account? <a href="/register">Sign up here</a>
                </div>
              </MDBCardBody>
            </MDBCard>
          </MDBCol>
        </MDBRow>
      </MDBContainer>
    </div>
  );
};

export default UserLogin;