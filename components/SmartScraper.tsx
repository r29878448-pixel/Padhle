
import React, { useState } from 'react';
import { Search, Loader2, RefreshCw, Save, Zap, Database, CheckCircle2, AlertCircle, Play, User as UserIcon, FileText, Globe, Layers, ArrowRight } from 'lucide-react';
import { scrapeDeltaContent } from '../services/firecrawlService';
import { saveCourseToDB } from '../services/db';
import { Course, Resource } from '../types';

const SmartScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFirecrawlScrape = async () => {
    if (!url) return;
    setIsScraping(true);
    setError('');
    setSuccess('');
    setResult(null);
    
    try {
      const data = await scrapeDeltaContent(url);
      if (!data || !data.title) throw new Error("Firecrawl bypassed protection but data mapping failed. Ensure the URL is a public batch page.");
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Firecrawl engine failed to bypass security.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveToPortal = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const newBatch: Course = {
        id: result.id || (result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now()),
        title: result.title,
        description: result.description || "Premium Delta-synced content.",
        instructor: result.instructor || "Delta Expert Faculty",
        image: result.thumbnail || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500",
        price: result.price || 0,
        rating: 5.0,
        students: Math.floor(Math.random() * 20000) + 10000,
        category: result.category || "JEE",
        subjects: result.subjects.map((s: any, sIdx: number) => ({
          id: `sub-${sIdx}-${Date.now()}`,
          title: s.title,
          chapters: s.chapters?.length ? s.chapters : [
            {
              id: `chap-${sIdx}-${Date.now()}`,
              title: "Imported Curriculum",
              lectures: s.lectures.map((l: any, lIdx: number) => ({
                id: `lec-${lIdx}-${Date.now()}`,
                title: l.title,
                videoUrl: l.url,
                thumbnail: l.thumbnail || result.thumbnail,
                duration: l.duration || (l.isLive ? 'LIVE' : 'Recording'),
                description: l.description || `Delta synced session.`,
                resources: l.resources || []
              }))
            }
          ]
        }))
      };

      await saveCourseToDB(newBatch);
      setSuccess("Delta Batch successfully cloned and deployed!");
      setResult(null);
      setUrl('');
    } catch (e) {
      setError("Database handshaking failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-delta text-left">
      <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
        
        <div className="flex items-center justify-between mb-12">
          <div>
            <h3 className="text-4xl font-black text-white uppercase italic flex items-center gap-5 tracking-tighter">
              <Zap className="text-blue-500 fill-blue-500" size={36} /> Batch Studio
            </h3>
            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mt-3">
              Deep Ingestion Engine via Firecrawl v1
            </p>
          </div>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
              <input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Delta Study / PW Batch URL..." 
                className="w-full pl-20 pr-8 py-7 bg-[#1e293b] border border-white/5 rounded-[2.5rem] font-bold text-sm text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={handleFirecrawlScrape}
              disabled={isScraping || !url}
              className="bg-blue-600 text-white px-12 py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl shadow-blue-500/20"
            >
              {isScraping ? <Loader2 className="animate-spin" size={24}/> : <Globe size={24}/>}
              Fetch Curriculum
            </button>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol: Firecrawl Low-Latency Sync Active</p>
          </div>
        </div>

        {error && (
          <div className="mt-8 p-6 bg-red-500/10 text-red-400 rounded-3xl border border-red-500/20 text-[11px] font-black uppercase flex items-center gap-4 animate-delta">
            <AlertCircle size={24}/> {error}
          </div>
        )}

        {success && (
          <div className="mt-8 p-6 bg-emerald-500/10 text-emerald-400 rounded-3xl border border-emerald-500/20 text-[11px] font-black uppercase flex items-center gap-4 animate-delta">
            <CheckCircle2 size={24}/> {success}
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 animate-delta pb-20">
          <div className="lg:col-span-4">
            <div className="bg-[#0f172a] border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl sticky top-24">
              <img src={result.thumbnail} className="w-full aspect-video object-cover" alt="preview" />
              <div className="p-10 space-y-8">
                <h4 className="font-black text-white uppercase italic tracking-tighter text-3xl leading-tight">{result.title}</h4>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <UserIcon size={18} className="text-blue-500" /> {result.instructor}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <Layers size={18} className="text-blue-500" /> {result.subjects.length} Subjects Detected
                  </div>
                </div>
                <button 
                  onClick={handleSaveToPortal}
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-2xl"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                  Deploy to Portal
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-[#0f172a] border border-white/5 rounded-[3.5rem] p-12 shadow-sm space-y-12">
              <h4 className="font-black text-white uppercase text-[12px] mb-8 flex items-center gap-5 tracking-[0.2em] italic">
                <Database size={24} className="text-blue-500"/> Data Mapping Preview
              </h4>
              <div className="space-y-12">
                {result.subjects.map((sub: any, sIdx: number) => (
                  <div key={sIdx} className="space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                      <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{sub.title}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {sub.lectures.map((lec: any, lIdx: number) => (
                        <div key={lIdx} className="p-6 bg-[#1e293b]/40 border border-white/5 rounded-[2rem] flex items-center justify-between group hover:border-blue-500/50 transition-all">
                           <div className="flex items-center gap-8 min-w-0">
                              <div className="w-32 h-18 bg-black rounded-2xl flex items-center justify-center shrink-0 border border-white/5 relative overflow-hidden">
                                 {lec.thumbnail ? <img src={lec.thumbnail} className="w-full h-full object-cover" /> : <Play size={20} className="text-slate-800" />}
                                 {lec.duration === 'LIVE' && <div className="absolute top-2 right-2 w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>}
                              </div>
                              <div className="text-left">
                                <p className="text-[12px] font-black text-white uppercase tracking-tight truncate leading-none mb-3 group-hover:text-blue-400 transition-colors">{lec.title}</p>
                                <div className="flex items-center gap-6">
                                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Play size={10}/> {lec.duration}</span>
                                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2"><FileText size={10}/> {lec.resources?.length || 0} Assets</span>
                                </div>
                              </div>
                           </div>
                           <ArrowRight size={20} className="text-slate-800 group-hover:text-blue-500 transition-all translate-x-0 group-hover:translate-x-2" />
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
