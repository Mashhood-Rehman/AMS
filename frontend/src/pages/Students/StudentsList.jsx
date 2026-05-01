import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import CustomTable from '../../components/constantComponents/CustomTable';
import Icons from '../../assets/icons';

const StudentsList = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users?role=STUDENT', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setStudents(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student record?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          fetchStudents();
        }
      } catch (error) {
        alert('Failed to delete student');
      }
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Student Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone', render: (val) => val || 'N/A' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${val === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' :
            val === 'INACTIVE' ? 'bg-red-50 text-red-600' :
              'bg-amber-50 text-amber-600'
          }`}>
          {val || 'ACTIVE'}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Enrollment Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/dashboard/user-logs/edit-user/${item.id}`)}
            className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-active hover:text-white transition-all shadow-sm"
            title="Edit Student"
          >
            <Icons.Pencil size={16} />
          </button>
          <button
            onClick={() => handleDelete(item.id)}
            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
            title="Delete Student"
          >
            <Icons.Trash2 size={16} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="">
      <SectionHeader 
        title="Student Records"
        subtitle="View and manage student profiles and academic statuses."
        button={
          <button
            onClick={() => navigate('/dashboard/user-logs/add-user')}
            className="btn btn-blue"
          >
            Enroll Student
          </button>
        }
      />

      <div className="bg-white rounded-lg border-0 p-1 mt-6 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Icons.RefreshCcw className="animate-spin text-brand-active" size={32} />
            <p className="text-slate-500 font-medium tracking-tight">Fetching students...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-2">
              <Icons.Users size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No students enrolled yet.</p>
          </div>
        ) : (
          <CustomTable
            tableHeaders={tableHeaders}
            tableData={students}
          />
        )}
      </div>
    </div>
  );
};

export default StudentsList;
