
import React, { useState } from 'react';
import { Search, Loader2, Save, Zap, Database, CheckCircle2, AlertCircle, User as UserIcon, Globe, Layers, ArrowRight } from 'lucide-react';
import { scrapeDeltaContent } from '../services/firecrawlService';
import { saveCourseToDB } from '../services/db';
import { Course } from '../types';

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
      if (!data || !data.title) throw new Error("Batch data extraction failed. The site might be blocking AI crawlers or the URL is invalid.");
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Deep Scraper encountered a synchronization error.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleSaveToPortal = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const courseId = (result.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now());
      
      const newBatch: Course = {
        id: courseId,
        title: result.title,
        description: result.description || `Premium Batch synced from Delta Source.`,
        instructor: result.instructor || "Portal Faculty",
        image: result.thumbnail || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500",
        price: 0,
        rating: 5.0,
        students: 12000,
        category: result.category || "General",
        subjects: result.subjects.map((s: any, sIdx: number) => ({
          id: `sub-${sIdx}-${Date.now()}`,
          title: s.title,
          chapters: [
            {
              id: `chap-${sIdx}-${Date.now()}`,
              title: "Imported Curriculum",
              lectures: s.lectures.map((l: any, lIdx: number) => ({
                id: `lec-${lIdx}-${Date.now()}`,
                title: l.title,
                videoUrl: l.url,
                thumbnail: l.thumbnail || result.thumbnail,
                duration: l.duration || 'Recording',
                description: `Live session from ${result.title}`,
                resources: l.resources || []
              }))
            }
          ]
        })),
        shortLink: result.sourceUrl // For Watchdog auto-sync
      };

      await saveCourseToDB(newBatch);
      setSuccess("Batch successfully added to portal library!");
      setResult(null);
      setUrl('');
    } catch (e) {
      setError("Failed to save batch to cloud database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-delta text-left">
      <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-blue-600/10 rounded-full blur-[100px]"></div>
        
        <div className="mb-12">
          <h3 className="text-4xl font-black text-white uppercase italic flex items-center gap-5 tracking-tighter">
            <Zap className="text-blue-500 fill-blue-500" size={36} /> Batch Ingestor
          </h3>
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mt-3">
            Delta Sync Engine v3.0 | Deep Extraction Protocol
          </p>
        </div>

        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 relative">
              <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
              <input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Delta Study URL (e.g. deltastudy.site/study-v2/batches/...)" 
                className="w-full pl-20 pr-8 py-7 bg-[#1e293b] border border-white/5 rounded-[2.5rem] font-bold text-sm text-white outline-none focus:border-blue-500 transition-all shadow-inner"
              />
            </div>
            <button 
              onClick={handleFirecrawlScrape}
              disabled={isScraping || !url}
              className="bg-blue-600 text-white px-12 py-7 rounded-[2.5rem] font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-4 disabled:opacity-50 shadow-2xl shadow-blue-500/20"
            >
              {isScraping ? <Loader2 className="animate-spin" size={24}/> : <Globe size={24}/>}
              Fetch Batch
            </button>
          </div>

          <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl flex items-center gap-4">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Optimized for: deltastudy.site batches</p>
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
              <div className="aspect-video relative">
                <img src={result.thumbnail} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              <div className="p-10 space-y-8">
                <h4 className="font-black text-white uppercase italic tracking-tighter text-3xl leading-tight">{result.title}</h4>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <UserIcon size={18} className="text-blue-500" /> {result.instructor}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <Layers size={18} className="text-blue-500" /> {result.subjects?.length || 0} Subjects Found
                  </div>
                </div>
                <button 
                  onClick={handleSaveToPortal}
                  disabled={isSaving}
                  className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-4 shadow-2xl"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>}
                  Import to Library
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            <div className="bg-[#0f172a] border border-white/5 rounded-[3.5rem] p-12 shadow-sm space-y-12">
              <h4 className="font-black text-white uppercase text-[12px] mb-8 flex items-center gap-5 tracking-[0.2em] italic">
                <Database size={24} className="text-blue-500"/> Content Preview
              </h4>
              <div className="space-y-12">
                {result.subjects?.map((sub: any, sIdx: number) => (
                  <div key={sIdx} className="space-y-8">
                    <div className="flex items-center gap-6">
                      <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
                      <p className="text-2xl font-black text-white uppercase italic tracking-tighter">{sub.title}</p>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                      {sub.lectures?.map((lec: any, lIdx: number) => (
                        <div key={lIdx} className="p-6 bg-[#1e293b]/40 border border-white/5 rounded-[2rem] flex items-center justify-between group">
                           <div className="flex items-center gap-8 min-w-0">
                              <div className="w-24 h-14 bg-black rounded-xl overflow-hidden shrink-0 border border-white/5">
                                 {lec.thumbnail && <img src={lec.thumbnail} className="w-full h-full object-cover" />}
                              </div>
                              <div className="text-left">
                                <p className="text-[12px] font-black text-white uppercase tracking-tight truncate leading-none mb-2">{lec.title}</p>
                                <div className="flex items-center gap-6">
                                  <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Video: {lec.url ? 'FOUND' : 'NULL'}</span>
                                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{lec.resources?.length || 0} Attachments</span>
                                </div>
                              </div>
                           </div>
                           <ArrowRight size={20} className="text-slate-800" />
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
