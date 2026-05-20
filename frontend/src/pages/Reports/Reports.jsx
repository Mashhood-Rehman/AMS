import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import {
  FileText,
  Download,
  Printer,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  BookOpen,
  Search,
  RefreshCcw,
  Info,
  RefreshCw,
  Mail
} from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const getStatusStyles = (status) => {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    border: '1px solid',
    fontSize: '10px',
    fontWeight: 'bold'
  };
  if (status === 'PRESENT') {
    return { ...base, color: '#059669', backgroundColor: '#ecfdf5', borderColor: '#d1fae5' };
  } else if (status === 'ABSENT') {
    return { ...base, color: '#e11d48', backgroundColor: '#fff1f2', borderColor: '#ffe4e6' };
  } else if (status === 'LATE') {
    return { ...base, color: '#d97706', backgroundColor: '#fffbeb', borderColor: '#fef3c7' };
  }
  return base;
};

const getRateBadgeStyles = (rate) => {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold'
  };
  if (rate >= 90) {
    return { ...base, backgroundColor: '#d1fae5', color: '#065f46' };
  } else if (rate >= 75) {
    return { ...base, backgroundColor: '#fef3c7', color: '#92400e' };
  } else {
    return { ...base, backgroundColor: '#ffe4e6', color: '#9f1239' };
  }
};


const statusShort = {
  PRESENT: 'P',
  ABSENT: 'A',
  LATE: 'L',
};

