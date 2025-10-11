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

function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/login" element={<UserLogin />} />
      <Route path="/register" element={<UserSignup />} />
      <Route path="/admin-login" element={<AdminLogin />} />

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
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
