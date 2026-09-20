'use client';
import { useRef, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building2, 
  Power, 
  Plus, 
  ShieldCheck, 
  Download, 
  Loader2, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Settings, 
  QrCode,
  LifeBuoy,
  BarChart3,
  LogOut,
  Search,
  Trash2,
  Ban,
  ShieldAlert,
  Lock,
  User,
  X
} from 'lucide-react';

import QRCode from 'qrcode';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import ForgotPinForm from '@/app/components/ForgotPinForm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function GlobalHQ() {
  // Authentication States
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPhone, setAuthPhone] = useState('');
  const [authPin, setAuthPin] = useState('');
  const authPinRefs = useRef([]);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Dashboard States
  const [activeView, setActiveView] = useState('master'); 
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Tag & Onboarding States
  const [schoolTags, setSchoolTags] = useState([]);
  const [isTagsLoading, setIsTagsLoading] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [newSchoolName, setNewSchoolName] = useState('');
  const [metrics, setMetrics] = useState({ activeSchools: 0, globalHealth: 100, warnings: 0 });

  // === NEW: Tag Modal States ===
  const [selectedTag, setSelectedTag] = useState(null);
  const [showTagModal, setShowTagModal] = useState(false);
  const [tagStudentDetails, setTagStudentDetails] = useState(null);
  const [isTagModalLoading, setIsTagModalLoading] = useState(false);
  
  // Registration Form States
  const [newChildName, setNewChildName] = useState('');
  const [newGrade, setNewGrade] = useState('Class 1');
  const [newSection, setNewSection] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newDob, setNewDob] = useState('');

  const classOptions = [
    'Nursery', 'KG-1', 'KG-2', 
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 
    'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ];

  const normalizePhone = (value) => {
    const trimmedValue = value.trim();
    const digits = trimmedValue.replace(/\D/g, '');

    if (trimmedValue.startsWith('+')) {
      return `+${digits}`;
    }

    const nationalNumber = digits.startsWith('91') && digits.length === 12
      ? digits.slice(2)
      : digits.startsWith('0') && digits.length === 11
        ? digits.slice(1)
        : digits;

    return `+91${nationalNumber}`;
  };

  // Only fetch data after successful login
  useEffect(() => {
    if (localStorage.getItem('hq_phone')) {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchHQData();
    }
  }, [isAuthenticated]);

  // --- AUTHENTICATION HANDLER ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');

    const phone = normalizePhone(authPhone);
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
      setAuthError('Enter a valid phone number, including country code for international numbers.');
      return;
    }

    if (!/^\d{6}$/.test(authPin)) {
      setAuthError('PIN must contain exactly 6 digits.');
      return;
    }

    setIsAuthenticating(true);

    try {
      const { data, error } = await supabase
        .from('hq_admins')
        .select('id, phone, pin_hash, is_active')
        .eq('phone', phone)
        .eq('pin_hash', authPin)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setAuthError('Invalid HQ credentials. Access denied.');
      } else {
        localStorage.setItem('hq_phone', data.phone);
        window.dispatchEvent(new Event('kidshield-session-start'));
        setIsAuthenticated(true);
      }
    } catch (err) {
      setAuthError('Server connection error.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('hq_phone');
    window.dispatchEvent(new Event('kidshield-session-end'));
    setIsAuthenticated(false);
  };

  const fetchHQData = async () => {
    setIsLoading(true);
    try {
      const { data: schoolData, error } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setSchools(schoolData || []);
      
      const active = schoolData.filter(s => s.status === 'active').length;
      const totalHealth = schoolData.reduce((acc, curr) => acc + (curr.health_index || 100), 0);
      const avgHealth = schoolData.length ? Math.round(totalHealth / schoolData.length) : 100;
      const warnings = schoolData.filter(s => s.status === 'suspended' || (s.health_index && s.health_index < 50)).length;
      
      setMetrics({ activeSchools: active, globalHealth: avgHealth, warnings });
    } catch (e) {
      console.error("HQ Data Fetch Error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchoolTags = async (schoolId) => {
    setIsTagsLoading(true);
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('school_id', schoolId)
        .order('serial_number', { ascending: true });
      if (error) throw error;
      setSchoolTags(data || []);
    } catch (e) {
      console.error("Tags Fetch Error:", e);
    } finally {
      setIsTagsLoading(false);
    }
  };

  // --- CORE OPERATIONS ---
  const handleOnboardSchool = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const { data, error } = await supabase
        .from('schools')
        .insert([{ name: newSchoolName, status: 'lead' }])
        .select();
        
      if (error) throw error;
      
      await logAudit(`Onboarded New Client: ${newSchoolName}`, data[0].id);
      setShowOnboardModal(false);
      setNewSchoolName('');
      await fetchHQData();
    } catch (e) {
      alert("Onboarding failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActivateSubscription = async (schoolId, schoolName) => {
    if (!confirm(`Activate 365-day subscription for ${schoolName}?`)) return;
    setIsProcessing(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 365);

      const { error } = await supabase.from('schools').update({
        status: 'active',
        subscription_start: startDate.toISOString(),
        subscription_end: endDate.toISOString()
      }).eq('id', schoolId);

      if (error) throw error;

      await logAudit(`Activated 365-Day Subscription`, schoolId);
      await fetchHQData();
    } catch (e) {
      alert("Activation failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKillSwitch = async (schoolId, schoolName) => {
    if (!confirm(`CRITICAL WARNING: Suspend access for ${schoolName}? All scanning will halt.`)) return;
    setIsProcessing(true);
    try {
      await supabase.from('schools').update({ status: 'suspended' }).eq('id', schoolId);
      await logAudit(`TRIGGERED KILL SWITCH`, schoolId);
      await fetchHQData();
    } catch (e) {
      alert("Suspension failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteSchool = async (schoolId, schoolName) => {
    const pwd = prompt(`CRITICAL ACTION: To delete ${schoolName}, enter admin password:`);
    if (pwd !== 'admin123') return alert('Unauthorized: Incorrect password.');
    if (!confirm(`Are you absolutely sure? This will delete all tags and data for ${schoolName}. This CANNOT be undone.`)) return;

    setIsProcessing(true);
    try {
      await supabase.from('tags').delete().eq('school_id', schoolId);
      await supabase.from('schools').delete().eq('id', schoolId);
      
      await logAudit(`DELETED SCHOOL: ${schoolName}`, schoolId);
      setActiveView('master');
      setSelectedSchool(null);
      await fetchHQData();
    } catch (e) {
      alert("School Deletion failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchDeleteTags = async (schoolId) => {
    const pwd = prompt(`Enter admin password to PURGE ALL tags for this school:`);
    if (pwd !== 'admin123') return alert('Unauthorized: Incorrect password.');
    if (!confirm(`This will permanently delete all QR tags for this school. Proceed?`)) return;

    setIsProcessing(true);
    try {
      await supabase.from('tags').delete().eq('school_id', schoolId);
      await logAudit(`Purged all QR tags`, schoolId);
      await fetchSchoolTags(schoolId); 
    } catch (e) {
      alert("Batch delete failed: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateTagStatus = async (tagId, newStatus) => {
    try {
      await supabase.from('tags').update({ status: newStatus }).eq('uuid', tagId);
      await fetchSchoolTags(selectedSchool.id);
    } catch (e) {
      alert("Status update failed: " + e.message);
    }
  };

  const handleDeleteSingleTag = async (tagId) => {
    if (!confirm(`Permanently delete this specific QR code?`)) return;
    try {
      await supabase.from('tags').delete().eq('uuid', tagId);
      await fetchSchoolTags(selectedSchool.id);
    } catch (e) {
      alert("Tag deletion failed: " + e.message);
    }
  };

  const logAudit = async (action, targetId) => {
    await supabase.from('audit_logs').insert([{ action_performed: action, target_school_id: targetId }]);
  };

  const handleMintBatch = async (e) => {
    e.preventDefault();
    if (!selectedSchool) return alert("Select a school first.");
    
    const amount = parseInt(e.target.quantity.value);
    if (isNaN(amount) || amount <= 0) return;

    setIsProcessing(true);
    try {
      const { count } = await supabase
        .from('tags')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', selectedSchool.id);
      
      const newTags = [];
      const batchId = `BCH-${Date.now()}`;
      
      for (let i = 1; i <= amount; i++) {
        const seq = ((count || 0) + i).toString().padStart(4, '0');
        newTags.push({
          uuid: crypto.randomUUID(),
          batch_id: batchId,
          school_id: selectedSchool.id,
          serial_number: `KS-${selectedSchool.id.substring(0, 4).toUpperCase()}-${seq}`,
          status: 'minted'
        });
      }

      const { error: insertError } = await supabase.from('tags').insert(newTags);
      if (insertError) throw insertError;

      await logAudit(`Minted Batch ${batchId} (${amount} tags + Images)`, selectedSchool.id);

      const zip = new JSZip();
      const folderName = `${selectedSchool.name.replace(/\s+/g, '_')}_Batch`;
      const imgFolder = zip.folder(folderName);

      let csvContent = "Serial Number,QR URL\n";

      for (const tag of newTags) {
        const targetUrl = `https://kidshield-v2.vercel.app/scan/${tag.uuid}`;
        csvContent += `${tag.serial_number},${targetUrl}\n`;
        
        const qrDataUri = await QRCode.toDataURL(targetUrl, { 
          width: 400, margin: 2, color: { dark: '#000000', light: '#ffffff' } 
        });
        
        const base64Data = qrDataUri.replace(/^data:image\/(png|jpg);base64,/, "");
        imgFolder.file(`${tag.serial_number}.png`, base64Data, { base64: true });
      }

      zip.file(`${folderName}_Index.csv`, csvContent);
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `${folderName}.zip`);
      
      alert(`✅ Success: ${amount} tags minted and ZIP folder downloaded.`);
      e.target.reset();
    } catch (err) {
      alert("Minting Error: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // === NEW: Tag Interaction Logic ===
  const handleTagClick = async (tag) => {
    setSelectedTag(tag);
    setShowTagModal(true);
    setTagStudentDetails(null);

    // If active, fetch the bound student
    if (tag.status === 'active') {
      setIsTagModalLoading(true);
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('tag_uuid', tag.uuid)
          .single();

        if (data) setTagStudentDetails(data);
      } catch (e) {
        console.error("Error fetching student:", e);
      } finally {
        setIsTagModalLoading(false);
      }
    }
  };

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (!selectedSchool || !selectedTag) return;
    
    setIsTagModalLoading(true);
    try {
      // 1. Insert the student and bind the tag UUID and Serial
      const { error: studentError } = await supabase.from('students').insert([{
        school_id: selectedSchool.id,
        tag_uuid: selectedTag.uuid,
        serial_number: selectedTag.serial_number,
        child_name: newChildName.trim(),
        grade: newGrade,
        section: newSection.trim() || null,
        contact_phone: newParentPhone.trim(),
        dob: newDob || null
      }]);

      if (studentError) throw studentError;

      // 2. Update the tag status to 'active'
      const { error: tagError } = await supabase
        .from('tags')
        .update({ status: 'active' })
        .eq('uuid', selectedTag.uuid);

      if (tagError) throw tagError;

      alert(`Success! ${newChildName} has been registered and the tag is now ACTIVE.`);
      
      // Cleanup and refresh
      setShowTagModal(false);
      setNewChildName('');
      setNewGrade('Class 1');
      setNewSection('');
      setNewParentPhone('');
      setNewDob('');
      fetchSchoolTags(selectedSchool.id);

    } catch (err) {
      alert("Registration Error: " + err.message);
    } finally {
      setIsTagModalLoading(false);
    }
  };

  const filteredSchools = schools.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // ==========================================
  // RENDER: LOGIN SCREEN (If not authenticated)
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-indigo-600 p-3 rounded-2xl mb-4">
              <ShieldCheck size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">KidProtect HQ</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Authorized Access Only</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">HQ Phone Number</label>
              <input 
                type="tel"
                required
                inputMode="tel"
                maxLength={16}
                pattern="\+?[0-9]{8,15}"
                value={authPhone}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^\d+]/g, '');
                  setAuthPhone(value.startsWith('+') ? `+${value.slice(1).replace(/\+/g, '')}` : value.replace(/\+/g, ''));
                }}
                className="w-full mt-1 bg-slate-950 border border-slate-800 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-indigo-500 transition"
                placeholder="Enter admin phone"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase">Secure PIN</label>
              <div className="mt-1 flex gap-2" role="group" aria-label="Six digit secure PIN">
                {Array.from({ length: 6 }, (_, index) => (
                  <input
                    key={index}
                    ref={(element) => { authPinRefs.current[index] = element; }}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={authPin[index] || ''}
                    onChange={(e) => {
                      const digit = e.target.value.replace(/\D/g, '').slice(-1);
                      const nextPin = authPin.split('');
                      nextPin[index] = digit;
                      setAuthPin(nextPin.join('').slice(0, 6));
                      if (digit && index < 5) authPinRefs.current[index + 1]?.focus();
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && !authPin[index] && index > 0) authPinRefs.current[index - 1]?.focus();
                    }}
                    className="h-12 w-10 rounded-xl bg-slate-950 border border-slate-800 text-center text-white focus:outline-none focus:border-indigo-500 transition"
                    aria-label={`Secure PIN digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>
            
            {authError && (
              <p className="text-red-400 text-xs font-bold flex items-center gap-1 mt-2">
                <AlertTriangle size={14} /> {authError}
              </p>
            )}

            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:bg-indigo-900"
            >
              {isAuthenticating ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              {isAuthenticating ? 'Authenticating...' : 'Access Command Bridge'}
            </button>
          </form>
          <ForgotPinForm supabase={supabase} table="hq_admins" accentClass="slate" />
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN HQ DASHBOARD (If authenticated)
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col md:flex-row relative">
      
      {/* ENTERPRISE SIDEBAR */}
      <div className="w-full md:w-72 bg-slate-950 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 mb-4 mt-4 flex items-center gap-3 border-b border-slate-800">
          <div className="bg-indigo-600 p-2 rounded-lg"><ShieldCheck size={24} /></div>
          <div>
            <h2 className="text-xl font-black tracking-tight">KidProtect HQ</h2>
            <p className="text-indigo-400 text-[10px] tracking-widest uppercase font-bold">Enterprise ERP</p>
          </div>
        </div>
        
        <nav className="space-y-2 flex-grow p-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-2">Core Systems</p>
          <button onClick={() => setActiveView('master')} className={`w-full text-left p-3 rounded-xl font-semibold transition flex items-center gap-3 ${activeView === 'master' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
            <Building2 size={18} /> Master Fleet
          </button>
          <button onClick={() => setActiveView('minting')} className={`w-full text-left p-3 rounded-xl font-semibold transition flex items-center gap-3 ${activeView === 'minting' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
            <Download size={18} /> Logistics Factory
          </button>
          
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-8 mb-2 ml-2">Diagnostics</p>
          <button onClick={() => setActiveView('helpdesk')} className={`w-full text-left p-3 rounded-xl font-semibold transition flex items-center gap-3 ${activeView === 'helpdesk' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
            <LifeBuoy size={18} /> IT Helpdesk
          </button>
          <button onClick={() => setActiveView('analytics')} className={`w-full text-left p-3 rounded-xl font-semibold transition flex items-center gap-3 ${activeView === 'analytics' ? 'bg-indigo-600 shadow-lg' : 'hover:bg-slate-900 text-slate-400'}`}>
            <BarChart3 size={18} /> Fleet Analytics
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full p-3 rounded-xl font-semibold text-left transition flex items-center gap-3 text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 p-6 md:p-10 overflow-y-auto">
        
        {/* TOP METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Active Schools</p>
            <p className="text-4xl font-black text-slate-800">{metrics.activeSchools}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Avg Fleet Health</p>
            <p className={`text-4xl font-black ${metrics.globalHealth > 80 ? 'text-emerald-600' : 'text-red-500'}`}>{metrics.globalHealth}%</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Open Tickets</p>
            <p className="text-4xl font-black text-amber-500">0</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 bg-slate-900 text-white">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">System Status</p>
            <p className="text-2xl font-black text-emerald-400 flex items-center gap-2"><CheckCircle2 /> Optimal</p>
          </div>
        </div>

        {isLoading ? (
           <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
        ) : (
          <>
            {/* ZONE 1: MASTER FLEET */}
            {activeView === 'master' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in">
                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <h3 className="text-xl font-bold text-slate-800">B2B Client Fleet</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="text" 
                        placeholder="Search schools..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowOnboardModal(!showOnboardModal)} 
                    className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold transition flex items-center justify-center gap-2">
                    <Plus size={16} /> Onboard New Client
                  </button>
                </div>

                {showOnboardModal && (
                  <div className="p-6 bg-indigo-50 border-b border-indigo-100 animate-fade-in">
                    <form onSubmit={handleOnboardSchool} className="flex flex-col md:flex-row gap-4 items-end max-w-3xl">
                      <div className="flex-1 w-full">
                        <label className="block text-sm font-bold text-indigo-900 mb-2">Institution Name</label>
                        <input 
                          type="text" 
                          required 
                          value={newSchoolName} 
                          onChange={(e) => setNewSchoolName(e.target.value)} 
                          placeholder="e.g. Delhi Public School" 
                          className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-600 outline-none shadow-sm" 
                        />
                      </div>
                      <button 
                        type="submit" 
                        disabled={isProcessing} 
                        className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-sm disabled:bg-indigo-400">
                        {isProcessing ? 'Initializing...' : 'Save & Initialize'}
                      </button>
                    </form>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm">
                      <tr>
                        <th className="p-4 font-semibold">School Name</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Subscription Timer</th>
                        <th className="p-4 font-semibold text-right">Admin Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredSchools.map(school => {
                        let daysLeft = 'Not Active';
                        if (school.subscription_end) {
                          const diff = new Date(school.subscription_end) - new Date();
                          daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24)) + ' Days';
                        }

                        return (
                          <tr key={school.id} className="hover:bg-slate-50 transition">
                            <td className="p-4 font-bold text-slate-800">{school.name}</td>
                            <td className="p-4">
                              {school.status === 'active' && <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Active</span>}
                              {school.status === 'suspended' && <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Suspended</span>}
                              {school.status === 'lead' && <span className="bg-slate-200 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Lead / Demo</span>}
                            </td>
                            <td className="p-4 font-mono font-medium text-slate-600">{daysLeft}</td>
                            <td className="p-4 text-right flex justify-end gap-2">
                              {school.status !== 'active' && (
                                <button 
                                  onClick={() => handleActivateSubscription(school.id, school.name)} 
                                  disabled={isProcessing} 
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1">
                                  <Power size={14} /> Activate 365
                                </button>
                              )}
                              <button 
                                onClick={() => { 
                                  setSelectedSchool(school); 
                                  setActiveView('diagnostics'); 
                                  fetchSchoolTags(school.id);
                                }} 
                                className="bg-white border border-slate-200 hover:border-indigo-400 text-slate-700 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm">
                                <Settings size={14} /> Configure
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ZONE 2: DIAGNOSTICS & CONFIGURATION */}
            {activeView === 'diagnostics' && selectedSchool && (
              <div className="bg-white rounded-2xl border-2 border-indigo-100 shadow-lg p-8 animate-fade-in space-y-8">
                
                {/* Header */}
                <div className="flex justify-between items-center pb-6 border-b border-slate-100">
                  <div>
                    <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                      <Settings className="text-indigo-600" /> Infrastructure: {selectedSchool.name}
                    </h2>
                    <p className="text-sm text-slate-500 font-mono mt-1">Tenant ID: {selectedSchool.id}</p>
                  </div>
                  <button onClick={() => setActiveView('master')} className="text-sm font-bold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg transition">Return to Fleet</button>
                </div>
                
                {/* QR Fleet Management Module */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                    <div>
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <QrCode size={18} className="text-indigo-500"/> QR Tag Inventory
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">Total Minted Tags: <span className="font-bold text-indigo-600">{schoolTags.length}</span></p>
                    </div>
                    <button 
                      onClick={() => handleBatchDeleteTags(selectedSchool.id)}
                      disabled={isProcessing || schoolTags.length === 0}
                      className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 disabled:opacity-50">
                      <Trash2 size={14} /> Batch Purge All Tags
                    </button>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {isTagsLoading ? (
                      <div className="flex justify-center py-8"><Loader2 className="animate-spin text-indigo-600" /></div>
                    ) : schoolTags.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 text-sm font-medium">No QR tags generated for this client yet.</div>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-100 text-slate-500 sticky top-0 z-10 shadow-sm">
                          <tr>
                            <th className="p-3 font-semibold pl-6">Serial Number</th>
                            <th className="p-3 font-semibold">Status</th>
                            <th className="p-3 font-semibold text-right pr-6">Tag Controls</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {schoolTags.map(tag => (
                            <tr key={tag.uuid} className="hover:bg-slate-50 transition group">
                              <td className="p-3 pl-6">
                                {/* Clicking this triggers the modal logic */}
                                <button 
                                  onClick={() => handleTagClick(tag)}
                                  className="font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 px-2 py-1 rounded transition underline underline-offset-4"
                                >
                                  {tag.serial_number}
                                </button>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                                  tag.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 
                                  tag.status === 'deactivated' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                }`}>
                                  {tag.status}
                                </span>
                              </td>
                              <td className="p-3 pr-6 text-right flex justify-end gap-2">
                                {tag.status !== 'deactivated' ? (
                                  <button onClick={() => handleUpdateTagStatus(tag.uuid, 'deactivated')} className="text-amber-600 hover:bg-amber-50 p-2 rounded transition" title="Deactivate Tag">
                                    <Ban size={16} />
                                  </button>
                                ) : (
                                  <button onClick={() => handleUpdateTagStatus(tag.uuid, 'active')} className="text-emerald-600 hover:bg-emerald-50 p-2 rounded transition" title="Reactivate Tag">
                                    <CheckCircle2 size={16} />
                                  </button>
                                )}
                                <button onClick={() => handleDeleteSingleTag(tag.uuid)} className="text-red-500 hover:bg-red-50 p-2 rounded transition" title="Delete Permanent">
                                  <Trash2 size={16} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

                {/* Remote Configuration & Destructive Zone */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <Settings size={18} className="text-slate-500"/> System Controls
                    </h3>
                    <div className="space-y-3">
                      <button 
                        onClick={() => handleKillSwitch(selectedSchool.id, selectedSchool.name)} 
                        className="w-full bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 py-3 rounded-lg text-sm font-bold transition shadow-sm flex items-center justify-center gap-2">
                        <Power size={16} /> Engage Kill Switch (Suspend)
                      </button>
                    </div>
                  </div>

                  <div className="bg-red-50 p-6 rounded-xl border border-red-200">
                    <h3 className="font-bold text-red-700 mb-4 flex items-center gap-2">
                      <ShieldAlert size={18} /> Destructive Actions
                    </h3>
                    <p className="text-xs text-red-600 mb-4 font-medium">Requires Admin Password. Deleting a client permanently erases all associated structural data.</p>
                    <button 
                      onClick={() => handleDeleteSchool(selectedSchool.id, selectedSchool.name)}
                      disabled={isProcessing}
                      className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-sm font-bold transition shadow-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      <Trash2 size={16} /> Terminate Client School
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* ZONE 3: LOGISTICS FACTORY */}
            {activeView === 'minting' && (
              <div className="max-w-3xl bg-white rounded-2xl border border-slate-200 shadow-sm p-8 animate-fade-in">
                <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-2">
                  <QrCode className="text-indigo-600" /> Logistics Factory
                </h2>
                <p className="text-slate-500 mb-8 font-medium">Generate cryptographic hybrid batches bound to specific clients and download image archives.</p>
                
                <form onSubmit={handleMintBatch} className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Target Client School</label>
                    <select 
                      required 
                      onChange={(e) => setSelectedSchool(schools.find(s => s.id === e.target.value))}
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium">
                      <option value="">-- Select Campus --</option>
                      {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Batch Quantity</label>
                    <input 
                      type="number" 
                      name="quantity" 
                      min="1" 
                      max="1000" 
                      required 
                      placeholder="e.g. 50" 
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-medium" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={isProcessing} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-black text-lg transition shadow-md flex items-center justify-center gap-2 disabled:bg-indigo-400">
                    {isProcessing ? <Loader2 className="animate-spin" /> : <Plus />}
                    {isProcessing ? 'Minting & Packaging Images...' : 'Mint Batch & Download Image ZIP Archive'}
                  </button>
                </form>
              </div>
            )}

            {/* ZONE 4: HELPDESK */}
            {activeView === 'helpdesk' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in p-10 flex flex-col items-center justify-center text-center">
                <LifeBuoy size={48} className="text-indigo-200 mb-4" />
                <h3 className="text-2xl font-black text-slate-800 mb-2">IT Helpdesk Hub</h3>
                <p className="text-slate-500 max-w-md">Client support ticketing module. Once the client-side dashboard is built, school administrators will be able to raise software support tickets directly into this queue.</p>
                <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-2xl">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Active Ticket Queue</p>
                   <p className="text-slate-600 mt-4 font-medium">No open tickets at this time.</p>
                </div>
              </div>
            )}

            {/* ZONE 5: ANALYTICS */}
            {activeView === 'analytics' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden animate-fade-in p-10 flex flex-col items-center justify-center text-center">
                <BarChart3 size={48} className="text-indigo-200 mb-4" />
                <h3 className="text-2xl font-black text-slate-800 mb-2">Fleet Analytics Dashboard</h3>
                <p className="text-slate-500 max-w-md">Aggregate system utilization, daily active scan volumes, and churn risk predictions across all B2B tenants will be visualized here.</p>
                 <div className="mt-8 bg-slate-50 border border-slate-200 rounded-xl p-6 w-full max-w-2xl h-48 flex items-center justify-center">
                   <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"><Loader2 className="animate-spin" size={16}/> Awaiting Volume Data</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ======================================= */}
      {/* GLOBAL MODAL OVERLAY FOR TAG INSPECTION */}
      {/* ======================================= */}
      {showTagModal && selectedTag && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 relative animate-fade-in">
            
            {/* Modal Header */}
            <div className="bg-slate-900 p-6 flex justify-between items-start">
              <div>
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Tag Inspection View</p>
                <h3 className="text-xl font-mono font-bold text-white leading-tight">
                  {selectedTag.serial_number}
                </h3>
              </div>
              <button onClick={() => setShowTagModal(false)} className="text-slate-400 hover:text-white bg-slate-800 p-1.5 rounded-full transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {isTagModalLoading ? (
                <div className="py-12 flex justify-center text-indigo-500"><Loader2 className="animate-spin" size={32}/></div>
              ) : selectedTag.status === 'active' ? (
                /* --- SCENARIO A: TAG IS ACTIVE (SHOW STUDENT DETAILS) --- */
                tagStudentDetails ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="bg-emerald-100 text-emerald-600 p-3 rounded-full"><User size={24}/></div>
                      <div>
                        <h4 className="font-black text-lg text-slate-900">{tagStudentDetails.child_name}</h4>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Status: Bound & Active</span>
                      </div>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 text-sm">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-500">Grade & Sec:</span>
                        <span className="font-bold text-slate-900">{tagStudentDetails.grade} {tagStudentDetails.section ? `(${tagStudentDetails.section})` : ''}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                        <span className="font-semibold text-slate-500">Parent Phone:</span>
                        <span className="font-mono font-bold text-indigo-600">{tagStudentDetails.contact_phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-slate-500">Reg. Date:</span>
                        <span className="font-bold text-slate-900">{new Date(tagStudentDetails.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <AlertTriangle className="mx-auto text-amber-500 mb-3" size={32} />
                    <p className="font-bold text-slate-800">Data Desync Error</p>
                    <p className="text-sm text-slate-500">Tag is marked active but no student profile was found in the database.</p>
                  </div>
                )
              ) : (
                /* --- SCENARIO B: TAG IS DELIVERED/BLANK (SHOW REGISTRATION FORM) --- */
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800 mb-4">
                    <p className="font-bold mb-1 flex items-center gap-1"><QrCode size={16}/> Blank Tag Detected</p>
                    <p>Register a student below to instantly bind and activate this tag on the network.</p>
                  </div>
                  
                  <form onSubmit={handleRegisterStudent} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Student Name</label>
                      <input type="text" required value={newChildName} onChange={e => setNewChildName(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="e.g. Rahul Sharma" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class</label>
                        <select value={newGrade} onChange={e => setNewGrade(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600">
                          {classOptions.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Section</label>
                        <input type="text" value={newSection} onChange={e => setNewSection(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="A, B, C..." />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Parent WhatsApp Number</label>
                      <input type="tel" required value={newParentPhone} onChange={e => setNewParentPhone(e.target.value)} className="w-full mt-1 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600" placeholder="+91..." />
                    </div>
                    
                    <button type="submit" disabled={isTagModalLoading} className="w-full mt-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black py-3 rounded-xl transition shadow-md flex items-center justify-center gap-2">
                      <CheckCircle2 size={18} /> Bind & Activate Tag
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
