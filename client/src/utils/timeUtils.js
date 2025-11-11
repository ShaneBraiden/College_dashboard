// Time slots configuration for college schedule
export const TIME_SLOTS = [
  { hour: 1, start: '08:00', end: '08:55', label: 'Hour 1' },
  { hour: 2, start: '08:55', end: '09:50', label: 'Hour 2' },
  { hour: 3, start: '10:10', end: '11:05', label: 'Hour 3' }, // After 20 min break
  { hour: 4, start: '11:05', end: '12:00', label: 'Hour 4' },
  { hour: 5, start: '13:00', end: '13:50', label: 'Hour 5' }, // After 60 min lunch
  { hour: 6, start: '13:50', end: '14:40', label: 'Hour 6' },
  { hour: 7, start: '14:55', end: '15:45', label: 'Hour 7' }, // After 15 min break
  { hour: 8, start: '15:45', end: '16:40', label: 'Hour 8' }
];

export const BREAKS = [
  { name: 'Morning Break', start: '09:50', end: '10:10', duration: 20 },
  { name: 'Lunch Break', start: '12:00', end: '13:00', duration: 60 },
  { name: 'Afternoon Break', start: '14:40', end: '14:55', duration: 15 }
];

/**
 * Get the current hour based on system time
 * @returns {number|null} Current hour number (1-8) or null if not in class time
 */
export const getCurrentHour = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  for (let slot of TIME_SLOTS) {
    const [startHour, startMin] = slot.start.split(':').map(Number);
    const [endHour, endMin] = slot.end.split(':').map(Number);
    
    const slotStart = startHour * 60 + startMin;
    const slotEnd = endHour * 60 + endMin;

    if (currentMinutes >= slotStart && currentMinutes <= slotEnd) {
      return slot.hour;
    }
  }

  return null; // Not in any class hour
};

/**
 * Check if current time is during a break
 * @returns {object|null} Break info or null
 */
export const getCurrentBreak = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentMinutes = hours * 60 + minutes;

  for (let breakInfo of BREAKS) {
    const [startHour, startMin] = breakInfo.start.split(':').map(Number);
    const [endHour, endMin] = breakInfo.end.split(':').map(Number);
    
    const breakStart = startHour * 60 + startMin;
    const breakEnd = endHour * 60 + endMin;

    if (currentMinutes >= breakStart && currentMinutes <= breakEnd) {
      return breakInfo;
    }
  }

  return null;
};

/**
 * Check if current time is during class hours
 * @returns {boolean}
 */
export const isClassTime = () => {
  return getCurrentHour() !== null;
};

/**
 * Get time slot information for a specific hour
 * @param {number} hour - Hour number (1-8)
 * @returns {object|null} Time slot info or null
 */
export const getTimeSlotInfo = (hour) => {
  return TIME_SLOTS.find(slot => slot.hour === hour) || null;
};

/**
 * Get all hours that have passed for the current day
 * @returns {number[]} Array of hour numbers
 */
export const getPassedHours = () => {
  const currentHour = getCurrentHour();
  if (!currentHour) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    // If after last class, return all hours
    const lastSlot = TIME_SLOTS[TIME_SLOTS.length - 1];
    const [endHour, endMin] = lastSlot.end.split(':').map(Number);
    const lastSlotEnd = endHour * 60 + endMin;
    
    if (currentMinutes > lastSlotEnd) {
      return TIME_SLOTS.map(slot => slot.hour);
    }
    
    return [];
  }
  
  return TIME_SLOTS.filter(slot => slot.hour < currentHour).map(slot => slot.hour);
};

/**
 * Get remaining hours for the current day
 * @returns {number[]} Array of hour numbers
 */
export const getRemainingHours = () => {
  const currentHour = getCurrentHour();
  if (!currentHour) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentMinutes = hours * 60 + minutes;
    
    // If before first class, return all hours
    const firstSlot = TIME_SLOTS[0];
    const [startHour, startMin] = firstSlot.start.split(':').map(Number);
    const firstSlotStart = startHour * 60 + startMin;
    
    if (currentMinutes < firstSlotStart) {
      return TIME_SLOTS.map(slot => slot.hour);
    }
    
    return [];
  }
  
  return TIME_SLOTS.filter(slot => slot.hour > currentHour).map(slot => slot.hour);
};

/**
 * Format time for display (12-hour format)
 * @param {string} time - Time in HH:MM format
 * @returns {string} Formatted time
 */
export const formatTime = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

/**
 * Get day of week name
 * @param {Date} date - Date object
 * @returns {string} Day name
 */
export const getDayOfWeek = (date = new Date()) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

/**
 * Check if given date is a weekend
 * @param {Date} date - Date object
 * @returns {boolean}
 */
export const isWeekend = (date = new Date()) => {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
};

/**
 * Get time remaining until end of current hour
 * @returns {number|null} Minutes remaining or null
 */
export const getTimeRemainingInHour = () => {
  const currentHour = getCurrentHour();
  if (!currentHour) return null;

  const slot = getTimeSlotInfo(currentHour);
  if (!slot) return null;

  const now = new Date();
  const [endHour, endMin] = slot.end.split(':').map(Number);
  
  const endTime = new Date();
  endTime.setHours(endHour, endMin, 0, 0);
  
  const diffMs = endTime - now;
  const diffMins = Math.floor(diffMs / 60000);
  
  return diffMins >= 0 ? diffMins : 0;
};

/**
 * Get schedule status for a given hour
 * @param {number} hour - Hour number
 * @returns {string} 'completed' | 'ongoing' | 'upcoming'
 */
export const getHourStatus = (hour) => {
  const currentHour = getCurrentHour();
  
  if (!currentHour) {
    const passedHours = getPassedHours();
    if (passedHours.includes(hour)) return 'completed';
    return 'upcoming';
  }
  
  if (hour < currentHour) return 'completed';
  if (hour === currentHour) return 'ongoing';
  return 'upcoming';
};

export default {
  TIME_SLOTS,
  BREAKS,
  getCurrentHour,
  getCurrentBreak,
  isClassTime,
  getTimeSlotInfo,
  getPassedHours,
  getRemainingHours,
  formatTime,
  getDayOfWeek,
  isWeekend,
  getTimeRemainingInHour,
  getHourStatus
};
