const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const COURSE_CODE_REGEX = /^[A-Za-z0-9-]+$/;

export const isValidEmail = (email) =>
  typeof email === 'string' && EMAIL_REGEX.test(email.trim());

export const isValidPhone = (phone) => {
  if (!phone || String(phone).trim() === '') return true;
  return /^\d{10,15}$/.test(String(phone));
};

export const sanitizePhone = (value) => String(value || '').replace(/\D/g, '');

export const validateUserForm = (data, { isEditMode = false } = {}) => {
  const errors = {};
  const name = (data.name || '').trim();
  const email = (data.email || '').trim();

  if (!name) errors.name = 'Full name is required';
  else if (name.length < 2) errors.name = 'Name must be at least 2 characters';

  if (!email) errors.email = 'Email is required';
  else if (!isValidEmail(email)) errors.email = 'Enter a valid email address';

  if (!isEditMode && !data.password) {
    errors.password = 'Password is required';
  } else if (data.password && data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (data.phone && !isValidPhone(data.phone)) {
    errors.phone = 'Phone must be 10–15 digits (numbers only)';
  }

  if (data.role === 'STUDENT' && !data.className) {
    errors.className = 'Class is required for students';
  }

  if (data.role === 'TEACHER' && (!data.courseIds || data.courseIds.length === 0)) {
    errors.courses = 'Assign at least one course to the teacher';
  }

  return errors;
};

export const validateCourseForm = (data, { useDifferentTimes = false, dayTimes = {} } = {}) => {
  const errors = {};
  const name = (data.name || '').trim();
  const code = (data.code || '').trim();

  if (!name) errors.name = 'Course name is required';
  else if (name.length < 2) errors.name = 'Course name must be at least 2 characters';

  if (!code) errors.code = 'Course code is required';
  else if (code.length < 2) errors.code = 'Course code must be at least 2 characters';
  else if (!COURSE_CODE_REGEX.test(code)) {
    errors.code = 'Code can only contain letters, numbers, and hyphens';
  }

  if (!data.className) errors.className = 'Please select a class';

  if (!data.days || data.days.length === 0) {
    errors.days = 'Select at least one teaching day';
  }

  if (data.days?.length > 0) {
    if (useDifferentTimes) {
      const missingTime = data.days.some((day) => !(dayTimes[day] || '').trim());
      if (missingTime) {
        errors.time = 'Specify a start time for each selected teaching day';
      }
    } else if (!(data.time || '').trim()) {
      errors.time = 'Please specify a start time';
    }
  }

  return errors;
};
