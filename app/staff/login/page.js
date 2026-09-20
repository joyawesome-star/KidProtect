'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ShieldCheck, UserCircle } from 'lucide-react';
import ForgotPinForm from '@/app/components/ForgotPinForm';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const PIN_EXPIRY_DAYS = 30;

export default function StaffLogin() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const pinRefs = useRef([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    
    if (!phone || !pin || !/^\d{6}$/.test(pin)) {
      setErrorMsg('Please enter your phone number and PIN.');
      return;
    }

    setIsAuthenticating(true);

    try {
      const { data, error } = await supabase
        .from('staff')
        .select('id, name, role, assigned_grade, phone, pin_hash, pin_changed_at, is_active')
        .eq('phone', phone.trim())
        .eq('pin_hash', pin.trim());

      if (error) throw error;

      const matchedUser = (data || []).find((row) => row.is_active);

      const account = (data || [])[0];
      const pinExpired = account?.pin_changed_at &&
        Date.now() - new Date(account.pin_changed_at).getTime() >= PIN_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

      if (account && pinExpired) {
        await supabase.from('staff').update({ is_active: false }).eq('id', account.id);
        throw new Error('Your PIN has expired after 30 days. Contact an administrator to reactivate your account.');
      }

      if (!matchedUser) {
        throw new Error('Unauthorized. Invalid username or password.');
      }

      localStorage.setItem('staff_phone', matchedUser.phone || '');
      localStorage.removeItem('staff_username');
      localStorage.setItem('staff_name', matchedUser.name);
      localStorage.setItem('staff_role', matchedUser.role);
      window.dispatchEvent(new Event('kidshield-session-start'));
      
      if (matchedUser.assigned_grade) {
        localStorage.setItem('staff_grade', matchedUser.assigned_grade);
      } else {
        localStorage.removeItem('staff_grade');
      }

      router.push('/staff/dashboard');

    } catch (err) {
      console.error('Login failed:', err);
      setErrorMsg(err.message || 'Failed to connect to the server.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-sm w-full text-center">
        
        {/* Header Icon */}
        <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
          <ShieldCheck size={32} />
        </div>
        
        <h2 className="text-2xl font-black text-indigo-900 mb-1">Staff Hub</h2>
        <p className="text-sm text-slate-500 mb-8">Authorized personnel only.</p>
        
        {/* Error Message Display */}
        {errorMsg && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <UserCircle size={20} />
            </div>
            <input
              type="text"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl text-left font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
              disabled={isAuthenticating}
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <ShieldCheck size={20} />
            </div>
            <div className="pl-12 flex gap-2" role="group" aria-label="Six digit PIN">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={(element) => { pinRefs.current[index] = element; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[index] || ''}
                  onChange={(e) => {
                    const digit = e.target.value.replace(/\D/g, '').slice(-1);
                    const nextPin = pin.split('');
                    nextPin[index] = digit;
                    setPin(nextPin.join('').slice(0, 6));
                    if (digit && index < 5) pinRefs.current[index + 1]?.focus();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !pin[index] && index > 0) pinRefs.current[index - 1]?.focus();
                  }}
                  className="h-12 w-9 rounded-xl border border-slate-200 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                  aria-label={`PIN digit ${index + 1}`}
                  disabled={isAuthenticating}
                />
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isAuthenticating}
            className={`w-full text-white font-bold py-3 rounded-xl shadow-md transition ${
              isAuthenticating 
                ? 'bg-indigo-400 cursor-not-allowed' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isAuthenticating ? 'Verifying...' : 'Access Hub'}
          </button>
        </form>
        <ForgotPinForm supabase={supabase} table="staff" />
        
        <p className="mt-8 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
          KidProtect Secure Access
        </p>
      </div>
    </div>
  );
}
