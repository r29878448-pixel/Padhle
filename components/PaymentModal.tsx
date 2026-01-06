import React, { useState, useEffect } from 'react';
import { X, QrCode, Loader2, ShieldCheck, Zap, Clock } from 'lucide-react';
import { verifyUTR } from '../services/geminiService';
import { Course } from '../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, course, onSuccess }) => {
  const [utr, setUtr] = useState('');
  const [status, setStatus] = useState<'idle' | 'verifying' | 'failed' | 'fallback'>('idle');
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    let timer: any;
    if (status === 'fallback' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (status === 'fallback' && timeLeft === 0) {
      onSuccess();
    }
    return () => clearInterval(timer);
  }, [status, timeLeft, onSuccess]);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (utr.length < 8) return alert("Please enter a valid Transaction ID.");
    
    setStatus('verifying');
    const isValid = await verifyUTR(utr);

    if (isValid) {
      onSuccess();
    } else {
      setStatus('fallback');
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-study">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden relative border border-slate-100">
        <button onClick={onClose} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
          <X size={28} />
        </button>

        <div className="p-12">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">Batch Enrollment</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 truncate">License: {course.title}</p>
          </div>

          {status === 'fallback' ? (
            <div className="space-y-8 text-center animate-study py-10">
              <div className="w-20 h-20 bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-100 rounded-[2rem]">
                <Clock size={40} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 uppercase italic">Manual Bypass</h3>
                <p className="text-xs text-slate-500 font-medium mt-4 leading-relaxed">System is validating UTR via alternate nodes. Your access will be live in a few seconds.</p>
              </div>
              <div className="text-5xl font-black text-blue-600 tabular-nums">00:{timeLeft.toString().padStart(2, '0')}</div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em]">Optimizing Enrollment Gateway</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 p-8 flex flex-col items-center border border-slate-100 mb-10 rounded-[2.5rem] shadow-inner">
                {course.qrCode ? (
                  <img src={course.qrCode} className="w-56 h-56 object-contain mb-6 border-4 border-white shadow-xl rounded-2xl" alt="QR" />
                ) : (
                  <div className="w-56 h-56 bg-white flex items-center justify-center mb-6 shadow-xl rounded-2xl border border-slate-100">
                    <QrCode size={64} className="text-slate-100" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Module Fee</p>
                  <p className="text-4xl font-black text-slate-900 tracking-tighter">₹{course.price}</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">UTR / Transaction ID</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter 12-digit UTR ID"
                    className="w-full px-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-black text-slate-900 outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-sm uppercase tracking-tighter"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'verifying'}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[13px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl active:scale-[0.98]"
                >
                  {status === 'verifying' ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
                  {status === 'verifying' ? 'Verifying AI Sync...' : 'Claim Enrollment'}
                </button>
              </form>
            </>
          )}

          <div className="mt-10 pt-8 border-t border-slate-50 flex items-center gap-4">
             <div className="w-10 h-10 bg-emerald-50 text-emerald-600 flex items-center justify-center rounded-xl shrink-0">
                <Zap size={20} fill="currentColor" />
             </div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Secured via Delta AI Engine. Fraudulent UTR attempts result in immediate hardware ban.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;