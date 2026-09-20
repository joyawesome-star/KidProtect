'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Search, Users, Download, LogOut, ShieldCheck } from 'lucide-react';

export default function StaffDashboard() {
  const router = useRouter();
  const [staffData, setStaffData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Verify Authentication
    const username = localStorage.getItem('staff_username');
    const phone = localStorage.getItem('staff_phone');
    
    if (!username && !phone) {
      router.push('/staff/login');
      return;
    }

    setStaffData({
      name: localStorage.getItem('staff_name') || 'Staff Member',
      role: localStorage.getItem('staff_role') || 'teacher',
      grade: localStorage.getItem('staff_grade') || null,
    });
    
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('staff_phone');
    localStorage.removeItem('staff_username');
    localStorage.removeItem('staff_name');
    localStorage.removeItem('staff_role');
    localStorage.removeItem('staff_grade');
    router.push('/staff/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900 pb-20">
      
      {/* Header Area */}
      <header className="mb-6 bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck size={18} className="text-emerald-500" />
            <h1 className="text-xl font-black text-indigo-900 leading-none">Staff Hub</h1>
          </div>
          <p className="text-lg font-bold text-slate-700 mt-2">{staffData.name}</p>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">
            {staffData.role === 'admin' 
              ? 'Administrator (All Classes)' 
              : `Class Teacher • ${staffData.grade}`}
          </p>
        </div>
        
        <button 
          onClick={handleLogout}
          className="p-2 bg-rose-50 text-rose-600 rounded-full hover:bg-rose-100 transition"
          title="Logout"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* 4-Module Action Grid */}
      <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">
        Quick Actions
      </h2>
      
      <div className="grid grid-cols-2 gap-4">
        
        {/* Module 1: Attendance Scanner */}
        <button 
          onClick={() => router.push('/staff/attendance')}
          className="bg-indigo-600 text-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center gap-3 hover:bg-indigo-700 transition active:scale-95"
        >
          <QrCode size={40} />
          <span className="font-bold text-sm text-center leading-tight">Take<br/>Attendance</span>
        </button>

        {/* Module 2: Download CSV */}
        <button 
          onClick={() => router.push('/staff/exports')}
          className="bg-emerald-500 text-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center gap-3 hover:bg-emerald-600 transition active:scale-95"
        >
          <Download size={40} />
          <span className="font-bold text-sm text-center leading-tight">Export<br/>Daily CSV</span>
        </button>

        {/* Module 3: Parents Meeting */}
        <button 
          onClick={() => router.push('/staff/meetings')}
          className="bg-amber-500 text-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center gap-3 hover:bg-amber-600 transition active:scale-95"
        >
          <Users size={40} />
          <span className="font-bold text-sm text-center leading-tight">Parents<br/>Meeting</span>
        </button>

        {/* Module 4: Lost & Found */}
        <button 
          onClick={() => router.push('/staff/lost-found')}
          className="bg-rose-500 text-white p-6 rounded-3xl shadow-md flex flex-col items-center justify-center gap-3 hover:bg-rose-600 transition active:scale-95"
        >
          <Search size={40} />
          <span className="font-bold text-sm text-center leading-tight">Lost &<br/>Found</span>
        </button>

      </div>
    </div>
  );
}