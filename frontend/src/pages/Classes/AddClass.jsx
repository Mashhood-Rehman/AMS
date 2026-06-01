import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, GraduationCap, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'react-toastify';
import SectionHeader from '../../components/constantComponents/SectionHeader';

const AddClass = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEditMode);
  const [name, setName] = useState('');
  const [sections, setSections] = useState(['A']);
  const [newSection, setNewSection] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isEditMode) {
      fetchClass();
    }
  }, [id]);

  const fetchClass = async () => {
    setFetching(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data.success) {
        const row = response.data.class;
        setName(row.name || '');
        setSections((row.sections || []).map((s) => s.name));
      }
    } catch (err) {
      toast.error('Failed to load class');
      navigate('/dashboard/classes/list');
    } finally {
      setFetching(false);
    }
  };

  const addSection = () => {
    const value = newSection.trim();
    if (!value) return;
    if (sections.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setErrors((prev) => ({ ...prev, sections: 'Section already added' }));
      return;
    }
    setSections((prev) => [...prev, value]);
    setNewSection('');
    setErrors((prev) => ({ ...prev, sections: '' }));
  };

  const removeSection = (index) => {
    setSections((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = 'Class name is required (e.g. Class 10, Grade 12)';
    if (sections.length === 0) next.sections = 'Add at least one section';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const url = isEditMode
        ? `${import.meta.env.VITE_API_URL}/classes/${id}`
        : `${import.meta.env.VITE_API_URL}/classes`;
      const method = isEditMode ? 'put' : 'post';
      const response = await axios[method](
        url,
        { name: name.trim(), sections },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      if (response.data.success) {
        toast.success(isEditMode ? 'Class updated' : 'Class created with sections');
        navigate('/dashboard/classes/list');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 size={40} className="animate-spin text-brand-active" />
        <p className="text-slate-500 font-medium">Loading class…</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      <SectionHeader
        title={isEditMode ? 'Edit Class & Sections' : 'Create Class & Sections'}
        subtitle="Each class can have multiple sections (A, B, Morning, etc.) for the same grade level."
        button={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-600 rounded-lg font-bold hover:bg-slate-200"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-1.5">
          <label className="block text-sm font-bold text-slate-700">
            Class name <span className="text-red-500">*</span>
          </label>
          <div className="relative group">
            <GraduationCap
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-active"
            />
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
              }}
              placeholder="e.g. Class 10, Grade 12, Year 1"
              className={`custom_input ${errors.name ? 'border-red-400' : ''}`}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 font-bold pl-2">{errors.name}</p>}
          <p className="text-xs text-slate-500 pl-1">
            Students and courses are assigned using the full label, e.g. &quot;Class 10 - Section A&quot;.
          </p>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-slate-700">
            Sections <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-slate-500">
            Add sections for this class. Common labels: A, B, C, or Morning, Afternoon.
          </p>

          <div className="flex flex-wrap gap-2">
            {sections.map((section, index) => (
              <span
                key={`${section}-${index}`}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-brand-active font-semibold text-sm border border-indigo-100"
              >
                Section {section}
                <button
                  type="button"
                  onClick={() => removeSection(index)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label={`Remove section ${section}`}
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-md">
            <input
              value={newSection}
              onChange={(e) => setNewSection(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSection();
                }
              }}
              placeholder="e.g. A or Morning"
              className="custom_input flex-1"
            />
            <button
              type="button"
              onClick={addSection}
              className="btn btn-cancel flex items-center gap-1 shrink-0"
            >
              <Plus size={16} />
              Add
            </button>
          </div>
          {errors.sections && (
            <p className="text-xs text-red-500 font-bold pl-2">{errors.sections}</p>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button type="submit" disabled={loading} className="btn btn-blue">
            {loading ? 'Saving…' : isEditMode ? 'Update Class' : 'Create Class'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddClass;
