import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  MapPin, 
  Phone, 
  User,
  ExternalLink,
  Edit,
  Trash2
} from 'lucide-react';

const InstitutesList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  // Static data as requested
  const [institutes] = useState([
    {
      id: 1,
      name: 'Oakridge International School',
      classesOffered: '1 to 12',
      phone: '+44 20 1234 5678',
      address: '1st Floor, 29 Minerva Road, London, England, NW10 6HJ',
      principal: 'Dr. Sarah Wilson'
    },
    {
      id: 2,
      name: 'St. Mary’s Academy',
      classesOffered: 'Kindergarten to 10',
      phone: '+44 20 8765 4321',
      address: '45 High Street, Manchester, England',
      principal: 'Mr. James Brown'
    }
  ]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-brand-active/10 text-brand-active rounded-2xl flex items-center justify-center shrink-0">
            <Building2 size={28} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Institutes Directory</h1>
            <p className="text-slate-500 font-medium text-sm">Manage all registered institutes and their principals.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard/institutes/add')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-dark text-white rounded-xl font-bold shadow-lg shadow-brand-dark/20 hover:bg-brand-hover active:scale-[0.98] transition-all"
        >
          <Plus size={20} />
          Add Institute
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name, principal, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-0 rounded-xl focus:ring-2 focus:ring-brand-active/20 outline-none text-slate-700 transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-semibold hover:bg-slate-50 transition-all w-full md:w-auto justify-center">
            <Filter size={18} />
            Filters
          </button>
        </div>
      </div>

      {/* Institutes Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {institutes.map((inst) => (
          <div key={inst.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 font-bold text-xl">
                    {inst.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-active transition-colors">{inst.name}</h3>
                    <div className="flex items-center gap-2 text-slate-500 mt-1">
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                        Classes: {inst.classesOffered}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                  <MoreVertical size={20} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <User size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Principal</p>
                    <p className="text-sm font-semibold text-slate-700">{inst.principal}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact</p>
                    <p className="text-sm font-semibold text-slate-700">{inst.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 md:col-span-2">
                  <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Address</p>
                    <p className="text-sm font-semibold text-slate-700 leading-tight">{inst.address}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-2 text-slate-500 hover:text-brand-active font-bold text-xs transition-colors px-3 py-2 hover:bg-brand-active/5 rounded-lg">
                    <Edit size={14} />
                    Edit
                  </button>
                  <button className="flex items-center gap-2 text-slate-500 hover:text-red-500 font-bold text-xs transition-colors px-3 py-2 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
                <button className="flex items-center gap-2 text-brand-active font-bold text-sm hover:underline">
                  View Profile
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InstitutesList;
