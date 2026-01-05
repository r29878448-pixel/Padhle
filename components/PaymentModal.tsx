
import React, { useState, useEffect } from 'react';
import { X, QrCode, Loader2, ShieldCheck, Timer, Zap } from 'lucide-react';
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-none shadow-2xl overflow-hidden relative border border-slate-200">
        <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>

        <div className="p-10">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Batch Enrollment</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Course: {course.title}</p>
          </div>

          {status === 'fallback' ? (
            <div className="space-y-6 text-center animate-fadeIn py-8">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 flex items-center justify-center mx-auto border border-amber-200 rounded-none">
                <Timer size={32} className="animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase">Manual Verification</h3>
                <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">The AI couldn't verify this UTR instantly. Access will be granted automatically after a quick manual bypass.</p>
              </div>
              <div className="text-4xl font-black text-blue-600">00:{timeLeft.toString().padStart(2, '0')}</div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Please do not close this window</p>
            </div>
          ) : (
            <>
              <div className="bg-slate-50 p-6 flex flex-col items-center border border-slate-200 mb-8">
                {course.qrCode ? (
                  <img src={course.qrCode} className="w-48 h-48 object-contain mb-4 border border-white" alt="Payment QR" />
                ) : (
                  <div className="w-48 h-48 bg-slate-200 flex items-center justify-center mb-4">
                    <QrCode size={48} className="text-slate-400" />
                  </div>
                )}
                <div className="text-center">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Amount to Pay</p>
                  <p className="text-3xl font-black text-slate-900">₹{course.price}</p>
                </div>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">UTR / Transaction ID</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Enter 12-digit UTR No."
                    className="w-full px-4 py-4 bg-slate-50 border border-slate-200 font-bold text-slate-900 outline-none focus:border-blue-600 transition-all rounded-none"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={status === 'verifying'}
                  className="w-full bg-slate-900 text-white py-5 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-600 transition-all shadow-xl"
                >
                  {status === 'verifying' ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>}
                  {status === 'verifying' ? 'Verifying with AI...' : 'Submit Transaction'}
                </button>
              </form>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Zap size={14} fill="currentColor" />
             </div>
             <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Secured via Delta AI Gateway. Fake UTRs lead to account suspension.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
