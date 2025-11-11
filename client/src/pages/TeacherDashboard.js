import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { getCurrentHour, getDayOfWeek, isClassTime } from '../utils/timeUtils';
import './TeacherDashboard.css';

const TeacherDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hour, setHour] = useState(getCurrentHour()?.toString() || '1');
  const [currentClass, setCurrentClass] = useState(null);
  const [timetables, setTimetables] = useState([]);

  const token = localStorage.getItem('token');
  
  // Check if token exists, redirect to login if not
  useEffect(() => {
    if (!token) {
      console.error('No authentication token found');
      window.location.href = '/login';
    }
  }, [token]);
  
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (token) {
      fetchUserData();
      fetchClasses();
    }
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        const meRes = await axios.get('http://localhost:5000/api/auth/me', config);
        localStorage.setItem('userId', meRes.data.data._id);
        console.log('User ID fetched and stored:', meRes.data.data._id);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const fetchClasses = async () => {
    try {
      console.log('Fetching teacher classes and timetables...');
      console.log('Token:', token ? 'Present' : 'Missing');
      
      const [classesRes, timetablesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/classes', config),
        axios.get('http://localhost:5000/api/timetable', config)
      ]);
      
      console.log('Classes Response:', classesRes.data);
      console.log('Timetables Response:', timetablesRes.data);
      
      // Handle different response structures
      let classesData = [];
      if (Array.isArray(classesRes.data)) {
        classesData = classesRes.data;
      } else if (classesRes.data.data && Array.isArray(classesRes.data.data)) {
        classesData = classesRes.data.data;
      } else if (classesRes.data.classes && Array.isArray(classesRes.data.classes)) {
        classesData = classesRes.data.classes;
      }
      
      let timetablesData = [];
      if (Array.isArray(timetablesRes.data)) {
        timetablesData = timetablesRes.data;
      } else if (timetablesRes.data.data && Array.isArray(timetablesRes.data.data)) {
        timetablesData = timetablesRes.data.data;
      } else if (timetablesRes.data.timetables && Array.isArray(timetablesRes.data.timetables)) {
        timetablesData = timetablesRes.data.timetables;
      }
      
      console.log('Parsed Classes:', classesData.length, classesData);
      console.log('Parsed Timetables:', timetablesData.length, timetablesData);
      
      setClasses(classesData);
      setTimetables(timetablesData);
      
      // Auto-detect current class based on timetable
      const detectedClass = detectCurrentClass(classesData, timetablesData);
      if (detectedClass) {
        setCurrentClass(detectedClass);
        console.log('Auto-detected current class:', detectedClass.className);
      }
      
      console.log('Classes loaded:', classesData.length);
      console.log('Timetables loaded:', timetablesData.length);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching classes:', err);
      console.error('Error details:', err.response?.data || err.message);
      
      // If 403 or 401, token is invalid - redirect to login
      if (err.response?.status === 403 || err.response?.status === 401) {
        console.error('Authentication failed - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        localStorage.removeItem('role');
        window.location.href = '/login';
      }
      
      setLoading(false);
    }
  };

  const detectCurrentClass = (classesData, timetablesData) => {
    const currentHour = getCurrentHour();
    const dayOfWeek = getDayOfWeek();
    
    console.log('Detecting class for:', { dayOfWeek, currentHour });
    
    if (!currentHour || !isClassTime()) {
      console.log('Not during class time');
      return null;
    }

    // Get current user ID
    const userId = localStorage.getItem('userId');
    if (!userId) {
      console.log('User ID not found');
      return null;
    }

    // Find timetable entry for current day and hour
    for (const timetable of timetablesData) {
      if (timetable.dayOfWeek === dayOfWeek) {
        const slot = timetable.slots?.find(s => s.hour === currentHour);
        
        if (slot && slot.faculty && slot.faculty._id === userId) {
          // Find the class details
          const classInfo = classesData.find(c => c._id === timetable.classId || c._id === timetable.classId?._id);
          
          if (classInfo) {
            console.log('Found matching class:', classInfo.name, 'Subject:', slot.subject);
            return {
              classId: classInfo._id,
              className: classInfo.name,
              subject: slot.subject,
              hour: currentHour,
              roomNumber: slot.roomNumber
            };
          }
        }
      }
    }

    console.log('No matching class found for current time');
    return null;
  };

  const handleSelectClass = async (classItem) => {
    setSelectedClass(classItem);
    setStudents(classItem.students || []);
    
    // Initialize attendance state for all students
    const initialAttendance = {};
    classItem.students?.forEach(student => {
      initialAttendance[student._id || student] = 'present';
    });
    setAttendance(initialAttendance);
    setShowAttendanceModal(true);
  };

  const handleQuickMarkCurrentClass = () => {
    if (currentClass) {
      const classInfo = classes.find(c => c._id === currentClass.classId);
      if (classInfo) {
        // Set the hour to current hour automatically
        setHour(currentClass.hour.toString());
        handleSelectClass(classInfo);
      }
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting attendance...');
      
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }));

      console.log('Attendance Data:', { classId: selectedClass._id, date, hour, attendanceData });

      await axios.post('http://localhost:5000/api/attendance', {
        classId: selectedClass._id,
        date: new Date(date),
        hour,
        attendance: attendanceData
      }, config);

  console.log('Attendance submitted successfully');
      
      alert('Attendance submitted successfully!');
      setShowAttendanceModal(false);
      setSelectedClass(null);
    } catch (err) {
      console.error('Error submitting attendance:', err);
      console.error('Error details:', err.response?.data || err.message);
      alert(`Failed to submit attendance: ${err.response?.data?.msg || err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="teacher-dashboard-page">
        <Navbar />
        <div className="teacher-dashboard-container">
          <div className="loading-spinner">
            <div className="loading"></div>
            <p>Loading your classes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="teacher-dashboard-page">
      <Navbar />
      <div className="teacher-dashboard-container fade-in">
        <div className="teacher-welcome-header slide-in">
          <div>
            <h1 className="page-title">Welcome, Teacher!</h1>
            <p className="page-subtitle">Here's what's happening with your classes today</p>
          </div>
          <div className="date-badge glass-card">
            <div className="date-icon">📅</div>
            <div>
              <div className="date-day">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</div>
              <div className="date-text">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            </div>
          </div>
        </div>

        <div className="teacher-stats-grid">
          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #C4B5FD 0%, #4F46E5 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value text-gradient">{classes.length}</h3>
              <p className="stat-label">My Classes</p>
              <p className="stat-sub">Active courses</p>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #86EFAC 0%, #10B981 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value" style={{ color: '#10B981' }}>
                {classes.reduce((acc, cls) => acc + (cls.students?.length || 0), 0)}
              </h3>
              <p className="stat-label">Total Students</p>
              <p className="stat-sub">Across all classes</p>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #A5F3FC 0%, #06B6D4 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value text-gradient">{new Date().getDate()}</h3>
              <p className="stat-label">{new Date().toLocaleDateString('en-US', { month: 'long' })}</p>
              <p className="stat-sub">Today's date</p>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="card-header-modern" style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
          <h2 className="card-title-modern">Quick Actions</h2>
          <p className="card-subtitle-modern">Manage your teaching tasks</p>
        </div>

        <div className="action-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/attendance'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Mark Attendance</h3>
              <p className="action-card-description">Record student attendance</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/courses'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">View Courses</h3>
              <p className="action-card-description">Browse course materials</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/announcements'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Announcements</h3>
              <p className="action-card-description">Post class updates</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>
        </div>

        {/* Current Class Quick Action */}
        {currentClass && isClassTime() && (
          <div className="current-class-banner glass-card slide-in" style={{ 
            marginBottom: '2rem',
            background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
            color: 'white',
            padding: '1.5rem',
            borderRadius: '16px',
            border: 'none',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                  <span style={{ 
                    background: 'rgba(255, 255, 255, 0.2)', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '20px', 
                    fontSize: '0.875rem',
                    fontWeight: 600
                  }}>
                    🕐 Hour {currentClass.hour} - NOW
                  </span>
                  {currentClass.roomNumber && (
                    <span style={{ 
                      background: 'rgba(255, 255, 255, 0.2)', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '20px', 
                      fontSize: '0.875rem',
                      fontWeight: 600
                    }}>
                      📍 Room {currentClass.roomNumber}
                    </span>
                  )}
                </div>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: 700 }}>
                  {currentClass.className}
                </h3>
                <p style={{ margin: 0, fontSize: '1.125rem', opacity: 0.9 }}>
                  Subject: {currentClass.subject}
                </p>
              </div>
              <button 
                onClick={handleQuickMarkCurrentClass}
                style={{
                  padding: '1rem 2rem',
                  background: 'white',
                  color: '#667EEA',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1.125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                }}
              >
                ✓ Mark Attendance Now
              </button>
            </div>
          </div>
        )}

        {classes.length > 0 ? (
          <>
            <div className="card-header-modern" style={{ marginBottom: '1.5rem' }}>
              <h2 className="card-title-modern">
                {currentClass && isClassTime() ? 'All My Classes' : 'My Classes'}
              </h2>
              <span className="badge">{classes.length} Active</span>
            </div>

            <div className="teacher-classes-grid">
              {classes.map(cls => (
                <div key={cls._id} className="teacher-class-card glass-card">
                  <div className="teacher-class-header">
                    <div className="teacher-class-icon">{cls.name.charAt(0)}</div>
                    <div className="teacher-class-info">
                      <h3 className="teacher-class-name">{cls.name}</h3>
                      <span className="teacher-class-code">{cls.classCode}</span>
                    </div>
                  </div>

                  <div className="teacher-class-details">
                    <div className="teacher-class-detail-item">
                      <span>Sem {cls.semester}</span>
                    </div>
                    <div className="teacher-class-detail-item">
                      <span>{cls.branch}</span>
                    </div>
                  </div>

                  <div className="teacher-class-students">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--indigo)' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <div>
                      <div className="teacher-class-students-count">{cls.students?.length || 0}</div>
                      <div className="teacher-class-students-label">Students Enrolled</div>
                    </div>
                  </div>

                  <button className="teacher-class-action" onClick={() => handleSelectClass(cls)}>
                    Mark Attendance
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="teacher-empty-state">
            <p className="teacher-empty-text">No classes assigned yet</p>
          </div>
        )}
      </div>

      {showAttendanceModal && selectedClass && (
        <div className="attendance-modal-overlay">
          <div className="attendance-modal">
            <div className="attendance-modal-header">
              <div>
                <h2>Mark Attendance - {selectedClass.name}</h2>
                {currentClass && currentClass.classId === selectedClass._id && (
                  <p style={{ 
                    margin: '0.5rem 0 0 0', 
                    fontSize: '0.95rem', 
                    color: '#667EEA',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>🕐</span>
                    Current Class: {currentClass.subject} (Hour {currentClass.hour})
                  </p>
                )}
              </div>
              <button className="attendance-modal-close" onClick={() => setShowAttendanceModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmitAttendance}>
              <div className="attendance-modal-body">
                <div className="attendance-date-hour-grid">
                  <div className="attendance-form-group">
                    <label>Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                    />
                  </div>
                  <div className="attendance-form-group">
                    <label>Period</label>
                    <select
                      value={hour}
                      onChange={(e) => setHour(e.target.value)}
                      required
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                        <option key={h} value={h}>Period {h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="attendance-table-wrapper">
                  <table className="attendance-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th style={{ textAlign: 'center' }}>Present</th>
                        <th style={{ textAlign: 'center' }}>Absent</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student, index) => {
                        const studentId = student._id || student;
                        return (
                          <tr key={studentId}>
                            <td style={{ fontWeight: 600 }}>{studentId}</td>
                            <td>
                              <div className="attendance-radio-wrapper">
                                <input
                                  type="radio"
                                  name={`attendance-${studentId}`}
                                  checked={attendance[studentId] === 'present'}
                                  onChange={() => handleAttendanceChange(studentId, 'present')}
                                />
                              </div>
                            </td>
                            <td>
                              <div className="attendance-radio-wrapper">
                                <input
                                  type="radio"
                                  name={`attendance-${studentId}`}
                                  checked={attendance[studentId] === 'absent'}
                                  onChange={() => handleAttendanceChange(studentId, 'absent')}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button type="submit" className="attendance-submit-btn">
                  Submit Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
