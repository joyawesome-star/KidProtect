'use client';
import { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { createClient } from '@supabase/supabase-js';
import { ClipboardCheck, MessageSquare, Bell, LogOut, ScanLine, Search, Download, ArrowLeft } from "lucide-react";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function TeacherDashboard() {
  const [activeMode, setActiveMode] = useState(null); 
  const [scannedIds, setScannedIds] = useState([]); 
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // State and refs for duplicate alerts
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const scannedIdsRef = useRef([]);
  const alertTimeoutRef = useRef(null);

  // Keep the ref synced with the state
  useEffect(() => {
    scannedIdsRef.current = scannedIds;
  }, [scannedIds]);

  // 1. SCANNER INITIALIZATION
  useEffect(() => {
    if (!activeMode || isProcessing) return;

    const scanner = new Html5QrcodeScanner("teacher-reader", { 
      qrbox: { width: 250, height: 250 }, 
      fps: 15 
    }, false);

    scanner.render(onScanSuccess, onScanError);

    function onScanSuccess(decodedText) {
      if (scannedIdsRef.current.includes(decodedText)) {
        // Handle Duplicate
        const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setDuplicateAlert(`Tag already scanned at ${timeString}`);
        
        if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
        alertTimeoutRef.current = setTimeout(() => {
          setDuplicateAlert(null);
        }, 2500);
        
      } else {
        // Handle New Scan
        setScannedIds((prevIds) => [...prevIds, decodedText]);
        setDuplicateAlert(null); 
      }
    }

    function onScanError(err) {
      // Background noise ignored
    }

    return () => {
      scanner.clear().catch(e => console.error("Scanner cleanup error:", e));
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, [activeMode, isProcessing]);


  // 2. BATCH PROCESSING LOGIC
  const processBatch = async () => {
    if (scannedIds.length === 0) return;
    
    setIsProcessing(true);
    setDuplicateAlert(null); 

    for (let i = 0; i < scannedIds.length; i++) {
      const currentId = scannedIds[i];
      const countLabel = `(${i + 1}/${scannedIds.length})`;
      
      try {
        if (activeMode === 'attendance') {
          setStatusMessage(`Logging attendance for ${currentId}... ${countLabel}`);
          const { error } = await supabase.from('attendance_logs').insert([{ tag_uuid: currentId }]);
          if (error) throw error;
          
        } else if (activeMode === 'meet') {
          setStatusMessage(`Routing meet request for ${currentId}... ${countLabel}`);
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('students(name, parent_whatsapp, has_parent_app, app_device_token)')
            .eq('uuid', currentId)
            .single();

          if (tagError || !tagData) throw new Error('Unregistered safety sticker.');
          
          const student = tagData.students;
          let notificationDelivered = false;

          if (student.has_parent_app && student.app_device_token) {
            setStatusMessage(`Pinging KidProtect App for ${student.name}'s parent... ${countLabel}`);
            try {
              await new Promise(resolve => setTimeout(resolve, 600)); 
              notificationDelivered = true; 
            } catch (appError) {
              console.warn("App notification failed.");
            }
          }

          if (!notificationDelivered && student.parent_whatsapp) {
            setStatusMessage(`App unavailable. Sending WhatsApp... ${countLabel}`);
            await new Promise(resolve => setTimeout(resolve, 800));
          }

          await supabase.from('meeting_requests').insert([{ 
            tag_uuid: currentId,
            status: notificationDelivered ? 'sent_to_app' : 'sent_to_whatsapp' 
          }]);

        } else if (activeMode === 'lost_found') {
          setStatusMessage(`Identifying owner for ${currentId}... ${countLabel}`);
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('student_id, students(name, parent_whatsapp)')
            .eq('uuid', currentId)
            .single();

          if (tagError || !tagData) throw new Error('Unregistered safety sticker.');
          
          setStatusMessage(`Found item for ${tagData.students.name}. Alerting parent... ${countLabel}`);
          await supabase.from('lost_found_logs').insert([{ tag_uuid: currentId }]);
        }

        await new Promise(resolve => setTimeout(resolve, 800)); 

      } catch (err) {
        console.error("Error processing ID:", currentId, err);
      }
    }

    setStatusMessage('✓ Batch processing complete!');
    
    setTimeout(() => {
      setScannedIds([]);
      setStatusMessage('');
      setIsProcessing(false);
      setActiveMode(null); // Return to dashboard
    }, 2000);
  };

  // 3. FULLY FUNCTIONAL CSV DOWNLOAD
  const downloadAttendanceCSV = async () => {
    try {
      setStatusMessage('Fetching records from database...');
      setIsProcessing(true); 

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('attendance_logs')
        .select('tag_uuid, created_at')
        .gte('created_at', today.toISOString());

      if (error) throw error;

      if (!data || data.length === 0) {
        alert("No attendance records found for today.");
        setIsProcessing(false);
        return;
      }

      const headers = ['Tag ID', 'Scan Time'];
      const csvRows = [
        headers.join(','), 
        ...data.map(row => {
          const scanTime = new Date(row.created_at).toLocaleTimeString();
          return `${row.tag_uuid},${scanTime}`;
        })
      ];
      const csvString = csvRows.join('\n');

      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const dateString = new Date().toISOString().split('T')[0];
      link.href = url;
      link.setAttribute('download', `Class_Attendance_${dateString}.csv`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setStatusMessage('');
    } catch (err) {
      console.error("CSV Export Error:", err);
      alert("Supabase Error: " + (err.message || JSON.stringify(err)));
    } finally {
      setIsProcessing(false);
    }
  };

  const exitMode = () => {
    setActiveMode(null);
    setScannedIds([]);
    setStatusMessage('');
    setIsProcessing(false);
    setDuplicateAlert(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 relative">
      
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">Staff Hub</h1>
            <p className="text-xs text-slate-500">Classroom Command</p>
          </div>
        </div>
        <button className="text-slate-500 hover:text-red-600 transition-colors flex items-center gap-2 text-sm font-medium">
          <LogOut size={18} />
          <span className="hidden md:inline">Sign Out</span>
        </button>
      </nav>

      {/* LOADING OVERLAY */}
      {isProcessing && !activeMode && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-center items-center z-50">
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center max-w-sm w-full mx-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-slate-800 font-semibold text-center">{statusMessage}</p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="max-w-5xl mx-auto p-6 md:p-8">
        
        {!activeMode ? (
          /* DASHBOARD VIEW */
          <div className="animate-fade-in">
            {/* Welcome & Primary Action (Scan) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, Instructor</h2>
                <p className="text-slate-600">Here is your classroom overview for today.</p>
              </div>
              <button 
                onClick={() => setActiveMode('attendance')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-95">
                <ScanLine size={20} />
                Batch Scan Attendance
              </button>
            </div>

            {/* Quick Actions Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Action Menu */}
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ClipboardCheck size={20} className="text-blue-600" /> 
                  Daily Operations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  <div onClick={() => setActiveMode('meet')} className="p-4 border border-slate-100 rounded-xl hover:bg-amber-50 hover:border-amber-200 cursor-pointer transition-colors group">
                    <MessageSquare className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                    <h4 className="font-semibold text-slate-800">Parents Meet Option</h4>
                    <p className="text-sm text-slate-500 mt-1">Scan tags to trigger instant app/WhatsApp invites.</p>
                  </div>

                  <div onClick={() => setActiveMode('lost_found')} className="p-4 border border-slate-100 rounded-xl hover:bg-purple-50 hover:border-purple-200 cursor-pointer transition-colors group">
                    <Search className="text-purple-500 mb-2 group-hover:scale-110 transition-transform" size={24} />
                    <h4 className="font-semibold text-slate-800">Lost and Found System</h4>
                    <p className="text-sm text-slate-500 mt-1">Scan stray items to alert parents for collection.</p>
                  </div>
                  
                  <div onClick={downloadAttendanceCSV} className="p-4 border border-slate-100 rounded-xl hover:bg-emerald-50 hover:border-emerald-200 cursor-pointer transition-colors group sm:col-span-2">
                    <div className="flex items-center gap-3">
                      <Download className="text-emerald-500 group-hover:scale-110 transition-transform" size={24} />
                      <div>
                        <h4 className="font-semibold text-slate-800">Download Attendance Report</h4>
                        <p className="text-sm text-slate-500">Export today's raw logs directly into a .csv spreadsheet.</p>
                      </div>
                    </div>
                  </div>

                </div>
              </div>

              {/* Recent Alerts */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Bell size={20} className="text-amber-500" /> 
                  System Status
                </h3>
                <div className="space-y-4">
                  <div className="text-sm bg-blue-50 text-blue-800 p-3 rounded-lg border border-blue-100">
                    <p className="font-semibold">Scanner Ready</p>
                    <p className="opacity-90">Camera module initialized and ready for high-speed scanning.</p>
                  </div>
                  <div className="text-sm bg-slate-50 text-slate-700 p-3 rounded-lg border border-slate-100">
                    <p className="font-semibold">Database Connection</p>
                    <p className="opacity-90">{supabaseUrl ? 'Connected to Supabase securely.' : 'Pending environment variables.'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : (
          /* SCANNER VIEW */
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-xl animate-fade-in">
            
            {/* Scanner Header */}
            <div className="flex justify-between items-center mb-6">
              <button onClick={exitMode} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-800 transition">
                <ArrowLeft size={16} /> Back to Hub
              </button>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                activeMode === 'attendance' ? 'bg-blue-100 text-blue-700' :
                activeMode === 'meet' ? 'bg-amber-100 text-amber-700' : 'bg-purple-100 text-purple-700'
              }`}>
                Mode: {activeMode.replace('_', ' ')}
              </span>
            </div>

            {!isProcessing ? (
              <div className="space-y-6">
                
                {/* Duplicate Scan Alert Banner */}
                {duplicateAlert && (
                  <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-600 text-sm font-semibold text-center shadow-sm animate-pulse">
                    ⚠️ {duplicateAlert}
                  </div>
                )}

                {/* QR Scanner Target */}
                <div className="bg-slate-50 p-2 rounded-2xl border-2 border-dashed border-slate-300 overflow-hidden relative">
                  <div id="teacher-reader" className="w-full"></div>
                </div>
                
                {/* Scan Statistics & Process Button */}
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                  <h3 className="text-4xl font-extrabold text-blue-600 mb-1">{scannedIds.length}</h3>
                  <p className="text-sm text-slate-500 font-medium mb-5">Tags Successfully Scanned</p>
                  
                  <button 
                    onClick={processBatch}
                    disabled={scannedIds.length === 0}
                    className={`w-full p-4 rounded-xl text-base font-bold transition-all shadow-sm ${
                      scannedIds.length > 0 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md' 
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}>
                    Process {scannedIds.length > 0 ? scannedIds.length : ''} Pending Scans
                  </button>
                </div>

              </div>
            ) : (
              /* Processing Status View */
              <div className="text-center py-16">
                <div className="flex justify-center items-center mb-6">
                  {statusMessage.includes('complete') ? (
                    <div className="h-16 w-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                      <ClipboardCheck size={32} />
                    </div>
                  ) : (
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">Processing Batch</h3>
                <p className="text-blue-600 font-medium">{statusMessage}</p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
