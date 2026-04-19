import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import UsersList from './pages/UserLogs/UsersList';
import AddUser from './pages/UserLogs/AddUser';

// Placeholder components for other routes
const Attendance = () => <div className="stat-card"><h2>Attendance Management</h2><p>Feature coming soon...</p></div>;
const Students = () => <div className="stat-card"><h2>Student Records</h2><p>Feature coming soon...</p></div>;
const Reports = () => <div className="stat-card"><h2>System Reports</h2><p>Feature coming soon...</p></div>;
const Settings = () => <div className="stat-card"><h2>Settings</h2><p>Feature coming soon...</p></div>;

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Auth Routes - Login is now the index route (/) */}
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<LoginPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="signup" element={<SignupPage />} />
          </Route>

          {/* Dashboard Routes - Nested under /dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="students" element={<Students />} />
            <Route path="reports" element={<Reports />} />
            <Route path="settings" element={<Settings />} />
            <Route path="user-logs">
              <Route index element={<Navigate to="users-list" replace />} />
              <Route path="users-list" element={<UsersList />} />
              <Route path="add-user" element={<AddUser />} />
              <Route path="edit-user/:id" element={<AddUser />} />
            </Route>
          </Route>

          {/* Fallback - Redirect to login (index) */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </>
  );
}


export default App;

