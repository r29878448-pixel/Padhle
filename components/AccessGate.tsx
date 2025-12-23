import React, { useState } from 'react';
import { Lock, Loader2, Zap, Clock, ShieldAlert, X } from 'lucide-react';
import { SiteSettings } from '../types';

interface AccessGateProps {
  siteSettings: SiteSettings;
  onClose: () => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ siteSettings, onClose }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetAccess = async () => {
    setIsLoading(true);
    setError('');

    // 0. Set Timestamp for Fallback Verification (20s rule)
    // If the user leaves and comes back after 20s, App.tsx will auto-grant access
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
      
      // 4. Proxy (Essential for CORS)
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(requestUrl)}`;

      console.log("Generating link via proxy...");

      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Proxy error: ${response.status} ${response.statusText}`);
      }
      
      const shortenedLink = (await response.text()).trim();

      // 5. Validation
      if (!shortenedLink) {
        throw new Error("Empty response from shortener service.");
      }

      if (shortenedLink.startsWith('http')) {
        window.location.href = shortenedLink;
      } else {
        console.error("API Error Response:", shortenedLink);
        let displayError = shortenedLink;
        if (displayError.startsWith('{')) {
            try {
                const json = JSON.parse(displayError);
                if (json.message) displayError = json.message;
            } catch (e) { /* ignore */ }
        }
        throw new Error(`Service Error: ${displayError}`);
      }
      
    } catch (err: any) {
      console.error("Link Gen Failed:", err);
      let msg = err.message || "Failed to generate access link.";
      if (msg === "Failed to fetch") {
        msg = "Network Error: Please check your internet connection or disable AdBlocker.";
      }
      setError(msg);
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
            <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-100">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <button 
            onClick={handleGetAccess}
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-base hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <Zap size={20} className="fill-white" />}
            {isLoading ? "Generating Link..." : "Unlock Access Now"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessGate;