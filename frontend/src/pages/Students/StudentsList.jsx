import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import CustomTable from '../../components/constantComponents/CustomTable';
import Icons from '../../assets/icons';
import { Eye, X, Mail } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../api';

const StudentsList = () => {
  const navigate = useNavigate();
  const userRole = JSON.parse(localStorage.getItem('user') || '{}').role;
  const isStudent = userRole === 'STUDENT';
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student Detail Modal States
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [studentSummary, setStudentSummary] = useState([]);
  const [customMessage, setCustomMessage] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);


  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const params = new URLSearchParams();
      params.append('role', 'STUDENT');
      if (isStudent && user.className) {
        params.append('className', user.className);
      }
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.data.success) {
        const filteredUsers = response.data.users.filter(u => u.id !== user.id);
        setStudents(filteredUsers);
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
        const response = await axios.delete(`${import.meta.env.VITE_API_URL}/users/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        if (response.data.success) {
          fetchStudents();
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete student';
        alert(message);
      }
    }
  };

  const handleOpenDetails = async (student) => {
    setSelectedStudent(student);
    setIsDetailsOpen(true);
    setDetailLoading(true);
    setStudentSummary([]);
    setCustomMessage(`Hi ${student.name},\n\nPlease review your attendance report. Your presence in lectures is vital for your success and course compliance.`);
    try {
      const res = await api.getStudentAttendanceSummary(student.id);
      if (res.success) {
        setStudentSummary(res.summary || []);
      } else {
        toast.error(res.message || 'Failed to load student attendance details.');
      }
    } catch (err) {
      console.error('Error loading student details:', err);
      toast.error('Failed to load student attendance summary.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSendManualEmail = async () => {
    if (!selectedStudent) return;
    setSendingEmail(true);
    try {
      const res = await api.sendManualAttendanceAlert({
        studentId: selectedStudent.id,
        customMessage
      });
      if (res.success) {
        toast.success(res.message || 'Manual warning email sent successfully!');
      } else {
        toast.error(res.message || 'Failed to send manual warning email.');
      }
    } catch (err) {
      console.error('Error sending manual email:', err);
      toast.error(err.message || 'Failed to send manual warning email.');
    } finally {
      setSendingEmail(false);
    }
  };

  const tableHeaders = [
    { key: 'name', label: 'Student Name' },
    { key: 'email', label: 'Email Address' },
    { key: 'phone', label: 'Phone', render: (val) => val || 'N/A' },

    {
      key: 'createdAt',
      label: 'Enrollment Date',
      render: (val) => new Date(val).toLocaleDateString()
    },
    ...(!isStudent ? [{
      key: 'actions',
      label: 'Actions',
      render: (_, item) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleOpenDetails(item)}
            className="p-1.5 bg-sky-50 text-sky-600 rounded-lg hover:bg-sky-500 hover:text-white transition-all shadow-sm border border-sky-100"
            title="View Details & Attendance"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Eye size={16} />
          </button>
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
    }] : [])
  ];

  return (
    <div className="">
      <SectionHeader
        title="Student Records"
        subtitle="View and manage student profiles."
        button={!isStudent ? (
          <button
            onClick={() => navigate('/dashboard/user-logs/add-user')}
            className="btn btn-blue"
          >
            Enroll Student
          </button>
        ) : null}
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

      {/* Student Details & Attendance Modal */}
      {isDetailsOpen && selectedStudent && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '16px',
        }} onClick={() => setIsDetailsOpen(false)}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
          }} onClick={(e) => e.stopPropagation()}>

            {/* Modal Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(to right, #f8fafc, #ffffff)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                    {selectedStudent.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                    Student profile & attendance summary
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDetailsOpen(false)}
                style={{
                  background: '#f1f5f9',
                  border: 'none',
                  borderRadius: '8px',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  color: '#64748b',
                  transition: 'all 0.2s',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

              {/* Profile Details Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
              }}>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Email Address</span>
                  <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500', wordBreak: 'break-all' }}>{selectedStudent.email}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Phone Number</span>
                  <span style={{ fontSize: '14px', color: '#334155', fontWeight: '500' }}>{selectedStudent.phone || 'N/A'}</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>Class Name</span>
                  <span style={{
                    fontSize: '13px',
                    color: '#0369a1',
                    fontWeight: '600',
                    backgroundColor: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    display: 'inline-block',
                    marginTop: '2px',
                  }}>{selectedStudent.className || 'N/A'}</span>
                </div>

              </div>

              {/* Attendance Summary List */}
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                  Course Attendance Performance
                </h4>

                {detailLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: '8px' }}>
                    <Icons.RefreshCcw className="animate-spin" style={{ color: '#0ea5e9' }} size={24} />
                    <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '500' }}>Calculating attendance rates...</span>
                  </div>
                ) : studentSummary.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 0', border: '1px dashed #cbd5e1', borderRadius: '12px', color: '#64748b' }}>
                    No enrolled courses or attendance records found for this student.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {studentSummary.map((item) => {
                      const isLow = item.rate < 80;
                      return (
                        <div key={item.courseId} style={{
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          backgroundColor: isLow ? '#fff5f5' : '#ffffff',
                          transition: 'all 0.2s',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                            <div>
                              <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#1e293b' }}>
                                {item.courseName}
                              </h5>
                              <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '500' }}>
                                Code: {item.courseCode} &bull; Instructor: {item.teacherName}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                fontSize: '16px',
                                fontWeight: '800',
                                color: isLow ? '#e11d48' : '#10b981',
                              }}>
                                {item.rate}%
                              </span>
                              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '500', marginTop: '2px' }}>
                                {item.present} / {item.expected} Classes
                              </div>
                            </div>
                          </div>

                          {/* Progress bar */}
                          <div style={{ width: '100%', height: '8px', backgroundColor: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                            <div style={{
                              width: `${Math.min(item.rate, 100)}%`,
                              height: '100%',
                              backgroundColor: isLow ? '#ef4444' : '#10b981',
                              borderRadius: '9999px',
                              transition: 'width 0.4s ease-in-out',
                            }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Manual Email Warning Dispatch */}
              {!isStudent && (
                <div style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700', color: '#334155', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                      Send Manual warning Notification
                    </h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: '1.4' }}>
                      Compose a direct notice to dispatch to the student's email inbox containing their live attendance record and your custom instruction.
                    </p>
                  </div>

                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Enter manual remarks or warnings for the student..."
                    disabled={sendingEmail}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      color: '#334155',
                      fontFamily: 'inherit',
                      outline: 'none',
                      resize: 'vertical',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0ea5e9'}
                    onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                  />

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                      onClick={handleSendManualEmail}
                      disabled={sendingEmail || detailLoading}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: '#0f172a',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: sendingEmail ? 'not-allowed' : 'pointer',
                        transition: 'background-color 0.2s',
                        boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.1)',
                      }}
                      onMouseOver={(e) => { if (!sendingEmail) e.currentTarget.style.backgroundColor = '#1e293b'; }}
                      onMouseOut={(e) => { if (!sendingEmail) e.currentTarget.style.backgroundColor = '#0f172a'; }}
                    >
                      <Mail size={16} />
                      {sendingEmail ? 'Dispatching Warning...' : 'Send Attendance Alert'}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsList;
