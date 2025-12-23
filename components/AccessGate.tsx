import React, { useState } from 'react';
import { Lock, AlertCircle, Loader2, Zap, Clock, ShieldAlert } from 'lucide-react';
import { SiteSettings } from '../types';

interface AccessGateProps {
  siteSettings: SiteSettings;
}

const AccessGate: React.FC<AccessGateProps> = ({ siteSettings }) => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetAccess = async () => {
    setIsLoading(true);
    setError('');

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
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(requestUrl)}`;

      console.log("Generating link via proxy...");

      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error("Network error contacting proxy.");
      
      const data = await response.json();
      const shortenedLink = data.contents;

      // 5. Validation
      if (!shortenedLink) {
        throw new Error("Empty response from shortener service.");
      }

      if (shortenedLink.startsWith('http')) {
        // Success
        window.location.href = shortenedLink;
      } else {
        // The API returned an error message as text (e.g. "Invalid API Key")
        console.error("API Error:", shortenedLink);
        // Clean up error message
        let displayError = shortenedLink;
        if(typeof shortenedLink === 'string' && shortenedLink.length > 50) {
            try {
                const jsonErr = JSON.parse(shortenedLink);
                if(jsonErr.message) displayError = jsonErr.message;
            } catch(e) { displayError = "Unknown API Error"; }
        }
        throw new Error(`Service Error: ${displayError}`);
      }
      
    } catch (err: any) {
      console.error("Link Gen Failed:", err);
      setError(err.message || "Failed to generate access link. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fadeIn"></div>
      
      <div className="relative w-full max-w-sm bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-slideUp">
        <div className="bg-slate-900 p-8 text-center">
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