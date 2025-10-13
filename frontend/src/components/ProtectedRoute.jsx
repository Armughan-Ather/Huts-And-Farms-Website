import React from "react";
import { Navigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode"; // ✅ Correct import

const ProtectedRoute = ({ children, tokenKey, redirectTo }) => {
  const token = localStorage.getItem(tokenKey);

  if (!token) return <Navigate to={redirectTo} />;

  try {
    const decoded = jwtDecode(token);
    const exp = decoded?.exp;

    if (!exp || exp * 1000 < Date.now()) {
      localStorage.removeItem(tokenKey);
      return <Navigate to={redirectTo} />;
    }

    // ✅ Valid token
    return children;
  } catch (err) {
    console.error("Token decode error:", err);
    localStorage.removeItem(tokenKey);
    return <Navigate to={redirectTo} />;
  }
};

export default ProtectedRoute;
