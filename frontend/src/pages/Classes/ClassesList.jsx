import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import CustomTable from '../../components/constantComponents/CustomTable';

const ClassesList = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/classes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data.success) {
        setClasses(
          (response.data.classes || []).map((row) => ({
            id: row.id,
            name: row.name,
            sections: (row.sections || []).map((s) => s.name).join(', '),
            sectionCount: (row.sections || []).length,
            sortOrder: row.sortOrder,
          }))
        );
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this class and all its sections? Students/courses still using these labels are not changed.')) {
      return;
    }
    try {
      const response = await axios.delete(`${import.meta.env.VITE_API_URL}/classes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.data.success) {
        toast.success('Class deleted');
        fetchClasses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete class');
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Class' },
    { key: 'sections', label: 'Sections' },
    { key: 'sectionCount', label: '# Sections' },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/classes/edit/${row.id}`);
            }}
            className="p-2 text-slate-400 hover:text-brand-active hover:bg-brand-active/5 rounded-lg transition-all"
            title="Edit class"
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row.id);
            }}
            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Delete class"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="animate-spin text-brand-active" size={36} />
        <p className="text-slate-500 font-medium">Loading classes…</p>
      </div>
    );
  }

  return (
    <CustomTable
      tableHeaders={tableHeaders}
      tableData={classes}
      showSearch
      showDownload
      showPagination
    />
  );
};

export default ClassesList;
