import React from 'react';
import { Users, BookOpen, CheckCircle, Clock, FileText } from 'lucide-react';

const Dashboard = () => {
  const stats = [
    { title: 'Total Students', value: '1,280', icon: <Users size={24} />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active Courses', value: '24', icon: <BookOpen size={24} />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Today Attendance', value: '92%', icon: <CheckCircle size={24} />, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Pending Approval', value: '12', icon: <Clock size={24} />, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Welcome back, Admin. Here's a snapshot of the system today.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex items-center gap-5"
          >
            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}>
              {stat.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-0.5">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid for Tables/Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table Placeholder */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Recent Attendance</h2>
            <button className="text-blue-600 font-semibold text-sm hover:underline hover:underline-offset-4 transition-all">
              View All
            </button>
          </div>
          <div className="aspect-video flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
              <Users size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-400 font-medium">No recent activity records to display.</p>
          </div>
        </div>

        {/* Quick Actions Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h2>
          <div className="flex flex-col gap-3 flex-1">
            <button className="w-full bg-brand-dark text-white py-3 px-4 rounded-xl font-bold hover:bg-brand-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <CheckCircle size={18} />
              Mark Attendance
            </button>
            <button className="w-full bg-white text-slate-700 border border-slate-200 py-3 px-4 rounded-xl font-bold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <FileText size={18} />
              Generate Monthly Report
            </button>
            <button className="w-full bg-white text-slate-700 border border-slate-200 py-3 px-4 rounded-xl font-bold hover:bg-slate-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              <Users size={18} />
              Enroll New Student
            </button>
          </div>
          <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-100 italic text-sm text-blue-700">
            Tip: You can customize these shortcuts in the settings panel.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