const parseLocalDate = (dateStr) => {
  if (!dateStr) return null;
  const dateOnly = dateStr.split('T')[0];
  const [y, m, d] = dateOnly.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const countExpectedClasses = (courseDays, startStr, endStr) => {
  if (!courseDays || !courseDays.length || !startStr || !endStr) return 0;

  const start = parseLocalDate(startStr);
  const end = parseLocalDate(endStr);

  if (!start || !end || start > end) return 0;

  let count = 0;
  const current = new Date(start);

  const daysMap = {
    'Sunday': 0,
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6
  };

  const targetDayIndices = courseDays.map(d => daysMap[d]).filter(idx => idx !== undefined);

  while (current <= end) {
    if (targetDayIndices.includes(current.getDay())) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
};

const Reports = () => {
  const [courses, setCourses] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Date states
  const [reportType, setReportType] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'custom'
  const [singleDate, setSingleDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // Data states
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sendingAlerts, setSendingAlerts] = useState(false);

  const triggerLowAttendanceAlerts = async () => {
    if (!selectedCourse || !selectedClass) {
      toast.info('Please select a subject and class first.');
      return;
    }

    const today = new Date();
    const currentDay = today.getDate();

    let bypassDateCheck = false;
    if (currentDay !== 25) {
      const confirmBypass = window.confirm(
        `Low attendance warnings are officially configured to send only on the 25th day of the month (today is day ${currentDay}).\n\nWould you like to bypass this restriction for testing or custom grading purposes?`
      );
      if (!confirmBypass) return;
      bypassDateCheck = true;
    } else {
      const confirmSend = window.confirm(
        `Are you sure you want to run the low-attendance alert system for ${selectedClass} in this subject? Warning emails will be dispatched to all active students with less than 80% monthly attendance.`
      );
      if (!confirmSend) return;
    }

    setSendingAlerts(true);
    try {
      const res = await api.sendLowAttendanceAlerts({
        courseId: parseInt(selectedCourse),
        className: selectedClass,
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        bypassDateCheck
      });

      if (res.success) {
        toast.success(res.message);
      } else {
        toast.error(res.message || 'Failed to dispatch alert emails.');
      }
    } catch (err) {
      console.error('Failed to trigger low-attendance alerts:', err);
      toast.error(err?.message || 'Internal server error running low attendance system.');
    } finally {
      setSendingAlerts(false);
    }
  };

  // Logged-in user information
  const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isStudent = loggedInUser?.role === 'STUDENT';
  const studentClass = isStudent ? (loggedInUser?.className || null) : null;

  // Load courses and classes on component mount
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const coursesResponse = await api.getCourses();
        setCourses(coursesResponse.courses || []);

        if (isStudent) {
          setSelectedClass(studentClass || '');
          return;
        }

        // Admins and teachers should always see 10 fixed class options
        setClasses(Array.from({ length: 10 }, (_, idx) => `Class ${idx + 1}`));
      } catch (err) {
        console.error('Failed to load report options:', err);
        setError('Failed to load filter choices. Please refresh.');
      }
    };

    loadOptions();
  }, []);

  // Set default dates/month on reportType changes
  useEffect(() => {
    const today = new Date();
    if (reportType === 'daily') {
      setSingleDate(today.toISOString().split('T')[0]);
    } else if (reportType === 'weekly') {
      // Find Monday of current week
      const day = today.getDay();
      const diff = today.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(today.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);

      setStartDate(monday.toISOString().split('T')[0]);
      setEndDate(sunday.toISOString().split('T')[0]);
    } else if (reportType === 'monthly') {
      const year = selectedYear;
      const month = selectedMonth;
      const firstDay = new Date(year, month - 1, 1);
      const lastDay = new Date(year, month, 0);

      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
    }
  }, [reportType, selectedMonth, selectedYear]);

  // Generate Report / Fetch Data
  const generateReport = async () => {
    if (!selectedCourse) {
      toast.info('Please select a subject to generate report');
      return;
    }
    if (!selectedClass) {
      toast.info('Please select a class to generate report');
      return;
    }

    setLoading(true);
    setError('');

    // Resolve start/end dates
    let fetchStart = startDate;
    let fetchEnd = endDate;

    if (reportType === 'daily') {
      fetchStart = singleDate;
      fetchEnd = singleDate;
    }

    try {
      // 1. Fetch all students in the class (if not student role)
      let studentsList = [];
      if (isStudent) {
        studentsList = [loggedInUser];
      } else {
        const usersResponse = await api.getUsers({ role: 'STUDENT', className: selectedClass });
        studentsList = usersResponse.users || [];
      }
      setStudents(studentsList);

      // 2. Fetch attendance records in the range
      const queryParams = {
        courseId: selectedCourse,
        className: selectedClass,
        startDate: fetchStart,
        endDate: fetchEnd,
        limit: 5000 // Ensure we get all records in one go
      };

      const attendanceResponse = await api.getAttendance(queryParams);

      if (attendanceResponse.success) {
        let records = attendanceResponse.attendance || [];
        if (isStudent) {
          records = records.filter(r => r.studentId === loggedInUser.id);
        }
        setAttendanceRecords(records);

        if (records.length === 0) {
          toast.info('No attendance records found for this period');
        } else {
          toast.success(`Successfully analyzed ${records.length} records`);
        }
      } else {
        setError(attendanceResponse.message || 'Failed to fetch attendance data.');
      }
    } catch (err) {
      console.error('Failed to generate report:', err);
      setError(err.message || 'An error occurred while generating the report.');
    } finally {
      setLoading(false);
    }
  };

  // Helper: Format date for headers
  const formatDateLabel = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
  };

  // Helper: get ISO date string without time
  const getLocalDateKey = (isoDateStr) => {
    return isoDateStr.split('T')[0];
  };

  // Process data for presentation
  const processedData = React.useMemo(() => {
    if (!students.length) return { studentStats: [], uniqueDates: [], expectedClasses: 0 };

    // Get all unique dates with recorded attendance, sorted ascending
    const dateSet = new Set();
    attendanceRecords.forEach(rec => {
      dateSet.add(getLocalDateKey(rec.date));
    });
    const uniqueDates = Array.from(dateSet).sort();

    // Map records for quick student lookup: { studentId: { dateKey: record } }
    const recordsMap = {};
    attendanceRecords.forEach(rec => {
      if (!recordsMap[rec.studentId]) {
        recordsMap[rec.studentId] = {};
      }
      recordsMap[rec.studentId][getLocalDateKey(rec.date)] = rec;
    });

    // Resolve active date range
    const activeStart = reportType === 'daily' ? singleDate : startDate;
    const activeEnd = reportType === 'daily' ? singleDate : endDate;

    // Get course days and clamp expected sessions by course creation date
    const courseObj = courses.find(c => String(c.id) === String(selectedCourse));
    const courseDays = courseObj?.days || [];
    const courseCreatedDate = courseObj?.createdAt ? parseLocalDate(courseObj.createdAt) : null;
    const reportStartDate = parseLocalDate(activeStart);
    const reportEndDate = parseLocalDate(activeEnd);
    let effectiveStartDate = reportStartDate;

    if (courseCreatedDate && reportStartDate && courseCreatedDate > reportStartDate) {
      effectiveStartDate = courseCreatedDate;
    }

    const expectedClasses =
      courseDays.length && effectiveStartDate && reportEndDate && (!courseCreatedDate || courseCreatedDate <= reportEndDate)
        ? countExpectedClasses(courseDays, effectiveStartDate.toISOString().split('T')[0], activeEnd)
        : 0;

    // Generate stats for each student
    const studentStats = students.map(student => {
      const studentRecs = recordsMap[student.id] || {};
      let present = 0;
      let absent = 0;
      let late = 0;

      uniqueDates.forEach(date => {
        const record = studentRecs[date];
        if (record) {
          if (record.status === 'PRESENT') present++;
          else if (record.status === 'ABSENT') absent++;
          else if (record.status === 'LATE') late++;
        }
      });

      const rate = expectedClasses > 0 ? Math.round(((present + late) / expectedClasses) * 100) : 0;

      return {
        ...student,
        present,
        absent,
        late,
        total: expectedClasses,
        rate,
        records: studentRecs
      };
    }).sort((a, b) => b.rate - a.rate); // Sort by attendance rate descending

    return { studentStats, uniqueDates, expectedClasses };
  }, [students, attendanceRecords, reportType, singleDate, startDate, endDate, courses, selectedCourse]);

  // Filter students based on search query
  const filteredStudentStats = processedData.studentStats.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate General Overview Stats
  const overviewStats = React.useMemo(() => {
    const statsList = processedData.studentStats;
    if (!statsList.length) return { avgRate: 0, sessions: 0, expected: 0, atRisk: 0, totalRecords: 0 };

    let totalRateSum = 0;
    let atRiskCount = 0;
    let totalPresent = 0;
    let totalLate = 0;
    let totalAbsent = 0;

    statsList.forEach(s => {
      totalRateSum += s.rate;
      if (s.total > 0 && s.rate < 75) {
        atRiskCount++;
      }
      totalPresent += s.present;
      totalLate += s.late;
      totalAbsent += s.absent;
    });

    const avgRate = statsList.length > 0 ? Math.round(totalRateSum / statsList.length) : 0;
    const expectedClasses = processedData.expectedClasses || 0;

    return {
      avgRate,
      sessions: processedData.uniqueDates.length,
      expected: expectedClasses,
      atRisk: atRiskCount,
      totalRecords: totalPresent + totalLate + totalAbsent
    };
  }, [processedData]);

  // Export to CSV Function
  const exportToCSV = () => {
    if (!filteredStudentStats.length) {
      toast.error('No data to export');
      return;
    }

    const courseObj = courses.find(c => String(c.id) === String(selectedCourse));
    const courseName = courseObj ? courseObj.name : 'Subject';
    const dates = processedData.uniqueDates;

    // Build headers
    const headers = ['Student Name', 'Email', 'Class', ...dates.map(d => formatDateLabel(d)), 'Present', 'Absent', 'Total Days', 'Attendance Rate (%)'];

    // Build rows
    const rows = filteredStudentStats.map(student => {
      const dateRecords = dates.map(date => {
        const record = student.records[date];
        return record ? record.status : '-';
      });

      return [
        student.name,
        student.email,
        selectedClass,
        ...dateRecords,
        student.present,
        student.absent,
        student.total,
        `${student.rate}%`
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${selectedClass.replace(' ', '_')}_${courseName.replace(' ', '_')}_${reportType}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully!');
  };

  // Generate and Download PDF Report
  const downloadPDF = async () => {
    if (!filteredStudentStats.length) {
      toast.error('No data to export to PDF');
      return;
    }

    const toastId = toast.loading('Generating high-quality PDF report...');

    try {
      const courseObj = courses.find(c => String(c.id) === String(selectedCourse));
      const courseName = courseObj ? courseObj.name : 'Subject';

      const printArea = document.getElementById('report-print-area');
      if (!printArea) {
        throw new Error('Report container not found');
      }

      const noPrintElements = printArea.querySelectorAll('.no-print');
      const hiddenElements = [];
      noPrintElements.forEach(el => {
        hiddenElements.push({ el, display: el.style.display });
        el.style.display = 'none';
      });

      const printHeader = printArea.querySelector('.print-header-pdf');
      const headerDisplay = printHeader ? printHeader.style.display : null;
      if (printHeader) {
        printHeader.style.display = 'block';
      }

      const scrollContainers = printArea.querySelectorAll('.overflow-x-auto');
      const originalScrollStyles = [];
      scrollContainers.forEach(container => {
        originalScrollStyles.push({
          el: container,
          overflowX: container.style.overflowX,
          width: container.style.width,
          maxWidth: container.style.maxWidth,
        });
        container.style.overflowX = 'visible';
        container.style.width = 'auto';
        container.style.maxWidth = 'none';
      });

      const A4_PX_WIDTH = 794;
      const savedWidth = printArea.style.width;
      const savedMinWidth = printArea.style.minWidth;
      const savedMaxWidth = printArea.style.maxWidth;
      printArea.style.width = `${A4_PX_WIDTH}px`;
      printArea.style.minWidth = `${A4_PX_WIDTH}px`;
      printArea.style.maxWidth = `${A4_PX_WIDTH}px`;

      await new Promise(resolve => setTimeout(resolve, 200));

      const canvas = await html2canvas(printArea, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: Math.max(printArea.scrollWidth, A4_PX_WIDTH),
        scrollX: -window.scrollX,
        scrollY: -window.scrollY,
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        throw new Error('Generated canvas is empty');
      }

      printArea.style.width = savedWidth;
      printArea.style.minWidth = savedMinWidth;
      printArea.style.maxWidth = savedMaxWidth;

      hiddenElements.forEach(({ el, display }) => {
        el.style.display = display;
      });
      originalScrollStyles.forEach(({ el, overflowX, width, maxWidth }) => {
        el.style.overflowX = overflowX;
        el.style.width = width;
        el.style.maxWidth = maxWidth;
      });
      if (printHeader && headerDisplay !== null) {
        printHeader.style.display = headerDisplay;
      }

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, '', 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`Attendance_Report_${selectedClass.replace(/\s+/g, '_')}_${courseName.replace(/\s+/g, '_')}_${reportType}.pdf`);
      toast.update(toastId, {
        render: 'PDF Report downloaded successfully!',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      });
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.update(toastId, {
        render: `Failed to generate PDF: ${err.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 4000,
      });
    }
  };

  const selectedCourseDetails = courses.find(c => String(c.id) === String(selectedCourse));

  return (
    <div id="report-print-area" style={{ display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      {/* Actionable styling for standard web browser printing */}
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, nav, header, button, .no-print {
            display: none !important;
          }
          .print-full-width {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
          .print-header-pdf {
            display: block !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>

      <div className="no-print">
        <SectionHeader
          title="Attendance & Analytics Reports"
          subtitle="Generate, review, print or export student attendance reports."
        />
      </div>

      {/* Printable Report Header */}
      <div 
        className="print-header-pdf" 
        style={{
          display: 'none',
          borderBottom: '2px solid #cbd5e1',
          paddingBottom: '16px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Attendance Analytics Report
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', marginTop: '4px', fontWeight: '500' }}>
              Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
              AMS Attendance System
            </h2>
            <p style={{ fontSize: '11px', color: '#64748b', margin: 0, fontWeight: '500' }}>
              Institution Management Portal
            </p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e2e8f0', fontSize: '13px', color: '#334155' }}>
          <div><strong>Subject/Course:</strong> {selectedCourseDetails ? `${selectedCourseDetails.name} (${selectedCourseDetails.code})` : 'N/A'}</div>
          <div><strong>Target Class:</strong> {selectedClass || 'N/A'}</div>
          <div>
            <strong>Date Range:</strong> {
              reportType === 'daily' ? singleDate :
                `${formatDateLabel(startDate)} to ${formatDateLabel(endDate)}`
            }
          </div>
        </div>
      </div>

      {/* Filter and Selection Section */}
      <div 
        className="no-print" 
        style={{
          backgroundColor: '#ffffff',
          padding: '24px',
          borderRadius: '16px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* Class Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Class</label>
            {isStudent ? (
              <div style={{ width: '100%', borderRadius: '8px', border: '1px solid rgba(30, 41, 59, 0.3)', backgroundColor: 'rgba(30, 41, 59, 0.05)', padding: '10px 16px', fontSize: '14px', fontWeight: '600', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                {studentClass || 'No class assigned'}
              </div>
            ) : (
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '8px 12px', fontSize: '14px', color: '#1e293b', outline: 'none', cursor: 'pointer' }}
              >
                <option value="">Select class</option>
                {classes.map((className) => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            )}
          </div>

          {/* Subject Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Subject</label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '8px 12px', fontSize: '14px', color: '#1e293b', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Select subject</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.name} ({course.code})</option>
              ))}
            </select>
          </div>

          {/* Report Type Select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Frequency</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{ width: '100%', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '8px 12px', fontSize: '14px', color: '#1e293b', outline: 'none', cursor: 'pointer' }}
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Report Action Trigger */}
          <div style={{ display: 'flex', alignItems: 'end' }}>
            <button
              onClick={generateReport}
              disabled={loading}
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyStyle: 'center', gap: '8px', backgroundColor: '#1e293b', color: '#ffffff', fontWeight: '600', padding: '10px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  Generating...
                </>
              ) : (
                <>
                  <FileText size={16} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dynamic Date Filter Inputs */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid #cbd5e1', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px' }}>
          {reportType === 'daily' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Date</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={16} style={{ color: '#94a3b8' }} />
                <input
                  type="date"
                  value={singleDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '6px 12px', fontSize: '12px', color: '#334155', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {reportType === 'weekly' && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date (Monday)</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '6px 12px', fontSize: '12px', color: '#334155', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date (Sunday)</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '6px 12px', fontSize: '12px', color: '#334155', outline: 'none' }}
                />
              </div>
            </div>
          )}

          {reportType === 'monthly' && (
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Month</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '6px 12px', fontSize: '12px', color: '#334155', cursor: 'pointer', outline: 'none' }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2026, i, 1).toLocaleDateString('en-US', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select Year</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '6px 12px', fontSize: '12px', color: '#334155', cursor: 'pointer', outline: 'none' }}
                >
                  <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                  <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                </select>
              </div>
            </div>
          )}

          {reportType === 'custom' && (
            <div style={{ display: 'flex', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Start Date</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '6px 12px', fontSize: '12px', color: '#334155', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>End Date</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', padding: '6px 12px', fontSize: '12px', color: '#334155', outline: 'none' }}
                />
              </div>
            </div>
          )}

          <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Info size={14} style={{ color: '#94a3b8' }} />
            <span>Generate report after picking criteria.</span>
          </div>
        </div>
      </div>

      {error && (
        <div 
          className="no-print" 
          style={{
            borderRadius: '12px',
            border: '1px solid #fecaca',
            backgroundColor: '#fef2f2',
            padding: '12px 16px',
            fontSize: '14px',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Analytics Summary Cards (Only show when data exists) */}
      {processedData.studentStats.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Avg Attendance */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Avg. Attendance</span>
              <TrendingUp size={16} style={{ color: '#10b981' }} />
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{overviewStats.avgRate}%</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>rate</span>
            </div>
            <div style={{ marginTop: '4px', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '9999px', height: '4px' }}>
              <div
                style={{ backgroundColor: '#10b981', height: '4px', borderRadius: '9999px', width: `${overviewStats.avgRate}%`, transition: 'width 0.5s ease' }}
              />
            </div>
          </div>

          {/* Expected Classes */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Expected Classes</span>
              <Calendar size={16} style={{ color: '#3b82f6' }} />
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{overviewStats.expected}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>classes</span>
            </div>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500', marginTop: '4px', marginBottom: 0 }}>based on course schedule</p>
          </div>

          {/* At-Risk Students */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>At-Risk Students</span>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#ef4444' }}>{overviewStats.atRisk}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>students</span>
            </div>
            <p style={{ fontSize: '10px', color: '#ef4444', fontWeight: '500', marginTop: '4px', marginBottom: 0 }}>attendance below 75%</p>
          </div>

          {/* Active Students */}
          <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '100px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Students</span>
              <Users size={16} style={{ color: '#6366f1' }} />
            </div>
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0f172a' }}>{processedData.studentStats.length}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500' }}>enrolled</span>
            </div>
            <p style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500', marginTop: '4px', marginBottom: 0 }}>in this class</p>
          </div>
        </div>
      )}

      {/* Main Attendance Matrix Grid Card */}
      <div 
        className="print-full-width" 
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #cbd5e1',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          overflow: 'hidden'
        }}
      >
        {/* Table Controls (Search & Export) */}
        {processedData.studentStats.length > 0 && (
          <div 
            className="no-print" 
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #cbd5e1',
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'rgba(248, 250, 252, 0.5)'
            }}
          >
            {/* Student Search */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <Search size={14} style={{ position: 'absolute', left: '12px', top: '10px', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', paddingLeft: '36px', paddingRight: '16px', paddingTop: '8px', paddingBottom: '8px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', outline: 'none' }}
              />
            </div>

            {/* Export & Print */}
            <div style={{ display: 'flex', gap: '8px', width: 'auto' }}>
              <button
                onClick={exportToCSV}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', color: '#334155', fontWeight: '600', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}
              >
                <Download size={14} />
                Export CSV
              </button>
              <button
                onClick={downloadPDF}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', backgroundColor: '#1e293b', color: '#ffffff', fontWeight: '600', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', border: 'none', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              >
                <FileText size={14} />
                Save PDF Report
              </button>
              {!isStudent && reportType === 'monthly' && (
                <button
                  onClick={triggerLowAttendanceAlerts}
                  disabled={sendingAlerts}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    backgroundColor: '#fff5f5',
                    color: '#c53030',
                    border: '1px solid #feb2b2',
                    fontWeight: '600',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    cursor: sendingAlerts ? 'not-allowed' : 'pointer',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!sendingAlerts) {
                      e.currentTarget.style.backgroundColor = '#fed7d7';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!sendingAlerts) {
                      e.currentTarget.style.backgroundColor = '#fff5f5';
                    }
                  }}
                >
                  <Mail size={14} style={{ color: '#c53030' }} />
                  {sendingAlerts ? 'Sending Alerts...' : 'Alert Low Attendance'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* The Grid / Table Wrapper */}
        {loading ? (
          <div style={{ padding: '96px 0', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite', color: '#6366f1' }} />
            <p style={{ fontWeight: 'semibold', color: '#475569', fontSize: '14px', margin: 0 }}>Processing and generating attendance reports...</p>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Fetching large datasets, pivoting records and validating metrics</p>
          </div>
        ) : processedData.studentStats.length === 0 ? (
          <div style={{ padding: '96px 0', textAlign: 'center', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', gap: '12px' }}>
            <div style={{ width: '56px', height: '56px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)' }}>
              <FileText size={24} />
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#475569', margin: '8px 0 0 0' }}>No Reports Generated Yet</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '380px', margin: 0 }}>Select a course and class above, specify a date range, and click "Generate Report".</p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', color: '#64748b', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '10px' }}>
                  <th style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', fontSize: '10px', borderRight: '1px solid #cbd5e1', position: 'sticky', left: 0, zIndex: 10 }}># Student</th>
                  <th style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', fontSize: '10px', borderRight: '1px solid #cbd5e1' }}>Email</th>

                  {/* Dynamic Date Columns */}
                  {processedData.uniqueDates.map(date => (
                    <th key={date} style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', minWidth: '60px', borderRight: '1px solid #cbd5e1' }}>
                      {formatDateLabel(date)}
                    </th>
                  ))}

                  {/* Summary Metric Headers */}
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', backgroundColor: '#ecfdf5', color: '#065f46' }}>P</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', backgroundColor: '#fff1f2', color: '#9f1239' }}>A</th>
                  <th style={{ padding: '12px 16px', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', backgroundColor: '#eff6ff', color: '#1e40af' }}>Expected</th>
                  <th style={{ padding: '12px 16px', backgroundColor: '#f8fafc', borderBottom: '2px solid #cbd5e1', fontWeight: 'bold', fontSize: '10px', textAlign: 'center', borderLeft: '1px solid #cbd5e1', color: '#1e293b' }}>Rate</th>
                </tr>
              </thead>
              <tbody style={{ borderTop: 'none' }}>
                {filteredStudentStats.length === 0 ? (
                  <tr>
                    <td colSpan={6 + processedData.uniqueDates.length} style={{ padding: '48px', textAlign: 'center', color: '#94a3b8' }}>
                      No matching students found.
                    </td>
                  </tr>
                ) : (
                  filteredStudentStats.map((student, idx) => (
                    <tr key={student.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      {/* Student info sticky column */}
                      <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#1e293b', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #cbd5e1', position: 'sticky', left: 0, backgroundColor: '#ffffff', zIndex: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: '500', width: '16px' }}>{idx + 1}</span>
                          <div>
                            <div style={{ color: '#1e293b', fontWeight: 'bold' }}>{student.name}</div>
                          </div>
                        </div>
                      </td>

                      {/* Student Email */}
                      <td style={{ padding: '12px 16px', color: '#64748b', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #cbd5e1' }}>
                        {student.email}
                      </td>

                      {/* Dynamic Date Records */}
                      {processedData.uniqueDates.map(date => {
                        const rec = student.records[date];
                        return (
                          <td key={date} style={{ padding: '12px 8px', borderBottom: '1px solid #f1f5f9', borderRight: '1px solid #cbd5e1', textAlign: 'center' }}>
                            {rec ? (
                              <span
                                title={`${student.name} - ${formatDateLabel(date)}: ${rec.status}`}
                                style={getStatusStyles(rec.status)}
                              >
                                {statusShort[rec.status]}
                              </span>
                            ) : (
                              <span style={{ color: '#cbd5e1', fontWeight: 'bold' }}>-</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Summarized Counts */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', color: '#059669', backgroundColor: 'rgba(236, 253, 245, 0.4)', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #cbd5e1' }}>
                        {student.present}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', color: '#e11d48', backgroundColor: 'rgba(255, 241, 242, 0.4)', borderBottom: '1px solid #f1f5f9' }}>
                        {student.absent}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 'bold', color: '#1e40af', backgroundColor: 'rgba(239, 246, 255, 0.4)', borderBottom: '1px solid #f1f5f9' }}>
                        {student.total}
                      </td>

                      {/* Attendance Percentage Indicator */}
                      <td style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #cbd5e1', backgroundColor: '#f8fafc', position: 'sticky', right: 0, zIndex: 10 }}>
                        <span style={getRateBadgeStyles(student.rate)}>
                          {student.rate}%
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Guide/Legend Details Footer */}
      {processedData.studentStats.length > 0 && (
        <div 
          className="no-print" 
          style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#64748b',
            fontWeight: '500'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyStyle: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #d1fae5', backgroundColor: '#ecfdf5', color: '#059669', fontSize: '10px', fontWeight: 'bold' }}>P</span>
              Present
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1px solid #ffe4e6', backgroundColor: '#fff1f2', color: '#e11d48', fontSize: '10px', fontWeight: 'bold' }}>A</span>
              Absent
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontWeight: 'bold', color: '#cbd5e1' }}>-</span>
              No session / No record
            </span>
          </div>

          <div style={{ color: '#94a3b8', textAlign: 'right' }}>
            Shows attendance matrix grouped by student and chronological dates.
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
