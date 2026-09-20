'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function PrincipalDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedClass, setSelectedClass] = useState('1-A');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- LIVE DATABASE STATES ---
  const [totalEnrolled, setTotalEnrolled] = useState(0);
  const [classData, setClassData] = useState({
    '1-A': { attendance: '0/0', teacher: 'Loading...', phone: '...' },
    '1-B': { attendance: '0/0', teacher: 'Loading...', phone: '...' },
    '2-A': { attendance: '0/0', teacher: 'Loading...', phone: '...' },
    '2-B': { attendance: '0/0', teacher: 'Loading...', phone: '...' },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Set sidebar to open by default only on desktop
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true);
    }
  }, []);

  // --- FETCH LIVE DATA FROM SUPABASE ---
  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      try {
        // 1. Get Total Enrolled Students
        const { count: studentCount, error: studentError } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true });
        
        if (!studentError && studentCount !== null) {
          setTotalEnrolled(studentCount);
        }

        // 2. Fetch Staff (Teachers) to assign to classes
        const { data: staff, error: staffError } = await supabase
          .from('staff')
          .select('*')
          .eq('role', 'teacher');

        if (!staffError && staff && staff.length > 0) {
          // Map real teachers to the mock classes for now
          setClassData({
            '1-A': { attendance: '42/45', teacher: staff[0]?.name || 'Pending Assignment', phone: staff[0]?.phone || 'N/A' },
            '1-B': { attendance: '44/45', teacher: staff[1]?.name || 'Pending Assignment', phone: staff[1]?.phone || 'N/A' },
            '2-A': { attendance: '39/40', teacher: staff[2]?.name || 'Pending Assignment', phone: staff[2]?.phone || 'N/A' },
            '2-B': { attendance: '41/42', teacher: staff[3]?.name || 'Pending Assignment', phone: staff[3]?.phone || 'N/A' },
          });
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const handleNavigation = (id) => {
    setActiveTab(id);
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  // Mock Alerts & Analytics (To be connected later)
  const failedAlerts = [
    { id: 1, name: 'Rahul Hembram', class: '1-A', issue: 'Delivery Failed' },
    { id: 2, name: 'Sourav Pal', class: '3-B', issue: 'Invalid Number' },
  ];
  const topAttendance = [
    { name: 'Sneha Roy', class: '1-B', rate: '100%' },
    { name: 'Arpan Dey', class: '4-A', rate: '99.5%' },
  ];
  const lowAttendance = [
    { name: 'Amit Bauri', class: '2-A', rate: '74%' },
    { name: 'Puja Tudu', class: '5-B', rate: '71%' },
  ];

  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'classes', icon: '🏫', label: 'Classrooms' },
    { id: 'alerts', icon: '⚠️', label: 'Failed Alerts' },
    { id: 'analytics', icon: '📈', label: 'Analytics' },
    { id: 'system', icon: '⚙️', label: 'System Setup' },
  ];

  // Placeholder logic for present/absent based on actual enrolled count
  const simulatedPresent = Math.floor(totalEnrolled * 0.93);
  const simulatedAbsent = totalEnrolled - simulatedPresent;

  return (
    <div 
      className="h-screen w-full font-sans relative flex overflow-hidden bg-slate-900"
      style={{
        backgroundImage: "url('/principal-bg.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-slate-900/60 md:bg-slate-900/50 pointer-events-none z-0 backdrop-blur-[2px]"></div>

      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* --- LEFT SIDEBAR --- */}
      <aside 
        className={`absolute lg:relative z-30 h-screen bg-slate-900/95 lg:bg-white/10 backdrop-blur-xl shadow-2xl transition-all duration-300 ease-in-out overflow-hidden border-white/20 flex-shrink-0 ${
          isSidebarOpen ? 'w-72 border-r' : 'w-0 border-r-0'
        }`}
      >
        <div className="w-72 h-full flex flex-col">
          <div className="p-6 md:p-8 border-b border-white/10 flex-shrink-0 flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-3">
                <span className="bg-white/20 p-2 rounded-lg border border-white/30 backdrop-blur-md">🛡️</span> 
                KIDPROTECT
              </h1>
              <p className="text-emerald-400 text-[10px] md:text-xs font-bold tracking-widest mt-2 uppercase">Principal Terminal</p>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-white/50 hover:text-white p-2"
            >✕</button>
          </div>

          <nav className="flex-1 px-4 py-6 md:py-8 space-y-2 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-300 ease-out whitespace-nowrap ${
                  activeTab === item.id 
                    ? 'bg-white/20 text-white shadow-lg border border-white/30 translate-x-2' 
                    : 'text-slate-300 hover:bg-white/10 hover:text-white hover:translate-x-1'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="px-4 py-4 flex-shrink-0">
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 rounded-xl p-4 backdrop-blur-md">
              <h4 className="text-amber-400 font-bold text-sm flex items-center gap-2 whitespace-nowrap">
                <span>⭐</span> Enterprise License
              </h4>
              <p className="text-slate-300 text-xs mt-1 mb-3 font-medium">
                Your campus license expires in <span className="text-amber-400 font-bold">45 days</span>.
              </p>
              <button className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-black text-sm rounded-lg transition-colors shadow-lg shadow-amber-500/20 whitespace-nowrap">
                Renew Yearly Plan
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 border-t border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-500 to-emerald-400 border-2 border-white/50 flex-shrink-0 shadow-inner"></div>
              <div>
                <p className="text-white font-bold text-sm">Dr. S. Chatterjee</p>
                <p className="text-slate-400 text-xs font-semibold">Campus Admin</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* --- MAIN CANVAS --- */}
      <main className="relative z-10 flex-1 h-screen overflow-y-auto p-4 md:p-8 lg:p-10 scroll-smooth">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-6 md:mb-10 flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div className="flex items-center gap-4 md:gap-6">
              <button 
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-3.5 bg-white/10 border border-white/20 rounded-xl text-white hover:bg-white/20 transition-all backdrop-blur-md shadow-lg group focus:outline-none focus:ring-2 focus:ring-white/30"
              >
                <div className="w-5 h-4 flex flex-col justify-between items-center">
                  <span className={`block h-0.5 bg-white transition-all duration-300 rounded ${isSidebarOpen ? 'w-5' : 'w-4 group-hover:w-5'}`}></span>
                  <span className={`block h-0.5 bg-white transition-all duration-300 rounded ${isSidebarOpen ? 'w-3' : 'w-5'}`}></span>
                  <span className={`block h-0.5 bg-white transition-all duration-300 rounded ${isSidebarOpen ? 'w-5' : 'w-4 group-hover:w-5'}`}></span>
                </div>
              </button>
              
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white capitalize drop-shadow-md">
                  {navItems.find(i => i.id === activeTab)?.label}
                </h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1 font-medium">Real-time data synchronization active.</p>
              </div>
            </div>

            <div className="self-start md:self-auto px-3 py-1.5 md:px-4 md:py-2 bg-emerald-500/20 border border-emerald-500/50 rounded-lg backdrop-blur-md text-emerald-400 font-bold text-xs md:text-sm flex items-center gap-2 shadow-lg w-fit">
              <span className="relative flex h-2.5 w-2.5 md:h-3 md:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 md:h-3 md:w-3 bg-emerald-500"></span>
              </span>
              System Secure
            </div>
          </header>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 animate-fade-in-up">
              <div className="bg-white/10 backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-2xl border border-white/20 hover:bg-white/15 transition-all">
                <h3 className="text-slate-300 text-xs md:text-sm font-bold uppercase tracking-wider mb-2">Today's Attendance</h3>
                <div className="mt-2 flex items-baseline gap-3 md:gap-4">
                  <span className="text-5xl md:text-6xl font-black text-white drop-shadow-lg">93%</span>
                  <span className="text-emerald-400 text-xs md:text-sm font-bold px-2 py-1 md:px-3 bg-emerald-500/20 rounded-full border border-emerald-500/30">▲ +2%</span>
                </div>
                <p className="text-xs md:text-sm text-slate-400 mt-4 md:mt-6 font-semibold">Campus wide daily average generated from live scans.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-2xl border border-white/20 flex flex-col justify-between hover:bg-white/15 transition-all">
                <h3 className="text-slate-300 text-xs md:text-sm font-bold uppercase tracking-wider mb-4">Live Campus Roster</h3>
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <span className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
                      {isLoading ? '...' : simulatedPresent}
                    </span>
                    <span className="text-emerald-400 text-xs md:text-sm ml-1 md:ml-2 font-bold uppercase">Present</span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl md:text-3xl font-black text-white drop-shadow-lg">
                      {isLoading ? '...' : simulatedAbsent}
                    </span>
                    <span className="text-rose-400 text-xs md:text-sm ml-1 md:ml-2 font-bold uppercase">Absent</span>
                  </div>
                </div>
                <div className="w-full h-3 md:h-4 bg-black/40 rounded-full overflow-hidden flex shadow-inner border border-white/10">
                  <div className="bg-emerald-500 h-full transition-all duration-1000 ease-out" style={{ width: '93%' }}></div>
                  <div className="bg-rose-500 h-full transition-all duration-1000 ease-out" style={{ width: '7%' }}></div>
                </div>
                <div className="flex justify-between items-center mt-3 md:mt-4">
                  <span className="text-xs md:text-sm text-slate-400 font-bold">
                    Total Enrolled: {isLoading ? 'Syncing...' : totalEnrolled}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CLASSROOMS */}
          {activeTab === 'classes' && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5 md:p-8 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 md:mb-8 border-b border-white/10 pb-4 md:pb-6">
                <h3 className="text-lg md:text-xl font-bold text-white">Section Administration</h3>
                <select 
                  className="w-full sm:w-auto px-4 py-2 md:py-3 border border-white/30 rounded-lg text-sm bg-black/40 text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-xl cursor-pointer"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  <option className="bg-slate-900" value="1-A">Class 1 - Section A</option>
                  <option className="bg-slate-900" value="1-B">Class 1 - Section B</option>
                  <option className="bg-slate-900" value="2-A">Class 2 - Section A</option>
                  <option className="bg-slate-900" value="2-B">Class 2 - Section B</option>
                </select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
                <div className="bg-white/5 p-5 md:p-6 rounded-xl border border-white/10 shadow-inner">
                  <h4 className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 md:mb-4">Today's Roster</h4>
                  <div className="flex items-end gap-2 md:gap-3">
                    <span className="text-4xl md:text-5xl font-black text-white drop-shadow-md">
                      {classData[selectedClass]?.attendance}
                    </span>
                    <span className="text-emerald-400 text-xs md:text-sm font-bold mb-1 md:mb-2 uppercase">Present</span>
                  </div>
                </div>
                <div className="bg-blue-500/10 p-5 md:p-6 rounded-xl border border-blue-500/30 shadow-lg">
                  <h4 className="text-xs md:text-sm font-bold text-blue-300 uppercase tracking-wider mb-2 md:mb-4">Assigned Commander</h4>
                  <p className="font-black text-xl md:text-2xl text-white drop-shadow-md">
                    {classData[selectedClass]?.teacher}
                  </p>
                  <p className="text-blue-300 font-bold mt-1 md:mt-2 text-sm md:text-base">📞 {classData[selectedClass]?.phone}</p>
                  <button className="mt-4 md:mt-6 w-full py-2.5 md:py-3 bg-white/10 border border-white/20 text-white rounded-lg font-bold hover:bg-white/20 transition-colors shadow-sm text-sm md:text-base">
                    Reassign Teacher
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FAILED ALERTS */}
          {activeTab === 'alerts' && (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5 md:p-8 animate-fade-in-up">
              <h3 className="text-lg md:text-xl font-bold text-rose-400 mb-4 md:mb-6 flex items-center gap-2">
                ⚠️ Critical Delivery Failures
              </h3>
              <div className="space-y-3 md:space-y-4">
                {failedAlerts.map(alert => (
                  <div key={alert.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 md:p-6 border border-white/10 rounded-xl bg-black/20 hover:bg-black/40 transition-all shadow-md">
                    <div>
                      <p className="font-black text-base md:text-lg text-white">{alert.name}</p>
                      <p className="text-xs md:text-sm text-slate-400 font-semibold mt-1">Class {alert.class} • <span className="text-rose-400">{alert.issue}</span></p>
                    </div>
                    <button className="w-full sm:w-auto px-4 md:px-6 py-2.5 md:py-3 bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg font-bold hover:bg-rose-500/40 transition-colors text-sm">
                      Ping Teacher
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 animate-fade-in-up">
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5 md:p-8">
                <h3 className="text-xs md:text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 md:mb-6">🔴 Action Required (&lt; 75%)</h3>
                <div className="space-y-3 md:space-y-4">
                  {lowAttendance.map((student, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 md:py-3 border-b border-white/10 last:border-0 hover:px-2 transition-all">
                      <span className="text-sm md:text-base font-bold text-white drop-shadow-sm">{student.name} <span className="text-slate-400 text-xs md:text-sm">({student.class})</span></span>
                      <span className="text-sm md:text-base font-black text-rose-400">{student.rate}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-6 w-full py-2.5 md:py-3 bg-white/5 border border-white/10 text-white rounded-lg font-bold hover:bg-white/10 transition-colors shadow-sm text-sm">
                  Export Warning PDFs
                </button>
              </div>

              <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-5 md:p-8">
                <h3 className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 md:mb-6">🟢 Campus Honor Roll</h3>
                <div className="space-y-3 md:space-y-4">
                  {topAttendance.map((student, idx) => (
                    <div key={idx} className="flex justify-between items-center py-2 md:py-3 border-b border-white/10 last:border-0 hover:px-2 transition-all">
                      <span className="text-sm md:text-base font-bold text-white drop-shadow-sm">{student.name} <span className="text-slate-400 text-xs md:text-sm">({student.class})</span></span>
                      <span className="text-sm md:text-base font-black text-emerald-400">{student.rate}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: SYSTEM */}
          {activeTab === 'system' && (
            <div className="bg-white/10 backdrop-blur-xl p-5 md:p-8 rounded-2xl shadow-2xl border border-white/20 animate-fade-in-up">
              <div className="max-w-2xl">
                <h3 className="text-lg md:text-xl font-bold text-white mb-2">Batch Lifecycle Architecture</h3>
                <p className="text-xs md:text-sm text-slate-400 font-semibold mb-6 md:mb-8">Permanently archive outgoing batches. This action removes associated QR assets from active scanning routes.</p>
                
                <label className="block text-xs md:text-sm font-bold text-slate-300 mb-2">Target Asset Group</label>
                <select className="w-full p-3 md:p-4 border border-white/20 rounded-xl bg-black/40 text-white font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 mb-4 md:mb-6 backdrop-blur-xl text-sm">
                  <option className="bg-slate-900">Class 10 - Passout 2026</option>
                  <option className="bg-slate-900">Class 12 - Passout 2026</option>
                </select>
                
                <button className="w-full md:w-auto px-6 md:px-8 py-3 md:py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl border border-rose-400/50 transition-colors shadow-lg shadow-rose-900/50 text-sm md:text-base">
                  Execute Batch Archive
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
