import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";

import UserLogin from "./pages/UserLogin/UserLogin";
import UserSignup from "./pages/UserSignup/UserSignup";
import UserChat from "./pages/UserChat/UserChat";

import AdminLogin from "./pages/Login/Login"; // Renamed for clarity
import Dashboard from "./pages/dashboard/dashboard";
import Bookings from "./pages/bookings/bookings";
import AddBooking from "./pages/add-booking/add-booking";

function App() {
  const propertyToken = localStorage.getItem("propertyToken"); // Admin token
  const userToken = localStorage.getItem("token"); // User token

  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES ---------- */}
      <Route path="/login" element={<UserLogin />} />          {/* User login */}
      <Route path="/register" element={<UserSignup />} />      {/* User signup */}
      <Route path="/admin-login" element={<AdminLogin />} />   {/* Admin login */}

      {/* ---------- USER PROTECTED ROUTES ---------- */}
      {userToken ? (
        <>
          <Route path="/chat" element={<UserChat />} />
          {/* Default route for logged-in user */}
          <Route path="*" element={<Navigate to="/chat" />} />
        </>
      ) : (
        <>
          <Route path="/chat" element={<Navigate to="/login" />} />
        </>
      )}

      {/* ---------- ADMIN PROTECTED ROUTES ---------- */}
      {propertyToken ? (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/add-booking" element={<AddBooking />} />
          {/* Default route for logged-in admin */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </>
      ) : (
        <>
          <Route path="/dashboard" element={<Navigate to="/admin-login" />} />
          <Route path="/bookings" element={<Navigate to="/admin-login" />} />
          <Route path="/add-booking" element={<Navigate to="/admin-login" />} />
        </>
      )}

      {/* ---------- DEFAULT (Catch-all) ---------- */}
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
