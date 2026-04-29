import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Settings,
  History,
  BookOpen,
  Building2
} from 'lucide-react';

export const navItems = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  {
    title: 'Institutes',
    icon: <Building2 size={20} />,
    path: '/dashboard/institutes',
    subTabs: [
      { title: 'Institute List', path: '/dashboard/institutes/list' },
      { title: 'Add Institute', path: '/dashboard/institutes/add' },
    ]
  },
  { title: 'Attendance', icon: <ClipboardCheck size={20} />, path: '/dashboard/attendance' },
  { title: 'Students', icon: <Users size={20} />, path: '/dashboard/students' },
  {
    title: 'Courses',
    icon: <BookOpen size={20} />,
    path: '/dashboard/courses',
    subTabs: [
      { title: 'Courses List', path: '/dashboard/courses/courses-list' },
      { title: 'Add Course', path: '/dashboard/courses/add-course' },
    ]
  },
  { title: 'Reports', icon: <FileText size={20} />, path: '/dashboard/reports' },
  { title: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings' },
  {
    title: 'User Logs',
    icon: <History size={20} />,
    path: '/dashboard/user-logs',
    subTabs: [
      { title: 'Users List', path: '/dashboard/user-logs/users-list' },
      { title: 'Add User', path: '/dashboard/user-logs/add-user' },
    ]
  },
];
