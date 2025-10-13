import React, { useState } from 'react';
import axios from 'axios';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    propertyUsername: '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const response = await axios.post(`${backendUrl}/api/properties/login`, {
        username: formData.propertyUsername,
        password: formData.password
      });

      const data = response.data;

      // Store the token in localStorage
      localStorage.setItem('propertyToken', data.token);
      localStorage.setItem('propertyData', JSON.stringify(data.property));
      
      console.log('Login successful:', data);
      
      // Redirect to dashboard
      window.location.href = '/dashboard';
      
    } catch (err) {
      console.log('Login error:', err);
      
      if (err.response) {
        // Server responded with error status
        setError(err.response.data.error || 'Login failed. Please try again.');
      } else if (err.request) {
        // Request was made but no response received
        setError('Network error. Please check your connection and try again.');
      } else {
        // Something else happened
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side - Branding */}
      <div className="login-left-panel">
        <div className="login-branding">
          <div className="login-logo">
            <div className="login-logo-icon">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20V14H14V20H19V12H22L12 3L2 12H5V20H10Z" fill="white"/>
              </svg>
            </div>
          </div>
          
          <h1 className="login-title">Huts & Farms</h1>
          <p className="login-subtitle">Do your Huts & Farms booking with us!</p>
          
          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon">✓</div>
              <span>Secure & Trusted Platform</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">✓</div>
              <span>One place for everything</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon">✓</div>
              <span>24/7 Customer Support</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="login-right-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Welcome Back!</h2>
            <p>Please login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="login-form-group">
              <input
                type="text"
                id="propertyUsername"
                name="propertyUsername"
                value={formData.propertyUsername}
                onChange={handleInputChange}
                className="login-input"
                placeholder="Email Address"
                required
              />
            </div>

            <div className="login-form-group">
              <div className="login-password-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="login-input"
                  placeholder="Password"
                  required
                />
                <button
                  type="button"
                  className="login-password-toggle"
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
              className={`login-button ${isLoading ? 'loading' : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="login-loading">
                  <div className="login-spinner"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Login
                </>
              )}
            </button>

            <div className="login-divider">
              <span>OR</span>
            </div>

            <div className="login-signup">
              <span>Don't have an account? </span>
              <a href="#" className="login-signup-link">Sign up here</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 