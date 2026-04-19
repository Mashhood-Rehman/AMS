import React from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  FileText,
  Settings,
  History
} from 'lucide-react';

export const navItems = [
  { title: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
  { title: 'Attendance', icon: <ClipboardCheck size={20} />, path: '/dashboard/attendance' },
  { title: 'Students', icon: <Users size={20} />, path: '/dashboard/students' },
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
