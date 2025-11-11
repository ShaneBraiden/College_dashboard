import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import './Timetable.css';

const Timetable = () => {
  const [batches, setBatches] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [timetableData, setTimetableData] = useState({});
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [editingSlots, setEditingSlots] = useState([]);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [editingCell, setEditingCell] = useState(null); // { day, hour }
  const [cellModalData, setCellModalData] = useState({
    subject: '',
    faculty: '',
    roomNumber: ''
  });
  const [user, setUser] = useState(null);

  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    { hour: 1, startTime: '09:00', endTime: '10:00' },
    { hour: 2, startTime: '10:00', endTime: '11:00' },
    { hour: 3, startTime: '11:15', endTime: '12:15' },
    { hour: 4, startTime: '12:15', endTime: '01:15' },
    { hour: 5, startTime: '02:00', endTime: '03:00' },
    { hour: 6, startTime: '03:00', endTime: '04:00' },
    { hour: 7, startTime: '04:00', endTime: '05:00' },
  ];

  useEffect(() => {
    fetchBatches();
    fetchTeachers();
    fetchUser();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      fetchTimetable();
    }
  }, [selectedBatch]);

  const fetchUser = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/auth/me', config);
      setUser(res.data.data);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  };

  const fetchBatches = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/batches', config);
      const batchesData = res.data.data || res.data || [];
      setBatches(batchesData);
      
      // Auto-select first batch if available
      if (batchesData.length > 0 && !selectedBatch) {
        setSelectedBatch(batchesData[0]);
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
    }
  };

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', config);
      const usersData = res.data.data || res.data || [];
      const facultyList = usersData.filter(u => u.role === 'teacher') || [];
      setTeachers(facultyList);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const fetchTimetable = async () => {
    if (!selectedBatch) return;
    
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:5000/api/timetable/${selectedBatch._id}`,
        config
      );
      
      const timetables = res.data.data || [];
      const organized = {};
      
      timetables.forEach(tt => {
        organized[tt.dayOfWeek] = tt.slots || [];
      });
      
      setTimetableData(organized);
    } catch (err) {
      console.error('Error fetching timetable:', err);
      setTimetableData({});
    } finally {
      setLoading(false);
    }
  };

  const handleEditDay = (day) => {
    setSelectedDay(day);
    setEditingSlots(timetableData[day] || []);
    setEditMode(true);
  };

  const addSlot = () => {
    const lastSlot = editingSlots.length > 0 ? editingSlots[editingSlots.length - 1] : null;
    const nextHour = lastSlot ? lastSlot.hour + 1 : 1;
    const defaultTime = timeSlots.find(t => t.hour === nextHour) || timeSlots[0];
    
    setEditingSlots([
      ...editingSlots,
      {
        hour: nextHour,
        startTime: defaultTime.startTime,
        endTime: defaultTime.endTime,
        subject: '',
        faculty: '',
        roomNumber: '',
      },
    ]);
  };

  const removeSlot = (index) => {
    setEditingSlots(editingSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...editingSlots];
    newSlots[index][field] = value;
    setEditingSlots(newSlots);
  };

  const saveTimetable = async () => {
    if (!selectedBatch || !selectedDay) return;
    
    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/api/timetable',
        {
          classId: selectedBatch._id,
          dayOfWeek: selectedDay,
          slots: editingSlots,
        },
        config
      );
      
      alert('Timetable saved successfully!');
      setEditMode(false);
      fetchTimetable();
    } catch (err) {
      console.error('Error saving timetable:', err);
      alert('Failed to save timetable');
    } finally {
      setLoading(false);
    }
  };

  const handleCellClick = (day, hour) => {
    console.log('User role:', user.role); // Debug log
    if (user?.role !== 'admin') {
      console.log('Access denied - not admin');
      return;
    }
    
    const daySlots = timetableData[day] || [];
    const slotData = daySlots.find(s => s.hour === hour);
    
    setEditingCell({ day, hour });
    if (slotData) {
      setCellModalData({
        subject: slotData.subject || '',
        faculty: slotData.faculty || '',
        roomNumber: slotData.roomNumber || ''
      });
    } else {
      setCellModalData({
        subject: '',
        faculty: '',
        roomNumber: ''
      });
    }
  };

  const saveCellData = async () => {
    if (!selectedBatch || !editingCell) return;
    
    const { day, hour } = editingCell;
    
    // Get existing slots for the day
    const daySlots = timetableData[day] || [];
    
    // Remove existing slot for this hour if it exists
    const filteredSlots = daySlots.filter(s => s.hour !== hour);
    
    // Add new slot data if subject is provided
    let updatedSlots = filteredSlots;
    if (cellModalData.subject.trim()) {
      const timeSlot = timeSlots.find(t => t.hour === hour);
      updatedSlots = [
        ...filteredSlots,
        {
          hour: hour,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          subject: cellModalData.subject,
          faculty: cellModalData.faculty,
          roomNumber: cellModalData.roomNumber
        }
      ].sort((a, b) => a.hour - b.hour);
    }
    
    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/api/timetable',
        {
          classId: selectedBatch._id,
          dayOfWeek: day,
          slots: updatedSlots,
        },
        config
      );
      
      // Update local state
      setTimetableData(prev => ({
        ...prev,
        [day]: updatedSlots
      }));
      
      setEditingCell(null);
      setCellModalData({ subject: '', faculty: '', roomNumber: '' });
    } catch (err) {
      console.error('Error saving cell:', err);
      alert('Failed to save changes');
    } finally {
      setLoading(false);
    }
  };

  const deleteCellData = async () => {
    if (!selectedBatch || !editingCell) return;
    
    const { day, hour } = editingCell;
    const daySlots = timetableData[day] || [];
    const updatedSlots = daySlots.filter(s => s.hour !== hour);
    
    setLoading(true);
    try {
      await axios.post(
        'http://localhost:5000/api/timetable',
        {
          classId: selectedBatch._id,
          dayOfWeek: day,
          slots: updatedSlots,
        },
        config
      );
      
      setTimetableData(prev => ({
        ...prev,
        [day]: updatedSlots
      }));
      
      setEditingCell(null);
      setCellModalData({ subject: '', faculty: '', roomNumber: '' });
    } catch (err) {
      console.error('Error deleting cell:', err);
      alert('Failed to delete');
    } finally {
      setLoading(false);
    }
  };

  const getTeacherName = (facultyId) => {
    const teacher = teachers.find(t => t._id === facultyId);
    return teacher ? teacher.name : 'N/A';
  };

  const renderViewMode = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loader"></div>
          <p>Loading timetable...</p>
        </div>
      );
    }

    return (
      <div className="timetable-grid-container">
        <div className="timetable-grid">
          {/* Header Row - Time Slots */}
          <div className="timetable-cell header-cell">Day / Hour</div>
          {timeSlots.map(slot => (
            <div key={slot.hour} className="timetable-cell header-cell">
              <div className="time-info">
                <span className="hour-label">Hour {slot.hour}</span>
                <span className="time-range">{slot.startTime} - {slot.endTime}</span>
              </div>
            </div>
          ))}

          {/* Day Rows */}
          {daysOfWeek.map(day => (
            <React.Fragment key={day}>
              <div className="timetable-cell time-cell">
                <div className="day-header">
                  <span>{day}</span>
                </div>
              </div>
              
              {timeSlots.map(slot => {
                const daySlots = timetableData[day] || [];
                const slotData = daySlots.find(s => s.hour === slot.hour);
                const isEditable = user?.role === 'admin';
                
                return (
                  <div 
                    key={`${day}-${slot.hour}`} 
                    className={`timetable-cell data-cell ${isEditable ? 'editable-cell' : ''}`}
                    onClick={() => handleCellClick(day, slot.hour)}
                    title={isEditable ? 'Click to edit' : ''}
                    style={{ cursor: isEditable ? 'pointer' : 'default' }}
                  >
                    {slotData ? (
                      <div className="slot-content">
                        <div className="subject-name">{slotData.subject}</div>
                        <div className="faculty-name">{getTeacherName(slotData.faculty)}</div>
                        {slotData.roomNumber && (
                          <div className="room-number">Room: {slotData.roomNumber}</div>
                        )}
                      </div>
                    ) : (
                      <div className="empty-slot">{isEditable ? '+' : '-'}</div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderEditMode = () => {
    return (
      <div className="edit-mode-container">
        <div className="edit-mode-header">
          <h3>Edit Timetable - {selectedDay}</h3>
          <div className="edit-actions">
            <button className="btn-add-slot" onClick={addSlot}>
              + Add Slot
            </button>
            <button className="btn-save" onClick={saveTimetable} disabled={loading}>
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button className="btn-cancel" onClick={() => setEditMode(false)}>
              Cancel
            </button>
          </div>
        </div>

        <div className="slots-editor">
          {editingSlots.length === 0 ? (
            <div className="empty-state">
              <p>No slots added yet. Click "Add Slot" to create one.</p>
            </div>
          ) : (
            editingSlots.map((slot, index) => (
              <div key={index} className="slot-editor-card">
                <div className="slot-editor-header">
                  <span className="slot-number">Slot {index + 1}</span>
                  <button
                    className="btn-remove-slot"
                    onClick={() => removeSlot(index)}
                    title="Remove slot"
                  >
                    ×
                  </button>
                </div>

                <div className="slot-editor-grid">
                  <div className="form-group">
                    <label>Hour</label>
                    <input
                      type="number"
                      className="form-input"
                      value={slot.hour}
                      onChange={(e) => updateSlot(index, 'hour', parseInt(e.target.value) || 1)}
                      min="1"
                      max="7"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Subject</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Enter subject name"
                      value={slot.subject}
                      onChange={(e) => updateSlot(index, 'subject', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group full-width">
                    <label>Faculty</label>
                    <select
                      className="form-input"
                      value={slot.faculty}
                      onChange={(e) => updateSlot(index, 'faculty', e.target.value)}
                      required
                    >
                      <option value="">Select Faculty</option>
                      {teachers.map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Room Number (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g., 301"
                      value={slot.roomNumber || ''}
                      onChange={(e) => updateSlot(index, 'roomNumber', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="timetable-page">
        <div className="timetable-header">
          <div className="header-content">
            <h1 className="page-title">📅 Timetable</h1>
          </div>
        </div>

        <div className="timetable-content">
        {/* Batch Selector */}
        <div className="batch-selector-card">
          <label className="selector-label">Select Batch</label>
          <select
            className="batch-select"
            value={selectedBatch?._id || ''}
            onChange={(e) => {
              const batch = batches.find(b => b._id === e.target.value);
              setSelectedBatch(batch);
              setEditMode(false);
            }}
          >
            <option value="">-- Select a batch --</option>
            {batches.map(batch => (
              <option key={batch._id} value={batch._id}>
                {batch.name} - Year {batch.year} - {batch.department}
              </option>
            ))}
          </select>
        </div>

        {/* Timetable Display */}
        {selectedBatch && (
          <div className="timetable-display-card">
            <div className="batch-info">
              <h2>{selectedBatch.name}</h2>
              <span className="batch-details">
                Year {selectedBatch.year} • {selectedBatch.department} • Semester {selectedBatch.semester}
              </span>
            </div>

            {editMode ? renderEditMode() : renderViewMode()}
          </div>
        )}

        {!selectedBatch && (
          <div className="empty-state-container">
            <div className="empty-state-icon">📚</div>
            <h3>No Batch Selected</h3>
            <p>Please select a batch to view or edit its timetable</p>
          </div>
        )}

        {/* Cell Edit Modal */}
        {editingCell && (
          <div className="admin-modal-overlay" onClick={() => setEditingCell(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h2>Edit Slot - {editingCell.day} Hour {editingCell.hour}</h2>
                <button className="admin-modal-close" onClick={() => setEditingCell(null)}>×</button>
              </div>
              
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="Enter subject name"
                    value={cellModalData.subject}
                    onChange={(e) => setCellModalData({ ...cellModalData, subject: e.target.value })}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Faculty *</label>
                  <select
                    className="admin-form-input"
                    value={cellModalData.faculty}
                    onChange={(e) => setCellModalData({ ...cellModalData, faculty: e.target.value })}
                  >
                    <option value="">Select Faculty</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Room Number (Optional)</label>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="e.g., 301"
                    value={cellModalData.roomNumber}
                    onChange={(e) => setCellModalData({ ...cellModalData, roomNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="admin-modal-footer">
                <button 
                  className="admin-btn admin-btn-success"
                  onClick={saveCellData}
                  disabled={loading || !cellModalData.subject.trim() || !cellModalData.faculty}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
                {timetableData[editingCell.day]?.find(s => s.hour === editingCell.hour) && (
                  <button 
                    className="admin-btn admin-btn-danger"
                    onClick={deleteCellData}
                    disabled={loading}
                  >
                    Delete
                  </button>
                )}
                <button 
                  className="admin-btn admin-btn-secondary"
                  onClick={() => setEditingCell(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  );
};

export default Timetable;

