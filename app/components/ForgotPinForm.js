'use client';
import { useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';

export default function ForgotPinForm({ supabase, table, accentClass = 'indigo' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const pinRefs = useRef([]);

  const colors = {
    indigo: { link: 'text-indigo-600 hover:text-indigo-700', focus: 'focus:ring-indigo-600', button: 'bg-indigo-600 hover:bg-indigo-700' },
    slate: { link: 'text-slate-700 hover:text-slate-900', focus: 'focus:ring-slate-900', button: 'bg-slate-900 hover:bg-black' }
  };
  const color = colors[accentClass] || colors.indigo;

  const reset = () => {
    setIsOpen(false);
    setPhone('');
    setPin('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!phone.trim()) {
      setMessage('Enter the phone number registered to this account.');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setMessage('PIN must contain exactly 6 digits.');
      return;
    }

    setIsSaving(true);
    try {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .eq('phone', phone.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setMessage('We could not verify those details.');
        return;
      }

      const { error: updateError } = await supabase
        .from(table)
        .update({
          pin_hash: pin,
          ...(table === 'staff' ? { pin_changed_at: new Date().toISOString() } : {})
        })
        .eq('id', data.id)
        .eq('phone', phone.trim())
        .eq('is_active', true);

      if (updateError) throw updateError;
      setMessage('PIN updated. You can now sign in.');
      setPhone('');
      setPin('');
    } catch (error) {
      console.error('Forgot PIN failed:', error);
      setMessage('Unable to update PIN right now. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mt-4">
      {!isOpen ? (
        <button
          type="button"
          onClick={() => { setIsOpen(true); setMessage(''); }}
          className={`inline-flex items-center gap-1 text-xs font-bold ${color.link}`}
        >
          <KeyRound size={14} /> Forgot PIN?
        </button>
      ) : (
        <div className="border-t border-slate-200 pt-4 text-left">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-slate-800">Reset your PIN</p>
            <button type="button" onClick={reset} className="text-xs font-bold text-slate-400 hover:text-slate-700">Cancel</button>
          </div>
          <p className="text-xs text-slate-500 mb-3">Enter your registered phone number and choose a new 6-digit PIN.</p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              type="tel"
              inputMode="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className={`w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 ${color.focus}`}
              disabled={isSaving}
            />
            <div className="flex justify-center gap-2" role="group" aria-label="New six digit PIN">
              {Array.from({ length: 6 }, (_, index) => (
                <input
                  key={index}
                  ref={(element) => { pinRefs.current[index] = element; }}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[index] || ''}
                  onChange={(event) => {
                    const digit = event.target.value.replace(/\D/g, '').slice(-1);
                    const nextPin = pin.split('');
                    nextPin[index] = digit;
                    setPin(nextPin.join('').slice(0, 6));
                    if (digit && index < 5) pinRefs.current[index + 1]?.focus();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Backspace' && !pin[index] && index > 0) pinRefs.current[index - 1]?.focus();
                  }}
                  className={`h-10 w-9 rounded-lg border border-slate-200 text-center font-bold text-slate-800 focus:outline-none focus:ring-2 ${color.focus}`}
                  aria-label={`New PIN digit ${index + 1}`}
                  disabled={isSaving}
                />
              ))}
            </div>
            {message && <p className="text-xs font-bold text-slate-600">{message}</p>}
            <button type="submit" disabled={isSaving} className={`w-full text-white font-bold py-2 rounded-xl transition ${color.button} disabled:opacity-50`}>
              {isSaving ? 'Updating...' : 'Update PIN'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
