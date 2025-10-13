import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import UserLogin from "./pages/UserLogin/UserLogin";
import UserSignup from "./pages/UserSignup/UserSignup";
import UserChat from "./pages/UserChat/UserChat";

import AdminLogin from "./pages/Login/Login";
import Dashboard from "./pages/dashboard/dashboard";
import Bookings from "./pages/bookings/bookings";
import AddBooking from "./pages/add-booking/add-booking";

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
  const hasAdminToken = isTokenValid("propertyToken");

  return (
    <Routes>
      {/* ---------- ROOT ---------- */}
      <Route
        path="/"
        element={
          hasUserToken ? (
            <Navigate to="/chat" />
          ) : hasAdminToken ? (
            <Navigate to="/dashboard" />
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
        path="/register"
        element={hasUserToken ? <Navigate to="/chat" /> : <UserSignup />}
      />
      <Route
        path="/admin-login"
        element={hasAdminToken ? <Navigate to="/dashboard" /> : <AdminLogin />}
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

      {/* ---------- ADMIN PROTECTED ROUTES ---------- */}
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

      {/* ---------- DEFAULT ---------- */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
