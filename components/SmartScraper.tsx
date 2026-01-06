
import React, { useState } from 'react';
import { Search, Loader2, RefreshCw, FileCode, Save, Zap, Database, CheckCircle2, AlertCircle, Play, User as UserIcon, FileText } from 'lucide-react';
import { parseScrapedContent } from '../services/geminiService';
import { saveCourseToDB } from '../services/db';
import { Course, Resource } from '../types';

interface ScrapedContent {
  title: string;
  category: string;
  description: string;
  instructor: string;
  thumbnail: string;
  price: number;
  subjects: {
    title: string;
    lectures: { 
      title: string; 
      url: string; 
      duration: string; 
      thumbnail?: string; 
      isLive?: boolean;
      resources?: Resource[];
    }[];
  }[];
}

const SmartScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [manualHtml, setManualHtml] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<ScrapedContent | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAutoFetch = async (sourceHtml?: string) => {
    if (!url && !sourceHtml) return;
    setIsScraping(true);
    setError('');
    setSuccess('');
    
    try {
      let html = sourceHtml;
      
      if (!html) {
        // Attempt proxy fetch
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("CORS or Bot Protection active. Please use 'Process Direct Source' with the page HTML (Ctrl+U).");
        html = await response.text();
      }

      const data = await parseScrapedContent(html!, url || "Direct Source Ingest");
      if (!data || !data.title) throw new Error("Deep crawl failed to map data. Ensure you are on a Batch or Course page.");
      
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Failed to analyze external curriculum.");
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
        description: result.description || "Premium academic content.",
        instructor: result.instructor || "Academy Faculty",
        image: result.thumbnail || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500",
        price: result.price || 0,
        rating: 4.9,
        students: Math.floor(Math.random() * 10000) + 5000,
        category: result.category || "JEE",
        subjects: result.subjects.map((s, sIdx) => ({
          id: `sub-${sIdx}-${Date.now()}`,
          title: s.title,
          chapters: [
            {
              id: `chap-${sIdx}-${Date.now()}`,
              title: "Full Module",
              lectures: s.lectures.map((l, lIdx) => ({
                id: `lec-${lIdx}-${Date.now()}`,
                title: l.title,
                videoUrl: l.url,
                thumbnail: l.thumbnail || result.thumbnail,
                duration: l.duration || (l.isLive ? 'LIVE' : 'N/A'),
                description: `Complete session for ${l.title}.`,
                resources: l.resources || []
              }))
            }
          ]
        }))
      };

      await saveCourseToDB(newBatch);
      setSuccess("Real batch curriculum and thumbnails synced successfully!");
      setResult(null);
      setUrl('');
      setManualHtml('');
    } catch (e) {
      setError("Failed to push curriculum to cloud database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-study text-left">
      <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-5 tracking-tighter">
              <Zap className="text-blue-600 fill-blue-600" size={36} /> Real-Time PW Scraper
            </h3>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mt-3">
              Extract batches, thumbnails, and lectures directly
            </p>
          </div>
          <RefreshCw className={`text-blue-500 ${isScraping ? 'animate-spin' : ''}`} size={36} />
        </div>

        <div className="space-y-8">
          <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
            <Database className="text-blue-600 shrink-0" size={24}/>
            <div className="space-y-1">
              <p className="text-[11px] font-black text-blue-900 uppercase">Expert Tip</p>
              <p className="text-[10px] text-blue-700 font-bold leading-relaxed">For modern platforms (Next.js/React), right-click the course page, select "View Page Source", Copy (Ctrl+A), and paste below for 100% extraction accuracy including all hidden thumbnails.</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
              <input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Course URL (e.g., pw.live/batches/...)" 
                className="w-full pl-20 pr-8 py-6 bg-slate-50 border border-slate-100 rounded-[2rem] font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <button 
              onClick={() => handleAutoFetch()}
              disabled={isScraping || !url}
              className="bg-slate-900 text-white px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
            >
              {isScraping ? <Loader2 className="animate-spin" size={24}/> : <RefreshCw size={24}/>}
              Fetch Batch
            </button>
          </div>

          <div className="space-y-4">
            <textarea 
              value={manualHtml}
              onChange={(e) => setManualHtml(e.target.value)}
              placeholder="Paste Full Page HTML Source here for Deep Crawl (Highest Success)..."
              className="w-full h-40 p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] font-mono text-[11px] outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
            />
            <button 
              onClick={() => handleAutoFetch(manualHtml)}
              disabled={isScraping || !manualHtml}
              className="w-full py-5 bg-white text-slate-400 border border-slate-200 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-3"
            >
              <FileCode size={20}/> Deep Crawl Source
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 text-[11px] font-black uppercase flex items-center gap-4">
            <AlertCircle size={24}/> {error}
          </div>
        )}

        {success && (
          <div className="mt-8 p-5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[11px] font-black uppercase flex items-center gap-4">
            <CheckCircle2 size={24}/> {success}
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-study pb-20">
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-100 rounded-[3.5rem] overflow-hidden shadow-2xl sticky top-24">
              <div className="aspect-video relative">
                <img src={result.thumbnail} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-10">
                  <div className="px-5 py-2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">{result.category}</div>
                </div>
              </div>
              <div className="p-12 space-y-8">
                <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-3xl leading-tight">{result.title}</h4>
                <div className="flex items-center gap-4 text-slate-400 font-bold text-[11px] uppercase tracking-widest">
                  <UserIcon size={20} className="text-blue-500" /> {result.instructor}
                </div>
                <button 
                  onClick={handleSaveToPortal}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-[12px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 shadow-2xl"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                  Import to Portal
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm">
              <h4 className="font-black text-slate-900 uppercase text-[12px] mb-12 flex items-center gap-5 tracking-[0.2em] italic">
                <Database size={24} className="text-blue-600"/> Batch Blueprint
              </h4>
              <div className="space-y-12">
                {result.subjects.map((sub, sIdx) => (
                  <div key={sIdx} className="space-y-6">
                    <p className="text-lg font-black text-slate-900 uppercase italic border-l-6 border-blue-600 pl-6 tracking-tighter">{sub.title}</p>
                    <div className="space-y-4">
                      {sub.lectures.map((lec, lIdx) => (
                        <div key={lIdx} className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center gap-6 group hover:bg-white hover:shadow-xl transition-all">
                          <div className="w-28 h-16 bg-white rounded-2xl flex items-center justify-center shrink-0 border border-slate-100 relative overflow-hidden shadow-sm">
                             {lec.thumbnail ? <img src={lec.thumbnail} className="w-full h-full object-cover" alt="thumb" /> : <Play size={20} className="text-slate-300" />}
                             {lec.duration === 'LIVE' && <div className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">{lec.title}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><Play size={10}/> {lec.duration}</p>
                              {lec.resources && lec.resources.length > 0 && (
                                <p className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1"><FileText size={10}/> {lec.resources.length} Attachments</p>
                              )}
                            </div>
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
