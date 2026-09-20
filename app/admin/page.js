'use client';
import { useRef, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  Building, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  LogOut, 
  Lock, 
  Plus, 
  UserCheck, 
  UserX, 
  RefreshCw, 
  CheckCircle2,
  PhoneCall,
  UserCheck2,
  UserMinus,
  Activity,
  GraduationCap,
  X,
  Search,
  Megaphone // Added Megaphone icon for the notices tab
} from 'lucide-react';
import ForgotPinForm from '@/app/components/ForgotPinForm';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const PIN_EXPIRY_DAYS = 30;

export default function AdminPortal() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Auth States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const loginPinRefs = useRef([]);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Dashboard Data States
  const [staffList, setStaffList] = useState([]);
  const [failedAlerts, setFailedAlerts] = useState([]);
  const [overviewStats, setOverviewStats] = useState({ 
    totalStudents: 0, 
    presentToday: 0,
    absentToday: 0,
    attendanceRate: 0
  });
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Student Directory States
  const [studentDirectory, setStudentDirectory] = useState([]);
  const [isFetchingStudents, setIsFetchingStudents] = useState(false);
  const [filterClass, setFilterClass] = useState('All');
  const [filterSection, setFilterSection] = useState('All');
  const [selectedStudent, setSelectedStudent] = useState(null);

  // New Staff Form States
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffGrade, setNewStaffGrade] = useState('Class 1');
  const [newStaffSection, setNewStaffSection] = useState('');
  const [addStaffMsg, setAddStaffMsg] = useState('');

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [newAdminPhone, setNewAdminPhone] = useState('');
  const [addAdminMsg, setAddAdminMsg] = useState('');

  const [newParentName, setNewParentName] = useState('');
  const [newParentPin, setNewParentPin] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [addParentMsg, setAddParentMsg] = useState('');

  // Global Notice Form States
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeMessage, setNoticeMessage] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState(false);

  const normalizeLoginPhone = (value) => {
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

  const isValidLoginPhone = (value) => /^\+[1-9]\d{7,14}$/.test(value);
  const normalizeIndianPhone = (value) => {
    const digits = value.replace(/\D/g, '');
    const nationalNumber = digits.startsWith('91') && digits.length === 12
      ? digits.slice(2)
      : digits.startsWith('0') && digits.length === 11
        ? digits.slice(1)
        : digits;

    return `+91${nationalNumber}`;
  };
  const isValidIndianPhone = (value) => /^\+91[6-9]\d{9}$/.test(value);
  const isValidPin = (value) => /^\d{6}$/.test(value.trim());

  // Extended Class List
  const classOptions = [
    'Nursery', 'KG-1', 'KG-2', 
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 
    'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ];

  // 1. Check Auth Session on Mount
  useEffect(() => {
    const phone = localStorage.getItem('admin_phone');
    const role = localStorage.getItem('admin_role');

    if (phone && role === 'admin') {
      setAdminData({ name: localStorage.getItem('admin_name') || 'Admin' });
      setIsAuthenticated(true);
    }
    setIsLoading(false);

    const handleSessionEnd = () => {
      setAdminData(null);
      setIsAuthenticated(false);
    };
    const clearAdminSessionOnPageHide = () => {
      localStorage.removeItem('admin_phone');
      localStorage.removeItem('admin_username');
      localStorage.removeItem('admin_name');
      localStorage.removeItem('admin_role');
    };

    window.addEventListener('kidshield-session-end', handleSessionEnd);
    window.addEventListener('pagehide', clearAdminSessionOnPageHide);

    return () => {
      window.removeEventListener('kidshield-session-end', handleSessionEnd);
      window.removeEventListener('pagehide', clearAdminSessionOnPageHide);
    };
  }, []);

  // 2. Load Dashboard Data When Authenticated & Tab Changes
  useEffect(() => {
    if (!isAuthenticated) return;
    
    if (activeTab === 'students') {
      fetchStudentDirectory();
    } else {
      fetchDashboardData();
    }
  }, [isAuthenticated, activeTab]);

  // Fetch Student Directory Logic
  const fetchStudentDirectory = async () => {
    setIsFetchingStudents(true);
    try {
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('child_name', { ascending: true });

      if (studentsError) throw studentsError;

      // Fetch today's attendance logs
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: todayLogs, error: logsError } = await supabase
        .from('attendance_logs')
        .select('student_id')
        .gte('created_at', `${todayStr}T00:00:00`);

      if (logsError) throw logsError;

      // Create a set of student IDs who are present today for quick lookup
      const presentStudentIds = new Set(todayLogs?.map(log => log.student_id));

      // Combine student data with their attendance status
      const formattedDirectory = students.map(student => ({
        ...student,
        attendance_status: presentStudentIds.has(student.id) ? 'Present' : 'Pending'
      }));

      setStudentDirectory(formattedDirectory);
    } catch (err) {
      console.error('Error fetching student directory:', err);
    } finally {
      setIsFetchingStudents(false);
    }
  };

  const fetchDashboardData = async () => {
    setIsFetchingData(true);
    try {
      // A. Fetch Overview Stats
      const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
      
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: todayLogs } = await supabase
        .from('attendance_logs')
        .select('student_id, created_at')
        .gte('created_at', `${todayStr}T00:00:00`);

      const uniquePresent = new Set(todayLogs?.map(log => log.student_id)).size;
      const total = studentCount || 0;
      const present = uniquePresent || 0;
      const absent = total > 0 ? total - present : 0;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      setOverviewStats({
        totalStudents: total,
        presentToday: present,
        absentToday: absent,
        attendanceRate: rate
      });

      // B. Fetch Staff Members
      const { data: staff } = await supabase
        .from('staff')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (staff) setStaffList(staff);

      // C. Fetch WhatsApp Failed Alerts
      const { data: alerts } = await supabase
        .from('attendance_logs')
        .select('id, created_at, student_id, whatsapp_status, students(child_name, grade, contact_phone)')
        .eq('whatsapp_status', 'failed')
        .order('created_at', { ascending: false });

      if (alerts) {
        const formatted = alerts.map(a => ({
          id: a.id,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          student_name: a.students?.child_name || 'Unknown Student',
          grade: a.students?.grade || 'Class N/A',
          parent_phone: a.students?.contact_phone || 'N/A'
        }));
        setFailedAlerts(formatted);
      }

    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsFetchingData(false);
    }
  };

  const handleGlobalRefresh = () => {
    if (activeTab === 'students') {
      fetchStudentDirectory();
    } else {
      fetchDashboardData();
    }
  };

  // 3. Admin Login Handler
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    const phone = normalizeLoginPhone(loginPhone);
    if (!isValidLoginPhone(phone)) {
      setLoginError('Enter a valid phone number, including country code for international numbers.');
      return;
    }

    if (!/^\d{6}$/.test(loginPin)) {
      setLoginError('Enter a valid 6-digit PIN.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, role, phone, pin_hash, pin_changed_at, is_active')
        .eq('role', 'admin')
        .eq('phone', phone)
        .eq('pin_hash', loginPin.trim())
        .limit(20);

      if (error) throw error;

      const matchedAdmin = (data || []).find((row) => row.is_active);

      const account = (data || [])[0];
      const pinExpired = account?.pin_changed_at &&
        Date.now() - new Date(account.pin_changed_at).getTime() >= PIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      if (account && pinExpired) {
        await supabase.from('staff').update({ is_active: false }).eq('id', account.id);
        throw new Error('This admin PIN has expired after 30 days. Contact an administrator to reactivate the account.');
      }

      if (!matchedAdmin) {
        throw new Error('Invalid credentials or unauthorized account.');
      }

      localStorage.setItem('admin_phone', matchedAdmin.phone || '');
      localStorage.removeItem('admin_username');
      localStorage.setItem('admin_name', matchedAdmin.name);
      localStorage.setItem('admin_role', matchedAdmin.role);
      window.dispatchEvent(new Event('kidshield-session-start'));
      
      setAdminData({ name: matchedAdmin.name });
      setIsAuthenticated(true);

    } catch (err) {
      setLoginError(err.message || 'Login failed.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // 4. Add Teacher Action
  const handleAddStaff = async (e) => {
    e.preventDefault();
    setAddStaffMsg('');

    const phone = normalizeIndianPhone(newStaffPhone);
    if (!newStaffName || !newStaffPhone || !newStaffPin) {
      setAddStaffMsg('Name, phone, and PIN are required.');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setAddStaffMsg('Enter a valid Indian mobile number, for example +91 9876543210.');
      return;
    }
    if (!isValidPin(newStaffPin)) {
      setAddStaffMsg('PIN must contain exactly 6 digits.');
      return;
    }

    try {
      const { data: firstStaff } = await supabase.from('staff').select('school_id').limit(1).single();
      const schoolId = firstStaff?.school_id;

      if (!schoolId) {
        throw new Error('No valid School ID found in system.');
      }

      const combinedGrade = newStaffSection.trim() 
        ? `${newStaffGrade} - ${newStaffSection.trim()}` 
        : newStaffGrade;

      const { error } = await supabase.from('staff').insert([{
        school_id: schoolId,
        name: newStaffName.trim(),
        pin_hash: newStaffPin.trim(),
        pin_changed_at: new Date().toISOString(),
        phone,
        role: 'teacher',
        assigned_grade: combinedGrade,
        is_active: true
      }]);

      if (error) throw error;

      setAddStaffMsg('Success! Teacher added to system.');
      setNewStaffName('');
      setNewStaffPin('');
      setNewStaffPhone('');
      setNewStaffSection('');
      fetchDashboardData();

    } catch (err) {
      console.error(err);
      setAddStaffMsg('Failed to add teacher. Username or phone may already exist.');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddAdminMsg('');

    const phone = normalizeIndianPhone(newAdminPhone);
    if (!newAdminName || !newAdminPhone || !newAdminPin) {
      setAddAdminMsg('Name, phone, and PIN are required.');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setAddAdminMsg('Enter a valid Indian mobile number, for example +91 9876543210.');
      return;
    }
    if (!isValidPin(newAdminPin)) {
      setAddAdminMsg('PIN must contain exactly 6 digits.');
      return;
    }

    try {
      const { data: firstStaff } = await supabase.from('staff').select('school_id').limit(1).single();
      const schoolId = firstStaff?.school_id;

      if (!schoolId) {
        throw new Error('No valid School ID found in system.');
      }

      const { error } = await supabase.from('staff').insert([{
        school_id: schoolId,
        name: newAdminName.trim(),
        pin_hash: newAdminPin.trim(),
        pin_changed_at: new Date().toISOString(),
        phone,
        role: 'admin',
        assigned_grade: 'All Classes',
        is_active: true
      }]);

      if (error) throw error;

      setAddAdminMsg('Success! Admin account created.');
      setNewAdminName('');
      setNewAdminPin('');
      setNewAdminPhone('');
      fetchDashboardData();

    } catch (err) {
      console.error(err);
      setAddAdminMsg('Failed to create admin account. Username or phone may already exist.');
    }
  };

  const handleAddParent = async (e) => {
    e.preventDefault();
    setAddParentMsg('');

    const phone = normalizeIndianPhone(newParentPhone);
    if (!newParentName || !newParentPhone || !newParentPin) {
      setAddParentMsg('Name, phone, and PIN are required.');
      return;
    }
    if (!isValidIndianPhone(phone)) {
      setAddParentMsg('Enter a valid Indian mobile number, for example +91 9876543210.');
      return;
    }
    if (!isValidPin(newParentPin)) {
      setAddParentMsg('PIN must contain exactly 6 digits.');
      return;
    }

    try {
      const { error } = await supabase.from('parent_accounts').insert([
        {
          name: newParentName.trim(),
          pin_hash: newParentPin.trim(),
          phone,
          is_active: true
        }
      ]);

      if (error) throw error;

      setAddParentMsg('Success! Parent account created.');
      setNewParentName('');
      setNewParentPin('');
      setNewParentPhone('');

    } catch (err) {
      console.error(err);
      setAddParentMsg('Failed to create parent account. Username or phone may already exist.');
    }
  };

  // 5. Toggle Teacher Active Status
  const toggleStaffStatus = async (staffId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('staff')
        .update({ is_active: !currentStatus })
        .eq('id', staffId);

      if (!error) fetchDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Handle Global Notice Publish
  const handlePublishGlobalNotice = async (e) => {
    e.preventDefault();
    setIsPublishing(true);

    try {
      const { error } = await supabase
        .from('notices')
        .insert([
          {
            target_grade: 'GLOBAL', // Broadcasting to all parents
            title: noticeTitle.trim(),
            message: noticeMessage.trim()
          }
        ]);

      if (error) throw error;
      
      setNoticeSuccess(true);
      setTimeout(() => {
        setNoticeSuccess(false);
        setNoticeTitle('');
        setNoticeMessage('');
      }, 3000);

    } catch (err) {
      console.error("Global Notice publish error:", err);
      alert("Failed to publish global notice: " + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_phone');
    localStorage.removeItem('admin_username');
    localStorage.removeItem('admin_name');
    localStorage.removeItem('admin_role');
    window.dispatchEvent(new Event('kidshield-session-end'));
    setIsAuthenticated(false);
  };

  // Filter Logic for Directory (Includes smart matching for older records like "2" vs "Class 2")
  const filteredStudents = studentDirectory.filter((student) => {
    if (filterClass === 'All' && filterSection === 'All') return true;

    // Smart class match: ignore "class" and spaces so "2" matches "Class 2"
    let classMatch = true;
    if (filterClass !== 'All') {
      const cleanFilterClass = String(filterClass).toLowerCase().replace(/class/g, '').replace(/\s+/g, '');
      const cleanStudentClass = String(student.grade || '').toLowerCase().replace(/class/g, '').replace(/\s+/g, '');
      classMatch = cleanFilterClass === cleanStudentClass;
    }

    const sectionMatch = filterSection === 'All' || (student.section && student.section === filterSection);
    return classMatch && sectionMatch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-400 border-t-transparent"></div>
      </div>
    );
  }

  // RENDER: Login Gate
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 font-sans p-4">
        <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
          <div className="h-16 w-16 bg-slate-900 text-amber-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-1">Admin Portal</h2>
          <p className="text-xs text-slate-500 mb-6">School Administrators Only</p>
          
          {loginError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="tel"
              inputMode="numeric"
              maxLength={16}
              pattern="\+?[0-9]{8,15}"
              placeholder="Admin phone number"
              value={loginPhone}
              onChange={(e) => {
                const value = e.target.value.replace(/[^\d+]/g, '');
                setLoginPhone(value.startsWith('+') ? `+${value.slice(1).replace(/\+/g, '')}` : value.replace(/\+/g, ''));
              }}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
              disabled={isLoggingIn}
            />
            <div className="flex justify-center gap-2" role="group" aria-label="Six digit admin PIN">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={(element) => { loginPinRefs.current[index] = element; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={loginPin[index] || ''}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, '').slice(-1);
                    const nextPin = loginPin.split('');
                    nextPin[index] = digit;
                    setLoginPin(nextPin.join('').slice(0, 6));
                    if (digit && index < 5) loginPinRefs.current[index + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !loginPin[index] && index > 0) loginPinRefs.current[index - 1]?.focus();
                  }}
                  className="h-12 w-10 rounded-xl border border-slate-200 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50"
                  aria-label={`Admin PIN digit ${index + 1}`}
                  disabled={isLoggingIn}
                />
              ))}
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className={`w-full text-white font-black py-4 rounded-xl shadow-md transition ${
                isLoggingIn ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-900 hover:bg-black'
              }`}
            >
              {isLoggingIn ? 'Verifying...' : 'Access Command Center'}
            </button>
          </form>
          <ForgotPinForm supabase={supabase} table="staff" accentClass="slate" />
        </div>
      </div>
    );
  }

  // RENDER: Full Dashboard
  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col md:flex-row">
      
      {/* Sidebar */}
      <aside className="bg-slate-900 text-slate-300 md:w-64 flex-shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-slate-800">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <Building className="text-amber-400" size={28} />
          <div>
            <h1 className="font-black text-white text-lg leading-tight">Admin Portal</h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">KidProtect HQ</p>
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 size={18} /> Daily Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('staff')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
              activeTab === 'staff' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users size={18} /> Staff Permissions
          </button>

          <button 
            onClick={() => setActiveTab('students')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
              activeTab === 'students' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <GraduationCap size={18} /> Student Directory
          </button>

          {/* New Global Notices Tab Button */}
          <button 
            onClick={() => setActiveTab('notices')}
            className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
              activeTab === 'notices' ? 'bg-amber-400 text-slate-900' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Megaphone size={18} /> Global Notices
          </button>

          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex items-center justify-between p-3 rounded-xl font-bold text-sm transition-colors whitespace-nowrap ${
              activeTab === 'alerts' ? 'bg-rose-500 text-white' : 'hover:bg-slate-800 text-rose-400'
            }`}
          >
            <span className="flex items-center gap-3">
              <AlertTriangle size={18} /> Failed Messages
            </span>
            {failedAlerts.length > 0 && (
              <span className="bg-white text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black">
                {failedAlerts.length}
              </span>
            )}
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-xl font-bold text-sm w-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-slate-900">
              {activeTab === 'overview' && 'School Attendance Overview'}
              {activeTab === 'staff' && 'Manage Teacher Access'}
              {activeTab === 'students' && 'Student Directory & QR Registry'}
              {activeTab === 'notices' && 'Campus-Wide Broadcast'}
              {activeTab === 'alerts' && 'WhatsApp Communication Fallback'}
            </h2>
            <p className="text-slate-500 font-medium text-xs mt-1">Logged in as {adminData?.name}</p>
          </div>
          <button 
            onClick={handleGlobalRefresh} 
            className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-amber-500 transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={isFetchingData || isFetchingStudents ? 'animate-spin text-amber-500' : ''} />
          </button>
        </header>

        {/* TAB 1: DAILY OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Enrolled</p>
                  <Users size={16} className="text-indigo-500" />
                </div>
                <p className="text-3xl font-black text-slate-800">{overviewStats.totalStudents}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present Today</p>
                  <UserCheck2 size={16} className="text-emerald-500" />
                </div>
                <p className="text-3xl font-black text-emerald-600">{overviewStats.presentToday}</p>
              </div>
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent Today</p>
                  <UserMinus size={16} className="text-rose-500" />
                </div>
                <p className="text-3xl font-black text-rose-600">{overviewStats.absentToday}</p>
              </div>
              <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 shadow-sm flex flex-col justify-between">
                <div className="flex justify-between items-start mb-2">
                  <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Turnout %</p>
                  <Activity size={16} className="text-amber-400" />
                </div>
                <p className="text-3xl font-black text-white">{overviewStats.attendanceRate}%</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-800 text-sm mb-4">Today&apos;s Attendance Visual</h3>
              <div className="w-full h-8 bg-rose-100 rounded-full flex overflow-hidden shadow-inner">
                {overviewStats.attendanceRate > 0 && (
                  <div 
                    className="bg-emerald-500 h-full flex items-center justify-center transition-all duration-1000 ease-out"
                    style={{ width: `${overviewStats.attendanceRate}%` }}
                  >
                    {overviewStats.attendanceRate > 10 && (
                      <span className="text-[10px] font-black text-white">PRESENT</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mt-3 px-2 text-xs font-bold">
                <span className="text-emerald-600 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500"></span> Present ({overviewStats.attendanceRate}%)</span>
                <span className="text-rose-500 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-400"></span> Absent ({100 - overviewStats.attendanceRate}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STAFF ACCESS CONTROL */}
        {activeTab === 'staff' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit space-y-6">
              <div>
                <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-indigo-600" /> Assign Class Teacher
                </h3>
                {addStaffMsg && (
                  <p className={`text-xs font-bold p-3 rounded-xl mb-4 ${
                    addStaffMsg.includes('Success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {addStaffMsg}
                  </p>
                )}
                <form onSubmit={handleAddStaff} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Teacher Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mr. Sharma"
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">PIN</label>
                    <input
                      type="password"
                      placeholder="Set staff PIN"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={newStaffPin}
                      onChange={(e) => setNewStaffPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      inputMode="tel"
                      maxLength={14}
                      pattern="^\\+91[6-9][0-9]{9}$"
                      value={newStaffPhone}
                      onChange={(e) => setNewStaffPhone(e.target.value)}
                      onBlur={() => setNewStaffPhone(normalizeIndianPhone(newStaffPhone))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Class</label>
                      <select
                        value={newStaffGrade}
                        onChange={(e) => setNewStaffGrade(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-white"
                      >
                        {classOptions.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-slate-400">Section (Optional)</label>
                      <input
                        type="text"
                        list="section-options"
                        placeholder="e.g. A, B, Tulip"
                        value={newStaffSection}
                        onChange={(e) => setNewStaffSection(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                      <datalist id="section-options">
                        <option value="A" />
                        <option value="B" />
                        <option value="C" />
                        <option value="D" />
                        <option value="E" />
                      </datalist>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl mt-2 hover:bg-indigo-700 transition shadow-md"
                  >
                    Grant Access
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-amber-600" /> Create Admin Access
                </h3>
                {addAdminMsg && (
                  <p className={`text-xs font-bold p-3 rounded-xl mb-4 ${
                    addAdminMsg.includes('Success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {addAdminMsg}
                  </p>
                )}
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Admin Name</label>
                    <input
                      type="text"
                      placeholder="e.g. School Administrator"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">PIN</label>
                    <input
                      type="password"
                      placeholder="Set admin PIN"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={newAdminPin}
                      onChange={(e) => setNewAdminPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      inputMode="tel"
                      maxLength={14}
                      pattern="^\\+91[6-9][0-9]{9}$"
                      value={newAdminPhone}
                      onChange={(e) => setNewAdminPhone(e.target.value)}
                      onBlur={() => setNewAdminPhone(normalizeIndianPhone(newAdminPhone))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-amber-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-slate-900 font-bold py-3 rounded-xl hover:bg-amber-400 transition shadow-md"
                  >
                    Create Admin
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <h3 className="font-black text-slate-800 text-base mb-4 flex items-center gap-2">
                  <Plus size={20} className="text-emerald-600" /> Create Parent Access
                </h3>
                {addParentMsg && (
                  <p className={`text-xs font-bold p-3 rounded-xl mb-4 ${
                    addParentMsg.includes('Success') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                  }`}>
                    {addParentMsg}
                  </p>
                )}
                <form onSubmit={handleAddParent} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Parent Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Mrs. Patel"
                      value={newParentName}
                      onChange={(e) => setNewParentName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">PIN</label>
                    <input
                      type="password"
                      placeholder="Set parent PIN"
                      inputMode="numeric"
                      maxLength={6}
                      pattern="[0-9]{6}"
                      value={newParentPin}
                      onChange={(e) => setNewParentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-slate-400">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      inputMode="tel"
                      maxLength={14}
                      pattern="^\\+91[6-9][0-9]{9}$"
                      value={newParentPhone}
                      onChange={(e) => setNewParentPhone(e.target.value)}
                      onBlur={() => setNewParentPhone(normalizeIndianPhone(newParentPhone))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl hover:bg-emerald-400 transition shadow-md"
                  >
                    Create Parent
                  </button>
                </form>
              </div>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="font-black text-slate-800 text-base mb-4">Authorized Personnel Directory</h3>
              <div className="space-y-3">
                {staffList.map((staff) => (
                  <div key={staff.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{staff.name}</p>
                      <p className="text-xs font-semibold text-slate-500 mt-0.5">
                        {staff.phone} â€¢ <span className="text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{staff.assigned_grade || 'All Classes (Admin)'}</span>
                      </p>
                    </div>
                    <button
                      onClick={() => toggleStaffStatus(staff.id, staff.is_active)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                        staff.is_active 
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-rose-100 hover:text-rose-700' 
                          : 'bg-slate-200 text-slate-500 hover:bg-emerald-100 hover:text-emerald-700'
                      }`}
                    >
                      {staff.is_active ? <UserCheck size={14} /> : <UserX size={14} />}
                      {staff.is_active ? 'Active' : 'Disabled'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: STUDENT DIRECTORY */}
        {activeTab === 'students' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            {/* Filter Controls */}
            <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Filter by Class</label>
                <select 
                  value={filterClass} 
                  onChange={(e) => setFilterClass(e.target.value)} 
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="All">All Classes</option>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Filter by Section</label>
                <select 
                  value={filterSection} 
                  onChange={(e) => setFilterSection(e.target.value)} 
                  className="w-full mt-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="All">All Sections</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                  <option value="D">Section D</option>
                  <option value="E">Section E</option>
                </select>
              </div>
            </div>

            {/* Students Table */}
            {isFetchingStudents ? (
              <div className="py-12 text-center text-slate-400">
                 <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
                 <p className="text-sm font-bold">Loading students...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-semibold">
                <Search size={40} className="mx-auto text-slate-300 mb-2 opacity-80" />
                <p className="text-sm">No students found matching your filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                      <th className="pb-3 pl-2">Student Name</th>
                      <th className="pb-3">Class</th>
                      <th className="pb-3">Section</th>
                      <th className="pb-3">Parent Phone</th>
                      <th className="pb-3 text-right pr-2">Today&apos;s Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3 pl-2">
                          {/* Clicking the name opens the modal */}
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="font-bold text-indigo-600 hover:text-indigo-800 underline-offset-4 hover:underline text-left"
                          >
                            {student.child_name}
                          </button>
                        </td>
                        <td className="py-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{student.grade}</span>
                        </td>
                        <td className="py-3">{student.section || '-'}</td>
                        <td className="py-3 font-mono text-slate-500">{student.contact_phone}</td>
                        <td className="py-3 text-right pr-2">
                          <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            student.attendance_status === 'Present' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            {student.attendance_status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: GLOBAL NOTICES (NEW) */}
        {activeTab === 'notices' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm max-w-2xl">
            <div className="mb-6">
              <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                <Megaphone size={20} className="text-indigo-600" /> Publish Global Notice
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Publish an urgent alert or general notice to every parent&apos;s dashboard instantly.
              </p>
            </div>

            {noticeSuccess ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-fade-in">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <h4 className="text-emerald-700 font-black text-lg mb-1">Broadcast Successful!</h4>
                <p className="text-emerald-600 text-sm font-medium">All parents will now see this on their dashboards.</p>
              </div>
            ) : (
              <form onSubmit={handlePublishGlobalNotice} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Notice Title</label>
                  <input
                    type="text"
                    required
                    value={noticeTitle}
                    onChange={(e) => setNoticeTitle(e.target.value)}
                    placeholder="e.g., School Closed Tomorrow (Heavy Rain)"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-400">Message Content</label>
                  <textarea
                    required
                    rows="4"
                    value={noticeMessage}
                    onChange={(e) => setNoticeMessage(e.target.value)}
                    placeholder="Type the full announcement here..."
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-medium mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-50 resize-none"
                  ></textarea>
                </div>
                <button
                  type="submit"
                  disabled={isPublishing}
                  className={`w-full text-white font-bold py-3.5 rounded-xl transition shadow-md flex justify-center items-center gap-2 ${
                    isPublishing 
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isPublishing ? 'Publishing...' : 'Execute Global Broadcast'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* TAB 5: WHATSAPP FAILED ALERTS */}
        {activeTab === 'alerts' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="font-black text-slate-800 text-base">Failed Parent Notifications</h3>
                <p className="text-xs text-slate-500">
                  Students whose parents did not receive automated WhatsApp attendance alerts.
                </p>
              </div>
              <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-bold">
                {failedAlerts.length} Unresolved
              </span>
            </div>

            {failedAlerts.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-semibold">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm">All WhatsApp messages were delivered successfully!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold uppercase text-slate-400">
                      <th className="pb-3">Time</th>
                      <th className="pb-3">Student Name</th>
                      <th className="pb-3">Grade</th>
                      <th className="pb-3">Parent Phone</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                    {failedAlerts.map((alert) => (
                      <tr key={alert.id}>
                        <td className="py-3 font-mono">{alert.time}</td>
                        <td className="py-3 font-bold text-slate-900">{alert.student_name}</td>
                        <td className="py-3">
                          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{alert.grade}</span>
                        </td>
                        <td className="py-3 font-mono">{alert.parent_phone}</td>
                        <td className="py-3 text-right">
                          <a
                            href={`tel:${alert.parent_phone}`}
                            className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl font-bold hover:bg-indigo-100 transition"
                          >
                            <PhoneCall size={12} /> Call Parent
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>

      {/* STUDENT DETAILS MODAL OVERLAY */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 relative shadow-2xl border border-slate-200 transform transition-all">
            
            <button 
              onClick={() => setSelectedStudent(null)} 
              className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition"
            >
              <X size={18} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 leading-tight">{selectedStudent.child_name}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {selectedStudent.grade} {selectedStudent.section ? `â€¢ Sec ${selectedStudent.section}` : ''}
                </p>
              </div>
            </div>

            <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Date of Birth</span>
                <span className="text-sm font-bold text-slate-800">{selectedStudent.dob || 'Not Provided'}</span>
              </div>
              
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">Parent Contact</span>
                <span className="text-sm font-mono font-bold text-slate-800">{selectedStudent.contact_phone}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase">System Reg. Date</span>
                <span className="text-sm font-bold text-slate-800">
                  {new Date(selectedStudent.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="pt-1 flex flex-col">
                <span className="text-xs font-bold text-slate-400 uppercase mb-1">Assigned Tag Serial</span>
                <span className="text-sm font-mono font-bold text-indigo-700 bg-indigo-50 px-4 py-2.5 rounded-xl text-center tracking-widest border border-indigo-100 shadow-sm">
                  {/* Checks for direct serial, falling back to UUID if needed */}
                  {selectedStudent.serial_number || selectedStudent.tag_uuid || 'Awaiting Tag Assignment'}
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
}
