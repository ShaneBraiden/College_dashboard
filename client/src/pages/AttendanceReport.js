import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './AttendanceReport.css';

function AttendanceReport() {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('');
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchCoursesAndBatches();
  }, []);

  useEffect(() => {
    if (selectedCourse && selectedBatch) {
      fetchAttendanceReport();
    }
  }, [selectedCourse, selectedBatch]);

  const fetchCoursesAndBatches = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/courses', config);
      const coursesData = response.data.data || [];
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
      
      setBatches(uniqueBatches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching courses and batches:', error);
      setLoading(false);
    }
  };

  const fetchAttendanceReport = async () => {
    try {
      setLoading(true);

      // Fetch students from the selected batch
      const studentsRes = await axios.get(
        `http://localhost:5000/api/users?role=student&batch=${selectedBatch}`,
        config
      );
      const studentsData = studentsRes.data.data || [];
      setStudents(studentsData);

      console.log('Students fetched:', studentsData.length);

      // Fetch attendance records for the selected course
      const attendanceRes = await axios.get(
        `http://localhost:5000/api/attendance?courseId=${selectedCourse}`,
        config
      );
      const attendanceRecords = attendanceRes.data.data || [];

      console.log('Attendance records fetched:', attendanceRecords.length);
      if (attendanceRecords.length > 0) {
        console.log('Sample record:', attendanceRecords[0]);
      }

      // Calculate attendance percentage for each student
      // New format: { classId, date, hour, attendance: [{ studentId, status }] }
      const reportData = studentsData.map(student => {
        let totalClasses = 0;
        let attendedClasses = 0;

        // Count attendance across all date-hour combinations
        attendanceRecords.forEach(record => {
          // Find this student in the attendance array
          const studentRecord = record.attendance.find(
            att => att.studentId && att.studentId._id === student._id
          );

          if (studentRecord) {
            totalClasses++;
            if (studentRecord.status === 'present') {
              attendedClasses++;
            }
          }
        });

        const percentage = totalClasses > 0 
          ? ((attendedClasses / totalClasses) * 100).toFixed(2)
          : 0;

        console.log(`Student ${student.name}: ${attendedClasses}/${totalClasses} = ${percentage}%`);

        return {
          student,
          totalClasses,
          attendedClasses,
          percentage: parseFloat(percentage)
        };
      });

      setAttendanceData(reportData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attendance report:', error);
      console.error('Error details:', error.response?.data);
      setLoading(false);
    }
  };

  const getFilteredData = () => {
    if (!searchTerm) return attendanceData;
    
    return attendanceData.filter(data =>
      data.student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.student.rollNumber?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return 'good';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const filteredData = getFilteredData();
  const coursesForBatch = courses.filter(c => 
    c.batches?.some(b => b._id === selectedBatch)
  );

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="attendance-report-container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="page-title">Attendance Report</h1>
              <p className="page-subtitle">View student attendance statistics by course and batch</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-card glass-card">
          <div className="filters-grid">
            <div className="form-group">
              <label>Batch <span className="required">*</span></label>
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
              <label>Course <span className="required">*</span></label>
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
                  {coursesForBatch.map(course => (
                    <option key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedCourse && selectedBatch && (
              <div className="form-group">
                <label>Search Students</label>
                <div className="input-with-icon">
                  <svg className="input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name, email, or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Report Table */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading report...</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="report-card glass-card">
            <div className="card-header">
              <h3>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                Attendance Report ({filteredData.length} students)
              </h3>
            </div>
            <div className="report-table">
              <table>
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Classes Attended</th>
                    <th>Total Classes</th>
                    <th>Attendance %</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((data) => (
                    <tr key={data.student._id}>
                      <td>{data.student.rollNumber || 'N/A'}</td>
                      <td className="student-name">{data.student.name}</td>
                      <td className="student-email">{data.student.email}</td>
                      <td className="text-center">{data.attendedClasses}</td>
                      <td className="text-center">{data.totalClasses}</td>
                      <td className="text-center">
                        <span className={`percentage-badge ${getPercentageColor(data.percentage)}`}>
                          {data.percentage}%
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`status-badge ${getPercentageColor(data.percentage)}`}>
                          {data.percentage >= 75 ? 'Good' : data.percentage >= 50 ? 'Warning' : 'Critical'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : selectedCourse && selectedBatch ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>No Data Available</h3>
            <p>No attendance records found for the selected course and batch</p>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>Select Batch and Course</h3>
            <p>Choose a batch and course from the dropdowns above to view the attendance report</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AttendanceReport;
