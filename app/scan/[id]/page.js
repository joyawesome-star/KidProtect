'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, UserPlus, CheckCircle2, AlertTriangle, Loader2, 
  IdCard, HeartPulse, Phone, MapPin, Users, Edit3, Lock, X, KeyRound,
  PhoneCall, MessageCircle, EyeOff
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export default function QRScanReceiver() {
  const params = useParams();
  const scanId = params.id;

  const [isLoading, setIsLoading] = useState(true);
  const [tagData, setTagData] = useState(null);
  const [studentData, setStudentData] = useState(null);
  const [error, setError] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [verificationStep, setVerificationStep] = useState(false);
  const [verifyPin, setVerifyPin] = useState('');
  const [verifyError, setVerifyError] = useState('');

  // UPDATED: Added 'section' to the initial form state
  const [formData, setFormData] = useState({
    child_name: '', dob: '', grade: '', section: '', parent_name: '', contact_phone: '', 
    emergency_phone: '', address: '', blood_group: '', allergies: '', 
    medical_notes: '', pickup_persons: '', security_pin: ''
  });

  // NEW: Consistent Class Options to match Admin Portal
  const classOptions = [
    'Nursery', 'KG-1', 'KG-2', 
    'Class 1', 'Class 2', 'Class 3', 'Class 4', 
    'Class 5', 'Class 6', 'Class 7', 'Class 8', 
    'Class 9', 'Class 10', 'Class 11', 'Class 12'
  ];

  useEffect(() => {
    if (scanId) validateQRScan();
  }, [scanId]);

  const validateQRScan = async () => {
    setIsLoading(true);
    try {
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select(`*, schools (id, name, status)`)
        .eq('uuid', scanId)
        .single();

      if (tagError || !tag) throw new Error("Invalid or unrecognized QR Code.");
      if (tag.status === 'deactivated') throw new Error("This tag is suspended.");
      if (tag.schools.status !== 'active') throw new Error("School infrastructure inactive.");

      setTagData(tag);

      const { data: student } = await supabase
        .from('students')
        .select('*')
        .eq('tag_uuid', scanId)
        .single();

      if (student) setStudentData(student);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- PRIVACY HELPER FUNCTIONS ---
  const maskPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 4) return '***';
    return `+** **** **${cleaned.slice(-4)}`;
  };

  const getWhatsAppLink = (phone) => {
    if (!phone) return '#';
    const cleaned = phone.replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  // --- PIN SECURITY GATE LOGIC ---
  const handleVerifyToEdit = (e) => {
    e.preventDefault();
    if (verifyPin === studentData.security_pin) {
      setFormData({
        child_name: studentData.child_name || '',
        dob: studentData.dob || '',
        grade: studentData.grade || '',
        section: studentData.section || '', // UPDATED: Pulls section into edit mode
        parent_name: studentData.parent_name || '',
        contact_phone: studentData.contact_phone || '',
        emergency_phone: studentData.emergency_phone || '',
        address: studentData.address || '',
        blood_group: studentData.blood_group || '',
        allergies: studentData.allergies || '',
        medical_notes: studentData.medical_notes || '',
        pickup_persons: studentData.pickup_persons || '',
        security_pin: studentData.security_pin || ''
      });
      setVerificationStep(false);
      setVerifyError('');
      setVerifyPin('');
      setIsEditing(true);
    } else {
      setVerifyError("Incorrect PIN. Access Denied.");
      setVerifyPin('');
    }
  };

  // --- DATABASE WRITE LOGIC ---
  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();
    if (formData.security_pin.length !== 6) return alert("Security PIN must be exactly 6 digits.");
    
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('students').insert([{
        school_id: tagData.schools.id, 
        tag_uuid: tagData.uuid, 
        serial_number: tagData.serial_number, // <--- FIXED: Serial number is now saved
        ...formData
      }]).select();
      if (error) throw error;

      await supabase.from('tags').update({ status: 'active' }).eq('uuid', tagData.uuid);
      setStudentData(data[0]);
    } catch (err) {
      alert("Registration failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (formData.security_pin.length !== 6) return alert("Security PIN must be exactly 6 digits.");

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.from('students')
        .update(formData)
        .eq('id', studentData.id)
        .select();
      if (error) throw error;
      
      setStudentData(data[0]);
      setIsEditing(false);
      alert("Profile updated successfully.");
    } catch (err) {
      alert("Update failed: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- RENDER STATES ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
        <p className="text-slate-500 font-bold animate-pulse">Authenticating Cryptographic Signature...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full border-t-4 border-red-500">
          <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">Scan Rejected</h2>
          <p className="text-slate-600 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  // PIN SECURITY GATE VIEW
  if (verificationStep) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full border border-slate-200">
          <div className="bg-slate-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-600">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Security Verification</h2>
          <p className="text-slate-500 font-medium mb-8 text-sm">To edit this profile, please enter the 6-digit Security PIN created during registration.</p>
          
          <form onSubmit={handleVerifyToEdit} className="space-y-4">
            <input 
              type="password"
              maxLength="6"
              required 
              placeholder="••••••"
              value={verifyPin} 
              onChange={(e) => setVerifyPin(e.target.value.replace(/\D/g, ''))} 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black text-center tracking-[1em] text-xl" 
            />
            {verifyError && <p className="text-red-500 text-sm font-bold">{verifyError}</p>}
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-xl font-black transition">
              Unlock Profile
            </button>
            <button type="button" onClick={() => { setVerificationStep(false); setVerifyError(''); setVerifyPin(''); }} className="w-full text-slate-500 font-bold p-2 hover:text-slate-700">
              Cancel
            </button>
          </form>
        </div>
      </div>
    );
  }

  // DIGITAL ID VIEW (Read Only - Privacy Protected)
  if (studentData && !isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10 p-6 relative">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden relative z-10">
          
          <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div>
              <span className="bg-indigo-500/50 text-indigo-100 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mb-3 w-max">
                <CheckCircle2 size={12}/> Verified ID
              </span>
              <h2 className="text-3xl font-black">{studentData.child_name}</h2>
              <p className="text-indigo-200 font-bold mt-1">
                Class: {studentData.grade} {studentData.section ? `- Sec ${studentData.section}` : ''}
              </p>
            </div>
            <IdCard size={40} className="text-indigo-300 opacity-50" />
          </div>

          <div className="p-6 space-y-6">
            
            <div className="bg-slate-100 text-slate-500 p-3 rounded-xl flex items-center gap-2 text-xs font-bold justify-center border border-slate-200">
              <EyeOff size={14} /> Sensitive details masked for privacy.
            </div>

            <div className="space-y-5">
              <div className="flex items-start gap-3">
                <MapPin className="text-slate-400 mt-1" size={18} />
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Institution</p>
                  <p className="font-bold text-slate-700">{tagData.schools.name}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Phone className="text-slate-400 mt-1" size={18} />
                <div className="w-full">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Primary Contact (Parent)</p>
                  <p className="font-bold text-slate-700">{studentData.parent_name} • <span className="font-mono text-slate-500">{maskPhoneNumber(studentData.contact_phone)}</span></p>
                  
                  {/* Action Buttons for Primary */}
                  <div className="flex gap-2 mt-2">
                    <a href={`tel:${studentData.contact_phone}`} className="flex-1 flex items-center justify-center gap-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-2 rounded-lg text-xs font-bold transition border border-indigo-100">
                      <PhoneCall size={14} /> Call
                    </a>
                    <a href={getWhatsAppLink(studentData.contact_phone)} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-lg text-xs font-bold transition border border-emerald-100">
                      <MessageCircle size={14} /> WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-red-50 border border-red-100 rounded-xl p-4">
              <h3 className="text-xs font-black text-red-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                <HeartPulse size={14} /> Medical & Emergency
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Blood Group</p>
                  <p className="font-bold text-red-700 text-lg">{studentData.blood_group || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Alt Emergency Line</p>
                  <p className="font-bold text-slate-700 font-mono text-sm mt-1">{maskPhoneNumber(studentData.emergency_phone)}</p>
                  {studentData.emergency_phone && (
                    <a href={`tel:${studentData.emergency_phone}`} className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 mt-1 text-[10px] font-bold uppercase tracking-wider">
                      <PhoneCall size={12} /> Tap to Dial
                    </a>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Allergies / Conditions</p>
                  <p className="font-medium text-slate-700 text-sm">{studentData.allergies || 'None reported'} {studentData.medical_notes ? `• ${studentData.medical_notes}` : ''}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Physical Tag Serial</p>
                <p className="font-mono text-xs font-medium text-slate-400 mt-1">{tagData.serial_number}</p>
              </div>
              <button onClick={() => setVerificationStep(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold transition border border-slate-200">
                <KeyRound size={14} /> Edit Data
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // REGISTRATION & EDIT FORM
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 md:px-0">
      <div className="max-w-xl w-full mb-8 text-center relative">
        {isEditing && (
          <button onClick={() => setIsEditing(false)} className="absolute top-0 right-0 bg-white border border-slate-200 text-slate-500 p-2 rounded-full hover:bg-slate-100 shadow-sm transition">
            <X size={20} />
          </button>
        )}
        <div className="bg-indigo-600 text-white w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
          {isEditing ? <Edit3 size={32} /> : <ShieldCheck size={32} />}
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">
          {isEditing ? 'Update KidProtect Profile' : 'KidProtect Registration'}
        </h1>
        <p className="text-slate-500 font-medium mt-2">Tag Serial: <span className="font-mono font-bold text-slate-700">{tagData.serial_number}</span></p>
      </div>

      <form onSubmit={isEditing ? handleUpdateSubmit : handleRegistrationSubmit} className="max-w-xl w-full space-y-6">
        
        {/* SECTION 1: Identity & Security */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <IdCard size={18} /> 1. Student Identity & Security
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Child's Full Name *</label>
              <input type="text" name="child_name" required value={formData.child_name} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Date of Birth *</label>
              <input type="date" name="dob" required value={formData.dob} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700" />
            </div>

            {/* UPDATED: Class and Section strict dropdowns */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Class / Grade *</label>
              <select
                name="grade"
                required
                value={formData.grade}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
              >
                <option value="" disabled>Select a Class</option>
                {classOptions.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Section (Optional)</label>
              <select
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700"
              >
                <option value="">No Section</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </div>
            
            <div className="md:col-span-2 bg-slate-900 p-5 rounded-xl border border-slate-800 mt-2">
              <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <KeyRound size={14}/> 6-Digit Security PIN *
              </label>
              <p className="text-xs text-slate-400 mb-3">Create a secure PIN. You will need this to edit or update your child's profile in the future.</p>
              <input 
                type="text" 
                name="security_pin" 
                maxLength="6"
                placeholder="e.g. 123456" 
                required 
                value={formData.security_pin} 
                onChange={(e) => setFormData({ ...formData, security_pin: e.target.value.replace(/\D/g, '') })}
                className="w-full p-3 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-black tracking-widest text-lg" 
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Contact & Logistics */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-indigo-600 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Phone size={18} /> 2. Contact & Logistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Parent / Guardian Name *</label>
              <input type="text" name="parent_name" required value={formData.parent_name} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Phone (SMS Alerts) *</label>
              <input type="tel" name="contact_phone" required value={formData.contact_phone} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alt / Emergency Phone *</label>
              <input type="tel" name="emergency_phone" required value={formData.emergency_phone} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Home Address</label>
              <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium resize-none"></textarea>
            </div>
          </div>
        </div>

        {/* SECTION 3: Health & Security */}
        <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-black text-red-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <HeartPulse size={18} /> 3. Health & Security
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Blood Group</label>
              <select name="blood_group" value={formData.blood_group} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                <option value="">Select...</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg} value={bg}>{bg}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Known Allergies</label>
              <input type="text" name="allergies" placeholder="e.g. Peanuts (Optional)" value={formData.allergies} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Other Medical Conditions</label>
              <input type="text" name="medical_notes" placeholder="e.g. Asthma, Diabetes (Optional)" value={formData.medical_notes} onChange={handleChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" />
            </div>
            <div className="md:col-span-2 bg-amber-50 p-4 rounded-xl border border-amber-100 mt-2">
              <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Users size={14}/> Authorized Pickup Persons
              </label>
              <p className="text-xs text-amber-700 mb-2">List individuals (other than parents) authorized to collect this child.</p>
              <input type="text" name="pickup_persons" placeholder="e.g. John Doe (Grandfather) - 98765..." value={formData.pickup_persons} onChange={handleChange} className="w-full p-3 bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium" />
            </div>
          </div>
        </div>

        <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-5 rounded-2xl font-black text-xl transition shadow-xl disabled:opacity-70 flex items-center justify-center gap-2">
          {isSubmitting ? <Loader2 className="animate-spin" /> : (isEditing ? <CheckCircle2 size={24} /> : <ShieldCheck size={24} />)}
          {isSubmitting ? 'Processing...' : (isEditing ? 'Save Updated Profile' : 'Link Identity & Activate Tag')}
        </button>
      </form>
    </div>
  );
}
