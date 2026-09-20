'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Scanner } from '@yudiel/react-qr-scanner';
import { ArrowLeft, CheckCircle2, UploadCloud, XCircle, QrCode } from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AttendanceScanner() {
  const router = useRouter();
  const [staffData, setStaffData] = useState(null);
  const [scannedBatch, setScannedBatch] = useState([]);
  const [isDeploying, setIsDeploying] = useState(false);
  const [scanMessage, setScanMessage] = useState({ type: '', text: '' });

  // 1. Verify Login on Mount
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

  // 2. Handle QR Code Scan (WITH STRICT SERVER-SIDE DUPLICATE CHECK)
  const handleScan = async (text) => {
    if (!text) return;

    let extractedId = text;
    try {
      const url = new URL(text);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      extractedId = pathSegments[pathSegments.length - 1] || text;
    } catch (e) {
      extractedId = text;
    }

    // 1. Local Check: Prevent duplicates within the CURRENT batch
    if (scannedBatch.some(student => student.qr_id === extractedId)) {
      setScanMessage({ type: 'warning', text: 'Already scanned in this batch!' });
      setTimeout(() => setScanMessage({ type: '', text: '' }), 2000);
      return;
    }

    try {
      // Fetch student details
      const { data: student, error } = await supabase
        .from('students')
        .select('id, child_name, grade, section, contact_phone, serial_number')
        .eq('tag_uuid', extractedId) 
        .single();

      if (error || !student) throw new Error('Student not found');

      // 2. Server-Side Check: Prevent duplicates in the database for TODAY
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to exactly midnight
      const startOfDay = today.toISOString();

      const { data: existingLogs, error: logError } = await supabase
        .from('attendance_logs')
        .select('id')
        .eq('student_id', student.id)
        .gte('created_at', startOfDay)
        .limit(1); // Safely grabs at most 1 record without crashing if multiple exist!

      // If a log already exists for today (array has at least 1 item), reject the scan
      if (existingLogs && existingLogs.length > 0) {
        setScanMessage({ type: 'error', text: `${student.child_name} already logged today!` });
        setTimeout(() => setScanMessage({ type: '', text: '' }), 2000);
        return; 
      }

      // If no duplicate exists, format the new scan and add to batch
      const newScan = {
        ...student,
        qr_id: extractedId,
        time_scanned: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date_scanned: new Date().toISOString().split('T')[0]
      };

      setScannedBatch(prev => [newScan, ...prev]);
      setScanMessage({ type: 'success', text: `${student.child_name} Added!` });
      setTimeout(() => setScanMessage({ type: '', text: '' }), 2000);

    } catch (error) {
      console.error("Scan error:", error);
      setScanMessage({ type: 'error', text: 'Invalid ID / Not Found' });
      setTimeout(() => setScanMessage({ type: '', text: '' }), 2000);
    }
  };

  // 3. Download CSV Function
  const downloadCSV = (batchData) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Date,Time,Serial Number,Student Name,Class,Section,Parent Phone,Status\n";

    batchData.forEach(student => {
      const row = `${student.date_scanned},${student.time_scanned},${student.serial_number || 'N/A'},${student.child_name},${student.grade},${student.section || '-'},${student.contact_phone},Present`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Attendance_${staffData.grade.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 4. Handle "Deploy & Push"
  const handleDeploy = async () => {
    if (scannedBatch.length === 0) return;
    setIsDeploying(true);

    try {
      // A. Format data for Supabase insertion
      const logsToInsert = scannedBatch.map(student => ({
        student_id: student.id,
        status: 'present',
        recorded_by: staffData.name,
        whatsapp_status: 'pending' // Initialize as pending
      }));

      // B. Push to Supabase 'attendance_logs' table FIRST
      const { data: insertedLogs, error: dbError } = await supabase
        .from('attendance_logs')
        .insert(logsToInsert)
        .select('id, student_id'); 

      if (dbError) throw new Error(`Database Error: ${dbError.message}`);

      // C. TRIGGER THE SECURE BACKEND API
      const response = await fetch('/api/whatsapp-notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          batchData: scannedBatch,
          logIds: insertedLogs 
        })
      });

      if (!response.ok) {
        throw new Error('Backend dispatch failed, but attendance was saved to the database.');
      }

      const result = await response.json();
      
      // D. Download the CSV locally
      downloadCSV(scannedBatch);

      // E. Clear batch and show success
      setScannedBatch([]);
      alert(`Success! Attendance saved. Simulated ${result.successCount} WhatsApp messages.`);

    } catch (error) {
      console.error("Deploy Error:", error);
      alert(error.message);
    } finally {
      setIsDeploying(false);
    }
  };

  if (!staffData) return null; 

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 p-4 sticky top-0 z-20 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/staff/dashboard')} className="p-2 bg-slate-100 rounded-full text-slate-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-black text-lg text-indigo-900 leading-tight">Scanner</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase">{staffData.grade}</p>
          </div>
        </div>
        <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold">
          Batch: {scannedBatch.length}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <div className="bg-black rounded-3xl overflow-hidden shadow-lg border-4 border-slate-800 relative aspect-[4/3] w-full max-w-md mx-auto flex items-center justify-center">
          <Scanner 
            onScan={(result) => {
              if (result && result.length > 0) {
                  handleScan(result[0].rawValue);
              }
            }} 
            onError={(error) => console.log(error?.message)}
            options={{ delayBetweenScanAttempts: 1000 }}
          />
          {scanMessage.text && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full font-bold text-sm text-white shadow-lg flex items-center gap-2 ${
              scanMessage.type === 'success' ? 'bg-emerald-500' : 
              scanMessage.type === 'warning' ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              {scanMessage.type === 'success' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
              {scanMessage.text}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 flex-1 min-h-[200px]">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
            Current Batch ({scannedBatch.length})
          </h3>
          {scannedBatch.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2 mt-10">
              <QrCode size={40} className="opacity-20" />
              <p className="text-sm font-medium">Scan ID cards to build batch...</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {scannedBatch.map((student, idx) => (
                <li key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-800 text-sm leading-tight">{student.child_name}</p>
                    <p className="text-[10px] font-semibold text-slate-500 uppercase mt-0.5">
                      {student.grade} {student.section ? `• Sec ${student.section}` : ''} 
                      {student.serial_number && <span className="ml-1 font-mono text-indigo-500">| {student.serial_number}</span>}
                    </p>
                  </div>
                  <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg shrink-0">
                    {student.time_scanned}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      <div className="p-4 bg-white border-t border-slate-200 sticky bottom-0 z-20 pb-safe">
        <button
          onClick={handleDeploy}
          disabled={scannedBatch.length === 0 || isDeploying}
          className={`w-full flex items-center justify-center gap-2 font-black py-4 rounded-2xl shadow-lg transition-all ${
            scannedBatch.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95'
          }`}
        >
          {isDeploying ? (
            'Deploying & Saving...'
          ) : (
            <>
              <UploadCloud size={24} />
              Deploy & Push Batch
            </>
          )}
        </button>
      </div>
    </div>
  );
}
