import React, { useState } from 'react';
import axios from 'axios';

const TimetableManager = ({ classId, onClose, onSuccess }) => {
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [slots, setSlots] = useState([
    { hour: 1, startTime: '09:00', endTime: '10:00', subject: '', faculty: '' },
  ]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  React.useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/users', config);
      
      // Handle different response formats
      const usersData = res.data.data || res.data || [];
      const facultyList = usersData.filter(u => u.role === 'teacher') || [];
      
      setTeachers(facultyList);
    } catch (err) {
      console.error('Error fetching teachers:', err);
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const addSlot = () => {
    const lastSlot = slots[slots.length - 1];
    const nextHour = lastSlot.hour + 1;
    setSlots([
      ...slots,
      {
        hour: nextHour,
        startTime: lastSlot.endTime,
        endTime: '',
        subject: '',
        faculty: '',
      },
    ]);
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(
        'http://localhost:5000/api/timetable',
        {
          classId,
          dayOfWeek: selectedDay,
          slots,
        },
        config
      );
      alert('Timetable created/updated successfully!');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to create/update timetable');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <h2>Manage Timetable</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Day of Week</label>
            <select
              className="form-control"
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            >
              {daysOfWeek.map(day => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div className="card-header">
              <h3 className="card-title">Time Slots</h3>
              <button type="button" className="btn btn-primary btn-sm" onClick={addSlot}>
                + Add Slot
              </button>
            </div>

            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {slots.map((slot, index) => (
                <div key={index} style={{ padding: '1rem', borderBottom: '1px solid #ddd' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 2fr auto', gap: '1rem', alignItems: 'end' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Hour</label>
                      <input
                        type="number"
                        className="form-control"
                        value={slot.hour || ''}
                        onChange={(e) => updateSlot(index, 'hour', parseInt(e.target.value) || 1)}
                        min="1"
                        max="8"
                        required
                        style={{ width: '60px' }}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Start</label>
                      <input
                        type="time"
                        className="form-control"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>End</label>
                      <input
                        type="time"
                        className="form-control"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Subject</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Subject name"
                        value={slot.subject}
                        onChange={(e) => updateSlot(index, 'subject', e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label>Faculty</label>
                      <select
                        className="form-control"
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

                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeSlot(index)}
                      disabled={slots.length === 1}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" className="btn btn-success" disabled={loading} style={{ width: '100%' }}>
            {loading ? 'Saving...' : 'Save Timetable'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TimetableManager;
