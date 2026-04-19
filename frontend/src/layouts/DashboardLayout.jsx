import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar isSidebarOpen={isSidebarOpen} />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out 
          ${isSidebarOpen ? 'ml-64' : 'ml-20'}`}
      >
        <Navbar toggleSidebar={toggleSidebar} />

        <main className="flex-1 p-6 md:p-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
