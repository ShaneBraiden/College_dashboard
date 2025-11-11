import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentHour, getTimeSlotInfo, formatTime, getDayOfWeek, getHourStatus } from '../utils/timeUtils';
import './TodaySchedule.css';

const TodaySchedule = ({ classId }) => {
  const [schedule, setSchedule] = useState([]);
  const [currentHour, setCurrentHour] = useState(null);
  const [currentBreak, setCurrentBreak] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    if (classId) {
      fetchTodaySchedule();
    }
    
    // Update current hour every minute
    const interval = setInterval(() => {
      setCurrentHour(getCurrentHour());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [classId]);

  const fetchTodaySchedule = async () => {
    try {
      setLoading(true);
      const today = getDayOfWeek();

      const res = await axios.get(
        `http://localhost:5000/api/timetable/${classId}`,
        config
      );

      // Find today's schedule
      const todaySchedule = res.data.data.find(tt => tt.dayOfWeek === today);
      
      if (todaySchedule && todaySchedule.slots) {
        // Sort by hour
        const sortedSlots = todaySchedule.slots.sort((a, b) => a.hour - b.hour);
        setSchedule(sortedSlots);
      } else {
        setSchedule([]);
      }

      setCurrentHour(getCurrentHour());
      setLoading(false);
    } catch (err) {
      console.error('Error fetching schedule:', err);
      setError(err.response?.data?.msg || 'Failed to load schedule');
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return '✓';
      case 'ongoing':
        return '▶';
      case 'upcoming':
        return '◷';
      default:
        return '';
    }
  };

  const getStatusClass = (hour) => {
    const status = getHourStatus(hour);
    return status;
  };

  if (loading) {
    return (
      <div className="today-schedule">
        <h3>📅 Today's Schedule</h3>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="today-schedule">
        <h3>📅 Today's Schedule</h3>
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (schedule.length === 0) {
    const today = getDayOfWeek();
    return (
      <div className="today-schedule">
        <h3>📅 Today's Schedule - {today}</h3>
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <p>No classes scheduled for today</p>
          <small>Enjoy your day off!</small>
        </div>
      </div>
    );
  }

  return (
    <div className="today-schedule">
      <div className="schedule-header">
        <h3>📅 Today's Schedule - {getDayOfWeek()}</h3>
        {currentHour && (
          <div className="current-hour-badge">
            Current: Hour {currentHour}
          </div>
        )}
      </div>

      <div className="schedule-list">
        {schedule.map((slot, index) => {
          const status = getStatusClass(slot.hour);
          const isCurrent = slot.hour === currentHour;
          
          return (
            <div 
              key={index} 
              className={`schedule-item ${status} ${isCurrent ? 'current' : ''}`}
            >
              <div className="schedule-time-col">
                <div className="schedule-hour">Hour {slot.hour}</div>
                <div className="schedule-time">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </div>
              </div>

              <div className="schedule-details">
                <div className="schedule-subject">{slot.subject}</div>
                {slot.faculty && (
                  <div className="schedule-faculty">
                    👨‍🏫 {slot.faculty.name || 'Faculty'}
                  </div>
                )}
                {slot.roomNumber && (
                  <div className="schedule-room">
                    🚪 Room {slot.roomNumber}
                  </div>
                )}
              </div>

              <div className={`schedule-status-badge ${status}`}>
                <span className="status-icon">{getStatusIcon(status)}</span>
                <span className="status-text">{status}</span>
              </div>

              {isCurrent && (
                <div className="current-indicator">
                  <div className="pulse"></div>
                  <span>IN PROGRESS</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="schedule-legend">
        <div className="legend-item">
          <span className="legend-dot completed"></span>
          <span>Completed</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot ongoing"></span>
          <span>Ongoing</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot upcoming"></span>
          <span>Upcoming</span>
        </div>
      </div>
    </div>
  );
};

export default TodaySchedule;
