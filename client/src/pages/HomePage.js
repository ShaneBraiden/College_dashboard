import React from 'react';
import { Navigate } from 'react-router-dom';

const HomePage = () => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  } else if (userRole === 'teacher') {
    return <Navigate to="/teacher" replace />;
  } else if (userRole === 'student') {
    return <Navigate to="/student" replace />;
  }

  // Fallback to login if role is not set or invalid
  return <Navigate to="/login" replace />;
};

export default HomePage;
