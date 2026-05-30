import React, { useRef, useState } from 'react';
import {
  Download,
  Upload,
  Database,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileJson,
  Shield,
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../api';

const RESTORE_CONFIRM_PHRASE = 'RESTORE';

const computeSummaryFromData = (data) => {
  if (!data) return null;
  return {
    institutes: data.institutes?.length ?? 0,
    users: data.users?.length ?? 0,
    courses: data.courses?.length ?? 0,
    enrollments: data.enrollments?.length ?? 0,
    attendance: data.attendance?.length ?? 0,
    teacherAttendance: data.teacherAttendance?.length ?? 0,
    alerts: data.alerts?.length ?? 0,
  };
};

const formatBackupDate = (iso) => {
  if (!iso) return 'Unknown date';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
};

const SummaryList = ({ summary }) => {
  if (!summary) return null;
  const items = [
    { label: 'Schools / Institutes', value: summary.institutes },
    { label: 'Users', value: summary.users },
    { label: 'Courses', value: summary.courses },
    { label: 'Enrollments', value: summary.enrollments },
    { label: 'Student attendance records', value: summary.attendance },
    { label: 'Teacher attendance records', value: summary.teacherAttendance },
    { label: 'Alerts', value: summary.alerts },
  ];

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
      {items.map((item) => (
        <li key={item.label} className="flex justify-between gap-3 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
          <span>{item.label}</span>
          <span className="font-bold text-slate-900">{item.value ?? 0}</span>
        </li>
      ))}
    </ul>
  );
};

const BackupRestorePanel = () => {
  const fileInputRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [confirmText, setConfirmText] = useState('');
  const [lastExportInfo, setLastExportInfo] = useState(null);

  const handleDownloadBackup = async () => {
    setExporting(true);
    try {
      const response = await api.exportBackup();
      if (!response.success || !response.backup) {
        toast.error(response.message || 'Could not create backup.');
        return;
      }

      const fileName = `ams-backup-${new Date().toISOString().slice(0, 10)}.json`;
      const blob = new Blob([JSON.stringify(response.backup, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setLastExportInfo({
        fileName,
        exportedAt: response.backup.exportedAt,
        summary: response.backup.summary,
      });
      toast.success('Backup downloaded. Keep this file in a safe place.');
    } catch (error) {
      toast.error(error.message || 'Could not download backup.');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChosen = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please choose a .json backup file from AMS.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!parsed?.version || !parsed?.data) {
          toast.error('This file does not look like an AMS backup.');
          setSelectedBackup(null);
          return;
        }
        setSelectedBackup(parsed);
        setConfirmText('');
        toast.info('Backup file loaded. Review the summary, then confirm restore below.');
      } catch {
        toast.error('Could not read the backup file. Make sure it is a valid JSON file.');
        setSelectedBackup(null);
      }
    };
    reader.onerror = () => toast.error('Could not read the selected file.');
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleRestore = async () => {
    if (!selectedBackup) {
      toast.error('Choose a backup file first.');
      return;
    }
    if (confirmText.trim() !== RESTORE_CONFIRM_PHRASE) {
      toast.error(`Type ${RESTORE_CONFIRM_PHRASE} to confirm.`);
      return;
    }

    const proceed = window.confirm(
      'This will replace ALL current dashboard data with the backup.\n\nAre you absolutely sure you want to continue?'
    );
    if (!proceed) return;

    setRestoring(true);
    try {
      const response = await api.restoreBackup({
        backup: selectedBackup,
        confirmPhrase: RESTORE_CONFIRM_PHRASE,
      });
      if (response.success) {
        toast.success(response.message || 'Data restored successfully.');
        setSelectedBackup(null);
        setConfirmText('');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast.error(response.message || 'Restore failed.');
      }
    } catch (error) {
      toast.error(error.message || 'Restore failed.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border-2 border-[#07384d]/20 shadow-sm overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-r from-[#07384d] to-[#0c4a64] p-5 flex items-center gap-3 text-white">
        <div className="p-2 bg-white/10 rounded-lg">
          <Database size={22} />
        </div>
        <div>
          <h2 className="font-bold text-lg">School Data Backup &amp; Restore</h2>
          <p className="text-xs text-white/80 mt-0.5">
            For principals and administrators — no technical skills needed
          </p>
        </div>
        <Shield className="ml-auto text-[#00d2ff] shrink-0" size={28} />
      </div>

      <div className="p-6 space-y-8">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-amber-900 space-y-1">
            <p className="font-bold">Important</p>
            <p>
              Download a backup <strong>before</strong> clearing or resetting your school data.
              If data is lost later, upload the same backup file here to bring everything back.
            </p>
          </div>
        </div>

        {/* Step 1 — Download */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#07384d] text-white text-xs font-bold">
              1
            </span>
            <h3 className="font-bold text-slate-800">Download a full backup</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Saves everything in one file: users, courses, attendance, teacher check-ins, and school
            settings. Store it on your computer, USB drive, or cloud folder (Google Drive, OneDrive).
          </p>
          <button
            type="button"
            onClick={handleDownloadBackup}
            disabled={exporting}
            className="btn btn-blue flex items-center gap-2"
          >
            {exporting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            {exporting ? 'Creating backup…' : 'Download backup file'}
          </button>
          {lastExportInfo && (
            <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex items-start gap-2">
              <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Last backup: {lastExportInfo.fileName}</p>
                <p className="mt-1 text-emerald-800/80">
                  Created {formatBackupDate(lastExportInfo.exportedAt)}
                </p>
                <div className="mt-3">
                  <SummaryList summary={lastExportInfo.summary} />
                </div>
              </div>
            </div>
          )}
        </section>

        <hr className="border-slate-200" />

        {/* Step 2 — Restore */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#07384d] text-white text-xs font-bold">
              2
            </span>
            <h3 className="font-bold text-slate-800">Restore from a backup file</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Use this after data was deleted or the dashboard was reset. All current data will be
            replaced with what is in your backup file.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleFileChosen}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-cancel flex items-center gap-2 border-2 border-dashed border-slate-300"
          >
            <FileJson size={18} />
            Choose backup file (.json)
          </button>

          {selectedBackup && (
            <div className="space-y-4 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <Upload size={16} className="text-[#07384d]" />
                Selected backup
              </div>
              <p className="text-xs text-slate-500">
                Exported {formatBackupDate(selectedBackup.exportedAt)}
                {selectedBackup.exportedBy?.name
                  ? ` by ${selectedBackup.exportedBy.name}`
                  : ''}
              </p>
              <SummaryList
                summary={selectedBackup.summary || computeSummaryFromData(selectedBackup.data)}
              />

              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-xs text-red-800">
                <strong>Warning:</strong> This cannot be undone. Current data will be removed and
                replaced with the backup.
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                  Type <span className="text-red-600">{RESTORE_CONFIRM_PHRASE}</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={RESTORE_CONFIRM_PHRASE}
                  className="custom_input max-w-xs uppercase"
                  autoComplete="off"
                />
              </div>

              <button
                type="button"
                onClick={handleRestore}
                disabled={restoring || confirmText.trim() !== RESTORE_CONFIRM_PHRASE}
                className="btn bg-red-600 hover:bg-red-700 text-white border-red-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {restoring ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Upload size={18} />
                )}
                {restoring ? 'Restoring data…' : 'Restore all data from backup'}
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default BackupRestorePanel;
