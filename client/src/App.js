import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

// Eagerly load critical components
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import PrivateRoute from './components/PrivateRoute';

// Lazy-load all other pages
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const BatchManagement = lazy(() => import('./pages/BatchManagement'));
const Courses = lazy(() => import('./pages/Courses'));
const Announcements = lazy(() => import('./pages/Announcements'));
const ODApplications = lazy(() => import('./pages/ODApplications'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const AttendanceMarking = lazy(() => import('./pages/AttendanceMarking'));
const AttendanceReport = lazy(() => import('./pages/AttendanceReport'));
const Timetable = lazy(() => import('./pages/Timetable'));

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}><div className="spinner"></div></div>}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
          <Route path="/teacher" element={<PrivateRoute roles={['teacher']}><TeacherDashboard /></PrivateRoute>} />
          <Route path="/student" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
          <Route path="/users" element={<PrivateRoute roles={['admin']}><UserManagement /></PrivateRoute>} />
          <Route path="/attendance" element={<PrivateRoute roles={['teacher', 'admin']}><AttendanceMarking /></PrivateRoute>} />
          <Route path="/attendance-report" element={<PrivateRoute roles={['teacher', 'admin']}><AttendanceReport /></PrivateRoute>} />
          <Route path="/batches" element={<PrivateRoute roles={['admin']}><BatchManagement /></PrivateRoute>} />
          <Route path="/courses" element={<PrivateRoute roles={['admin', 'teacher', 'student']}><Courses /></PrivateRoute>} />
          <Route path="/timetable" element={<PrivateRoute roles={['admin', 'teacher', 'student']}><Timetable /></PrivateRoute>} />
          <Route path="/announcements" element={<PrivateRoute roles={['admin', 'teacher', 'student']}><Announcements /></PrivateRoute>} />
          <Route path="/od-applications" element={<PrivateRoute roles={['admin', 'teacher', 'student']}><ODApplications /></PrivateRoute>} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
