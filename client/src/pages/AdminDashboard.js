import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import TimetableManager from '../components/TimetableManager';
import { AttendanceBarChart, AttendancePieChart } from '../components/Charts';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ users: 0, classes: 0, students: 0, teachers: 0 });
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [selectedClassForTimetable, setSelectedClassForTimetable] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [bunkedList, setBunkedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'student' });
  const [newClass, setNewClass] = useState({ name: '', classCode: '', semester: '', branch: '' });

  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('Stats state changed:', stats);
  }, [stats]);

  useEffect(() => {
    console.log('Users state changed:', users);
    console.log('Classes state changed:', classes);
  }, [users, classes]);

  const fetchData = async () => {
    try {
  console.log('Fetching admin data...');
      
      const [usersRes, batchesRes, statsRes, bunkedRes] = await Promise.all([
        axios.get('http://localhost:5000/api/users', config),
        axios.get('http://localhost:5000/api/batches', config),
        axios.get('http://localhost:5000/api/reports/statistics', config),
        axios.get('http://localhost:5000/api/reports/bunked', config)
      ]);

  console.log('Users Response:', JSON.stringify(usersRes.data, null, 2));
  console.log('Batches Response:', JSON.stringify(batchesRes.data, null, 2));
  console.log('Stats Response:', JSON.stringify(statsRes.data, null, 2));
  console.log('Bunked Response:', JSON.stringify(bunkedRes.data, null, 2));

      // Try multiple possible data structures
      let usersArray = [];
      if (Array.isArray(usersRes.data)) {
        usersArray = usersRes.data;
      } else if (usersRes.data.data && Array.isArray(usersRes.data.data)) {
        usersArray = usersRes.data.data;
      } else if (usersRes.data.users && Array.isArray(usersRes.data.users)) {
        usersArray = usersRes.data.users;
      }

      let batchesArray = [];
      if (Array.isArray(batchesRes.data)) {
        batchesArray = batchesRes.data;
      } else if (batchesRes.data.data && Array.isArray(batchesRes.data.data)) {
        batchesArray = batchesRes.data.data;
      } else if (batchesRes.data.batches && Array.isArray(batchesRes.data.batches)) {
        batchesArray = batchesRes.data.batches;
      }
      
  console.log('Users Array Length:', usersArray.length);
  console.log('Users Array:', JSON.stringify(usersArray, null, 2));
  console.log('Batches Array Length:', batchesArray.length);
  console.log('Batches Array:', JSON.stringify(batchesArray, null, 2));

      setUsers(usersArray);
      setClasses(batchesArray);
      setAttendanceStats(statsRes.data.data || statsRes.data);
      setBunkedList(bunkedRes.data.data || bunkedRes.data || []);

      const studentCount = usersArray.filter(u => u.role === 'student').length || 0;
      const teacherCount = usersArray.filter(u => u.role === 'teacher').length || 0;

      const calculatedStats = {
        users: usersArray.length || 0,
        classes: batchesArray.length || 0,
        students: studentCount,
        teachers: teacherCount
      };

  console.log('Calculated Stats:', JSON.stringify(calculatedStats, null, 2));
      
      // Force update stats
      setStats({
        users: usersArray.length,
        classes: batchesArray.length,
        students: studentCount,
        teachers: teacherCount
      });

      console.log('Final Stats Set:', {
        users: usersArray.length,
        classes: batchesArray.length,
        students: studentCount,
        teachers: teacherCount
      });

      setLoading(false);
      console.log('Admin data loaded successfully');
    } catch (err) {
      console.error('Error fetching admin data:', err);
      console.error('Error details:', err.response?.data || err.message);
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
  console.log('Creating user:', newUser);
      
      const response = await axios.post('http://localhost:5000/api/users', newUser, config);
      
  console.log('User created successfully:', response.data);
      
      setShowUserModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'student' });
      
      // Refresh data
      await fetchData();
      
      alert('User created successfully!');
    } catch (err) {
  console.error('Error creating user:', err);
  console.error('Error response:', err.response?.data);
      alert(`Error creating user: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
  console.log('Creating class:', newClass);
      
      const response = await axios.post('http://localhost:5000/api/classes', newClass, config);
      
  console.log('Class created successfully:', response.data);
      
      setShowClassModal(false);
      setNewClass({ name: '', classCode: '', semester: '', branch: '' });
      
      // Refresh data
      await fetchData();
      
      alert('Class created successfully!');
    } catch (err) {
  console.error('Error creating class:', err);
  console.error('Error response:', err.response?.data);
      alert(`Error creating class: ${err.response?.data?.msg || err.message}`);
    }
  };

  const handleDeleteClass = async (id) => {
    if (window.confirm('Are you sure you want to delete this class?')) {
      try {
        console.log('Deleting class:', id);
        
        await axios.delete(`http://localhost:5000/api/classes/${id}`, config);
        
        console.log('Class deleted successfully');
        
        // Refresh data
        await fetchData();
        
        alert('Class deleted successfully!');
      } catch (err) {
        console.error('Error deleting class:', err);
        console.error('Error response:', err.response?.data);
        alert(`Error deleting class: ${err.response?.data?.msg || err.message}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <Navbar />
        <div className="admin-dashboard-container">
          <div className="loading-spinner">
            <div className="loading"></div>
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      <Navbar />
      <div className="admin-dashboard-container fade-in">
        <div className="admin-welcome-header slide-in">
          <div>
            <h1 className="page-title">Admin Dashboard</h1>
            <p className="page-subtitle">Manage users, courses, and monitor attendance</p>
          </div>
          <div className="date-badge glass-card">
            <div className="date-icon">📅</div>
            <div>
              <div className="date-day">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
              <div className="date-text">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #A5F3FC 0%, #06B6D4 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value text-gradient">{stats.users}</h3>
              <p className="stat-label">Total Users</p>
              <p className="stat-sub">System-wide</p>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #86EFAC 0%, #10B981 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value" style={{ color: '#10B981' }}>{stats.students}</h3>
              <p className="stat-label">Students</p>
              <p className="stat-sub">Enrolled</p>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value" style={{ color: '#F59E0B' }}>{stats.teachers}</h3>
              <p className="stat-label">Teachers</p>
              <p className="stat-sub">Active</p>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #C4B5FD 0%, #4F46E5 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value text-gradient">{stats.classes}</h3>
              <p className="stat-label">Classes</p>
              <p className="stat-sub">Total courses</p>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="card-header-modern" style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
          <h2 className="card-title-modern">Quick Actions</h2>
          <p className="card-subtitle-modern">Manage your system efficiently</p>
        </div>

        <div className="action-cards-grid">
          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/users'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">User Management</h3>
              <p className="action-card-description">Add, edit, or remove users</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => setShowClassModal(true)}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Add New Course</h3>
              <p className="action-card-description">Create a new course</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/batches'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Batch Management</h3>
              <p className="action-card-description">Organize student batches</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/announcements'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Announcements</h3>
              <p className="action-card-description">Post system-wide notices</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/courses'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #30CDC8 0%, #667EEA 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">View Courses</h3>
              <p className="action-card-description">Browse all courses</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/timetable'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Timetable</h3>
              <p className="action-card-description">Manage class schedules</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/attendance'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #FEA858 0%, #ED4E50 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Mark Attendance</h3>
              <p className="action-card-description">Record class attendance</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>
        </div>

        <div className="management-card slide-in">
          <div className="management-card-header">
            <h2 className="management-card-title">Batch Management</h2>
            <button className="add-btn" onClick={() => setShowClassModal(true)}>
              <span>+</span> Add Batch
            </button>
          </div>
          <div className="modern-table-wrapper">
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Batch Name</th>
                  <th>Year</th>
                  <th>Semester</th>
                  <th>Department</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.map(cls => (
                  <tr key={cls._id}>
                    <td style={{ fontWeight: 600 }}>{cls.name}</td>
                    <td>
                      <span style={{ 
                        padding: '0.375rem 0.875rem',
                        background: 'linear-gradient(135deg, var(--ice-blue) 0%, #06B6D4 100%)',
                        color: 'white',
                        borderRadius: '20px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        {cls.year}
                      </span>
                    </td>
                    <td>{cls.semester}</td>
                    <td>{cls.department}</td>
                    <td>{cls.students?.length || 0}</td>
                    <td>
                      <button 
                        className="table-action-btn table-action-btn-timetable" 
                        onClick={() => {
                          setSelectedClassForTimetable(cls._id);
                          setShowTimetableModal(true);
                        }}
                      >
                        Timetable
                      </button>
                      <button 
                        className="table-action-btn table-action-btn-delete" 
                        onClick={() => handleDeleteClass(cls._id)}
                        style={{ marginLeft: '0.5rem' }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {attendanceStats && (
          <div className="charts-grid slide-in">
            <div className="chart-card">
              <h3>Attendance Overview</h3>
              <AttendanceBarChart 
                data={{
                  labels: ['Present', 'Absent'],
                  values: [attendanceStats.totalPresent, attendanceStats.totalAbsent]
                }}
              />
            </div>
            <div className="chart-card">
              <h3>Attendance Distribution</h3>
              <AttendancePieChart 
                data={{
                  labels: ['Present', 'Absent'],
                  values: [attendanceStats.totalPresent, attendanceStats.totalAbsent]
                }}
              />
            </div>
          </div>
        )}

        {bunkedList.length > 0 && (
          <div className="bunked-hours-card slide-in">
            <div className="bunked-hours-header">
              <h2 className="bunked-hours-title">Bunked Hours Today</h2>
              <span className="bunked-count-badge">{bunkedList.length} Records</span>
            </div>
            <div className="modern-table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Period</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {bunkedList.slice(0, 10).map((record, index) => (
                    <tr key={index}>
                      <td style={{ fontWeight: 600 }}>{record.student?.name || 'N/A'}</td>
                      <td>{record.class?.name || 'N/A'}</td>
                      <td>Period {record.hour}</td>
                      <td>{new Date(record.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showTimetableModal && (
        <TimetableManager
          classId={selectedClassForTimetable}
          onClose={() => {
            setShowTimetableModal(false);
            setSelectedClassForTimetable(null);
          }}
          onSuccess={fetchData}
        />
      )}

      {showUserModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Add New User</h2>
              <button className="admin-modal-close" onClick={() => setShowUserModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateUser}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Role</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" className="admin-submit-btn">✓ Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showClassModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2>Add New Course</h2>
              <button className="admin-modal-close" onClick={() => setShowClassModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateClass}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Course Name</label>
                  <input
                    type="text"
                    value={newClass.name}
                    onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Course Code</label>
                  <input
                    type="text"
                    value={newClass.classCode}
                    onChange={(e) => setNewClass({ ...newClass, classCode: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Semester</label>
                  <input
                    type="text"
                    value={newClass.semester}
                    onChange={(e) => setNewClass({ ...newClass, semester: e.target.value })}
                    required
                  />
                </div>
                <div className="admin-form-group">
                  <label>Branch</label>
                  <input
                    type="text"
                    value={newClass.branch}
                    onChange={(e) => setNewClass({ ...newClass, branch: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="admin-submit-btn">✓ Create Course</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
