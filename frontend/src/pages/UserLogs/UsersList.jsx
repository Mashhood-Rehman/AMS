import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomHeader from '../../components/constantComponents/CustomHeader';
import CustomTable from '../../components/constantComponents/CustomTable';
import Icons from '../../assets/icons';

const UsersList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        const response = await axios.delete(`http://localhost:5000/api/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          fetchUsers();
        }
      } catch (error) {
        alert('Failed to delete user');
      }
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Full Name' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    { 
      key: 'createdAt', 
      label: 'Joined Date',
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
      )
    }
  ];

  return (
    <div className="text-slate-800">
      <CustomHeader 
        title="Users List" 
        subtitle="Manage and monitor system users and their access levels."
        actions={
          <button 
            onClick={() => navigate('/dashboard/user-logs/add-user')}
            className="flex items-center gap-2 bg-brand-active text-white px-4 py-2 rounded-lg hover:bg-brand-hover transition-all shadow-sm font-semibold"
          >
            <Icons.Plus size={18} />
            <span>Add User</span>
          </button>
        }
      />
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 overflow-hidden">
        {loading ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <Icons.RefreshCcw className="animate-spin text-brand-active" size={32} />
            <p className="text-slate-500 font-medium">Fetching users...</p>
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
