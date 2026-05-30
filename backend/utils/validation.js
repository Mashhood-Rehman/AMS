const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COURSE_CODE_REGEX = /^[A-Za-z0-9-]+$/;

export const isValidEmail = (email) =>
  typeof email === 'string' && EMAIL_REGEX.test(email.trim());

export const isValidPhone = (phone) => {
  if (phone === undefined || phone === null || String(phone).trim() === '') return true;
  return /^\d{10,15}$/.test(String(phone));
};

export const validateUserPayload = ({ email, password, name, phone, role, className }, { requirePassword = true } = {}) => {
  const errors = [];

  if (!name || String(name).trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || !isValidEmail(email)) {
    errors.push('A valid email address is required');
  }
  if (requirePassword && (!password || password.length < 8)) {
    errors.push('Password must be at least 8 characters');
  } else if (password && password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!isValidPhone(phone)) {
    errors.push('Phone must be 10–15 digits (numbers only)');
  }
  if (role === 'STUDENT' && !className) {
    errors.push('Class is required for students');
  }

  return errors;
};

export const validateCoursePayload = ({ name, code, className, days }) => {
  const errors = [];

  if (!name || String(name).trim().length < 2) {
    errors.push('Course name must be at least 2 characters');
  }
  const trimmedCode = String(code || '').trim();
  if (!trimmedCode || trimmedCode.length < 2) {
    errors.push('Course code must be at least 2 characters');
  } else if (!COURSE_CODE_REGEX.test(trimmedCode)) {
    errors.push('Course code can only contain letters, numbers, and hyphens');
  }
  if (!className) {
    errors.push('Class assignment is required');
  }
  const dayList = Array.isArray(days) ? days : [];
  if (dayList.length === 0) {
    errors.push('Select at least one teaching day');
  }

  return errors;
};
