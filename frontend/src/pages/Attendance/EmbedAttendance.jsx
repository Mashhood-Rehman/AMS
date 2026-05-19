import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import MarkAttendance from './MarkAttendance';
import { 
  ShieldAlert, 
  Loader2, 
  CheckCircle, 
  HelpCircle, 
  Lock,
  RefreshCw,
  Info
} from 'lucide-react';

const EmbedAttendance = () => {
  const [searchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState(null);
  const [verified, setVerified] = useState(false);

  // Extract parameters
  const instituteId = searchParams.get('instituteId');
  const email = searchParams.get('email');
  const role = searchParams.get('role');

  useEffect(() => {
    const authenticateEmbed = async () => {
      // 1. Client-side parameter sanity check
      if (!instituteId || !email || !role) {
        setError('Missing required integration parameters. The iframe URL must contain instituteId, email, and role.');
        setVerifying(false);
        return;
      }

      // 2. Call backend to verify and obtain a session JWT
      try {
        const response = await api.verifyLmsEmbed({
          instituteId,
          email,
          role
        });

        if (response.success && response.token) {
          // Store session token and user details to localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          setVerified(true);
        } else {
          setError(response.message || 'LMS Verification failed.');
        }
      } catch (err) {
        console.error('LMS verification failed:', err);
        setError(err.message || 'A network error occurred while establishing an LMS session.');
      } finally {
        setVerifying(false);
      }
    };

    authenticateEmbed();
  }, [instituteId, email, role]);

  // Loading state
  if (verifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-md p-8 max-w-sm w-full text-center space-y-4">
          <Loader2 size={36} className="animate-spin text-[#07384d] mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Verifying Security Signature</h3>
            <p className="text-xs text-slate-500">Establishing a secure cryptographic connection with the Attendance Management System...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error/Failure state (diagnostic dashboard)
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
          
          {/* Header */}
          <div className="bg-red-50 border-b border-red-100 p-6 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h2 className="font-bold text-red-800 text-lg">Embed Authentication Failed</h2>
              <p className="text-xs text-red-600 mt-0.5">Verification error: Access Denied</p>
            </div>
          </div>

          {/* Diagnostic Info */}
          <div className="p-6 space-y-6">
            
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Error Details</h4>
              <p className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 leading-relaxed">
                {error}
              </p>
            </div>

            {/* Diagnostic Parameters Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Provided Parameters</h4>
              <div className="border border-slate-100 rounded-lg overflow-hidden text-xs">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                      <th className="px-4 py-2 text-left">Parameter</th>
                      <th className="px-4 py-2 text-left">Value Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px] text-slate-600">
                    <tr>
                      <td className="px-4 py-2.5 font-bold">instituteId</td>
                      <td className={`px-4 py-2.5 ${instituteId ? 'text-green-600' : 'text-red-500 font-bold'}`}>
                        {instituteId ? instituteId : 'Missing'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-bold">email</td>
                      <td className={`px-4 py-2.5 ${email ? 'text-green-600' : 'text-red-500 font-bold'}`}>
                        {email ? email : 'Missing'}
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-bold">role</td>
                      <td className={`px-4 py-2.5 ${role ? 'text-green-600' : 'text-red-500 font-bold'}`}>
                        {role ? role : 'Missing'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support Advice */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-2.5">
              <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
              <div className="text-xs text-blue-800 space-y-1">
                <p className="font-bold">LMS Embed Advice:</p>
                <p>
                  Ensure your LMS page template passes the correct `instituteId` of your school along with the `email` and `role` of the logged-in user inside the iframe src query string.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button 
                onClick={() => window.location.reload()}
                className="btn btn-cancel text-xs flex items-center gap-1.5 border border-slate-200"
              >
                <RefreshCw size={12} />
                Retry Loading
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Success state: render the secure distraction-free Attendance markers
  if (verified) {
    return (
      <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-8">
        
        {/* Distraction-free Frame Header */}
        <div className="mb-6 bg-white border border-slate-200/80 rounded-xl p-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#07384d] flex items-center justify-center text-[#00d2ff]">
              <Lock size={16} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-800">LMS Integration Frame</span>
                <span className="inline-flex items-center gap-0.5 bg-green-50 border border-green-200 text-green-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                  <CheckCircle size={10} /> Active Session Verified
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Authenticated user: <strong className="text-slate-600 font-bold">{email}</strong> ({role})</p>
            </div>
          </div>
        </div>

        {/* Display the Core Attendance Module inside the verified container */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <MarkAttendance />
        </div>
        
      </div>
    );
  }

  return null;
};

export default EmbedAttendance;
