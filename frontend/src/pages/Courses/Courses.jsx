import React, { useState } from 'react';
import CoursesList from './CoursesList';
import AddCourse from './AddCourse';
import { BookOpen, PlusCircle, LayoutGrid } from 'lucide-react';

const Courses = () => {
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'add'
  const [editingId, setEditingId] = useState(null);

  const handleEdit = (id) => {
    setEditingId(id);
    setActiveTab('add');
  };

  const handleAddNew = () => {
    setEditingId(null);
    setActiveTab('add');
  };

  const handleSuccess = () => {
    setEditingId(null);
    setActiveTab('list');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header & Tabs Section */}
      <div className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-active/10 rounded-2xl flex items-center justify-center text-brand-active shadow-inner">
              <BookOpen size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Courses Management</h1>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Create, edit and manage academic curricula</p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl w-fit self-end md:self-center">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'list'
                  ? "bg-white text-brand-active shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutGrid size={16} />
              Courses List
            </button>
            <button
              onClick={handleAddNew}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                activeTab === 'add'
                  ? "bg-white text-brand-active shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <PlusCircle size={16} />
              Add New
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Content Panel */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'list' ? (
          <CoursesList onEdit={handleEdit} />
        ) : (
          <AddCourse courseId={editingId} onSuccess={handleSuccess} />
        )}
      </div>
    </div>
  );
};

export default Courses;
