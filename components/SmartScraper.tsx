
import React, { useState } from 'react';
import { Search, Loader2, Globe, Database, ArrowRight, CheckCircle2, AlertCircle, Save, Zap, RefreshCw, FileCode, Bot, User as UserIcon, Play, Radio } from 'lucide-react';
import { parseScrapedContent } from '../services/geminiService';
import { saveCourseToDB } from '../services/db';
import { Course } from '../types';

interface ScrapedContent {
  title: string;
  description: string;
  instructor: string;
  thumbnail: string;
  price: number;
  subjects: {
    title: string;
    lectures: { title: string; url: string; duration: string; thumbnail?: string; isLive?: boolean }[];
  }[];
}

const SmartScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [manualHtml, setManualHtml] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<ScrapedContent | null>(null);
  const [step, setStep] = useState<number>(0); // 0: input, 1: fetching, 2: parsing, 3: result
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAutoFetch = async (sourceHtml?: string) => {
    if (!url && !sourceHtml) return;
    setIsScraping(true);
    setError('');
    setStep(1);
    
    try {
      let html = sourceHtml;
      
      if (!html) {
        // Try direct proxy fetch first
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Bot-protection detected. Please use 'Paste HTML' mode.");
        html = await response.text();
      }

      setStep(2);
      const data = await parseScrapedContent(html!, url || "Manual Ingest");
      
      if (!data || !data.title) throw new Error("AI could not find a curriculum on this page.");
      
      setResult(data);
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Connection failed.");
      setStep(0);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveToPortal = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const newBatch: Course = {
        id: result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        title: result.title,
        description: result.description || "Auto-discovered content.",
        instructor: result.instructor || "Expert Faculty",
        image: result.thumbnail || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500",
        price: result.price || 0,
        rating: 4.9,
        students: Math.floor(Math.random() * 2000) + 500,
        category: "Auto-Synced",
        subjects: result.subjects.map((s, sIdx) => ({
          id: `sub-${sIdx}-${Date.now()}`,
          title: s.title,
          chapters: [
            {
              id: `chap-${sIdx}-${Date.now()}`,
              title: "Imported Modules",
              lectures: s.lectures.map((l, lIdx) => ({
                id: `lec-${lIdx}-${Date.now()}`,
                title: l.title,
                videoUrl: l.url,
                thumbnail: l.thumbnail,
                duration: l.duration || (l.isLive ? 'LIVE' : 'N/A'),
                description: "Lecture synced from source.",
                resources: []
              }))
            }
          ]
        }))
      };

      await saveCourseToDB(newBatch);
      setSuccess("Batch synced successfully! Refresh your home page.");
      setResult(null);
      setUrl('');
      setStep(0);
    } catch (e) {
      setError("Database connection error.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn text-left">
      {/* Search Header */}
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-3">
              <Zap className="text-blue-600 fill-blue-600" /> Auto-Discovery Hub
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">
              Deep Crawl Physics Wallah & NextToppers Resources
            </p>
          </div>
          <Bot className="text-blue-100 animate-float" size={48} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste PW Batch URL..." 
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-200 rounded-3xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              />
            </div>
            <button 
              onClick={() => handleAutoFetch()}
              disabled={isScraping || !url}
              className="bg-slate-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
            >
              {isScraping ? <Loader2 className="animate-spin" size={20}/> : <RefreshCw size={20}/>}
              {isScraping ? 'Auto-Fetching...' : 'Fetch All Content'}
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[8px] font-black uppercase text-slate-300 tracking-[0.3em]"><span className="bg-white px-4">OR USE RAW HTML PASTE</span></div>
          </div>

          <div className="space-y-4">
            <textarea 
              value={manualHtml}
              onChange={(e) => setManualHtml(e.target.value)}
              placeholder="Paste page source (Ctrl+U) for 100% success..."
              className="w-full h-24 p-6 bg-slate-50 border border-slate-200 rounded-3xl font-mono text-[10px] outline-none focus:border-blue-500 transition-all resize-none"
            />
            <button 
              onClick={() => handleAutoFetch(manualHtml)}
              disabled={isScraping || !manualHtml}
              className="w-full py-4 bg-white text-slate-500 border border-slate-200 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
            >
              <FileCode size={16}/> Extract From HTML
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-[10px] font-black uppercase flex items-center gap-3 animate-shake">
            <AlertCircle size={18}/> {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase flex items-center gap-3">
            <CheckCircle2 size={18}/> {success}
          </div>
        )}
      </div>

      {isScraping && (
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 text-center space-y-6">
           <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
           <p className="text-lg font-black text-slate-900 uppercase italic">
             {step === 1 ? 'Streaming HTML Data...' : 'AI Discovering Live Streams & Thumbnails...'}
           </p>
        </div>
      )}

      {/* Sync Result Preview */}
      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-slideUp">
          <div className="xl:col-span-4">
            <div className="bg-white border border-slate-100 rounded-[3rem] overflow-hidden shadow-sm sticky top-24">
              <div className="aspect-[16/10] relative">
                <img src={result.thumbnail || 'https://via.placeholder.com/800x500'} className="w-full h-full object-cover" />
                <div className="absolute top-6 left-6 px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">Source Found</div>
              </div>
              <div className="p-8 space-y-4">
                <h4 className="font-black text-slate-900 uppercase italic tracking-tight leading-tight text-xl">{result.title}</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase">{result.instructor}</p>
                <button 
                  onClick={handleSaveToPortal}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                  Deploy Batch
                </button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-8 space-y-6">
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm">
              <h4 className="font-black text-slate-900 uppercase text-xs mb-8 flex items-center gap-3">
                <Database size={22} className="text-blue-600"/> Auto-Fetched Modules
              </h4>
              <div className="space-y-6">
                {result.subjects.map((sub, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <p className="text-xs font-black text-slate-900 uppercase italic border-b pb-2">{sub.title}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {sub.lectures.map((lec, lIdx) => (
                        <div key={lIdx} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex gap-4 group hover:bg-white hover:border-blue-300 transition-all">
                          <div className="w-20 h-14 bg-slate-200 rounded-lg overflow-hidden shrink-0 relative">
                            {lec.thumbnail ? (
                              <img src={lec.thumbnail} className="w-full h-full object-cover" alt="thumb" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><Play size={16}/></div>
                            )}
                            {lec.isLive && (
                              <div className="absolute top-1 left-1 px-1 py-0.5 bg-red-600 text-white text-[6px] font-black uppercase rounded flex items-center gap-1">
                                <Radio size={6} /> LIVE
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-2">{lec.title}</p>
                            <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">{lec.isLive ? 'Live Stream' : lec.duration}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartScraper;
