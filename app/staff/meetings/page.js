'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Scanner } from '@yudiel/react-qr-scanner';
import { 
  ArrowLeft, 
  Users, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Loader2, 
  CheckCircle2, 
  QrCode, 
  User, 
  RefreshCcw,
  AlertTriangle,
  Bell,
  Megaphone
} from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function NoticeAndMeetingsPage() {
  const router = useRouter();
  const [staffData, setStaffData] = useState(null);
  
  // Tab State
  const [activeTab, setActiveTab] = useState('bulk'); // 'bulk' | 'individual'

  // Notice Form States
  const [noticeType, setNoticeType] = useState('meeting'); // 'meeting' | 'general'
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [agenda, setAgenda] = useState('');
  
  const [generalTitle, setGeneralTitle] = useState('');
  const [generalMessage, setGeneralMessage] = useState('');

  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);

  // Individual Scan States
  const [scannedStudent, setScannedStudent] = useState(null);
  const [customMessage, setCustomMessage] = useState('');
  const [scanError, setScanError] = useState('');

  // 1. Verify Login
  useEffect(() => {
    const phone = localStorage.getItem('staff_phone');
    if (!phone) {
      router.push('/staff/login');
      return;
    }
    setStaffData({
      name: localStorage.getItem('staff_name') || 'Teacher',
      grade: localStorage.getItem('staff_grade') || 'All Classes',
    });
  }, [router]);

  // 2. Handle Publishing Notice to Parent Dashboard
  const handlePublishNotice = async (e) => {
    e.preventDefault();
    setIsSending(true);

    try {
      let finalTitle = "";
      let finalMessage = "";

      if (noticeType === 'meeting') {
        finalTitle = "Parent-Teacher Meeting";
        finalMessage = `Date: ${meetingDate}\nTime: ${meetingTime}\nAgenda: ${agenda}\n\nPlease make sure to attend.`;
      } else {
        finalTitle = generalTitle.trim();
        finalMessage = generalMessage.trim();
      }

      // Insert directly into the 'notices' table targeting this specific class
      const { error } = await supabase
        .from('notices')
        .insert([
          {
            target_grade: staffData.grade, // This ensures it ONLY goes to this class
            title: finalTitle,
            message: finalMessage
          }
        ]);

      if (error) throw error;
      
      // Show Success
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        // Reset forms
        setMeetingDate('');
        setMeetingTime('');
        setAgenda('');
        setGeneralTitle('');
        setGeneralMessage('');
      }, 3000);

    } catch (err) {
      console.error("Notice publish error:", err);
      alert("Failed to publish notice: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // 3. Handle QR Code Scan for Individual Parent
  const handleScan = async (text) => {
    if (!text) return;
    setScanError('');

    // Extract UUID if a full URL was scanned
    let extractedId = text;
    try {
      const url = new URL(text);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      extractedId = pathSegments[pathSegments.length - 1] || text;
    } catch (e) {
      extractedId = text.trim();
    }

    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('tag_uuid', extractedId)
        .single();

      if (error || !data) throw new Error('Student not found');
      
      setScannedStudent(data);
    } catch (err) {
      setScanError('Tag not recognized or student not found.');
      setTimeout(() => setScanError(''), 3000);
    }
  };

  // 4. Send Individual WhatsApp Message via direct App link
  const handleSendIndividualMessage = () => {
    if (!customMessage.trim()) {
      alert("Please enter a message to send.");
      return;
    }

    const rawPhone = scannedStudent.contact_phone.replace(/\D/g, ''); 
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone; 
    
    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(customMessage.trim())}`, '_blank');
    
    // Clear and reset
    setScannedStudent(null);
    setCustomMessage('');
  };

  if (!staffData) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 pb-20">
      {/* Header */}
      <header className="mb-6 bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
        <button 
          onClick={() => router.push('/staff/dashboard')} 
          className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-indigo-900">Notice & Meetings</h1>
          <p className="text-xs font-semibold text-slate-500">Parent Communication for {staffData.grade}</p>
        </div>
      </header>

      {/* Main Content Container */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 max-w-lg mx-auto mt-4 overflow-hidden">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('bulk')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'bulk' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Megaphone size={18} /> Class Noticeboard
          </button>
          <button 
            onClick={() => setActiveTab('individual')}
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition ${
              activeTab === 'individual' ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-600' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <QrCode size={18} /> Individual Scan
          </button>
        </div>

        <div className="p-6 md:p-8">
          
          {/* TAB 1: CLASS NOTICEBOARD */}
          {activeTab === 'bulk' && (
            <div className="animate-fade-in">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-indigo-100">
                <Bell size={32} />
              </div>
              
              <h2 className="text-2xl font-black text-slate-800 mb-2">Publish a Notice</h2>
              <p className="text-sm text-slate-500 mb-6">
                Publish a meeting or general announcement directly to the KidProtect dashboard for parents in <strong className="text-slate-700">{staffData.grade}</strong>.
              </p>

              {/* Notice Type Selector */}
              <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
                <button
                  onClick={() => setNoticeType('meeting')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${noticeType === 'meeting' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Schedule Meeting
                </button>
                <button
                  onClick={() => setNoticeType('general')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${noticeType === 'general' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  General Notice
                </button>
              </div>

              {success ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center animate-fade-in">
                  <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-lg font-black text-emerald-800 mb-2">Notice Published!</h3>
                  <p className="text-sm text-emerald-600 font-medium">
                    The details are now visible on the class parent dashboards.
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePublishNotice} className="space-y-5 animate-fade-in">
                  
                  {/* MEETING FORM */}
                  {noticeType === 'meeting' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date</label>
                          <div className="relative mt-1">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                              type="date"
                              required
                              value={meetingDate}
                              onChange={(e) => setMeetingDate(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Time</label>
                          <div className="relative mt-1">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                              type="time"
                              required
                              value={meetingTime}
                              onChange={(e) => setMeetingTime(e.target.value)}
                              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Meeting Agenda</label>
                        <div className="relative mt-1">
                          <MessageSquare className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <select
                            required
                            value={agenda}
                            onChange={(e) => setAgenda(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition appearance-none"
                          >
                            <option value="" disabled>Select a standard agenda...</option>
                            <option value="General Academic Progress">General Academic Progress</option>
                            <option value="Upcoming Term Examinations">Upcoming Term Examinations</option>
                            <option value="Behavioral & Disciplinary Update">Behavioral & Disciplinary Update</option>
                            <option value="End of Year Review">End of Year Review</option>
                            <option value="Special Event Coordination">Special Event Coordination</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* GENERAL NOTICE FORM */}
                  {noticeType === 'general' && (
                    <>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Notice Title</label>
                        <input
                          type="text"
                          required
                          value={generalTitle}
                          onChange={(e) => setGeneralTitle(e.target.value)}
                          placeholder="e.g., Tomorrow is a Holiday"
                          className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Message Details</label>
                        <textarea
                          required
                          rows="4"
                          value={generalMessage}
                          onChange={(e) => setGeneralMessage(e.target.value)}
                          placeholder="Type your full announcement here..."
                          className="w-full mt-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition resize-none"
                        ></textarea>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={isSending}
                    className={`w-full py-4 px-6 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-md ${
                      isSending 
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
                    }`}
                  >
                    {isSending ? (
                      <>
                        <Loader2 size={20} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        <Bell size={20} />
                        Publish to Notice Board
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: INDIVIDUAL SCAN & MESSAGE (REMAINS WHATSAPP) */}
          {activeTab === 'individual' && (
            <div className="animate-fade-in">
              {!scannedStudent ? (
                <>
                  <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800 mb-2">Scan ID Card</h2>
                    <p className="text-sm text-slate-500">
                      Scan a student's QR tag to pull up their profile and message their parent directly via WhatsApp.
                    </p>
                  </div>

                  <div className="bg-black rounded-3xl overflow-hidden shadow-lg border-4 border-slate-800 relative aspect-square w-full max-w-sm mx-auto flex items-center justify-center">
                    <Scanner 
                      onScan={(result) => {
                        if (result && result.length > 0) {
                            handleScan(result[0].rawValue);
                        }
                      }} 
                      onError={(error) => console.log(error?.message)}
                      options={{ delayBetweenScanAttempts: 1000 }}
                    />
                    {scanError && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-bold text-sm bg-red-500 text-white shadow-lg flex items-center gap-2 whitespace-nowrap">
                        <AlertTriangle size={18}/> {scanError}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl"><User size={24}/></div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900 leading-tight">{scannedStudent.child_name}</h3>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                          {scannedStudent.grade} {scannedStudent.section ? `• Sec ${scannedStudent.section}` : ''}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => { setScannedStudent(null); setCustomMessage(''); }}
                      className="p-2 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-full transition"
                      title="Scan Another"
                    >
                      <RefreshCcw size={18} />
                    </button>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Message to Parent</label>
                    <textarea
                      required
                      rows="4"
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder={`e.g., Hello, I would like to schedule a brief meeting regarding ${scannedStudent.child_name}'s recent performance...`}
                      className="w-full mt-2 p-3 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 transition resize-none"
                    ></textarea>
                  </div>

                  <button
                    onClick={handleSendIndividualMessage}
                    className="w-full py-4 px-6 rounded-xl font-black flex items-center justify-center gap-2 transition-all shadow-md bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95"
                  >
                    <MessageSquare size={20} />
                    Open WhatsApp to Parent
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
