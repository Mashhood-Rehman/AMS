import React, { useState, useEffect } from 'react';
import { 
  Copy, 
  Check, 
  Terminal, 
  HelpCircle,
  Info,
  Lock,
  ExternalLink,
  Code,
  School
} from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import api from '../../api';
import { toast } from 'react-toastify';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [instituteId, setInstituteId] = useState('');
  const [instituteName, setInstituteName] = useState('Your Institute');

  const APP_URL = window.location.origin + '/#';

  useEffect(() => {
    fetchLmsConfig();
  }, []);

  const fetchLmsConfig = async () => {
    setLoading(true);
    try {
      const response = await api.getLmsConfig();
      if (response.success && response.config) {
        setInstituteId(response.config.instituteId);
        setInstituteName(response.config.instituteName || 'Your Institute');
      }
    } catch (error) {
      console.error('[fetchLmsConfig] Error loading LMS config:', error);
      toast.error(error.message || 'Failed to load LMS settings');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  // Generate example iframe snippet using the real loaded instituteId
  const iframeSnippet = `<iframe 
  src="${APP_URL}/embed/attendance?instituteId=${instituteId || 'YOUR_INSTITUTE_ID'}&email=USER_EMAIL_HERE&role=TEACHER"
  width="100%" 
  height="720px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);"
  allow="camera; microphone"
></iframe>`;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#07384d] animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading Integration Configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <SectionHeader 
        title="LMS Integration Panel" 
        subtitle="Embed your AMS Attendance Portal directly into Moodle, Canvas, Blackboard, or any custom University platform using simple iframe snippets."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Parameters list and simple instructions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Institute ID Details */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center gap-2">
              <School className="text-[#07384d]" size={20} />
              <h2 className="font-bold text-slate-800 text-base">Institute Profile</h2>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">School Name</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm font-semibold text-slate-700">
                    {instituteName}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Institute ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={instituteId} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-600 font-mono focus:outline-none"
                    />
                    <button 
                      onClick={() => copyToClipboard(instituteId, setCopiedId)}
                      className="py-2 px-4 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1.5 font-semibold text-xs text-slate-700 bg-white"
                      title="Copy Institute ID"
                    >
                      {copiedId ? <Check size={14} className="text-green-600 animate-scaleIn" /> : <Copy size={14} />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your unique database identifier is used to separate your courses, student logs, and attendance rosters from other institutes using this cloud platform.
              </p>
            </div>
          </div>

          {/* How to Embed (Dynamic parameter tables) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center gap-2">
              <Code className="text-[#07384d]" size={20} />
              <h2 className="font-bold text-slate-800 text-base">Required URL Integration Parameters</h2>
            </div>
            
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                When loading the iframe within your student or teacher portal, your template engine (e.g. PHP, Django, Blade, React) should dynamically construct the URL by passing the logged-in user context inside these three parameters:
              </p>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 tracking-wider">
                      <th className="p-4">Param Name</th>
                      <th className="p-4">Required</th>
                      <th className="p-4">Expected Value / Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 text-xs text-slate-600">
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#07384d]">instituteId</td>
                      <td className="p-4 font-semibold text-green-600 bg-green-50/50 text-[10px] uppercase text-center w-24">Required</td>
                      <td className="p-4 leading-relaxed">
                        Must match your unique school ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700 font-bold">{instituteId || 'YOUR_ID'}</code>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#07384d]">email</td>
                      <td className="p-4 font-semibold text-green-600 bg-green-50/50 text-[10px] uppercase text-center w-24">Required</td>
                      <td className="p-4 leading-relaxed">
                        Email of the logged-in student or instructor in your LMS. MUST exist as a registered user under this school (e.g., <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">teacher@ams.com</code>).
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#07384d]">role</td>
                      <td className="p-4 font-semibold text-green-600 bg-green-50/50 text-[10px] uppercase text-center w-24">Required</td>
                      <td className="p-4 leading-relaxed">
                        User privilege category. Allowed choices: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700">TEACHER</code> or <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700">STUDENT</code>.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Code generator and advice */}
        <div className="space-y-8">
          
          {/* Core HTML IFrame Code snippet */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center gap-2">
              <Terminal className="text-[#07384d]" size={20} />
              <h2 className="font-bold text-slate-800 text-base">HTML Embed Snippet</h2>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Paste this clean HTML snippet into your external university page or LMS template. Replace the email dynamically:
              </p>
              
              <div className="relative">
                <textarea 
                  readOnly 
                  rows={9}
                  value={iframeSnippet}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-600 focus:outline-none resize-none leading-relaxed"
                />
                
                <button 
                  onClick={() => copyToClipboard(iframeSnippet, setCopiedSnippet)}
                  className="absolute right-3 bottom-4 bg-[#07384d] hover:bg-[#0c4a64] text-white py-1.5 px-3 rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-sm transition-all"
                >
                  {copiedSnippet ? <Check size={13} className="text-green-300" /> : <Copy size={13} />}
                  <span>{copiedSnippet ? 'Copied' : 'Copy HTML'}</span>
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-2.5">
                <Info className="text-blue-600 shrink-0 mt-0.5" size={16} />
                <div className="text-xs text-blue-800 space-y-1">
                  <p className="font-bold">Project Simplicity Mode</p>
                  <p className="leading-relaxed">
                    Domain restrictions, IP white-lists, and cryptographic signatures have been bypassed so you can seamlessly test embeds on local server instances, custom ports, and different host names.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick FAQ / Guide */}
          <div className="bg-[#07384d] text-white rounded-xl p-6 shadow-md space-y-4">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <HelpCircle className="text-[#00d2ff]" size={20} />
              <h3 className="font-bold text-xs uppercase tracking-wider">How to test embedding?</h3>
            </div>
            
            <ol className="space-y-4 text-xs text-slate-200 list-decimal list-inside leading-relaxed">
              <li>
                <span className="font-bold text-white">Copy the HTML snippet</span> on the left or top.
              </li>
              <li>
                <span className="font-bold text-white">Create a simple testing file</span> (e.g. <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-[10px]">test_lms.html</code>) in your local computer or project.
              </li>
              <li>
                <span className="font-bold text-white">Change the email parameter</span> in the iframe's URL to any active user email registered in your AMS database.
              </li>
              <li>
                <span className="font-bold text-white">Open the HTML file</span> in any browser to verify instant and automatic attendance marking integration!
              </li>
            </ol>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Settings;
