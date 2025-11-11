import React from 'react';
import './AttendanceWarning.css';

const AttendanceWarning = ({ 
  percentage, 
  requiredPercentage = 75,
  totalClasses = 0,
  presentClasses = 0
}) => {
  // Don't show warning if attendance is sufficient
  if (percentage >= requiredPercentage || totalClasses === 0) {
    return null;
  }

  // Calculate classes needed to reach required percentage
  // Formula: Classes needed = (Required% × Total + Required% × Needed - Present × 100) / (100 - Required%)
  const classesNeeded = Math.ceil(
    ((requiredPercentage * totalClasses) - (presentClasses * 100)) / 
    (100 - requiredPercentage)
  );

  // Calculate how many classes can be missed
  const allowedAbsences = Math.floor(
    (presentClasses - (requiredPercentage * totalClasses / 100)) / 
    (requiredPercentage / 100)
  );

  // Determine severity level
  const getSeverity = () => {
    if (percentage < 50) return 'critical';
    if (percentage < 65) return 'severe';
    return 'warning';
  };

  const severity = getSeverity();

  return (
    <div className={`attendance-warning alert-${severity}`}>
      <div className="warning-icon">
        {severity === 'critical' && '🚨'}
        {severity === 'severe' && '⚠️'}
        {severity === 'warning' && '⚡'}
      </div>
      <div className="warning-content">
        <h4>
          {severity === 'critical' && 'Critical: Extremely Low Attendance!'}
          {severity === 'severe' && 'Severe: Low Attendance Alert!'}
          {severity === 'warning' && 'Warning: Attendance Below Minimum!'}
        </h4>
        
        <div className="warning-stats">
          <div className="stat-item">
            <span className="stat-label">Current Attendance:</span>
            <span className="stat-value danger">{percentage}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Required Minimum:</span>
            <span className="stat-value">{requiredPercentage}%</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Sessions Attended:</span>
            <span className="stat-value">{presentClasses} / {totalClasses}</span>
          </div>
        </div>

        <div className="warning-message">
          {classesNeeded > 0 ? (
            <p>
              📚 You need to attend <strong className="highlight-danger">{classesNeeded}</strong> consecutive 
              sessions without any absence to reach {requiredPercentage}% attendance.
            </p>
          ) : (
            <p>
              ✅ You can miss up to <strong className="highlight-success">{Math.abs(allowedAbsences)}</strong> more 
              sessions and still maintain {requiredPercentage}% attendance.
            </p>
          )}
        </div>

        <div className="warning-consequences">
          <h5>⚠️ Important Information:</h5>
          <ul>
            <li>Students with less than {requiredPercentage}% attendance may not be allowed to appear for exams</li>
            <li>Attendance shortage may result in grade penalties</li>
            <li>Medical certificates should be submitted within 3 days for justified absences</li>
            {severity === 'critical' && (
              <li className="critical-note">
                <strong>Your attendance is critically low. Please contact your course teacher immediately.</strong>
              </li>
            )}
          </ul>
        </div>

        {classesNeeded > 0 && (
          <div className="action-buttons">
            <button className="btn-primary">Apply for OD</button>
            <button className="btn-secondary">Contact Teacher</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceWarning;
