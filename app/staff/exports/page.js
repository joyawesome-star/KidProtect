'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, Download, FileSpreadsheet, Loader2 } from 'lucide-react';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function ExportsPage() {
  const router = useRouter();
  const [staffData, setStaffData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);

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

  // 2. Fetch Today's Data
  const fetchTodaysAttendance = async () => {
    setIsLoading(true);
    
    // Get start of today in local time, properly formatted for UTC conversion
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startOfDay = today.toISOString();

    try {
      // Fetch logs and join with student data (Now pulling serial_number)
      const { data, error } = await supabase
        .from('attendance_logs')
        .select(`
          created_at,
          status,
          whatsapp_status,
          students (
            child_name,
            grade,
            section,
            contact_phone,
            serial_number
          )
        `)
        .gte('created_at', startOfDay)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Smart Filter for this teacher's specific grade
      let filteredLogs = data;
      if (staffData.grade && staffData.grade !== 'All Classes' && staffData.grade !== 'null') {
        filteredLogs = data.filter(log => {
          if (!log.students || !log.students.grade) return false;
          
          // Build the student's full class string (e.g., "2" or "2-A")
          let studentFullGrade = String(log.students.grade);
          if (log.students.section && log.students.section.trim() !== '' && log.students.section !== '-') {
            studentFullGrade += `-${log.students.section}`;
          }

          // Clean both strings: remove "class", make lowercase, and remove all spaces
          const cleanStaff = String(staffData.grade).toLowerCase().replace(/class/g, '').replace(/\s+/g, '');
          const cleanStudent = studentFullGrade.toLowerCase().replace(/class/g, '').replace(/\s+/g, '');
          
          // Check if they match (e.g., Staff "2" matches Student "2")
          return cleanStaff === cleanStudent || cleanStudent.startsWith(cleanStaff);
        });
      }

      setLogs(filteredLogs);
      
      if (filteredLogs.length === 0) {
        alert("No attendance records found for today.");
      } else {
        generateCSV(filteredLogs);
      }

    } catch (error) {
      console.error("Error fetching logs:", error);
      alert("Failed to fetch records. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Generate and Download CSV (Updated Headers & Rows)
  const generateCSV = (exportData) => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // ADDED: Serial Number to the CSV Headers
    csvContent += "Date,Time,Serial Number,Student Name,Grade,Section,Parent Phone,Attendance Status,WhatsApp Delivery\n";

    exportData.forEach(log => {
      const dateObj = new Date(log.created_at);
      const dateStr = dateObj.toLocaleDateString();
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const serial = log.students?.serial_number || 'N/A';
      const name = log.students?.child_name || 'Unknown';
      const grade = log.students?.grade || 'N/A';
      const section = log.students?.section || '-';
      const phone = log.students?.contact_phone || 'N/A';
      const status = log.status || 'present';
      const waStatus = log.whatsapp_status || 'pending';

      const row = `${dateStr},${timeStr},${serial},${name},${grade},${section},${phone},${status},${waStatus}`;
      csvContent += row + "\r\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const fileName = `Daily_Attendance_${staffData.grade.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", fileName);
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!staffData) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4">
      <header className="mb-6 bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
        <button 
          onClick={() => router.push('/staff/dashboard')} 
          className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200 transition"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-indigo-900">Data Exports</h1>
          <p className="text-xs font-semibold text-slate-500">Download {staffData.grade} reports</p>
        </div>
      </header>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 text-center max-w-md mx-auto mt-10">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileSpreadsheet size={40} />
        </div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-2">Today's Attendance</h2>
        <p className="text-sm text-slate-500 mb-8 px-4">
          Generate a complete CSV file containing all scanned students, attendance statuses, and WhatsApp delivery confirmations for today.
        </p>

        <button
          onClick={fetchTodaysAttendance}
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all ${
            isLoading 
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
              : 'bg-emerald-500 text-white hover:bg-emerald-600 active:scale-95 shadow-md'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Compiling Data...
            </>
          ) : (
            <>
              <Download size={20} />
              Download CSV Report
            </>
          )}
        </button>

        {logs.length > 0 && (
          <p className="mt-4 text-xs font-bold text-emerald-600">
            ✓ Successfully exported {logs.length} records.
          </p>
        )}
      </div>
    </div>
  );
}
