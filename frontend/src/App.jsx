import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import UserLogin from "./pages/UserLogin/UserLogin";
import Dashboard from "./pages/dashboard/dashboard";
import Bookings from "./pages/bookings/bookings";
import AddBooking from "./pages/add-booking/add-booking";
import "./App.css";

function App() {
  const token = localStorage.getItem("propertyToken");

  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<UserLogin />} />

      {/* Protected routes */}
      {token ? (
        <>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/bookings" element={<Bookings />} />
          <Route path="/add-booking" element={<AddBooking />} />
          {/* Default to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </>
      ) : (
        // If not logged in, redirect everything to login
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
}

export default App;
