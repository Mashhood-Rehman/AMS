import React, { useEffect, useState } from 'react';
import {
  Copy,
  Check,
  Terminal,
  HelpCircle,
  Info,
  Code,
  School,
  Pencil,
  Link,
} from 'lucide-react';
import SectionHeader from '../../components/constantComponents/SectionHeader';
import { toast } from 'react-toastify';
import api from '../../api';

const Settings = () => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [instituteId, setInstituteId] = useState('');
  const [instituteName, setInstituteName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState('');
  const displayInstituteId = instituteId || 'your-institute-id-here';

  const APP_URL = window.location.origin + '/#';

  const handleSaveName = async (val) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEditingName(false);
      return;
    }

    try {
      const response = await api.updateLmsConfig({ instituteName: trimmed });
      if (response.success && response.config) {
        setInstituteName(response.config.instituteName);
        toast.success('Institute name updated successfully');
      } else {
        toast.error(response.message || 'Unable to save institute name.');
      }
    } catch (error) {
      toast.error(error.message || 'Unable to save institute name.');
    }

    setEditingName(false);
  };

  useEffect(() => {
    const loadConfig = async () => {
      setConfigLoading(true);
      try {
        const response = await api.getLmsConfig();
        if (response.success && response.config) {
          setInstituteId(response.config.instituteId);
          setInstituteName(response.config.instituteName || 'My Institute');
        } else {
          setConfigError(response.message || 'Unable to load institute configuration.');
          toast.error(response.message || 'Unable to load institute configuration.');
        }
      } catch (error) {
        setConfigError(error.message || 'Unable to load institute configuration.');
        toast.error(error.message || 'Unable to load institute configuration.');
      } finally {
        setConfigLoading(false);
      }
    };

    loadConfig();
  }, []);

  const copyToClipboard = (text, setCopied) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  // Generate iframe snippet using the static instituteId
  const iframeSnippet = `<iframe 
  src="${APP_URL}/embed/attendance?instituteId=${displayInstituteId}&email=USER_EMAIL_HERE&role=TEACHER"
  width="100%" 
  height="720px" 
  style="border: none; border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);"
  allow="camera; microphone"
></iframe>`;

  const embedUrl = `${APP_URL}/embed/attendance?instituteId=${displayInstituteId}&email=USER_EMAIL_HERE&role=TEACHER`;

  return (
    <div className="space-y-8 animate-fadeIn">
      <SectionHeader 
        title="LMS Integration Panel" 
        subtitle="Embed your AMS Attendance Portal directly into Moodle, Canvas, Blackboard, or any custom University platform using simple iframe snippets."
      />

      {configLoading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 shadow-sm">
          Loading institute configuration...
        </div>
      )}
      {configError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-sm">
          {configError}
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Parameters list and simple instructions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Institute Profile – Editable */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center gap-2">
              <School className="text-[#07384d]" size={20} />
              <h2 className="font-bold text-slate-800 text-base">Institute Profile</h2>
              <span className="ml-auto text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">Static Config</span>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* School Name – editable */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">School Name</label>
                  {editingName ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        autoFocus
                        defaultValue={instituteName}
                        onBlur={(e) => handleSaveName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(e.target.value); }}
                        className="w-full border border-blue-300 rounded-lg py-2.5 px-3.5 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                  ) : (
                    <div
                      onClick={() => setEditingName(true)}
                      className="bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-sm font-semibold text-slate-700 flex items-center justify-between cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all group"
                    >
                      <span>{instituteName}</span>
                      <Pencil size={13} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </div>
                  )}
                </div>

                {/* Institute ID – editable */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Institute ID</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={instituteId} 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 text-sm text-slate-600 font-mono focus:outline-none transition-all"
                    />
                    <button 
                      onClick={() => copyToClipboard(instituteId, setCopiedId)}
                      className="py-2 px-4 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1.5 font-semibold text-xs text-slate-700 bg-white shrink-0"
                      title="Copy Institute ID"
                    >
                      {copiedId ? <Check size={14} className="text-green-600 animate-scaleIn" /> : <Copy size={14} />}
                      <span>{copiedId ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The institute values are loaded from backend configuration and stored in the database. Use this ID in your LMS iframe URL to verify users across any LMS instance.
              </p>
            </div>
          </div>

          {/* Direct Embed URL */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50/50 p-5 flex items-center gap-2">
              <Link className="text-[#07384d]" size={20} />
              <h2 className="font-bold text-slate-800 text-base">Direct Embed URL</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Use this URL directly in your LMS embed configuration, or paste it into an iframe <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">src</code> attribute. Replace <code className="bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-mono text-[10px] text-amber-700 font-bold">USER_EMAIL_HERE</code> with the logged-in user's email dynamically.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={embedUrl}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-3.5 text-xs font-mono text-slate-600 focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(embedUrl, setCopiedUrl)}
                  className="py-2 px-4 border border-slate-200 rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1.5 font-semibold text-xs text-slate-700 bg-white shrink-0"
                >
                  {copiedUrl ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                  <span>{copiedUrl ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
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
                        Must match your unique school ID: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[10px] text-slate-700 font-bold">{instituteId}</code>
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
                  <p className="font-bold">Backend-backed LMS Embed Settings</p>
                  <p className="leading-relaxed">
                    Your institution ID and name are now loaded from the server so the iframe can work across multiple LMS systems. Only the admin owner can manage this configuration.
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

