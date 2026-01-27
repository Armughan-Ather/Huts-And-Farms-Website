import React, { useState } from 'react';
import axios from 'axios';
import './login.css';

const Login = () => {
  const [loginType, setLoginType] = useState('property'); // property, owner, admin
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleLoginTypeChange = (type) => {
    setLoginType(type);
    setError('');
    setFormData({ username: '', password: '' });
  };

  const getLoginEndpoint = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
    switch (loginType) {
      case 'property':
        return `${backendUrl}/api/properties/login`;
      case 'owner':
        return `${backendUrl}/api/owners/login`;
      case 'admin':
        return `${backendUrl}/api/admin/login`;
      default:
        return `${backendUrl}/api/properties/login`;
    }
  };

  const handleLoginSuccess = (data) => {
    switch (loginType) {
      case 'property':
        localStorage.setItem('propertyToken', data.token);
        localStorage.setItem('propertyData', JSON.stringify(data.property));
        window.location.href = '/dashboard';
        break;
      case 'owner':
        localStorage.setItem('ownerToken', data.token);
        localStorage.setItem('ownerData', JSON.stringify(data.owner));
        window.location.href = '/owner-dashboard';
        break;
      case 'admin':
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        window.location.href = '/admin-dashboard';
        break;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(getLoginEndpoint(), {
        username: formData.username,
        password: formData.password
      });

      const data = response.data;
      console.log('Login successful:', data);
      
      handleLoginSuccess(data);
      
    } catch (err) {
      console.log('Login error:', err);
      
      if (err.response) {
        setError(err.response.data.error || 'Login failed. Please try again.');
      } else if (err.request) {
        setError('Network error. Please check your connection and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getLoginTypeTitle = () => {
    switch (loginType) {
      case 'property':
        return 'Property Login';
      case 'owner':
        return 'Owner Login';
      case 'admin':
        return 'Admin Login';
      default:
        return 'Login';
    }
  };

  const getPlaceholderText = () => {
    switch (loginType) {
      case 'property':
        return 'Property Username/Email';
      case 'owner':
        return 'Owner Username';
      case 'admin':
        return 'Admin Username';
      default:
        return 'Username/Email';
    }
  };

  return (
    <div className="unified-login-page-container">
      {/* Left Side - Branding */}
      <div className="unified-login-page-left-panel">
        <div className="unified-login-page-branding">
          <div className="unified-login-page-logo">
            <div className="unified-login-page-logo-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="white"/>
              </svg>
            </div>
          </div>
          
          <h1 className="unified-login-page-title">Huts & Farms</h1>
          <p className="unified-login-page-subtitle">Manage your properties and bookings with us!</p>
          
          <div className="unified-login-page-features">
            <div className="unified-login-page-feature">
              <div className="unified-login-page-feature-icon">✓</div>
              <span>Secure & Trusted Platform</span>
            </div>
            <div className="unified-login-page-feature">
              <div className="unified-login-page-feature-icon">✓</div>
              <span>Comprehensive Management</span>
            </div>
            <div className="unified-login-page-feature">
              <div className="unified-login-page-feature-icon">✓</div>
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="unified-login-page-right-panel">
        <div className="unified-login-page-form-container">
          {/* Login Type Selector */}
          <div className="unified-login-page-type-selector">
            <button
              type="button"
              className={`unified-login-page-type-btn ${loginType === 'property' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('property')}
            >
              Property
            </button>
            <button
              type="button"
              className={`unified-login-page-type-btn ${loginType === 'owner' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('owner')}
            >
              Owner
            </button>
            <button
              type="button"
              className={`unified-login-page-type-btn ${loginType === 'admin' ? 'active' : ''}`}
              onClick={() => handleLoginTypeChange('admin')}
            >
              Admin
            </button>
          </div>

          <div className="unified-login-page-form-header">
            <h2>{getLoginTypeTitle()}</h2>
            <p>Please login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="unified-login-page-form">
            {error && (
              <div className="unified-login-page-error">
                {error}
              </div>
            )}

            <div className="unified-login-page-form-group">
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="unified-login-page-input"
                placeholder={getPlaceholderText()}
                required
              />
            </div>

            <div className="unified-login-page-form-group">
              <div className="unified-login-page-password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="unified-login-page-input"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="unified-login-page-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {showPassword ? (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z" fill="currentColor"/>
                    ) : (
                      <path d="M12 7C14.76 7 17 9.24 17 12C17 13.38 16.5 14.65 15.64 15.64L17.42 17.42C18.72 16.19 19.5 14.8 19.5 12C19.5 7.61 17.27 4.5 12 4.5C10.2 4.5 8.27 5.61 7 7.39L8.58 8.97C9.35 7.16 10.62 7 12 7ZM2 4.27L4.28 6.55L4.73 7C3.08 8.3 1.78 10 1 12C2.73 16.39 7 19.5 12 19.5C13.55 19.5 15.03 19.2 16.38 18.66L16.81 19.09L19.73 22L21 20.73L3.27 3L2 4.27ZM7.53 9.8L9.08 11.35C9.03 11.56 9 11.78 9 12C9 13.66 10.34 15 12 15C12.22 15 12.44 14.97 12.65 14.92L14.2 16.47C13.53 16.8 12.79 17 12 17C9.24 17 7 14.76 7 12C7 11.21 7.2 10.47 7.53 9.8Z" fill="currentColor"/>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className={`unified-login-page-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="unified-login-page-loading">
                  <div className="unified-login-page-spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Login as {loginType.charAt(0).toUpperCase() + loginType.slice(1)}
                </>
              )}
            </button>

            {loginType === 'property' && (
              <>
                <div className="unified-login-page-divider">
                  <span>OR</span>
                </div>

                <div className="unified-login-page-signup">
                  <span>Don't have an account? </span>
                  <a href="#" className="unified-login-page-signup-link">Sign up here</a>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 