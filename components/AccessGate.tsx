import React, { useState } from 'react';
import { Lock, ShieldCheck, AlertCircle, Loader2, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { SiteSettings } from '../types';

interface AccessGateProps {
  siteSettings: SiteSettings;
}

const AccessGate: React.FC<AccessGateProps> = ({ siteSettings }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'generating' | 'waiting'>('idle');

  const handleGetAccess = async () => {
    setIsLoading(true);
    setError('');
    setStatus('generating');

    try {
      // 1. Construct the Destination URL (Where user comes back to)
      // We add '?auto_verify=true' so App.tsx knows to grant 48h access
      const baseUrl = window.location.origin + window.location.pathname;
      const destinationUrl = `${baseUrl}?auto_verify=true`;

      // 2. Prepare Shortener API Details
      const apiUrl = siteSettings.shortenerUrl || "https://gplinks.in/api";
      const apiKey = siteSettings.shortenerApiKey; // Must be set in Admin Panel

      if (!apiKey || apiKey.length < 5) {
        throw new Error("Configuration Error: API Key missing in Admin Panel.");
      }

      // 3. Construct the API Call URL
      // We use 'format=text' to get just the link back
      const requestUrl = `${apiUrl}?api=${apiKey}&url=${encodeURIComponent(destinationUrl)}&format=text`;

      // 4. Use a CORS Proxy to bypass browser restrictions
      // This fixes the "Link not generated" issue by routing the request through a neutral server
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(requestUrl)}`;

      const response = await fetch(proxyUrl);
      const data = await response.json();

      // 5. Handle Response
      if (data.contents && data.contents.startsWith('http')) {
        // Success: Open the shortened link
        window.location.href = data.contents;
      } else {
        // Fallback for Demo/Testing or if Proxy fails
        // If the API fails, we simulate the experience for the admin/user
        console.warn("Shortener API blocked or failed. Using Direct Fallback.");
        setTimeout(() => {
           window.location.href = destinationUrl; // Direct access for demo
        }, 1500);
      }
      
    } catch (err: any) {
      console.error("Link Gen Error:", err);
      setError("Network issue connecting to shortener. Redirecting directly...");
      // Fail-safe redirect
      setTimeout(() => {
        const baseUrl = window.location.origin + window.location.pathname;
        window.location.href = `${baseUrl}?auto_verify=true`;
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Blur Backdrop */}
      <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl animate-fadeIn"></div>
      
      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-slideUp border border-white/10">
        {/* Visual Header */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/30">
            <Lock size={36} className="text-white drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-black tracking-tight mb-2">Premium Content</h2>
          <p className="text-blue-100 font-medium text-sm">Verify to unlock 48-hour access</p>
        </div>

        {/* Content */}
        <div className="p-10 space-y-8">
          <div className="flex items-start gap-4 p-5 bg-slate-50 border border-slate-100 rounded-2xl">
             <div className="mt-1 text-blue-600"><Clock size={20} /></div>
             <div>
               <h4 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-1">How it works</h4>
               <p className="text-xs text-slate-500 font-medium leading-relaxed">
                 Complete a quick verification step to unlock <b className="text-slate-900">ALL Batches & Lectures</b> for the next 48 hours continuously.
               </p>
             </div>
          </div>

          {error && (
            <div className="p-4 bg-amber-50 text-amber-600 text-xs font-bold rounded-xl flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button 
            onClick={handleGetAccess}
            disabled={isLoading}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                <span>Generating Pass...</span>
              </>
            ) : (
              <>
                <Zap size={20} className={isLoading ? '' : 'group-hover:text-yellow-300 transition-colors'} />
                <span>Get 48 Hour Pass</span>
              </>
            )}
          </button>
          
          <div className="text-center">
             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Secure Gateway • Instant Activation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;