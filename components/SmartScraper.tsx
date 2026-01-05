
import React, { useState } from 'react';
import { Search, Loader2, Globe, Database, ArrowRight, CheckCircle2, AlertCircle, Save, Zap, RefreshCw, FileCode, Bot, User as UserIcon, Play, Radio, Clock, Calendar, GraduationCap } from 'lucide-react';
import { parseScrapedContent } from '../services/geminiService';
import { saveCourseToDB } from '../services/db';
import { Course } from '../types';

interface ScrapedContent {
  title: string;
  category: string;
  description: string;
  instructor: string;
  thumbnail: string;
  price: number;
  totalDuration?: string;
  lastUpdated?: string;
  subjects: {
    title: string;
    lectures: { title: string; url: string; duration: string; thumbnail?: string; isLive?: boolean; type?: string }[];
  }[];
}

const SmartScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [manualHtml, setManualHtml] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<ScrapedContent | null>(null);
  const [step, setStep] = useState<number>(0); 
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
        // Use proxy to attempt following onelink redirects
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Connection blocked. Please use the 'Paste HTML' method for 100% success.");
        html = await response.text();
      }

      setStep(2);
      const data = await parseScrapedContent(html!, url || "Direct Ingest");
      
      if (!data || !data.title) throw new Error("Could not detect curriculum structure. Try pasting the page source (Ctrl+U).");
      
      setResult(data);
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Scrape sync failed.");
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
        description: result.description || "Auto-synced from PW ecosystem.",
        instructor: result.instructor || "PW Academic Expert",
        image: result.thumbnail || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500",
        price: result.price || 0,
        rating: 4.9,
        students: Math.floor(Math.random() * 5000) + 1000,
        category: result.category || "Class 10th",
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
                description: `Type: ${l.type || 'Video lecture'}`,
                resources: []
              }))
            }
          ]
        }))
      };

      await saveCourseToDB(newBatch);
      setSuccess("Batch successfully integrated into Class segments!");
      setResult(null);
      setUrl('');
      setStep(0);
    } catch (e) {
      setError("Cloud database sync failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn text-left">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
           <GraduationCap size={200} />
        </div>
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-4 tracking-tighter">
              <Zap className="text-blue-600 fill-blue-600 animate-pulse" size={32} /> PW Batch Sync
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2 ml-1">
              Classes 9, 10, 11 & 12 Specialized Auto-Fetcher
            </p>
          </div>
          <Bot className="text-blue-500 bg-blue-50 p-3 rounded-3xl animate-float" size={64} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
              <input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste PW App/Web link (Onelink supported)..." 
                className="w-full pl-16 pr-6 py-6 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-black text-sm outline-none focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={() => handleAutoFetch()}
              disabled={isScraping || !url}
              className="bg-slate-900 text-white px-12 py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-2xl shadow-slate-900/20"
            >
              {isScraping ? <Loader2 className="animate-spin" size={24}/> : <RefreshCw size={24}/>}
              Fetch Batch
            </button>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
            <div className="relative flex justify-center text-[9px] font-black uppercase text-slate-300 tracking-[0.4em]"><span className="bg-white px-6">Manual HTML Buffer</span></div>
          </div>

          <div className="space-y-4">
            <textarea 
              value={manualHtml}
              onChange={(e) => setManualHtml(e.target.value)}
              placeholder="Paste page source from Browser/App here for deep-crawl..."
              className="w-full h-32 p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-mono text-[10px] outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
            />
            <button 
              onClick={() => handleAutoFetch(manualHtml)}
              disabled={isScraping || !manualHtml}
              className="w-full py-5 bg-white text-slate-500 border border-slate-200 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-2"
            >
              <FileCode size={20}/> Process Raw Data
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-[10px] font-black uppercase flex items-center gap-3 animate-shake">
            <AlertCircle size={18}/> {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase flex items-center gap-3 animate-fadeIn">
            <CheckCircle2 size={18}/> {success}
          </div>
        )}
      </div>

      {isScraping && (
        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 text-center space-y-8 shadow-xl">
           <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
             <Loader2 className="animate-spin text-blue-600" size={48} />
           </div>
           <div className="space-y-3">
              <p className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">
                {step === 1 ? 'Connecting to PW Ecosystem...' : 'AI Decoding Curriculum Tree...'}
              </p>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Identifying Class Level: 9th-12th</p>
           </div>
        </div>
      )}

      {result && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 animate-slideUp pb-12">
          <div className="xl:col-span-5">
            <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl sticky top-24">
              <div className="aspect-[16/10] relative">
                <img src={result.thumbnail || 'https://via.placeholder.com/800x500'} className="w-full h-full object-cover" />
                <div className="absolute top-8 left-8 flex flex-col gap-2">
                   <div className="px-4 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg border border-white/20">{result.category} Detected</div>
                   {result.totalDuration && (
                     <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest rounded-2xl flex items-center gap-2">
                        <Clock size={14}/> {result.totalDuration}
                     </div>
                   )}
                </div>
              </div>
              <div className="p-12 space-y-8">
                <div className="space-y-4">
                  <h4 className="font-black text-slate-900 uppercase italic tracking-tighter leading-none text-3xl">{result.title}</h4>
                  <div className="flex items-center gap-3 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                    <UserIcon size={18} className="text-blue-500" /> {result.instructor}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 py-6 border-t border-slate-50">
                  {result.subjects.map((s, i) => <span key={i} className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase border border-blue-100 tracking-wider">{s.title}</span>)}
                </div>

                <button 
                  onClick={handleSaveToPortal}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-8 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                  {isSaving ? 'Processing...' : 'Deploy to Study Portal'}
                </button>
              </div>
            </div>
          </div>

          <div className="xl:col-span-7 space-y-8">
            <div className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm">
              <h4 className="font-black text-slate-900 uppercase text-xs mb-10 flex items-center gap-4 tracking-widest">
                <Database size={28} className="text-blue-600"/> Reconstructed Content Tree
              </h4>
              <div className="space-y-10">
                {result.subjects.map((sub, sIdx) => (
                  <div key={sIdx} className="space-y-6">
                    <div className="flex items-center gap-4 mb-4">
                       <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                       <p className="text-sm font-black text-slate-900 uppercase italic tracking-wider">{sub.title}</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {sub.lectures.map((lec, lIdx) => (
                        <div key={lIdx} className="p-5 bg-slate-50 border border-slate-100 rounded-[2rem] flex gap-5 group hover:bg-white hover:border-blue-400 hover:shadow-xl transition-all cursor-default">
                          <div className="w-24 h-16 bg-slate-200 rounded-2xl overflow-hidden shrink-0 relative shadow-sm">
                            {lec.thumbnail ? (
                              <img src={lec.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="thumb" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400"><Play size={20}/></div>
                            )}
                            {lec.isLive && (
                              <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                <div className="px-2 py-0.5 bg-red-600 text-white text-[7px] font-black uppercase rounded shadow-lg flex items-center gap-1 animate-pulse">
                                  <Radio size={8} /> LIVE
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex flex-col justify-center">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{lec.title}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-2">
                               {lec.isLive ? <Radio size={10} className="text-red-500"/> : <Clock size={10}/>}
                               {lec.isLive ? 'Current Live' : lec.duration}
                            </p>
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
