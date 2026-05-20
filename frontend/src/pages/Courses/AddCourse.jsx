import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Save,
  BookOpen,
  Hash,
  Loader2,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  ChevronDown
} from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const AddCourse = ({ courseId: propCourseId, onSuccess: propOnSuccess }) => {
  const { id: paramId } = useParams();
  const navigate = useNavigate();
  const courseId = propCourseId || (paramId ? parseInt(paramId) : null);
  const onSuccess = propOnSuccess || (() => navigate(-1));
  const isEditMode = !!courseId;

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    className: '',
    days: [],
    time: ''
  });

  const [useDifferentTimes, setUseDifferentTimes] = useState(false);
  const [dayTimes, setDayTimes] = useState({});

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const staticClasses = [
  'Class 1',
  'Class 2',
  'Class 3',
  'Class 4',
  'Class 5',
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
];
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
const [instituteClasses] = useState(staticClasses);  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);


  useEffect(() => {
    if (isEditMode) {
      fetchCourseDetails();
    } else {
      setFormData({ name: '', code: '', className: '', days: [], time: '' });
      setUseDifferentTimes(false);
      setDayTimes({});
      setFetching(false);
    }
  }, [courseId]);

  const fetchCourseDetails = async () => {
    setFetching(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const course = response.data.course;
        let isJson = false;
        let parsedDayTimes = {};
        try {
          if (course.time && course.time.startsWith('{')) {
            parsedDayTimes = JSON.parse(course.time);
            isJson = true;
          }
        } catch (e) {
          console.error('Failed to parse day-specific times', e);
        }

        setFormData({
          name: course.name,
          code: course.code,
          className: course.className || '',
          days: course.days || [],
          time: isJson ? '' : (course.time || '')
        });
        setUseDifferentTimes(isJson);
        setDayTimes(parsedDayTimes);
      }
    } catch (err) {
      setError('Failed to fetch course details');
    } finally {
      setFetching(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleDayTimeChange = (day, value) => {
    setDayTimes(prev => ({
      ...prev,
      [day]: value
    }));
    if (error) setError('');
  };

  const toggleDay = (day) => {
    setFormData(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.code) {
      setError('Please fill in all mandatory fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/courses/${courseId}`
        : `${import.meta.env.VITE_API_URL}/courses`;

      const method = isEditMode ? 'put' : 'post';

      let finalTime = formData.time;
      if (useDifferentTimes && formData.days.length > 0) {
        const filteredDayTimes = {};
        formData.days.forEach(day => {
          filteredDayTimes[day] = dayTimes[day] || '';
        });

        // Validate that each active teaching day has a custom start time
        const missingTime = formData.days.some(day => !filteredDayTimes[day]);
        if (missingTime) {
          setError('Please specify a start time for all selected teaching days.');
          setLoading(false);
          return;
        }

        finalTime = JSON.stringify(filteredDayTimes);
      } else {
        if (!formData.time) {
          setError('Please specify a start time.');
          setLoading(false);
          return;
        }
      }

      const payload = {
        ...formData,
        time: finalTime,
      };

      const response = await axios[method](url, payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess && onSuccess();
        }, 1500);
      }
    } catch (err) {
      console.error('Course create error response:', err.response);
      console.error('Course create error object:', err);
      const msg = err.response?.data?.error || err.response?.data?.message || 'Something went wrong';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-active" />
        <p className="text-slate-500 font-medium tracking-tight">Loading details...</p>
      </div>
    );
  }

  return (
    <div>
      <div>
        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50/30 rounded-lg border border-slate-100">
          <SectionHeader
            title={isEditMode ? 'Update Academic Course' : 'Create New Course'}
            subtitle={isEditMode ? 'Modify course name and code.' : 'Register a new academic curriculum.'}
          />

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg flex items-center gap-3 text-sm font-medium animate-shake">
              <XCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg flex items-center gap-3 text-sm font-medium">
              <CheckCircle2 size={18} />
              Course {isEditMode ? 'updated' : 'created'} successfully!
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Course Name */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Course Name</label>
              <div className="relative group">
                <BookOpen size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g. Advanced Mathematics"
                  className="custom_input"
                />
              </div>
            </div>

            {/* Course Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-bold text-slate-700 ml-1">Course Code</label>
              <div className="relative group">
                <Hash size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <input
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  placeholder="e.g. MATH-401"
                  className="custom_input"
                />
              </div>
            </div>

            {/* Class Assignment */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Assigned To Class</label>
              <div className="relative group">
                <LayoutGrid size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active transition-colors" />
                <select
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  className="custom_input pl-12 appearance-none"
                >
                  <option value="">Select Class...</option>
                  {instituteClasses.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ChevronDown size={18} />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium ml-1">This course will be visible to all students in the selected class.</p>
            </div>

            {/* Schedule Days */}
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">Teaching Days</label>
              <div className="flex flex-wrap gap-2">
                {daysOfWeek.map(day => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${formData.days.includes(day)
                      ? 'bg-brand-active text-white border-brand-active shadow-sm'
                      : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                      }`}
                  >
                    {day}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle: Use different times per day */}
            {formData.days.length > 0 && (
              <div className="md:col-span-2 flex items-center gap-2.5 px-1 py-1">
                <input
                  type="checkbox"
                  id="useDifferentTimes"
                  checked={useDifferentTimes}
                  onChange={(e) => {
                    setUseDifferentTimes(e.target.checked);
                    if (error) setError('');
                  }}
                  className="h-4.5 w-4.5 rounded border-slate-300 text-brand-active focus:ring-brand-active cursor-pointer"
                />
                <label htmlFor="useDifferentTimes" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
                  Set different start times for each teaching day
                </label>
              </div>
            )}

            {/* Teaching Time(s) */}
            {useDifferentTimes && formData.days.length > 0 ? (
              <div className="md:col-span-2 space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60 animate-fade-in">
                <label className="block text-sm font-bold text-slate-700 ml-0.5">Start Times per Day</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formData.days.map(day => (
                    <div key={day} className="flex items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 hover:border-slate-300 transition-all shadow-sm">
                      <span className="text-xs font-extrabold text-slate-600">{day}</span>
                      <input
                        type="time"
                        value={dayTimes[day] || ''}
                        onChange={(e) => handleDayTimeChange(day, e.target.value)}
                        className="custom_input py-1.5 px-3 max-w-[130px]"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-medium ml-0.5">Specify a custom time for each day the class is taught.</p>
              </div>
            ) : (
              <div className="space-y-1.5 md:col-span-2">
                <label className="block text-sm font-bold text-slate-700 ml-1">Start Time</label>
                <div className="relative group">
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    className="custom_input"
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-medium ml-1">Specify the time this class usually starts.</p>
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onSuccess && onSuccess()}
              className="btn btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="btn btn-blue"
            >
              {loading ? "Processing..." : (isEditMode ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCourse;
