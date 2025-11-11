import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './BatchManagement.css';

function BatchManagement() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showEditStudentsModal, setShowEditStudentsModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    department: '',
    semester: 1,
    classTeacher: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [batchesRes, usersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/batches', config),
        axios.get('http://localhost:5000/api/users', config),
      ]);

      console.log('Batches Response:', batchesRes.data);
      console.log('Users Response:', usersRes.data);

      // Handle different response formats
      const batchesData = batchesRes.data.data || batchesRes.data || [];
      const usersData = usersRes.data.data || usersRes.data || [];

      setBatches(batchesData);
      setStudents(usersData.filter((u) => u.role === 'student'));
      setTeachers(usersData.filter((u) => u.role === 'teacher'));
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data. Please check console for details.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('http://localhost:5000/api/batches', formData, config);

      alert('Batch created successfully!');
      setShowModal(false);
      setFormData({
        name: '',
        year: new Date().getFullYear(),
        department: '',
        semester: 1,
        classTeacher: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating batch:', error);
      alert(error.response?.data?.error || 'Error creating batch');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this batch?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`http://localhost:5000/api/batches/${id}`, config);
      alert('Batch deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting batch:', error);
      alert(error.response?.data?.error || 'Error deleting batch');
    }
  };

  const handleEditStudents = (batch) => {
    setSelectedBatch(batch);
    setSelectedStudents(batch.students?.map(s => s._id || s) || []);
    setShowEditStudentsModal(true);
  };

  const isStudentInOtherBatch = (studentId) => {
    if (!selectedBatch) return false;
    
    // Check if student is assigned to any batch OTHER than the currently selected one
    return batches.some(batch => 
      batch._id !== selectedBatch._id && 
      batch.students?.some(s => (s._id || s) === studentId)
    );
  };

  const getAvailableStudents = () => {
    // Filter out students who are already in other batches
    return students.filter(student => {
      // If student is in the current batch, they should appear
      if (selectedStudents.includes(student._id)) return true;
      // Otherwise, only show if they're not in any other batch
      return !isStudentInOtherBatch(student._id);
    });
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleRangeSelect = () => {
    if (!rangeFrom || !rangeTo) {
      alert('Please enter both start and end roll numbers');
      return;
    }

    const fromLower = rangeFrom.toLowerCase().trim();
    const toLower = rangeTo.toLowerCase().trim();

    // Get available students only
    const availableStudents = getAvailableStudents();

    // Filter students whose rollNumber falls within the range
    const studentsInRange = availableStudents.filter(student => {
      if (!student.rollNumber) return false;
      const rollLower = student.rollNumber.toLowerCase().trim();
      return rollLower >= fromLower && rollLower <= toLower;
    });

    // Check how many students in range are already in other batches
    const allStudentsInRange = students.filter(student => {
      if (!student.rollNumber) return false;
      const rollLower = student.rollNumber.toLowerCase().trim();
      return rollLower >= fromLower && rollLower <= toLower;
    });

    const unavailableCount = allStudentsInRange.length - studentsInRange.length;

    if (studentsInRange.length === 0) {
      if (unavailableCount > 0) {
        alert(`All ${unavailableCount} students in this range are already assigned to other batches.`);
      } else {
        alert(`No students found with roll numbers between ${rangeFrom} and ${rangeTo}`);
      }
      return;
    }

    // Add all students in range to selection
    const idsInRange = studentsInRange.map(s => s._id);
    setSelectedStudents(prev => {
      const newSelection = [...prev];
      idsInRange.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });

    let message = `Added ${studentsInRange.length} students to selection`;
    if (unavailableCount > 0) {
      message += `\n(${unavailableCount} students in range were skipped as they're already in other batches)`;
    }
    alert(message);
    
    setRangeFrom('');
    setRangeTo('');
  };

  const handleUpdateStudents = async () => {
    if (!selectedBatch) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(
        `http://localhost:5000/api/batches/${selectedBatch._id}`,
        { students: selectedStudents },
        config
      );

      alert('Batch students updated successfully!');
      setShowEditStudentsModal(false);
      setSelectedBatch(null);
      setSelectedStudents([]);
      fetchData();
    } catch (error) {
      console.error('Error updating batch students:', error);
      alert(error.response?.data?.error || 'Error updating batch students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="batch-management-page">
      <Navbar />
      <div className="batch-container">
        <div className="batch-welcome-header">
          <div>
            <h1 className="page-title">Batch Management</h1>
            <p className="page-subtitle">Organize students into batches and groups</p>
          </div>
          <button onClick={() => setShowModal(true)} className="add-btn glass-card">
            <span>+</span>
            Create New Batch
          </button>
        </div>

        <div className="management-card slide-in">
          <div className="modern-table-wrapper">
            <table className="modern-table">
            <thead>
              <tr>
                <th>Batch Name</th>
                <th>Year</th>
                <th>Department</th>
                <th>Semester</th>
                <th>Class Teacher</th>
                <th>Students</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((batch) => (
                <tr key={batch._id}>
                  <td><strong>{batch.name}</strong></td>
                  <td>{batch.year}</td>
                  <td>{batch.department}</td>
                  <td>Semester {batch.semester}</td>
                  <td>{batch.classTeacher?.name || 'Not assigned'}</td>
                  <td>
                    <span style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      fontWeight: '600'
                    }}>
                      {batch.students?.length || 0} students
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEditStudents(batch)}
                        className="btn-primary small"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        Students
                      </button>
                      <button
                        onClick={() => handleDelete(batch._id)}
                        className="btn-danger"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {showModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>Create New Batch</h2>
                <button className="admin-modal-close" onClick={() => setShowModal(false)}>×</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  <div className="admin-form-group">
                    <label>Batch Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., 2025 CS Batch A"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Year *</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      min="2020"
                      max="2030"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Department *</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      placeholder="e.g., Computer Science"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Semester *</label>
                    <input
                      type="number"
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                      min="1"
                      max="8"
                      required
                    />
                  </div>

                  <div className="admin-form-group">
                    <label>Class Teacher</label>
                    <select
                      value={formData.classTeacher}
                      onChange={(e) => setFormData({ ...formData, classTeacher: e.target.value })}
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button type="submit" className="admin-submit-btn" disabled={loading}>
                    {loading ? '⏳ Creating...' : '✓ Create Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showEditStudentsModal && selectedBatch && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>Edit Students - {selectedBatch.name}</h2>
                <button className="admin-modal-close" onClick={() => {
                  setShowEditStudentsModal(false);
                  setSelectedBatch(null);
                  setSelectedStudents([]);
                }}>×</button>
              </div>
              
              <div className="admin-modal-body">
                <div className="selection-header">
                  <div className="selection-count">
                    Selected: {selectedStudents.length} / {getAvailableStudents().length} available students
                  </div>
                  <div className="selection-actions">
                    <button
                      type="button"
                      onClick={() => setSelectedStudents(getAvailableStudents().map(s => s._id))}
                      className="btn-secondary small"
                    >
                      Select All Available
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedStudents([])}
                      className="btn-secondary small"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Range Selection Section */}
                <div className="range-selection-box">
                  <h3 className="range-selection-title">📋 Quick Range Selection</h3>
                  <p className="range-selection-subtitle">Select multiple students by roll number range (e.g., e0324001 to e0324049)</p>
                  <div className="range-input-group">
                    <div className="range-input-field">
                      <label>From Roll Number</label>
                      <input
                        type="text"
                        value={rangeFrom}
                        onChange={(e) => setRangeFrom(e.target.value)}
                        placeholder="e.g., e0324001"
                        className="range-input"
                      />
                    </div>
                    <div className="range-arrow">→</div>
                    <div className="range-input-field">
                      <label>To Roll Number</label>
                      <input
                        type="text"
                        value={rangeTo}
                        onChange={(e) => setRangeTo(e.target.value)}
                        placeholder="e.g., e0324049"
                        className="range-input"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRangeSelect}
                      className="range-select-btn"
                    >
                      ✓ Add Range
                    </button>
                  </div>
                </div>

                <div className="student-selection-container">
                  {getAvailableStudents().map((student) => (
                    <div
                      key={student._id}
                      className={`student-item ${selectedStudents.includes(student._id) ? 'selected' : ''}`}
                      onClick={() => handleStudentToggle(student._id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student._id)}
                        onChange={() => {}}
                      />
                      <div className="student-details">
                        <div className="student-name">{student.name}</div>
                        <div className="student-info">
                          {student.email}
                          {student.rollNumber && ` • Roll: ${student.rollNumber}`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {getAvailableStudents().length === 0 && (
                    <div className="no-students-message">
                      <p>No available students to add. All students are already assigned to batches.</p>
                    </div>
                  )}
                </div>

                {students.length > getAvailableStudents().length && (
                  <div className="unavailable-students-notice">
                    ⚠️ {students.length - getAvailableStudents().length} student(s) are hidden because they're already assigned to other batches
                  </div>
                )}

                <button 
                  onClick={handleUpdateStudents} 
                  className="admin-submit-btn" 
                  disabled={loading}
                >
                  {loading ? '⏳ Updating...' : `✓ Update Students (${selectedStudents.length})`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BatchManagement;
