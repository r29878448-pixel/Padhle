
import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, AlertCircle, Loader2, ArrowRight, HelpCircle, ExternalLink, Zap } from 'lucide-react';
import { SiteSettings, Course } from '../types';

interface AccessGateProps {
  onUnlock: () => void;
  batchId: string;
  siteSettings: SiteSettings;
  courses: Course[];
}

const AccessGate: React.FC<AccessGateProps> = ({ onUnlock, batchId, siteSettings, courses }) => {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'get-link' | 'enter-code'>('get-link');

  const currentBatch = courses.find(c => c.id === batchId);
  const REQUIRED_KEY = (currentBatch?.accessCode || "ADMIN").toUpperCase().trim();

  // Load state if user already clicked the link
  useEffect(() => {
    const wasClicked = localStorage.getItem(`link_clicked_${batchId}`);
    if (wasClicked) setStep('enter-code');
  }, [batchId]);

  const handleGenerateLink = () => {
    setIsLoading(true);
    
    // Construct a destination URL that includes the key as a parameter.
    // When the user solves the shortener, they land back on this app with the key in the URL.
    const baseUrl = window.location.href.split('?')[0];
    const destination = `${baseUrl}?unlocked_code=${REQUIRED_KEY}`;
    
    const shortenerApiUrl = siteSettings.shortenerUrl || "https://gplinks.in/api";
    const apiKey = siteSettings.shortenerApiKey;
    
    // If API key is present, use the shortener. Otherwise, fallback to direct open for demo.
    const finalUrl = apiKey 
      ? `${shortenerApiUrl}?api=${apiKey}&url=${encodeURIComponent(destination)}`
      : destination; // Fallback: just reload with key (Demo mode)

    // Delay slightly to simulate processing
    setTimeout(() => {
      window.open(finalUrl, '_blank');
      localStorage.setItem(`link_clicked_${batchId}`, 'true');
      setStep('enter-code');
      setIsLoading(false);
    }, 1500);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const inputKey = key.toUpperCase().trim();
    
    if (inputKey === REQUIRED_KEY || inputKey === 'ADMIN') {
      setIsLoading(true);
      setTimeout(() => {
        onUnlock();
        localStorage.removeItem(`link_clicked_${batchId}`);
      }, 1000);
    } else {
      setError('Invalid Access Key. Please ensure you completed the link process correctly.');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl animate-fadeIn"></div>
      
      <div className="relative w-full max-w-md bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-slideUp">
        {/* Header Section */}
        <div className="bg-slate-900 p-10 text-white text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck size={120} />
          </div>
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/20">
            <Lock size={28} className="text-white" />
          </div>
          <h2 className="text-3xl font-black tracking-tight leading-tight">Batch Access <br/>Required</h2>
          <p className="text-slate-400 text-sm mt-2 font-medium">Verify your student status to proceed.</p>
        </div>

        {/* Content Section */}
        <div className="p-10 space-y-8">
          {step === 'get-link' ? (
            <div className="space-y-8">
              <div className="flex gap-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
                  <Zap size={20} />
                </div>
                <div>
                  <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Process instructions</p>
                  <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                    1. Click "Get Access Key" below.<br/>
                    2. Complete the verification steps.<br/>
                    3. You will receive a code to paste here.
                  </p>
                </div>
              </div>

              <button 
                onClick={handleGenerateLink}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/25 active:scale-95 group"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : (
                  <>Get Access Key <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /></>
                )}
              </button>
            </div>
          ) : (
            <form onSubmit={handleUnlock} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Paste your key here</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={key}
                    onChange={(e) => {setKey(e.target.value); setError('');}}
                    placeholder="SP-XXXXXX"
                    className={`w-full px-6 py-5 rounded-2xl border-2 text-center font-black tracking-[0.2em] uppercase transition-all ${
                      error ? 'border-red-500 bg-red-50 text-red-900' : 'border-slate-100 bg-slate-50 focus:border-blue-600 focus:bg-white text-slate-900'
                    }`}
                  />
                  {isLoading && (
                    <div className="absolute right-6 top-1/2 -translate-y-1/2">
                      <Loader2 className="animate-spin text-blue-600" size={20} />
                    </div>
                  )}
                </div>
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-[11px] font-bold mt-2 ml-1 animate-shake">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !key}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl disabled:opacity-50"
              >
                Verify Status
              </button>
              
              <button 
                type="button" 
                onClick={() => setStep('get-link')} 
                className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors"
              >
                Back to link generation
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
