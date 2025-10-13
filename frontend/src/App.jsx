import React, { useState, useEffect } from 'react';
import Login from './pages/login/login';
import Dashboard from './pages/dashboard/dashboard';
import Bookings from './pages/bookings/bookings';
import AddBooking from './pages/add-booking/add-booking';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('login');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('propertyToken');
    if (token) {
      // Check current URL to determine which page to show
      const path = window.location.pathname;
      if (path === '/bookings') {
        setCurrentPage('bookings');
      } else if (path === '/add-booking') {
        setCurrentPage('add-booking');
      } else {
        setCurrentPage('dashboard');
      }
    } else {
      setCurrentPage('login');
    }
    setLoading(false);
  }, []);

  // Listen for navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      const path = window.location.pathname;
      if (path === '/bookings') {
        setCurrentPage('bookings');
      } else if (path === '/dashboard') {
        setCurrentPage('dashboard');
      } else if (path === '/add-booking') {
        setCurrentPage('add-booking');
      } else {
        setCurrentPage('dashboard');
      }
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // Render appropriate page based on authentication and current route
  if (currentPage === 'login') {
    return <Login />;
  } else if (currentPage === 'bookings') {
    return <Bookings />;
  } else if (currentPage === 'add-booking') {
    return <AddBooking />;
  } else {
    return <Dashboard />;
  }
}

export default App;
