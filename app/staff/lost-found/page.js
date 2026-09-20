'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  ArrowLeft, 
  PackageSearch, 
  QrCode, 
  MessageCircle, 
  CheckCircle2, 
  Search,
  X
} from 'lucide-react';

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LostAndFound() {
  const router = useRouter();
  
  const [view, setView] = useState('list'); 
  const [isLoading, setIsLoading] = useState(false);
  const [activeItems, setActiveItems] = useState([]);
  
  const [manualId, setManualId] = useState('');
  const [scannedStudent, setScannedStudent] = useState(null);
  const [itemName, setItemName] = useState('');

  useEffect(() => {
    fetchActiveItems();
  }, []);

  const fetchActiveItems = async () => {
    const { data, error } = await supabase
      .from('lost_items')
      .select('*, students(child_name, grade, section)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setActiveItems(data);
    }
  };

  useEffect(() => {
    let scanner = null;
    if (view === 'scan') {
      scanner = new Html5QrcodeScanner(
        "qr-reader", 
        { fps: 10, qrbox: { width: 250, height: 250 } }, 
        false
      );

      scanner.render(
        (decodedText) => {
          scanner.clear(); 
          setManualId(decodedText); 
          processStudentSearch(decodedText); 
        },
        (errorMessage) => {}
      );
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(error => console.error(error));
      }
    };
  }, [view]);

  const processStudentSearch = async (rawText) => {
    if (!rawText || !rawText.trim()) return;
    setIsLoading(true);
    
    // --- ADDED: URL Extraction Logic ---
    let tagId = rawText.trim();
    try {
      const url = new URL(tagId);
      const pathSegments = url.pathname.split('/').filter(Boolean);
      tagId = pathSegments[pathSegments.length - 1] || tagId;
    } catch (e) {
      // If it's not a valid URL (e.g., manual ID entry), keep the original text
      tagId = rawText.trim();
    }
    // -----------------------------------

    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('tag_uuid', tagId)
      .single();

    setIsLoading(false);

    if (data) {
      setScannedStudent(data);
      setView('details');
    } else {
      alert("No student found with this tag ID.");
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    processStudentSearch(manualId);
  };

  const handleLogAndNotify = async () => {
    if (!itemName.trim()) {
      alert("Please enter the item name.");
      return;
    }
    setIsLoading(true);

    const { error } = await supabase
      .from('lost_items')
      .insert([{
        student_id: scannedStudent.id,
        item_name: itemName.trim(),
        status: 'pending'
      }]);

    setIsLoading(false);

    if (error) {
      alert("Error: " + error.message);
      return;
    }

    const rawPhone = scannedStudent.contact_phone.replace(/\D/g, ''); 
    const phone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone; 
    const message = `Hello! We found a lost item (${itemName.trim()}) belonging to ${scannedStudent.child_name}. Please collect it from the school office.`;
    
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');

    setManualId('');
    setItemName('');
    setScannedStudent(null);
    setView('list');
    fetchActiveItems();
  };

  const handleResolve = async (itemId) => {
    await supabase.from('lost_items').update({ status: 'resolved' }).eq('id', itemId);
    fetchActiveItems();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-slate-900 pb-20">
      <header className="mb-6 bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex items-center gap-4">
        <button 
          onClick={() => { view !== 'list' ? setView('list') : router.push('/staff/dashboard'); }} 
          className="p-2 bg-slate-100 rounded-full text-slate-600 hover:bg-slate-200"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-black text-indigo-900">Lost & Found</h1>
          <p className="text-xs font-semibold text-slate-500">Scan items & notify parents</p>
        </div>
      </header>

      {view === 'list' && (
        <>
          <button 
            onClick={() => setView('scan')}
            className="w-full mb-6 bg-indigo-600 text-white font-bold py-4 px-6 rounded-2xl shadow-md hover:bg-indigo-700 flex items-center justify-center gap-2"
          >
            <QrCode size={20} /> Report Found Item
          </button>
          <div className="space-y-3">
            <h3 className="font-bold text-slate-800 text-sm px-2">Unclaimed Items ({activeItems.length})</h3>
            {activeItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center mt-4">
                <PackageSearch size={48} className="mx-auto text-slate-300 mb-3" />
                <h2 className="text-base font-bold text-slate-700">All clear!</h2>
              </div>
            ) : (
              activeItems.map((item) => (
                <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{item.item_name}</p>
                    <p className="text-xs font-semibold text-slate-500">{item.students?.child_name}</p>
                  </div>
                  <button onClick={() => handleResolve(item.id)} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100">
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {view === 'scan' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-black text-slate-800">Scan Tag</h2>
            <button onClick={() => setView('list')} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full"><X size={20}/></button>
          </div>
          <div id="qr-reader" className="w-full mb-6 rounded-2xl overflow-hidden border-2 border-slate-200"></div>
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input 
              type="text"
              placeholder="Enter Tag ID..."
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button type="submit" disabled={isLoading} className="px-4 bg-indigo-600 text-white rounded-xl font-bold">
              <Search size={18} />
            </button>
          </form>
        </div>
      )}

      {view === 'details' && scannedStudent && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <p className="text-2xl font-black text-slate-900">{scannedStudent.child_name}</p>
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-md text-xs font-bold mt-2 inline-block">
              {scannedStudent.grade} - {scannedStudent.section || 'N/A'}
            </span>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <input 
              type="text"
              placeholder="What item was found?"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-600"
            />
            <button onClick={handleLogAndNotify} disabled={isLoading} className="w-full bg-emerald-500 text-white font-bold py-4 px-6 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600">
              <MessageCircle size={20} /> Log & Notify
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
