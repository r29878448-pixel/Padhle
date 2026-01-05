
import React, { useState } from 'react';
import { Search, Loader2, RefreshCw, FileCode, Save, Zap, Database, ArrowRight, CheckCircle2, AlertCircle, Play, Radio, Clock, User as UserIcon, GraduationCap } from 'lucide-react';
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
    setSuccess('');
    setStep(1);
    
    try {
      let html = sourceHtml;
      
      if (!html) {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Connection failed. Try the 'Direct Source Ingest' method.");
        html = await response.text();
      }

      setStep(2);
      const data = await parseScrapedContent(html!, url || "Direct Ingest");
      
      if (!data || !data.title) throw new Error("Could not parse structure. Please ensure you are pasting the correct source HTML.");
      
      setResult(data);
      setStep(3);
    } catch (e: any) {
      setError(e.message || "Failed to extract curriculum.");
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
        description: result.description || "Premium educational content.",
        instructor: result.instructor || "Expert Faculty",
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
              title: "Imported Curriculum",
              lectures: s.lectures.map((l, lIdx) => ({
                id: `lec-${lIdx}-${Date.now()}`,
                title: l.title,
                videoUrl: l.url,
                thumbnail: l.thumbnail,
                duration: l.duration || (l.isLive ? 'LIVE' : 'N/A'),
                description: "Lecture synced from external curriculum.",
                resources: []
              }))
            }
          ]
        }))
      };

      await saveCourseToDB(newBatch);
      setSuccess("Curriculum integrated successfully!");
      setResult(null);
      setUrl('');
      setStep(0);
    } catch (e) {
      setError("Failed to sync with cloud database.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in text-left">
      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h3 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-4 tracking-tighter">
              <Zap className="text-blue-600 fill-blue-600" size={32} /> Delta Sync Engine
            </h3>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">
              Cross-Platform Content Extraction Pro
            </p>
          </div>
          <RefreshCw className={`text-blue-500 ${isScraping ? 'animate-spin' : ''}`} size={32} />
        </div>

        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <input 
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste curriculum URL..." 
                className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-blue-500/5 transition-all"
              />
            </div>
            <button 
              onClick={() => handleAutoFetch()}
              disabled={isScraping || !url}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isScraping ? <Loader2 className="animate-spin" size={20}/> : <RefreshCw size={20}/>}
              Automate Extract
            </button>
          </div>

          <div className="relative py-4 flex items-center">
            <div className="flex-1 border-t border-slate-100"></div>
            <span className="px-4 text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">Direct Source Ingest</span>
            <div className="flex-1 border-t border-slate-100"></div>
          </div>

          <div className="space-y-4">
            <textarea 
              value={manualHtml}
              onChange={(e) => setManualHtml(e.target.value)}
              placeholder="Paste page source (HTML) for full deep-crawl..."
              className="w-full h-32 p-6 bg-slate-50 border border-slate-100 rounded-2xl font-mono text-[10px] outline-none focus:border-blue-500 transition-all resize-none shadow-inner"
            />
            <button 
              onClick={() => handleAutoFetch(manualHtml)}
              disabled={isScraping || !manualHtml}
              className="w-full py-4 bg-white text-slate-500 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
            >
              <FileCode size={18}/> Process HTML Source
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-[10px] font-black uppercase flex items-center gap-3">
            <AlertCircle size={18}/> {error}
          </div>
        )}

        {success && (
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-[10px] font-black uppercase flex items-center gap-3">
            <CheckCircle2 size={18}/> {success}
          </div>
        )}
      </div>

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in pb-12">
          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-xl sticky top-24">
              <div className="aspect-video relative">
                <img src={result.thumbnail} className="w-full h-full object-cover" alt="preview" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-8">
                  <div className="px-3 py-1 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg">{result.category}</div>
                </div>
              </div>
              <div className="p-10 space-y-6">
                <h4 className="font-black text-slate-900 uppercase italic tracking-tighter text-2xl">{result.title}</h4>
                <div className="flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <UserIcon size={16} className="text-blue-500" /> {result.instructor}
                </div>
                <button 
                  onClick={handleSaveToPortal}
                  disabled={isSaving}
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 shadow-xl"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                  Push to Library
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
              <h4 className="font-black text-slate-900 uppercase text-[11px] mb-8 flex items-center gap-4 tracking-widest">
                <Database size={20} className="text-blue-600"/> Detected Modules
              </h4>
              <div className="space-y-8">
                {result.subjects.map((sub, sIdx) => (
                  <div key={sIdx} className="space-y-4">
                    <p className="text-[12px] font-black text-slate-900 uppercase italic border-l-4 border-blue-600 pl-4">{sub.title}</p>
                    <div className="space-y-3">
                      {sub.lectures.map((lec, lIdx) => (
                        <div key={lIdx} className="p-4 bg-slate-50 border border-slate-50 rounded-2xl flex items-center gap-4">
                          <div className="w-16 h-10 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                            <Play size={16} className="text-slate-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight line-clamp-1">{lec.title}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{lec.duration}</p>
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
