import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomHeader from '../../components/constantComponents/CustomHeader';
import Icons from '../../assets/icons';

const AddUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchUser = async () => {
    setFetching(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const user = response.data.users.find(u => u.id === parseInt(id));
        if (user) {
          setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
          });
        }
      }
    } catch (err) {
      console.log(err)
      setError('Failed to fetch user details');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isEditMode
        ? `http://localhost:5000/api/users/${id}`
        : `http://localhost:5000/api/users`;

      const method = isEditMode ? 'put' : 'post';

      // Only include password if it's provided or in create mode
      const data = { ...formData };
      if (isEditMode && !data.password) {
        delete data.password;
      }

      const response = await axios[method](url, data, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        navigate('/dashboard/user-logs/users-list');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="p-10 text-center text-slate-500">Loading user details...</div>;

  return (
    <div className="text-slate-800">
      <CustomHeader
        title={isEditMode ? "Edit User" : "Add User"}
        subtitle={isEditMode ? `Updating credentials for ${formData.name}` : "Create a new user account and assign appropriate permissions."}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 max-w-2xl mx-auto mt-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 border border-red-100">
            <span className="font-semibold text-xs py-1 px-2 bg-red-100 rounded">Error</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                type="text"
                required
                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 transition-all p-3 border outline-none"
                placeholder="Enter full name"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Address</label>
              <input
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                type="email"
                required
                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 transition-all p-3 border outline-none font-medium"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {isEditMode ? "Change Password (optional)" : "Password"}
              </label>
              <input
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                type="password"
                required={!isEditMode}
                className="block w-full rounded-xl border-slate-200 shadow-sm focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 transition-all p-3 border outline-none"
                placeholder={isEditMode ? "Leave blank to keep current" : "Minimum 6 characters"}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">User Role</label>
              <div className="grid grid-cols-3 gap-3">
                {['ADMIN', 'TEACHER', 'STUDENT'].map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                    className={`py-3 px-4 rounded-xl border font-bold transition-all text-sm ${formData.role === role
                      ? "bg-brand-active/10 border-brand-active text-brand-active shadow-sm"
                      : "border-slate-100 bg-slate-50 text-slate-500 hover:border-slate-200"
                      }`}
                  >
                    {role.charAt(0) + role.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {formData.role === 'TEACHER' && (
              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300">
                <p className="text-xs text-slate-500 flex items-center gap-2">
                  <Icons.Search size={14} />
                  Looking at schema.prisma: Teacher roles allow teaching multiple courses. Course assignments can be managed in the Courses module.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/user-logs/users-list')}
              className="flex-1 border border-slate-200 text-slate-600 py-3 px-4 rounded-xl hover:bg-slate-50 transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 bg-brand-active text-white py-3 px-4 rounded-xl hover:bg-brand-hover transition-all font-semibold shadow-lg shadow-brand-active/20 flex items-center justify-center gap-2 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading && <Icons.RefreshCcw size={18} className="animate-spin" />}
              <span>{isEditMode ? "Update User" : "Save User"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
