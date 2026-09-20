'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Users, UserCircle, Building } from 'lucide-react';

export default function UniversalLandingPage() {
  const router = useRouter();
  const [animateFooter, setAnimateFooter] = useState(false);

  // Triggers the animation exactly once when the page first loads
  useEffect(() => {
    setAnimateFooter(true);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col items-center justify-center p-4">
      
      {/* App Branding */}
      <div className="mb-6 flex w-full max-w-md items-center justify-center gap-0 sm:gap-1">
        <Image 
          src="/logos/kidprotect.jpg" 
          alt="KidProtect safety mark" 
          width={900} 
          height={900} 
          priority
          className="h-32 w-32 shrink-0 object-contain mix-blend-multiply sm:h-44 sm:w-44" 
        />
        <div className="-ml-1 min-w-0 sm:ml-0">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">Kid<span className="text-emerald-500">Protect</span></h1>
          <p className="mt-1 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 sm:text-[10px]">Smart Safety for Every Child</p>
        </div>
      </div>

      <div className="w-full max-w-md space-y-4">
        <button
          onClick={() => router.push('/register/parent/dashboard')}
          className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5 hover:border-indigo-600 hover:shadow-md transition-all group text-left"
        >
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors shrink-0">
            <Users size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Parent Portal</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">Check attendance, notices & ranks</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/staff/login')}
          className="w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-5 hover:border-emerald-500 hover:shadow-md transition-all group text-left"
        >
          <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors shrink-0">
            <UserCircle size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800">Staff Hub</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">Take attendance & manage classes</p>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin')}
          className="w-full bg-slate-900 p-6 rounded-3xl shadow-md border border-slate-800 flex items-center gap-5 hover:bg-black hover:shadow-lg transition-all group text-left mt-6"
        >
          <div className="h-14 w-14 bg-slate-800 text-amber-400 rounded-2xl flex items-center justify-center group-hover:bg-amber-400 group-hover:text-slate-900 transition-colors shrink-0">
            <Building size={28} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">School Admin</h2>
            <p className="text-xs font-semibold text-slate-400 mt-1">Manage staff, students & system</p>
          </div>
        </button>
      </div>

      {/* Global Footer with Eastern Automations Logo (Animated & Single Line) */}
      <div className="mt-12 flex flex-col items-center text-center overflow-hidden">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Secure Access Gateway
        </p>
        
        {/* Switched to flex-row to put text and logo on the same line */}
        <div 
          className={`flex flex-row items-center justify-center gap-3 transition-all duration-1000 ease-out delay-300 transform ${
            animateFooter ? 'opacity-80 translate-y-0 hover:opacity-100' : 'opacity-0 translate-y-6'
          }`}
        >
          <span className="text-[10px] font-bold text-slate-500 whitespace-nowrap">POWERED BY</span>
          <Image 
            src="/logos/eastern_automations.png" 
            alt="Eastern Automations" 
            width={300} 
            height={100} 
            className="w-auto h-10 md:h-12 object-contain"
          />
        </div>
      </div>

    </div>
  );
}