'use client';
import { useRef, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { CalendarDays, Trophy, Bell, User, MapPin, Lock, QrCode, Hash, Loader2, Globe } from 'lucide-react';
import ForgotPinForm from '@/app/components/ForgotPinForm';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ParentDashboard() {
  const [familyData, setFamilyData] = useState([]);
  const [activeChild, setActiveChild] = useState(null);
  const [isParentAuthenticated, setIsParentAuthenticated] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [notices, setNotices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' | 'rankings' | 'notices'

  // Login States
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const loginPinRefs = useRef([]);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // 1. FETCH PARENT'S CHILDREN FROM SUPABASE ON MOUNT
  useEffect(() => {
    async function loadParentData() {
      try {
        setIsLoading(true);
        const savedParentPhone = localStorage.getItem('parent_phone') || '';

        if (!savedParentPhone) {
          setIsLoading(false);
          return;
        }

        const { data: parentAccount, error: parentError } = await supabase
          .from('parent_accounts')
          .select('id, name, phone')
          .eq('phone', savedParentPhone)
          .maybeSingle();

        if (parentError) throw parentError;

        if (!parentAccount) {
          localStorage.removeItem('parent_phone');
          setIsLoading(false);
          return;
        }

        setIsParentAuthenticated(true);

        const { data: parentLinks, error: linksError } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', parentAccount.id);

        if (linksError) throw linksError;

        const studentIds = (parentLinks || []).map((link) => link.student_id);
        if (studentIds.length === 0) {
          setFamilyData([]);
          setIsLoading(false);
          return;
        }

        const { data: students, error } = await supabase
          .from('students')
          .select('*')
          .in('id', studentIds);

        if (error) throw error;

        if (students && students.length > 0) {
          const formatted = students.map(s => {
            // FIX: Safely combine grade and section to match the Teacher's exact format ("Class 2 - A")
            let fullGrade = s.grade || 'Class 1';
            if (s.section && s.section.trim() !== '' && s.section.trim() !== '-') {
              fullGrade = `${fullGrade} - ${s.section}`;
            }

            return {
              id: s.id,
              child_name: s.child_name || 'Student',
              grade: fullGrade, // This will now say "Class 2 - A" instead of just "Class 2"
              school_name: s.school_name || 'KidProtect Campus',
              tag_uuid: s.tag_uuid || 'Pending Allocation',
              serial_number: s.serial_number || 'N/A'
            };
          });

          setFamilyData(formatted);
          setActiveChild(formatted[0]); 
        }
      } catch (err) {
        console.error('Error fetching parent portal data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadParentData();
  }, []);

  // 2. FETCH ATTENDANCE & NOTICES WHEN ACTIVE CHILD CHANGES
  useEffect(() => {
    if (!activeChild?.id) return;

    async function fetchDashboardData() {
      // Fetch Attendance
      const { data: attData, error: attError } = await supabase
        .from('attendance_logs')
        .select('created_at')
        .eq('student_id', activeChild.id);

      if (!attError && attData) {
        const dates = attData.map(log => new Date(log.created_at).toISOString().split('T')[0]);
        setAttendanceLogs(dates);
      }

      // Fetch Notices: Both Class-Specific AND Global
      const { data: noticeData, error: noticeError } = await supabase
        .from('notices')
        .select('*')
        .or(`target_grade.eq."${activeChild.grade}",target_grade.eq.GLOBAL`)
        .order('created_at', { ascending: false });

      if (noticeError) {
        console.error("Supabase Error fetching notices:", noticeError);
        setNotices([]);
      } else if (noticeData) {
        setNotices(noticeData);
      }
    }

    fetchDashboardData();
  }, [activeChild]);

  // 3. SECURE LOGIN HANDLER
  const handleLogin = async () => {
    setLoginError('');
    if (!loginPhone || !/^\d{6}$/.test(loginPin)) {
      setLoginError('Please enter your phone number and PIN.');
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      const { data, error } = await supabase
        .from('parent_accounts')
        .select('id, name, phone, pin_hash, is_active')
        .eq('phone', loginPhone.trim())
        .eq('pin_hash', loginPin.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        localStorage.setItem('parent_phone', data.phone || '');
        localStorage.setItem('parent_name', data.name);
        window.dispatchEvent(new Event('kidshield-session-start'));
        window.location.reload();
      } else {
        setLoginError('Invalid username or password.');
      }
    } catch (err) {
      console.error('Parent login failed:', err);
      setLoginError('Failed to connect to database.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // RENDER: Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 font-sans p-4">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-indigo-900 font-bold tracking-wide">Loading Parent Portal...</p>
      </div>
    );
  }

  // RENDER: Secure Login Screen
  if (!isParentAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full text-center">
          <div className="h-12 w-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-1">Parent Portal Login</h2>
          <p className="text-xs text-slate-500 mb-6">Enter your credentials to view your children's dashboard.</p>
          
          {loginError && (
            <p className="text-xs text-red-600 font-semibold mb-4 bg-red-50 p-2 rounded-xl">{loginError}</p>
          )}

          <div className="space-y-3 mb-6">
            <input
              type="text"
              placeholder="Phone number"
              value={loginPhone}
              onChange={(e) => setLoginPhone(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <div className="flex justify-center gap-2" role="group" aria-label="Six digit PIN">
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
                  className="h-12 w-10 rounded-xl border border-slate-200 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 tracking-widest"
                  aria-label={`PIN digit ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition ${
              isLoggingIn ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isLoggingIn ? 'Verifying...' : 'Access Dashboard'}
          </button>
          <ForgotPinForm supabase={supabase} table="parent_accounts" />
        </div>
      </div>
    );
  }

  if (!activeChild) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full text-center">
          <div className="h-12 w-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User size={24} />
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">No child linked yet</h2>
          <p className="text-sm text-slate-500 mb-6">Your parent account is active, but no student has been linked to it. Please contact your school administrator.</p>
          <button
            onClick={() => {
              localStorage.removeItem('parent_phone');
              localStorage.removeItem('parent_name');
              window.location.reload();
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  // --- CALENDAR LOGIC ---
  const today = new Date();
  const currentMonthName = today.toLocaleString('default', { month: 'long' });
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => `blank-${i}`);
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      
      {/* APP BAR & MULTI-CHILD SWITCHER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm px-4 py-3">
        <div className="flex justify-between items-center mb-3">
          <h1 className="font-black text-xl tracking-tight text-indigo-900">KidProtect</h1>
          <button 
            onClick={() => {
              localStorage.removeItem('parent_username');
              localStorage.removeItem('parent_phone');
              localStorage.removeItem('parent_name');
              window.location.reload();
            }}
            className="text-xs font-semibold text-slate-400 hover:text-red-600 transition"
          >
            Logout
          </button>
        </div>

        {/* Multi-Child Switcher */}
        {familyData.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x touch-pan-x hide-scrollbar">
            {familyData.map((child) => (
              <button
                key={child.id}
                onClick={() => setActiveChild(child)}
                className={`snap-start shrink-0 flex items-center gap-3 px-4 py-2 rounded-2xl border transition-all ${
                  activeChild.id === child.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  activeChild.id === child.id ? 'bg-white/20' : 'bg-slate-100'
                }`}>
                  {child.child_name.charAt(0)}
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold leading-tight">{child.child_name}</p>
                  <p className={`text-[10px] font-medium uppercase tracking-wider ${
                    activeChild.id === child.id ? 'text-indigo-200' : 'text-slate-400'
                  }`}>
                    {child.grade}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="p-4 space-y-6 max-w-md mx-auto mt-2 animate-fade-in">
        
        {/* TOP LEFT IDENTITY CARD */}
        <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="h-16 w-16 bg-indigo-600 text-white rounded-2xl flex items-center justify-center text-3xl font-black shadow-md border-4 border-indigo-100 shrink-0">
              {activeChild.child_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-black text-slate-800 leading-tight truncate">{activeChild.child_name}</h2>
              <p className="text-slate-500 font-bold text-xs flex items-center gap-1 mt-1 truncate">
                <MapPin size={12} className="text-indigo-500 shrink-0" /> {activeChild.school_name} 
              </p>
              <div className="mt-3 bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><User size={12}/> Class</span>
                  {/* Now properly displays Class 2 - A */}
                  <span className="font-black text-slate-700">{activeChild.grade}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1"><Hash size={12}/> Serial</span>
                  <span className="font-mono font-bold text-indigo-600">{activeChild.serial_number}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- TAB CONTENT: ATTENDANCE --- */}
        {activeTab === 'attendance' && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                <CalendarDays size={20} className="text-indigo-600" />
                {currentMonthName} {year}
              </h3>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-3 py-1 rounded-full uppercase tracking-wider">
                Live Data
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black text-slate-400 uppercase mb-3">
              <div>Su</div><div>Mo</div><div>Tu</div><div>We</div><div>Th</div><div>Fr</div><div>Sa</div>
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {blanks.map(blank => (
                <div key={blank} className="h-10"></div>
              ))}
              
              {daysArray.map((day) => {
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isPresent = attendanceLogs.includes(dateString);

                return (
                  <div
                    key={day}
                    className={`h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                      isPresent
                        ? 'bg-emerald-500 text-white shadow-md scale-105'
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}
                  >
                    {day}
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 bg-emerald-500 rounded-full shadow-sm"></span>
                <span className="text-slate-600 font-bold">Present</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 bg-slate-100 border border-slate-200 rounded-full"></span>
                <span className="text-slate-400 font-bold">No Record / Holiday</span>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: RANKINGS --- */}
        {activeTab === 'rankings' && (
          <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 text-center animate-fade-in relative">
            <h3 className="font-black text-slate-800 text-2xl mb-1">Class Leaderboard</h3>
            <p className="text-sm text-slate-500 font-medium mb-12">Top attendance performers in {activeChild.grade}</p>
            
            <div className="flex items-end justify-center gap-4 sm:gap-6 min-h-[220px] border-b-4 border-slate-100 pb-0 mb-8">
              
              <div className="flex flex-col items-center w-24 animate-podium-2">
                <div className="h-12 w-12 bg-slate-100 rounded-full mb-3 border-4 border-slate-300 flex items-center justify-center font-bold text-slate-500 text-sm shadow-md relative z-10">
                  AR
                </div>
                <div className="w-full bg-gradient-to-t from-slate-300 to-slate-200 h-28 rounded-t-2xl shadow-inner flex items-start justify-center pt-3 relative">
                  <span className="text-4xl font-black text-slate-400 opacity-60">2</span>
                </div>
              </div>

              <div className="flex flex-col items-center w-28 animate-podium-1">
                <Trophy size={36} className="text-amber-500 mb-2 z-10 drop-shadow-md" />
                <div className="h-16 w-16 bg-amber-100 rounded-full mb-3 border-4 border-amber-400 flex items-center justify-center font-black text-amber-700 text-xl shadow-xl relative z-10 ring-4 ring-amber-50">
                  {activeChild.child_name.charAt(0)}
                </div>
                <div className="w-full bg-gradient-to-t from-amber-400 to-amber-300 h-40 rounded-t-2xl shadow-inner flex items-start justify-center pt-3 relative">
                  <span className="text-5xl font-black text-amber-600 opacity-60">1</span>
                </div>
              </div>

              <div className="flex flex-col items-center w-24 animate-podium-3">
                <div className="h-12 w-12 bg-orange-50 rounded-full mb-3 border-4 border-orange-300 flex items-center justify-center font-bold text-orange-600 text-sm shadow-md relative z-10">
                  SK
                </div>
                <div className="w-full bg-gradient-to-t from-orange-300 to-orange-200 h-20 rounded-t-2xl shadow-inner flex items-start justify-center pt-3 relative">
                  <span className="text-4xl font-black text-orange-400 opacity-60">3</span>
                </div>
              </div>

            </div>
            
            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl flex items-center justify-start gap-4 text-left shadow-sm">
              <div className="bg-amber-100 p-3 rounded-full text-amber-600 shrink-0">
                <Trophy size={24} />
              </div>
              <div>
                <p className="font-black text-amber-800 text-lg">You are in 1st Place!</p>
                <p className="text-xs text-amber-600 mt-1 font-medium leading-relaxed">Keep attending daily to maintain your streak.</p>
              </div>
            </div>

            <style jsx>{`
              @keyframes smoothRise {
                0% { transform: translateY(40px); opacity: 0; }
                100% { transform: translateY(0); opacity: 1; }
              }
              .animate-podium-1 { animation: smoothRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
              .animate-podium-2 { animation: smoothRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards; opacity: 0; }
              .animate-podium-3 { animation: smoothRise 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s forwards; opacity: 0; }
            `}</style>
          </div>
        )}

        {/* --- TAB CONTENT: NOTICES --- */}
        {activeTab === 'notices' && (
          <div className="space-y-4 animate-fade-in">
            <h3 className="font-black text-slate-800 text-xl px-2">Notice Board</h3>
            
            {notices.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
                <Bell size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700">All Caught Up!</p>
                <p className="text-xs text-slate-500 mt-1">No new notices from the school.</p>
              </div>
            ) : (
              notices.map((notice) => (
                <div key={notice.id} className={`bg-white p-5 rounded-3xl shadow-sm border border-l-4 ${notice.target_grade === 'GLOBAL' ? 'border-l-amber-500' : 'border-l-indigo-500'} border-slate-200 relative overflow-hidden`}>
                  
                  {/* Subtle Global Background Decoration */}
                  {notice.target_grade === 'GLOBAL' && (
                    <Globe size={100} className="absolute -bottom-6 -right-6 text-amber-50 opacity-50 pointer-events-none" />
                  )}

                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div>
                      <h4 className="font-black text-slate-800">{notice.title}</h4>
                      {notice.target_grade === 'GLOBAL' && (
                         <span className="inline-block mt-1 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                           School Admin Notice
                         </span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 ml-4">
                      {new Date(notice.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed relative z-10">
                    {notice.message}
                  </p>
                </div>
              ))
            )}
          </div>
        )}

      </main>

      {/* BOTTOM NAVIGATION */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-3 z-20 pb-safe">
        <button 
          onClick={() => setActiveTab('attendance')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'attendance' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <CalendarDays size={22} className={activeTab === 'attendance' ? 'animate-bounce' : ''} />
          <span className="text-[10px] font-black mt-1 uppercase tracking-wider">Attendance</span>
        </button>
        <button 
          onClick={() => setActiveTab('rankings')}
          className={`flex flex-col items-center p-2 rounded-xl transition ${activeTab === 'rankings' ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Trophy size={22} className={activeTab === 'rankings' ? 'animate-bounce' : ''} />
          <span className="text-[10px] font-black mt-1 uppercase tracking-wider">Rankings</span>
        </button>
        <button 
          onClick={() => setActiveTab('notices')}
          className={`flex flex-col items-center p-2 rounded-xl transition relative ${activeTab === 'notices' ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <div className="relative">
            <Bell size={22} className={activeTab === 'notices' ? 'animate-bounce' : ''} />
            {notices.length > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-white"></span>}
          </div>
          <span className="text-[10px] font-black mt-1 uppercase tracking-wider">Notices</span>
        </button>
      </nav>

    </div>
  );
}
