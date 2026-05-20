import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { RefreshCcw, CheckCircle, XCircle, Clock, MapPin, FileSpreadsheet, FileText } from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

const statusStyle = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ABSENT: 'bg-red-50 text-red-600 border-red-200',
  LATE: 'bg-amber-50 text-amber-600 border-amber-200',
};

const AttendanceList = () => {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('Select a class and subject to view attendance.');

  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = loggedInUser?.role === 'STUDENT';
  const studentClass = isStudent ? (loggedInUser?.className || null) : null;

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const coursesResponse = await api.getCourses();
        setCourses(coursesResponse.courses || []);

        if (user?.role === 'STUDENT' && user?.className) {
          setSelectedClass(user.className);
          return;
        }

        setClasses(Array.from({ length: 10 }, (_, idx) => `Class ${idx + 1}`));
      } catch (err) {
        console.error('Failed to load attendance filters:', err);
        setError('Unable to load filters. Please refresh the page.');
      }
    };

    loadOptions();
  }, []);

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!selectedCourse || !selectedClass) {
        setAttendance([]);
        setInfo('Select a class and subject to view attendance.');
        return;
      }

      setLoading(true);
      setError('');
      setInfo('Loading attendance...');

      try {
        const result = await api.getAttendance({ courseId: selectedCourse, className: selectedClass });
        if (result.success) {
          let records = result.attendance || [];
          if (isStudent && loggedInUser?.id) {
            records = records.filter(r => r.studentId === loggedInUser.id);
          }
          setAttendance(records);
          setInfo(records.length > 0 ? '' : 'No attendance records found for the selected class and subject.');
        } else {
          setError(result.message || 'Failed to load attendance.');
          setAttendance([]);
        }
      } catch (err) {
        console.error('Attendance list fetch error:', err);
        setError(err.message || 'Failed to load attendance.');
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [selectedCourse, selectedClass]);

  const selectedSubject = courses.find((c) => String(c.id) === String(selectedCourse));

  const handleExportExcel = () => {
    if (attendance.length === 0) return;
    
    // Format the data for Excel
    const excelData = attendance.map((record, index) => ({
      'Sr No.': index + 1,
      'Student Name': record.student?.name || 'Unknown',
      'Email': record.student?.email || 'Unknown',
      'Date': new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
      'Marked At': record.markedAt ? new Date(record.markedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A',
      'Location': record.location || 'N/A',
      'Status': record.status,
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Define filename
    const subjectName = selectedSubject ? selectedSubject.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Subject';
    const className = selectedClass ? selectedClass.replace(/[^a-zA-Z0-9]/g, '_') : 'Class';
    const fileName = `Attendance_${className}_${subjectName}_${new Date().toISOString().split('T')[0]}.xlsx`;

    // Download file
    XLSX.writeFile(workbook, fileName);
  };

  const handleExportPDF = () => {
    if (attendance.length === 0) return;

    const doc = new jsPDF();
    
    // Header section
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Attendance Report', 14, 20);
    
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    
    const dateStr = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    doc.text(`Generated on: ${dateStr}`, 14, 28);
    doc.text(`Class: ${selectedClass || 'N/A'}`, 14, 34);
    doc.text(`Subject: ${selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'N/A'}`, 14, 40);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 45, 196, 45);

    // Table Headers
    const startX = 14;
    let startY = 55;
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(50);
    
    doc.text('#', startX, startY);
    doc.text('Student Name', startX + 10, startY);
    doc.text('Email', startX + 60, startY);
    doc.text('Date', startX + 115, startY);
    doc.text('Status', startX + 155, startY);
    
    doc.line(14, startY + 4, 196, startY + 4);
    
    startY += 10;
    doc.setFont('Helvetica', 'normal');
    
    attendance.forEach((record, index) => {
      // Page break check
      if (startY > 270) {
        doc.addPage();
        doc.setFont('Helvetica', 'bold');
        doc.text('#', startX, 20);
        doc.text('Student Name', startX + 10, 20);
        doc.text('Email', startX + 60, 20);
        doc.text('Date', startX + 115, 20);
        doc.text('Status', startX + 155, 20);
        doc.line(14, 24, 196, 24);
        
        startY = 32;
        doc.setFont('Helvetica', 'normal');
      }
      
      const name = record.student?.name || 'Unknown';
      const email = record.student?.email || 'Unknown';
      const date = new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      const status = record.status || 'N/A';
      
      doc.text(String(index + 1), startX, startY);
      
      const truncatedName = name.length > 22 ? name.substring(0, 20) + '..' : name;
      doc.text(truncatedName, startX + 10, startY);
      
      const truncatedEmail = email.length > 26 ? email.substring(0, 24) + '..' : email;
      doc.text(truncatedEmail, startX + 60, startY);
      
      doc.text(date, startX + 115, startY);
      
      // Color coding for status
      if (status === 'PRESENT') {
        doc.setTextColor(16, 124, 65);
      } else if (status === 'ABSENT') {
        doc.setTextColor(220, 53, 69);
      } else {
        doc.setTextColor(255, 193, 7);
      }
      doc.text(status, startX + 155, startY);
      doc.setTextColor(50); // reset
      
      startY += 8;
    });

    const subjectName = selectedSubject ? selectedSubject.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Subject';
    const className = selectedClass ? selectedClass.replace(/[^a-zA-Z0-9]/g, '_') : 'Class';
    const fileName = `Attendance_${className}_${subjectName}_${new Date().toISOString().split('T')[0]}.pdf`;
    
    doc.save(fileName);
  };

  return (
    <div className="space-y-6">

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Class filter: locked badge for students, dropdown for others */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</label>
          {isStudent ? (
            <div className="w-full rounded-lg border border-brand-dark/30 bg-brand-dark/5 px-4 py-2.5 text-sm font-semibold text-brand-dark flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              {studentClass || 'No class assigned'}
            </div>
          ) : (
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/15"
            >
              <option value="">Select class</option>
              {classes.map((className) => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 focus:border-brand-dark focus:ring-2 focus:ring-brand-dark/15"
          >
            <option value="">Select subject</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
            ))}
          </select>
        </div>

        <div className="space-y-2 xl:col-span-2">
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Selected Filters</label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <p><strong>Class:</strong> {selectedClass || 'Not selected'}</p>
            <p><strong>Subject:</strong> {selectedSubject ? `${selectedSubject.name} (${selectedSubject.code})` : 'Not selected'}</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Export Bar */}
      {!loading && attendance.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Attendance Summary</h4>
            <p className="text-xs text-slate-500 mt-0.5">Found {attendance.length} record(s) matching selected filters.</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
            >
              <FileSpreadsheet size={14} />
              Export to Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2.5 rounded-lg text-xs transition-all shadow-sm hover:shadow active:scale-[0.98] cursor-pointer"
            >
              <FileText size={14} />
              Export to PDF
            </button>
          </div>
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-500 flex flex-col items-center gap-4">
            <RefreshCcw size={32} className="animate-spin text-brand-active" />
            <p>Loading attendance records...</p>
          </div>
        ) : attendance.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <p>{info}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs">
                <th className="px-5 py-3.5 text-left">#</th>
                <th className="px-5 py-3.5 text-left">Student</th>
                <th className="px-5 py-3.5 text-left">Email</th>
                <th className="px-5 py-3.5 text-left">Date & Time</th>
                <th className="px-5 py-3.5 text-left">Location</th>
                <th className="px-5 py-3.5 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((record, index) => (
                <tr key={`${record.id}-${record.studentId}`} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500">{index + 1}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{record.student?.name || 'Unknown'}</td>
                  <td className="px-5 py-3.5 text-slate-500">{record.student?.email || 'Unknown'}</td>
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-700">
                      {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                    {record.markedAt && (
                      <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                        Marked at: {new Date(record.markedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-[220px]">
                    {record.location ? (
                      <div className="flex items-center gap-1.5 text-slate-700" title={record.location}>
                        <MapPin size={13} className="text-blue-500 shrink-0" />
                        <span className="truncate text-xs font-semibold">{record.location}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">N/A</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle[record.status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                      {record.status === 'PRESENT' ? <CheckCircle size={12} /> : record.status === 'ABSENT' ? <XCircle size={12} /> : <Clock size={12} />}
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AttendanceList;
