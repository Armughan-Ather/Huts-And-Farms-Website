import React from "react";
import { Navigate } from "react-router-dom";
import {jwtDecode} from "jwt-decode";

const ProtectedRoute = ({ children, tokenKey, redirectTo }) => {
  const token = localStorage.getItem(tokenKey);

  if (!token) return <Navigate to={redirectTo} />;

  try {
    const decoded = jwtDecode(token);
    const isExpired = decoded.exp * 1000 < Date.now();
    if (isExpired) {
      localStorage.removeItem(tokenKey);
      return <Navigate to={redirectTo} />;
    }
  } catch (err) {
    localStorage.removeItem(tokenKey);
    return <Navigate to={redirectTo} />;
  }

  return children;
};

export default ProtectedRoute;
