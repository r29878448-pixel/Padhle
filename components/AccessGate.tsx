import React, { useState, useEffect } from 'react';
import { Lock, Loader2, Zap, Clock, ShieldAlert, X, Timer, CheckCircle } from 'lucide-react';
import { SiteSettings } from '../types';

interface AccessGateProps {
  siteSettings: SiteSettings;
  onClose: () => void;
  onAccessGranted: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ siteSettings, onClose, onAccessGranted }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [fallbackSeconds, setFallbackSeconds] = useState<number | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);

  // Effect to handle the visual countdown if fallback mode is triggered
  useEffect(() => {
    let interval: any;
    if (fallbackSeconds !== null && fallbackSeconds > 0) {
      interval = setInterval(() => {
        setFallbackSeconds(prev => (prev && prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [fallbackSeconds]);

  const handleAction = async () => {
    // If in fallback mode and timer finished, grant access
    if (isFallbackMode && fallbackSeconds === 0) {
        onAccessGranted();
        return;
    }

    setIsLoading(true);
    setError('');
    setFallbackSeconds(null);

    // 0. Set Timestamp for Fallback Verification (20s rule)
    // If the user leaves and comes back after 20s, App.tsx will auto-grant access.
    localStorage.setItem('study_portal_verification_start', Date.now().toString());

    try {
      // 1. Destination URL (Auto Verify)
      const baseUrl = window.location.origin + window.location.pathname;
      const destinationUrl = `${baseUrl}?auto_verify=true`;

      // 2. API Config (Fallback to provided defaults if empty)
      const apiUrl = siteSettings.shortenerUrl || 'https://vplink.in/api';
      const apiKey = siteSettings.shortenerApiKey || '320f263d298979dc11826b8e2574610ba0cc5d6b';

      if (!apiKey) {
        throw new Error("API Key is missing in admin configuration.");
      }

      // 3. Construct API URL
      const requestUrl = `${apiUrl}?api=${apiKey}&url=${encodeURIComponent(destinationUrl)}&format=text`;
      
      // 4. Proxy (Switching to allorigins to avoid 403 from corsproxy.io)
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(requestUrl)}`;

      console.log("Generating link via proxy...");

      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status}`);
      }
      
      const shortenedLink = (await response.text()).trim();

      // 5. Validation
      if (!shortenedLink) {
        throw new Error("Empty response service.");
      }

      if (shortenedLink.startsWith('http')) {
        window.location.href = shortenedLink;
      } else {
        // If response is JSON error or HTML, treat as failure
        throw new Error("Invalid link response");
      }
      
    } catch (err: any) {
      console.error("Link Gen Failed:", err);
      // Fallback: Trigger visual countdown
      setIsFallbackMode(true);
      setFallbackSeconds(15);
      setError("Link service busy. Manual verification enabled.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fadeIn" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-slideUp">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors z-10">
          <X size={24} />
        </button>

        <div className="bg-slate-900 p-8 text-center relative">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Lock size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-black text-white">Premium Content</h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Verification Required</p>
        </div>

        <div className="p-8 space-y-6">
          <div className="flex gap-4 items-start">
             <Clock className="text-blue-600 shrink-0" size={20} />
             <p className="text-sm text-slate-600 font-medium">Complete one quick step to unlock <span className="font-bold text-slate-900">48 Hours</span> of unlimited access to all batches and notes.</p>
          </div>

          {error && (
            <div className="p-3 bg-amber-50 text-amber-600 text-xs font-bold rounded-xl flex items-center gap-2 border border-amber-100">
              <ShieldAlert size={16} className="shrink-0" /> {error}
            </div>
          )}

          <button 
            onClick={handleAction}
            disabled={isLoading || (fallbackSeconds !== null && fallbackSeconds > 0)}
            className={`w-full py-4 rounded-xl font-black text-base transition-all shadow-lg flex items-center justify-center gap-2 ${
              isFallbackMode && fallbackSeconds === 0
                ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/30'
                : fallbackSeconds !== null && fallbackSeconds > 0
                ? 'bg-slate-100 text-slate-400 cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/30'
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> Generating Link...
              </>
            ) : fallbackSeconds !== null && fallbackSeconds > 0 ? (
              <>
                <Timer className="animate-pulse" size={20} /> Verifying in {fallbackSeconds}s...
              </>
            ) : isFallbackMode && fallbackSeconds === 0 ? (
              <>
                <CheckCircle size={20} /> Complete Verification
              </>
            ) : (
              <>
                <Zap size={20} className="fill-white" /> Unlock Access Now
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;