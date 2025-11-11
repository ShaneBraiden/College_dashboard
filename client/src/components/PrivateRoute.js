import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, roles }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(userRole)) {
    // Redirect them to their respective dashboard if they try to access a wrong route
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'teacher') return <Navigate to="/teacher" replace />;
    if (userRole === 'student') return <Navigate to="/student" replace />;
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
