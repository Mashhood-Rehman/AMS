import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PlusCircle } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const Classes = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isFormPage =
    location.pathname.includes('/add') || location.pathname.includes('/edit');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {!isFormPage && (
        <SectionHeader
          title="Classes & Sections"
          subtitle="Define grade levels and sections (e.g. Section A, B) for your institute"
          button={
            <button
              type="button"
              onClick={() => navigate('/dashboard/classes/add')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 bg-brand-active text-white shadow-sm hover:bg-brand-hover"
            >
              <PlusCircle size={16} />
              Add Class
            </button>
          }
        />
      )}

      <div className="duration-500">
        <Outlet />
      </div>
    </div>
  );
};

export default Classes;
