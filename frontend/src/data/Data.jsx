import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Settings,
  History,
  BookOpen,
  Building2,
  User
} from 'lucide-react';

export const navItems = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard', permissionKey: 'dashboard' },
  {
    title: 'User Logs',
    icon: <History size={20} />,
    path: '/dashboard/user-logs',
    permissionKey: 'user-logs',
    subTabs: [
      { title: 'Users List', path: '/dashboard/user-logs/users-list' },
      { title: 'Add User', path: '/dashboard/user-logs/add-user' },
    ]
  },

  {
    title: 'Courses',
    icon: <BookOpen size={20} />,
    path: '/dashboard/courses',
    permissionKey: 'courses',
    hideForRoles: ['TEACHER'],
    subTabs: [
      { title: 'Courses List', path: '/dashboard/courses/courses-list' },
      { title: 'Add Course', path: '/dashboard/courses/add-course' },
    ]
  },
  { title: 'Attendance', icon: <ClipboardCheck size={20} />, path: '/dashboard/attendance', permissionKey: 'attendance' },
  { title: 'Students', icon: <Users size={20} />, path: '/dashboard/students', permissionKey: 'students', hideForRoles: ['TEACHER'] },
  { title: 'Reports', icon: <FileText size={20} />, path: '/dashboard/reports', permissionKey: 'reports' },
  { title: 'Edit Profile', icon: <User size={20} />, path: '/dashboard/profile', permissionKey: 'edit-profile' },
  { title: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings', permissionKey: 'settings' },
];
