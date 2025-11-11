import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './Announcements.css';

function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    targetAudience: 'all',
    expiresAt: '',
  });

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('user'));
    setUser(userData);
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const response = await axios.get('http://localhost:5000/api/announcements', config);
      setAnnouncements(response.data.data);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post('http://localhost:5000/api/announcements', formData, config);

      alert('Announcement created successfully!');
      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        priority: 'medium',
        targetAudience: 'all',
        expiresAt: '',
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Error creating announcement:', error);
      alert(error.response?.data?.error || 'Error creating announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`http://localhost:5000/api/announcements/${id}`, config);
      alert('Announcement deleted successfully!');
      fetchAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert(error.response?.data?.error || 'Error deleting announcement');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  if (announcements.length === 0 && !loading) {
    return (
      <div>
        <Navbar />
        <div className="announcements-container">
          <div className="page-header">
            <div>
              <h1 className="page-title">Announcements</h1>
              <p className="page-subtitle">Important notices and updates</p>
            </div>
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <button onClick={() => setShowModal(true)} className="btn-primary">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                </svg>
                Create Announcement
              </button>
            )}
          </div>
          <div className="empty-state">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            <h3>No Announcements</h3>
            <p>There are no announcements at this time</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="announcements-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Announcements</h1>
            <p className="page-subtitle">Important notices and updates</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
              Create Announcement
            </button>
          )}
        </div>

        <div className="announcements-list">
          {announcements.map((announcement) => (
            <div 
              key={announcement._id} 
              className="announcement-card" 
              style={{ borderLeftColor: getPriorityColor(announcement.priority) }}
            >
              <div className="announcement-header">
                <div className="announcement-title-section">
                  <div className="announcement-title-row">
                    <h3 className="announcement-title">{announcement.title}</h3>
                    <span className={`badge ${announcement.priority}`}>
                      {announcement.priority}
                    </span>
                    <span className="badge audience">
                      {announcement.targetAudience}
                    </span>
                  </div>
                  <div className="announcement-content">
                    {announcement.content}
                  </div>
                  <div className="announcement-meta">
                    <span>Posted by {announcement.author?.name}</span>
                    <span className="meta-separator">•</span>
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                    {announcement.expiresAt && (
                      <>
                        <span className="meta-separator">•</span>
                        <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>
                {(user?.role === 'admin' || announcement.author?._id === user?._id) && (
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className="btn-danger small"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{display: 'inline', marginRight: '4px'}}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Create Announcement</h2>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group full-width">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Announcement title"
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Content *</label>
                    <textarea
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      placeholder="Announcement content..."
                      rows="5"
                      required
                    />
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label>Priority *</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Target Audience *</label>
                      <select
                        value={formData.targetAudience}
                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                      >
                        <option value="all">All</option>
                        <option value="students">Students</option>
                        <option value="teachers">Teachers</option>
                        <option value="admins">Admins</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Expires At (optional)</label>
                    <input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    />
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
                    {loading ? 'Creating...' : 'Create Announcement'}
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

export default Announcements;
