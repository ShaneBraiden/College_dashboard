import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { AttendancePieChart } from '../components/Charts';
import TodaySchedule from '../components/TodaySchedule';
import AttendanceWarning from '../components/AttendanceWarning';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [classes, setClasses] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, percentage: 0 });
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (reportPeriod) {
      fetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportPeriod]);

  const fetchData = async () => {
    try {
  console.log('Fetching student data...');
      
      const [classesRes, attendanceRes] = await Promise.all([
        axios.get('http://localhost:5000/api/classes', config),
        axios.get('http://localhost:5000/api/attendance', config)
      ]);

  console.log('Classes Response:', classesRes.data);
  console.log('Attendance Response:', attendanceRes.data);

      const classesData = classesRes.data.data || classesRes.data || [];
      const attendanceData = attendanceRes.data.data || attendanceRes.data || [];

      setClasses(classesData);
      setAttendanceRecords(attendanceData);

      let totalClasses = 0;
      let presentCount = 0;
      let absentCount = 0;

      attendanceData.forEach(record => {
        const studentRecord = record.attendance?.find(
          a => a.studentId === localStorage.getItem('userId')
        );
        if (studentRecord) {
          totalClasses++;
          if (studentRecord.status === 'present') {
            presentCount++;
          } else {
            absentCount++;
          }
        }
      });

      const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;

      setStats({
        total: totalClasses,
        present: presentCount,
        absent: absentCount,
        percentage
      });

  console.log('Student Stats:', { totalClasses, presentCount, absentCount, percentage });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching student data:', err);
      console.error('Error details:', err.response?.data || err.message);
      setLoading(false);
    }
  };

  const fetchReport = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        const meRes = await axios.get('http://localhost:5000/api/auth/me', config);
        localStorage.setItem('userId', meRes.data.data._id);
      }
      
      const res = await axios.get(
        `http://localhost:5000/api/reports/student/${localStorage.getItem('userId')}?period=${reportPeriod}`,
        config
      );
      setReportData(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const getTodaySchedule = () => {
    // This would come from actual timetable API in production
    return [];
  };

  if (loading) {
    return (
      <div className="dashboard-page">
        <Navbar />
        <div className="dashboard-container">
          <div className="loading-spinner">
            <div className="loading"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Navbar />
      <div className="dashboard-container fade-in">
        <div className="welcome-header slide-in">
          <div>
            <h1 className="page-title">Welcome Back!</h1>
            <p className="page-subtitle">Here's what's happening with your attendance today</p>
          </div>
          <div className="date-badge glass-card">
            <div className="date-icon"></div>
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value text-gradient">{stats.percentage}%</h3>
              <p className="stat-label">Attendance Rate</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${stats.percentage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #86EFAC 0%, #10B981 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value" style={{ color: '#10B981' }}>{stats.present}</h3>
              <p className="stat-label">Classes Attended</p>
              <p className="stat-sub">Great job! Keep it up</p>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value" style={{ color: '#EF4444' }}>{stats.absent}</h3>
              <p className="stat-label">Classes Missed</p>
              <p className="stat-sub">Try to improve</p>
            </div>
          </div>

          <div className="stat-card glass-card glow-hover">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #C4B5FD 0%, #4F46E5 100%)' }}>
              <svg className="stat-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="stat-content">
              <h3 className="stat-value text-gradient">{stats.total}</h3>
              <p className="stat-label">Total Classes</p>
              <p className="stat-sub">This semester</p>
            </div>
          </div>
        </div>

        {/* Quick Action Cards */}
        <div className="card-header-modern" style={{ marginTop: '2rem', marginBottom: '1.5rem' }}>
          <h2 className="card-title-modern">Quick Access</h2>
          <p className="card-subtitle-modern">Navigate your student portal</p>
        </div>

        <div className="action-cards-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/courses'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">My Courses</h3>
              <p className="action-card-description">View enrolled courses</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => window.location.href = '/announcements'}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #F093FB 0%, #F5576C 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Announcements</h3>
              <p className="action-card-description">View latest updates</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => {
            const classesSection = document.querySelector('.classes-card');
            if (classesSection) {
              classesSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">View Classes</h3>
              <p className="action-card-description">See all enrolled classes</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>

          <div className="action-card glass-card glow-hover" onClick={() => {
            const scheduleSection = document.querySelector('.schedule-card');
            if (scheduleSection) {
              scheduleSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }}>
            <div className="action-card-icon" style={{ background: 'linear-gradient(135deg, #FA709A 0%, #FEE140 100%)' }}>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="32" height="32">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="action-card-content">
              <h3 className="action-card-title">Today's Schedule</h3>
              <p className="action-card-description">View today's timetable</p>
            </div>
            <div className="action-card-arrow">→</div>
          </div>
        </div>

        {/* Low Attendance Warning Component */}
        <AttendanceWarning 
          percentage={stats.percentage} 
          requiredPercentage={75}
          totalClasses={stats.total}
          presentClasses={stats.present}
        />

        <div className="dashboard-grid-2">
          {/* Today's Schedule Component */}
          {classes.length > 0 && (
            <div className="schedule-card glass-card slide-in">
              <TodaySchedule classId={classes[0]._id} />
            </div>
          )}

          <div className="summary-card glass-card slide-in">
            <div className="card-header-modern">
              <div>
                <h2 className="card-title-modern">Attendance Summary</h2>
                <p className="card-subtitle-modern">Your performance overview</p>
              </div>
              <select className="period-select" value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            {reportData && (
              <div className="summary-content">
                <div className="chart-container">
                  <AttendancePieChart data={{ labels: ['Present', 'Absent'], values: [reportData.presentCount, reportData.absentCount] }} />
                </div>
                <div className="summary-stats">
                  <div className="summary-stat-item">
                    <span className="summary-stat-label">Period</span>
                    <span className="summary-stat-value">{reportData.period}</span>
                  </div>
                  <div className="summary-stat-item">
                    <span className="summary-stat-label">Total Classes</span>
                    <span className="summary-stat-value">{reportData.totalClasses}</span>
                  </div>
                  <div className="summary-stat-item">
                    <span className="summary-stat-label">Present</span>
                    <span className="summary-stat-value" style={{ color: '#10B981' }}>{reportData.presentCount}</span>
                  </div>
                  <div className="summary-stat-item">
                    <span className="summary-stat-label">Absent</span>
                    <span className="summary-stat-value" style={{ color: '#EF4444' }}>{reportData.absentCount}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="classes-card glass-card slide-in">
            <div className="card-header-modern">
            <h2 className="card-title-modern">My Classes</h2>
            <span className="badge">{classes.length} Enrolled</span>
          </div>
          {classes.length > 0 ? (
            <div className="classes-grid">
              {classes.map(cls => (
                <div key={cls._id} className="class-item glass-card glow-hover">
                  <div className="class-icon">{cls.name.charAt(0)}</div>
                  <div className="class-info">
                    <h3 className="class-name">{cls.name}</h3>
                    <p className="class-code">{cls.classCode}</p>
                    <div className="class-meta">
                      <span className="class-meta-item">Sem {cls.semester}</span>
                      <span className="class-meta-dot">•</span>
                      <span className="class-meta-item">{cls.branch}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No classes enrolled yet.</p>
            </div>
          )}
        </div>

        <div className="recent-card glass-card slide-in">
            <div className="card-header-modern">
              <h2 className="card-title-modern">Recent Attendance</h2>
            <span className="badge">Last 10 Records</span>
          </div>
          {attendanceRecords.length > 0 ? (
            <div className="attendance-list">
              {attendanceRecords.slice(0, 10).map((record, index) => {
                const studentRecord = record.attendance?.find(a => a.studentId === localStorage.getItem('userId'));
                return studentRecord ? (
                  <div key={index} className="attendance-item">
                    <div className={`attendance-status-dot ${studentRecord.status}`}></div>
                    <div className="attendance-info">
                      <div className="attendance-date">{new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="attendance-period">Period {record.hour}</div>
                    </div>
                    <span className={`attendance-badge ${studentRecord.status}`}>
                      {studentRecord.status === 'present' ? '✓ Present' : '✗ Absent'}
                    </span>
                  </div>
                ) : null;
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-text">No attendance records found yet.</p>
            </div>
          )}
        </div>

        {reportData && reportData.bunkedHours && reportData.bunkedHours.length > 0 && (
          <div className="bunked-card glass-card slide-in">
            <div className="card-header-modern">
              <h2 className="card-title-modern">Bunked Hours</h2>
              <span className="badge" style={{ background: 'linear-gradient(135deg, #FCA5A5 0%, #EF4444 100%)', color: 'white' }}>
                {reportData.bunkedHours.length} Classes
              </span>
            </div>
            <div className="bunked-list">
              {reportData.bunkedHours.map((bunk, index) => (
                <div key={index} className="bunked-item">
                  <div className="bunked-icon"></div>
                  <div className="bunked-info">
                    <div className="bunked-class">{bunk.class?.name || 'N/A'}</div>
                    <div className="bunked-details">
                      <span>{new Date(bunk.date).toLocaleDateString()}</span>
                      <span className="class-meta-dot">•</span>
                      <span>Period {bunk.hour}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
