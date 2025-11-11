import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './Courses.css';

function Courses() {
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    credits: 3,
    department: '',
    semester: 1,
    teachers: [],
    batches: [],
  });

  useEffect(() => {
    fetchUser();
    fetchData();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('http://localhost:5000/api/auth/me', config);
      console.log('User fetched from API:', res.data.data);
      setUser(res.data.data);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [coursesRes, batchesRes, teachersRes] = await Promise.all([
        axios.get('http://localhost:5000/api/courses', config),
        axios.get('http://localhost:5000/api/batches', config),
        axios.get('http://localhost:5000/api/users?role=teacher', config),
      ]);

      setCourses(coursesRes.data.data);
      setBatches(batchesRes.data.data);
      setTeachers(teachersRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      alert('Error loading data: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Prepare data
      const submitData = { ...formData };

      if (editingCourse) {
        // Update existing course
        await axios.put(`http://localhost:5000/api/courses/${editingCourse._id}`, submitData, config);
        alert('Course updated successfully!');
      } else {
        // Create new course
        await axios.post('http://localhost:5000/api/courses', submitData, config);
        alert('Course created successfully!');
      }

      setShowModal(false);
      setEditingCourse(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        credits: 3,
        department: '',
        semester: 1,
        teachers: [],
        batches: [],
      });
      fetchData();
    } catch (error) {
      console.error('Error saving course:', error);
      alert(error.response?.data?.error || 'Error saving course');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`http://localhost:5000/api/courses/${id}`, config);
      alert('Course deleted successfully!');
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(error.response?.data?.error || 'Error deleting course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      code: course.code,
      description: course.description || '',
      credits: course.credits,
      department: course.department,
      semester: course.semester,
      teachers: course.teachers?.map(t => t._id) || [],
      batches: course.batches?.map(b => b._id) || [],
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCourse(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      credits: 3,
      department: '',
      semester: 1,
      teachers: [],
      batches: [],
    });
  };

  return (
    <div className="courses-page">
      <Navbar />
      <div className="courses-container">
        <div className="courses-welcome-header">
          <div>
            <h1 className="page-title">Courses</h1>
            <p className="page-subtitle">Manage all courses and curriculum</p>
          </div>
          {(user?.role === 'teacher' || user?.role === 'admin') && (
            <button onClick={() => setShowModal(true)} className="add-btn glass-card">
              <span>+</span>
              Create New Course
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="empty-state-card glass-card slide-in">
            <div className="empty-icon">📚</div>
            <h3>No Courses Available</h3>
            <p>Start by creating your first course</p>
          </div>
        ) : (
          <div className="courses-grid slide-in">
            {courses.map((course) => (
              <div key={course._id} className="course-card glass-card">
                <div className="course-header">
                  <h3>{course.name}</h3>
                  <span className="course-code">{course.code}</span>
                </div>
                <div className="course-info">
                  <div className="course-info-item">
                    <span className="info-label">Department</span>
                    <span className="info-value">{course.department}</span>
                  </div>
                  <div className="course-info-item">
                    <span className="info-label">Semester</span>
                    <span className="info-value">Semester {course.semester}</span>
                  </div>
                  <div className="course-info-item">
                    <span className="info-label">Credits</span>
                    <span className="info-value">{course.credits}</span>
                  </div>
                  <div className="course-info-item full-width">
                    <span className="info-label">Teachers</span>
                    <span className="info-value">
                      {course.teachers?.length > 0 
                        ? course.teachers.map(t => t.name).join(', ')
                        : 'Not assigned'}
                    </span>
                  </div>
                  <div className="course-info-item full-width">
                    <span className="info-label">Batches</span>
                    <span className="info-value">
                      {course.batches?.length > 0
                        ? course.batches.map(b => `${b.name} (${b.year})`).join(', ')
                        : 'Not assigned'}
                    </span>
                  </div>
                </div>
                {course.description && (
                  <div className="course-description">
                    <p>{course.description}</p>
                  </div>
                )}
                
                {(user?.role === 'teacher' || user?.role === 'admin') && (
                  <div className="course-actions">
                    <button
                      onClick={() => handleEdit(course)}
                      className="edit-btn"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course._id)}
                      className="delete-btn"
                    >
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="admin-modal-overlay">
            <div className="admin-modal">
              <div className="admin-modal-header">
                <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                <button className="admin-modal-close" onClick={handleCloseModal}>×</button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="admin-modal-body">
                  <div className="form-grid">
                    <div className="admin-form-group">
                      <label>Course Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Data Structures and Algorithms"
                        required
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Course Code *</label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        placeholder="e.g., CS301"
                        required
                      />
                    </div>

                    <div className="admin-form-group full-width">
                      <label>Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Course description..."
                        rows="3"
                      />
                    </div>

                    <div className="admin-form-group">
                      <label>Credits *</label>
                      <input
                        type="number"
                        value={formData.credits}
                        onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                        min="1"
                        max="10"
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

                    <div className="admin-form-group full-width">
                      <label>Department *</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="e.g., Computer Science"
                        required
                      />
                    </div>

                    <div className="admin-form-group full-width">
                      <label>Assign Teachers *</label>
                      <select
                        multiple
                        value={formData.teachers}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setFormData({ ...formData, teachers: selected });
                        }}
                        style={{ minHeight: '120px' }}
                        required
                      >
                        {teachers.map((teacher) => (
                          <option key={teacher._id} value={teacher._id}>
                            {teacher.name} ({teacher.email})
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Hold Ctrl (Windows) or Cmd (Mac) to select multiple teachers
                      </small>
                    </div>

                    <div className="admin-form-group full-width">
                      <label>Assign Batches *</label>
                      <select
                        multiple
                        value={formData.batches}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          setFormData({ ...formData, batches: selected });
                        }}
                        style={{ minHeight: '120px' }}
                        required
                      >
                        {batches.map((batch) => (
                          <option key={batch._id} value={batch._id}>
                            {batch.name} - {batch.year} {batch.department}
                          </option>
                        ))}
                      </select>
                      <small style={{ color: '#6B7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                        Hold Ctrl (Windows) or Cmd (Mac) to select multiple batches
                      </small>
                    </div>
                  </div>
                  <button type="submit" className="admin-submit-btn" disabled={loading}>
                    {loading ? '⏳ Saving...' : editingCourse ? '✓ Update Course' : '✓ Create Course'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Courses;
