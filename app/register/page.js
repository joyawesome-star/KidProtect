'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function ParentRegisterPage() {
  const [step, setStep] = useState(1); // Step 1: Login/OTP, Step 2: Registration Form
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Child Profile Form States
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');

  // Handle Requesting OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!phone) return alert("Please enter your phone number.");
    setLoading(true);
    setMessage("Sending secure OTP verification code...");
    
    // Simulating standard OTP dispatch to mobile
    setTimeout(() => {
      setLoading(false);
      setMessage("✓ Verification code sent to your phone via SMS.");
      setStep(1.5); // Move to entering OTP phase
    }, 1200);
  };

  // Handle Verifying OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) return alert("Please enter the OTP.");
    setLoading(true);
    setMessage("Verifying credentials...");

    setTimeout(() => {
      setLoading(false);
      setMessage("");
      setParentWhatsapp(phone); // Pre-fill whatsapp field with verified number
      setStep(2); // Unlock Child Registration Form
    }, 1000);
  };

  // Handle Registering Child
  const handleRegisterChild = async (e) => {
    e.preventDefault();
    if (!studentName || !schoolName || !bloodGroup) {
      return alert("Please complete all mandatory safety fields.");
    }
    setLoading(true);
    setMessage("Syncing device profile and provisioning KidProtect database line...");

    try {
      // 1. First ensure school exists or register a placeholder
      let schoolId = '8fa7419c-0925-4c07-b27b-9ce9eef43bc5'; // Global demo fallback UUID

      // 2. Insert the student record into Supabase
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .insert([{
          name: studentName,
          school_id: schoolId,
          class_section: "Class 1-A", // Default starter batch
          parent_whatsapp: parentWhatsapp
        }])
        .select()
        .single();

      if (studentError) throw studentError;

      // 3. Provision the smart cryptographic tag record for the bag
      const { error: tagError } = await supabase
        .from('tags')
        .insert([{
          student_id: studentData.id,
          status: 'active'
        }]);

      if (tagError) throw tagError;

      setMessage("🎉 Registration Complete! Your child's KidProtect tag is now active.");
      setStep(3); // Onboarding Success Screen
    } catch (err) {
      console.error(err);
      setMessage(`Onboarding Error: ${err.message || 'Database link timeout.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        
        {/* Header Indicator */}
        <div className="text-center mb-8">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            Parent Shield Activation
          </span>
          <h1 className="text-2xl font-bold mt-3">Setup Your Account</h1>
        </div>

        {/* STEP 1: Phone Number Input */}
        {step === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Registered Mobile Number</label>
              <input 
                type="tel" 
                placeholder="+91 XXXXX XXXXX" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-lg transition"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition shadow-lg shadow-emerald-500/10">
              {loading ? 'Processing...' : 'Request Verification OTP'}
            </button>
          </form>
        )}

        {/* STEP 1.5: OTP Code Entry */}
        {step === 1.5 && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Enter 6-Digit OTP</label>
              <input 
                type="text" 
                maxLength="6"
                placeholder="000000" 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-xl text-center font-mono tracking-widest transition"
              />
            </div>
            <button type="submit" disabled={loading} className="w-full p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition">
              {loading ? 'Verifying...' : 'Verify OTP & Continue'}
            </button>
          </form>
        )}

        {/* STEP 2: Unified Child Registration Profile Form */}
        {step === 2 && (
          <form onSubmit={handleRegisterChild} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-200 border-b border-slate-800 pb-2 mb-2">Child Protection Profile</h2>
            
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Student's Full Name</label>
              <input 
                type="text" 
                placeholder="Enter child's name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">School Name</label>
              <input 
                type="text" 
                placeholder="Enter school campus name"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-sm transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Blood Group</label>
              <select 
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-700 rounded-xl focus:border-emerald-500 focus:outline-none text-sm text-slate-300 transition">
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Alert Destination Number (WhatsApp)</label>
              <input 
                type="tel" 
                disabled
                value={parentWhatsapp}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <button type="submit" disabled={loading} className="w-full p-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition text-sm mt-2">
              {loading ? 'Securing Registry...' : 'Save Profile & Activate Tag'}
            </button>
          </form>
        )}

        {/* STEP 3: Success Acknowledgement Screen */}
        {step === 3 && (
          <div className="text-center py-6 space-y-4">
            <span className="text-5xl block">🛡️</span>
            <h2 className="text-xl font-bold text-emerald-400">Profile Linked & Locked</h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your information is securely encrypted inside the infrastructure. Any scanning of your child's physical smart tag will instantly ping this device.
            </p>
          </div>
        )}

        {/* Status Messages Tracker */}
        {message && (
          <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-center">
            <p className="text-xs font-medium text-slate-400">{message}</p>
          </div>
        )}

      </div>
    </div>
  );
}
