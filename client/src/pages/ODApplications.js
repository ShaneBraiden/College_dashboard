import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './ODApplications.css';

function ODApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/od-applications', config);
      setApplications(response.data.data);
    } catch (error) {
      console.error('Error fetching OD applications:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('http://localhost:5000/api/od-applications', formData, config);

      alert('OD Application submitted successfully!');
      setShowModal(false);
      setFormData({
        reason: '',
        description: '',
        startDate: '',
        endDate: '',
      });
      fetchApplications();
    } catch (error) {
      console.error('Error creating application:', error);
      alert(error.response?.data?.error || 'Error creating application');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status, remarks) => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(
        `http://localhost:5000/api/od-applications/${id}/review`,
        { status, remarks },
        config
      );

      alert(`Application ${status} successfully!`);
      fetchApplications();
    } catch (error) {
      console.error('Error reviewing application:', error);
      alert(error.response?.data?.error || 'Error reviewing application');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return '#28a745';
      case 'rejected': return '#dc3545';
      case 'pending': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div>
      <Navbar />
      <div className="od-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">On-Duty (OD) Applications</h1>
            <p className="page-subtitle">Manage and track OD requests</p>
          </div>
          {user?.role === 'student' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Apply for OD
            </button>
          )}
        </div>

        <div className="glass-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Reason</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Reviewed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>
                    <div className="student-name">{app.student?.name}</div>
                    {app.student?.rollNumber && (
                      <div className="student-roll">Roll: {app.student.rollNumber}</div>
                    )}
                  </td>
                  <td>
                    <div className="reason-title">{app.reason}</div>
                    {app.description && (
                      <div className="reason-description">{app.description}</div>
                    )}
                  </td>
                  <td>{new Date(app.startDate).toLocaleDateString()}</td>
                  <td>{new Date(app.endDate).toLocaleDateString()}</td>
                  <td>
                    <div>
                      <span className={`status-badge ${app.status}`}>
                        {app.status}
                      </span>
                      {app.remarks && (
                        <div className="status-remarks">{app.remarks}</div>
                      )}
                    </div>
                  </td>
                  <td>{app.reviewedBy?.name || '-'}</td>
                  <td>
                    {app.status === 'pending' && (user?.role === 'admin' || user?.role === 'teacher') && (
                      <div className="action-buttons">
                        <button
                          onClick={() => {
                            const remarks = prompt('Enter remarks (optional):');
                            handleReview(app._id, 'approved', remarks || '');
                          }}
                          className="btn-approve"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const remarks = prompt('Enter reason for rejection:');
                            if (remarks) handleReview(app._id, 'rejected', remarks);
                          }}
                          className="btn-danger"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Apply for On-Duty</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group full-width">
                    <label>Reason *</label>
                    <input
                      type="text"
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      placeholder="e.g., Conference, Workshop, Medical"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Additional details..."
                      rows="3"
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>End Date *</label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit Application'}
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

export default ODApplications;
