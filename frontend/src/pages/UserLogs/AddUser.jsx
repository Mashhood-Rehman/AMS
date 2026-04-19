import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ArrowLeft, 
  Save, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  BookOpen,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import CustomHeader from '../../components/constantComponents/CustomHeader';
import SearchableDropdown from '../../components/SearchableDropdown';
import { toast } from 'react-toastify';

const AddUser = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: 'STUDENT',
    status: 'ACTIVE',
    courseIds: []
  });

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCourses();
    if (isEditMode) {
      fetchUser();
    }
  }, [id]);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/courses', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        setCourses(response.data.courses.map(c => ({
          label: `${c.name} (${c.code})`,
          value: c.id
        })));
      }
    } catch (err) {
      console.error('Failed to fetch courses', err);
    }
  };

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
            phone: user.phone || '',
            role: user.role,
            status: user.status || 'ACTIVE',
            courseIds: user.taughtCourses ? user.taughtCourses.map(c => c.id) : []
          });
        }
      }
    } catch (err) {
      toast.error('Failed to fetch user details');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!isEditMode && !formData.password) newErrors.password = 'Password is required';
    if (formData.role === 'TEACHER' && formData.courseIds.length === 0) {
      newErrors.courses = 'Assign at least one course to the teacher';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const url = isEditMode
        ? `http://localhost:5000/api/users/${id}`
        : `http://localhost:5000/api/users`;

      const method = isEditMode ? 'put' : 'post';
      
      const payload = { ...formData };
      if (isEditMode && !payload.password) delete payload.password;
      if (payload.role !== 'TEACHER') delete payload.courseIds;

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        toast.success(isEditMode ? 'User updated successfully' : 'User created successfully');
        navigate('/dashboard/user-logs/users-list');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Teacher', value: 'TEACHER' },
    { label: 'Student', value: 'STUDENT' }
  ];

  const statusOptions = [
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
    { label: 'Pending', value: 'PENDING' }
  ];

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500 gap-3">
        <Loader2 className="animate-spin text-brand-active" size={40} />
        <p className="font-medium">Fetching User Details...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Add User Account</h1>
          <p className="text-slate-500 mt-2">Create a new system user and assign appropriate roles and permissions.</p>
        </div>
        <button 
          onClick={() => navigate('/dashboard/user-logs/users-list')}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#F2EDE7] text-slate-700 rounded-xl font-semibold hover:bg-[#EAE2D8] transition-colors border border-[#E0D6C8]"
        >
          <ArrowLeft size={18} />
          Back to Users List
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Type/Role Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Type <span className="text-red-500">*</span></label>
              <SearchableDropdown
                options={roleOptions}
                value={formData.role}
                onChange={(val) => setFormData(prev => ({ ...prev, role: val }))}
                placeholder="Select Role"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Full Name <span className="text-red-500">*</span></label>
              <div className="relative group">
                <User size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  type="text"
                  placeholder="Full Name"
                  className={`w-full pl-12 pr-4 py-3 bg-white border rounded-xl outline-none transition-all shadow-sm
                    ${errors.name ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 hover:border-slate-300'}
                  `}
                />
              </div>
              {errors.name && <p className="text-xs text-red-500 font-medium pl-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email <span className="text-red-500">*</span></label>
              <div className="relative group">
                <Mail size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  type="email"
                  placeholder="Email"
                  className={`w-full pl-12 pr-4 py-3 bg-white border rounded-xl outline-none transition-all shadow-sm
                    ${errors.email ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 hover:border-slate-300'}
                  `}
                />
              </div>
              {errors.email && <p className="text-xs text-red-500 font-medium pl-1">{errors.email}</p>}
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Phone Number</label>
              <div className="relative group">
                <Phone size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  type="tel"
                  placeholder="Phone Number"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none transition-all shadow-sm focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 hover:border-slate-300"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">
                {isEditMode ? "New Password" : "Password"} { !isEditMode && <span className="text-red-500">*</span>}
              </label>
              <div className="relative group">
                <Lock size={18} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  type={showPassword ? "text" : "password"}
                  placeholder={isEditMode ? "Leave blank to keep current" : "Password"}
                  className={`w-full pl-12 pr-12 py-3 bg-white border rounded-xl outline-none transition-all shadow-sm
                    ${errors.password ? 'border-red-300 ring-4 ring-red-50' : 'border-slate-200 focus:border-brand-active focus:ring-4 focus:ring-brand-active/10 hover:border-slate-300'}
                  `}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 font-medium pl-1">{errors.password}</p>}
            </div>

            {/* Status Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Status <span className="text-red-500">*</span></label>
              <SearchableDropdown
                options={statusOptions}
                value={formData.status}
                onChange={(val) => setFormData(prev => ({ ...prev, status: val }))}
                placeholder="Select Status"
              />
            </div>
          </div>

          {/* Dynamic Teacher Permissions/Courses Section */}
          {formData.role === 'TEACHER' && (
            <div className="mt-12 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-active/10 rounded-xl flex items-center justify-center text-brand-active">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Course Assignment</h3>
                    <p className="text-sm text-slate-500">Assign specific courses that this teacher will manage.</p>
                  </div>
                </div>
                {formData.courseIds.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-full border border-green-100">
                    <CheckCircle2 size={14} />
                    {formData.courseIds.length} Courses Assigned
                  </div>
                )}
              </div>
              
              <div className="max-w-xl">
                <SearchableDropdown
                  options={courses}
                  value={formData.courseIds}
                  onChange={(val) => setFormData(prev => ({ ...prev, courseIds: val }))}
                  placeholder="Select Courses to Assign..."
                  label="Search & Select Courses"
                  isMulti={true}
                  error={errors.courses}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="mt-12 pt-8 border-t border-slate-100 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard/user-logs/users-list')}
              className="px-8 py-3.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 px-10 py-3.5 bg-brand-active text-white rounded-xl font-bold shadow-lg shadow-brand-active/20 hover:bg-brand-hover transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100
                ${loading ? "cursor-not-allowed" : ""}
              `}
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
              {isEditMode ? "Update Account" : "Save Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUser;
