import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import UserLogin from "./pages/UserLogin/UserLogin.jsx";
import UserSignup from "./pages/UserSignup/UserSignup.jsx";
import UserChat from "./pages/UserChat/UserChat.jsx";
import AdminLogin from "./pages/login/login.jsx";
import Dashboard from "./pages/dashboard/dashboard.jsx";
import Bookings from "./pages/bookings/bookings.jsx";
import AddBooking from "./pages/add-booking/add-booking.jsx";
import OwnerDashboard from "./pages/owner-dashboard/OwnerDashboard.jsx";
import AdminDashboard from "./pages/admin-dashboard/AdminDashboard.jsx";

import ProtectedRoute from "./components/ProtectedRoute";
import {jwtDecode} from "jwt-decode"; // ✅ Needed for token validation

function App() {
  // Helper function to check token validity
  const isTokenValid = (tokenKey) => {
    const token = localStorage.getItem(tokenKey);
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const exp = decoded?.exp;
      return exp && exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  const hasUserToken = isTokenValid("token");
  const hasPropertyToken = isTokenValid("propertyToken");
  const hasOwnerToken = isTokenValid("ownerToken");
  const hasAdminToken = isTokenValid("adminToken");

  return (
    <Routes>
      {/* ---------- ROOT ---------- */}
      <Route
        path="/"
        element={
          hasUserToken ? (
            <Navigate to="/chat" />
          ) : hasPropertyToken ? (
            <Navigate to="/dashboard" />
          ) : hasOwnerToken ? (
            <Navigate to="/owner-dashboard" />
          ) : hasAdminToken ? (
            <Navigate to="/admin-dashboard" />
          ) : (
            <Navigate to="/login" />
          )
        }
      />

      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route
        path="/login"
        element={hasUserToken ? <Navigate to="/chat" /> : <UserLogin />}
      />
      <Route
        path="/user-login"
        element={hasUserToken ? <Navigate to="/chat" /> : <UserLogin />}
      />
      <Route
        path="/register"
        element={hasUserToken ? <Navigate to="/chat" /> : <UserSignup />}
      />
      <Route
        path="/admin-login"
        element={hasPropertyToken ? <Navigate to="/dashboard" /> : <AdminLogin />}
      />

      {/* ---------- USER PROTECTED ROUTES ---------- */}
      <Route
        path="/chat"
        element={
          <ProtectedRoute tokenKey="token" redirectTo="/login">
            <UserChat />
          </ProtectedRoute>
        }
      />

      {/* ---------- PROPERTY PROTECTED ROUTES ---------- */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute tokenKey="propertyToken" redirectTo="/admin-login">
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/bookings"
        element={
          <ProtectedRoute tokenKey="propertyToken" redirectTo="/admin-login">
            <Bookings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/add-booking"
        element={
          <ProtectedRoute tokenKey="propertyToken" redirectTo="/admin-login">
            <AddBooking />
          </ProtectedRoute>
        }
      />

      {/* ---------- OWNER PROTECTED ROUTES ---------- */}
      <Route
        path="/owner-dashboard"
        element={
          <ProtectedRoute tokenKey="ownerToken" redirectTo="/admin-login">
            <OwnerDashboard />
          </ProtectedRoute>
        }
      />

      {/* ---------- ADMIN PROTECTED ROUTES ---------- */}
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute tokenKey="adminToken" redirectTo="/admin-login">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* ---------- DEFAULT ---------- */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;