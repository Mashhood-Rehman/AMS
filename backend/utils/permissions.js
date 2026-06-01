export const ADMIN_PERMISSIONS = [
  'dashboard',
  'institutes',
  'attendance',
  'students',
  'courses',
  'classes',
  'reports',
  'settings',
  'user-logs',
  'edit-profile',
];

export const getEffectivePermissions = (user) => {
  if (!user) return [];
  if (user.role === 'ADMIN') {
    return Array.from(new Set([...ADMIN_PERMISSIONS, ...(user.permissions || [])]));
  }
  if (user.permissions?.length > 0) {
    return user.permissions;
  }
  if (user.role === 'STUDENT') {
    return ['dashboard', 'edit-profile'];
  }
  return [];
};
