import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import CustomTable from '../../components/constantComponents/CustomTable';
import Icons from '../../assets/icons';

const UsersList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setUsers(response.data.users || []);
      } else {
        const message = response.data.message || 'Could not load users';
        setFetchError(message);
        toast.error(message);
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to load users';
      setFetchError(message);
      toast.error(message);
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers, location.pathname]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          fetchUsers();
        }
      } catch (error) {
        console.log(error)
        alert('Failed to delete user');
      }
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'role',
      label: 'Role',
      render: (val) => (
        <span className={`px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest uppercase ${val === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' :
            val === 'TEACHER' ? 'bg-amber-50 text-amber-600' :
              'bg-emerald-50 text-emerald-600'
          }`}>
          {val}
        </span>
      )
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, item) => {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isSelf = currentUser.id === item.id;

        if (isSelf) return <span className="text-xs text-slate-400 italic px-2">You</span>;

        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/dashboard/user-logs/edit-user/${item.id}`)}
              className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-brand-active hover:text-white transition-all shadow-sm"
              title="Edit User"
            >
              <Icons.Pencil size={16} />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-all shadow-sm border border-red-100"
              title="Delete User"
            >
              <Icons.Trash2 size={16} />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="">
      <SectionHeader 
        title="Users Management"
        subtitle="Manage system users, access levels, and role assignments."
        button={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={fetchUsers}
              className="btn btn-cancel"
              disabled={loading}
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate('/dashboard/user-logs/add-user')}
              className="btn btn-blue"
            >
              Add User
            </button>
          </div>
        }
      />

      <div className="bg-white rounded-lg border-0 p-1 mt-6 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Icons.RefreshCcw className="animate-spin text-brand-active" size={32} />
            <p className="text-slate-500 font-medium tracking-tight">Fetching users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center gap-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
            <div className="p-4 bg-white rounded-lg shadow-sm mb-2">
              <Icons.Users size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">
              {fetchError || 'No users found in the system.'}
            </p>
            {fetchError && (
              <button type="button" onClick={fetchUsers} className="btn btn-blue text-sm mt-2">
                Try again
              </button>
            )}
          </div>
        ) : (
          <CustomTable
            tableHeaders={tableHeaders}
            tableData={users}
          />
        )}
      </div>
    </div>
  );
};

export default UsersList;
