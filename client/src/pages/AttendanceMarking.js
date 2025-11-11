import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import { getCurrentHour, getTimeSlotInfo } from '../utils/timeUtils';
import './AttendanceMarking.css';

const AttendanceMarking = () => {
  const [batches, setBatches] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [hour, setHour] = useState(getCurrentHour() || '1');
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchCoursesAndBatches();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedBatch) {
      console.log('Selected batch changed:', selectedBatch);
      fetchStudents();
    } else {
      setStudents([]);
      setAttendance({});
    }
  }, [selectedBatch]);

  const fetchCoursesAndBatches = async () => {
    try {
      setLoading(true);
      console.log('Fetching courses and batches...');
      // Fetch courses assigned to the teacher
      const response = await axios.get('http://localhost:5000/api/courses', config);
      const coursesData = response.data.data || [];
      console.log('Courses fetched:', coursesData);
      setCourses(coursesData);
      
      // Extract unique batches from courses
      const uniqueBatches = [];
      const batchIds = new Set();
      
      coursesData.forEach(course => {
        if (course.batches && Array.isArray(course.batches)) {
          course.batches.forEach(batch => {
            if (!batchIds.has(batch._id)) {
              batchIds.add(batch._id);
              uniqueBatches.push(batch);
            }
          });
        }
      });
      
      console.log('Unique batches extracted:', uniqueBatches);
      setBatches(uniqueBatches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses and batches:', error);
      console.error('Error details:', error.response?.data);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('Fetching students for batch:', selectedBatch);
      // Fetch students from the selected batch
      const response = await axios.get(`http://localhost:5000/api/users?role=student&batch=${selectedBatch}`, config);
      const studentsData = response.data.data || [];
      console.log('Students fetched:', studentsData);
      setStudents(studentsData);
      
      // Initialize attendance with all present
      const initialAttendance = {};
      studentsData.forEach(student => {
        initialAttendance[student._id] = 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error fetching students:', error);
      console.error('Error details:', error.response?.data);
      alert('Error loading students: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleBulkAction = () => {
    if (bulkAction) {
      const updatedAttendance = {};
      students.forEach(student => {
        updatedAttendance[student._id] = bulkAction;
      });
      setAttendance(updatedAttendance);
      setBulkAction('');
    }
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    
    console.log('Submit clicked');
    console.log('Selected Batch:', selectedBatch);
    console.log('Selected Course:', selectedCourse);
    console.log('Date:', date);
    console.log('Hour:', hour);
    console.log('Attendance:', attendance);
    
    if (!selectedBatch) {
      alert('Please select a batch');
      return;
    }

    if (!selectedCourse) {
      alert('Please select a course');
      return;
    }

    try {
      setSubmitting(true);
      
      const attendanceData = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status
      }));

      console.log('Sending attendance data:', {
        courseId: selectedCourse,
        date: new Date(date),
        hour: parseInt(hour),
        attendance: attendanceData
      });

      await axios.post('http://localhost:5000/api/attendance', {
        courseId: selectedCourse,
        date: new Date(date),
        hour: parseInt(hour),
        attendance: attendanceData
      }, config);

      alert('Attendance submitted successfully!');
      
      // Reset form
      setAttendance({});
      const initialAttendance = {};
      students.forEach(student => {
        initialAttendance[student._id] = 'present';
      });
      setAttendance(initialAttendance);
      
      setSubmitting(false);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert(error.response?.data?.msg || 'Failed to submit attendance');
      setSubmitting(false);
    }
  };

  const getAttendanceStats = () => {
    const present = Object.values(attendance).filter(status => status === 'present').length;
    const absent = Object.values(attendance).filter(status => status === 'absent').length;
    const total = students.length;
    const percentage = total > 0 ? ((present / total) * 100).toFixed(1) : 0;
    
    return { present, absent, total, percentage };
  };

  const currentTimeSlot = getTimeSlotInfo(parseInt(hour));
  const stats = getAttendanceStats();

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />
      
      <div className="attendance-marking-container">
        {/* Page Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <div>
              <h1 className="page-title">Mark Attendance</h1>
              <p className="page-subtitle">Record student attendance for your batches</p>
            </div>
          </div>
          
          {currentTimeSlot && (
            <div className="current-time-badge">
              <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Current Hour: {currentTimeSlot.hour} ({currentTimeSlot.startTime} - {currentTimeSlot.endTime})</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmitAttendance}>
          {/* Filters Section */}
          <div className="filters-card">
            <div className="filters-grid">
              <div className="form-group">
                <label>
                  Batch <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    required
                  >
                    <option value="">Select a batch</option>
                    {batches.map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {batch.name} - {batch.year} {batch.department}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Course <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    required
                    disabled={!selectedBatch}
                  >
                    <option value="">Select a course</option>
                    {courses
                      .filter(course => course.batches?.some(b => b._id === selectedBatch))
                      .map(course => (
                        <option key={course._id} value={course._id}>
                          {course.name} ({course.code})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>
                  Date <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Hour <span className="required">*</span>
                </label>
                <div className="input-with-icon">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <select
                    value={hour}
                    onChange={(e) => setHour(e.target.value)}
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(h => (
                      <option key={h} value={h}>
                        Hour {h} {h === getCurrentHour() && '(Current)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Bulk Action</label>
                <div className="bulk-action-group">
                  <select
                    value={bulkAction}
                    onChange={(e) => setBulkAction(e.target.value)}
                  >
                    <option value="">Select action</option>
                    <option value="present">Mark All Present</option>
                    <option value="absent">Mark All Absent</option>
                  </select>
                  <button
                    type="button"
                    className="btn-apply"
                    onClick={handleBulkAction}
                    disabled={!bulkAction}
                  >
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          {students.length > 0 && (
            <div className="stats-row">
              <div className="stat-card glass-card present">
                <div className="stat-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{stats.present}</div>
                  <div className="stat-label">Present</div>
                </div>
              </div>

              <div className="stat-card glass-card absent">
                <div className="stat-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{stats.absent}</div>
                  <div className="stat-label">Absent</div>
                </div>
              </div>

              <div className="stat-card glass-card total">
                <div className="stat-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{stats.total}</div>
                  <div className="stat-label">Total Students</div>
                </div>
              </div>

              <div className="stat-card glass-card percentage">
                <div className="stat-icon">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="stat-details">
                  <div className="stat-value">{stats.percentage}%</div>
                  <div className="stat-label">Attendance Rate</div>
                </div>
              </div>
            </div>
          )}

          {/* Students List */}
          {students.length > 0 && (
            <div className="students-card glass-card">
              <div className="card-header">
                <h3>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Students ({students.length})
                </h3>
              </div>
              <div className="students-table">
                <table>
                  <thead>
                    <tr>
                      <th>Roll No</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th className="attendance-column">Attendance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>{student.rollNumber || 'N/A'}</td>
                        <td className="student-name">{student.name}</td>
                        <td className="student-email">{student.email}</td>
                        <td className="attendance-column">
                          <div className="radio-group">
                            <label className={`radio-label ${attendance[student._id] === 'present' ? 'selected present' : ''}`}>
                              <input
                                type="radio"
                                name={`attendance-${student._id}`}
                                value="present"
                                checked={attendance[student._id] === 'present'}
                                onChange={(e) => setAttendance(prev => ({
                                  ...prev,
                                  [student._id]: e.target.value
                                }))}
                              />
                              <span className="radio-text">P</span>
                            </label>
                            <label className={`radio-label ${attendance[student._id] === 'absent' ? 'selected absent' : ''}`}>
                              <input
                                type="radio"
                                name={`attendance-${student._id}`}
                                value="absent"
                                checked={attendance[student._id] === 'absent'}
                                onChange={(e) => setAttendance(prev => ({
                                  ...prev,
                                  [student._id]: e.target.value
                                }))}
                              />
                              <span className="radio-text">A</span>
                            </label>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {students.length > 0 && (
            <div className="submit-section">
              <button
                type="submit"
                className="btn-submit"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="spinner-small"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Submit Attendance
                  </>
                )}
              </button>
            </div>
          )}

          {!selectedBatch && !selectedCourse && (
            <div className="empty-state">
              <div className="empty-state-icon">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3>Select a Batch</h3>
              <p>Choose a batch from the dropdown above to start marking attendance</p>
              <div className="empty-state-hint">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You can mark attendance for multiple hours at once</span>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AttendanceMarking;
