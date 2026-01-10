
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, X, 
  Upload, LayoutDashboard, Layers, Folder,
  Loader2, Database, Globe, Search, Link as LinkIcon, Key, Zap, RefreshCw, Eye, Play
} from 'lucide-react';
import { Course, Lecture, StaffMember, SiteSettings, Student, Chapter } from '../types';
import SmartScraper from './SmartScraper';
import { syncPWBatch } from '../services/pwService';
import { runDeltaAutoSync, SyncLog } from '../services/automation';
import { 
  subscribeToStaff, 
  saveCourseToDB, 
  deleteCourseFromDB, 
  subscribeToNotices, 
  saveSiteSettings,
  subscribeToStudents
} from '../services/db';

interface AdminPanelProps {
  userRole: 'student' | 'admin' | 'manager';
  courses: Course[];
  onClose: () => void;
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ userRole, courses, siteSettings, setSiteSettings }) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'scraper' | 'pw' | 'watchdog' | 'config' | 'users'>('batches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  
  // Watchdog States
  const [watchList, setWatchList] = useState<string[]>(JSON.parse(localStorage.getItem('portal_watch_list') || '[]'));
  const [newWatchUrl, setNewWatchUrl] = useState('');
  const [watchLogs, setWatchLogs] = useState<SyncLog[]>([]);

  // PW Sync States
  const [pwToken, setPwToken] = useState(localStorage.getItem('pw_auth_token') || '');
  const [pwBatchId, setPwBatchId] = useState('');
  const [syncLogs, setSyncLogs] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, setStaff] = useState<StaffMember[]>([]);
  const [, setNotices] = useState<any[]>([]);
  const [tempSettings, setTempSettings] = useState<SiteSettings>(siteSettings);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const emptyBatch: Course = {
    id: '', title: '', description: '', instructor: 'Portal Faculty', price: 0, rating: 5.0, students: 0, category: 'JEE', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000', subjects: []
  };

  const [currentBatch, setCurrentBatch] = useState<Course>(emptyBatch);

  useEffect(() => {
    const unsubStaff = subscribeToStaff(setStaff);
    const unsubNotices = subscribeToNotices(setNotices);
    const unsubStudents = subscribeToStudents(setStudents);
    return () => { unsubStaff(); unsubNotices(); unsubStudents(); };
  }, []);

  const handleRunWatchdog = async () => {
    setSaveStatus('saving');
    for (const url of watchList) {
      await runDeltaAutoSync(url, courses, (log) => {
        setWatchLogs(prev => [log, ...prev].slice(0, 50));
      });
    }
    setSaveStatus('idle');
  };

  const addToWatchList = () => {
    if (!newWatchUrl) return;
    const newList = [...watchList, newWatchUrl];
    setWatchList(newList);
    localStorage.setItem('portal_watch_list', JSON.stringify(newList));
    setNewWatchUrl('');
  };

  const removeFromWatchList = (url: string) => {
    const newList = watchList.filter(u => u !== url);
    setWatchList(newList);
    localStorage.setItem('portal_watch_list', JSON.stringify(newList));
  };

  const handlePWSync = async () => {
    if (!pwToken || !pwBatchId) return alert("Enter Token & Batch ID");
    localStorage.setItem('pw_auth_token', pwToken);
    setSaveStatus('saving');
    setSyncLogs(["Initiating handshake with PW API...", "Bypassing CORS filters..."]);
    
    try {
      const course = await syncPWBatch(pwToken, pwBatchId);
      setSyncLogs(prev => [...prev, `Found: ${course.title}`, `Mapping ${course.subjects.length} subjects...`]);
      await saveCourseToDB(course);
      setSyncLogs(prev => [...prev, "SUCCESS: Batch fully synchronized with high-res thumbnails."]);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e: any) {
      setSyncLogs(prev => [...prev, `ERROR: ${e.message}`]);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    try {
      await saveSiteSettings(tempSettings);
      setSiteSettings(tempSettings);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const handleSaveBatch = async () => {
    setSaveStatus('saving');
    try {
      const batchToSave = { ...currentBatch };
      if (!batchToSave.id) {
        batchToSave.id = (batchToSave.title || 'Untitled').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      }
      await saveCourseToDB(batchToSave);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsModalOpen(false);
      }, 1500);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-8 animate-study pb-12 text-left">
      <div className="bg-[#0f172a] p-10 rounded-[2.5rem] border border-white/5 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-blue-600 rounded-3xl flex items-center justify-center text-white"><LayoutDashboard size={28} /></div>
           <div><h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">Admin Console</h1><p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Delta Master Control</p></div>
        </div>
        
        <div className="flex bg-slate-900 p-1.5 border border-white/5 overflow-x-auto no-scrollbar rounded-2xl">
           <button onClick={() => setActiveTab('batches')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'batches' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>Batches</button>
           <button onClick={() => setActiveTab('watchdog')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'watchdog' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>Watchdog</button>
           <button onClick={() => setActiveTab('pw')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'pw' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>PW Connect</button>
           <button onClick={() => setActiveTab('scraper')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'scraper' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>AI Scrape</button>
           <button onClick={() => setActiveTab('users')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>Students</button>
           {userRole === 'admin' && (
             <button onClick={() => setActiveTab('config')} className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'config' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500'}`}>Config</button>
           )}
        </div>
      </div>

      <div className="bg-[#0f172a] min-h-[600px] border border-white/5 p-12 shadow-sm rounded-[3.5rem]">
        {activeTab === 'watchdog' && (
          <div className="max-w-4xl space-y-10 animate-delta">
             <div className="pb-8 border-b border-white/5">
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4"><Eye size={32} className="text-blue-500 fill-blue-500"/> Delta Watchdog</h2>
               <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em] mt-2">Auto-upload lectures from external sources</p>
            </div>
            
            <div className="space-y-8">
               <div className="flex gap-4">
                  <input 
                    value={newWatchUrl} 
                    onChange={e => setNewWatchUrl(e.target.value)} 
                    placeholder="Add Delta/PW Batch URL to monitor..." 
                    className="flex-1 px-8 py-5 bg-slate-900 border border-white/5 rounded-2xl text-white outline-none focus:border-blue-500"
                  />
                  <button onClick={addToWatchList} className="bg-blue-600 text-white px-10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-700">+ Add Source</button>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {watchList.map(url => (
                    <div key={url} className="p-6 bg-slate-900 rounded-2xl border border-white/5 flex items-center justify-between group">
                       <div className="flex items-center gap-4 min-w-0">
                          <Globe size={20} className="text-slate-500 shrink-0"/>
                          <p className="text-slate-300 font-bold text-xs truncate">{url}</p>
                       </div>
                       <button onClick={() => removeFromWatchList(url)} className="text-red-400 p-2 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"><Trash2 size={18}/></button>
                    </div>
                  ))}
               </div>

               <button 
                onClick={handleRunWatchdog} 
                disabled={saveStatus === 'saving' || watchList.length === 0}
                className="w-full bg-indigo-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-700 shadow-2xl transition-all flex items-center justify-center gap-4"
               >
                 {saveStatus === 'saving' ? <Loader2 className="animate-spin" /> : <RefreshCw size={20}/>}
                 Trigger Global Auto-Sync
               </button>

               {watchLogs.length > 0 && (
                 <div className="p-10 bg-[#020617] rounded-[2.5rem] border border-white/5 space-y-4">
                    <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-6 flex items-center gap-2"><Zap size={14}/> Sync Activity Engine</h4>
                    {watchLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-4 border-b border-white/5 last:border-0">
                         <div className={`w-2 h-2 rounded-full mt-1 ${log.status === 'success' ? 'bg-emerald-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                         <div>
                            <p className="text-[10px] font-black text-white uppercase italic">{log.itemTitle}</p>
                            <p className={`text-[9px] font-bold mt-1 ${log.status === 'success' ? 'text-emerald-400' : log.status === 'failed' ? 'text-red-400' : 'text-slate-500'}`}>{log.message}</p>
                         </div>
                      </div>
                    ))}
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'pw' && (
          <div className="max-w-4xl space-y-10 animate-study">
             <div className="pb-8 border-b border-white/5">
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4"><Zap size={32} className="text-blue-500 fill-blue-500"/> PW Legacy Sync</h2>
            </div>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Key size={14}/> PW Auth Token</label>
                 <input 
                  type="password"
                  value={pwToken} 
                  onChange={e => setPwToken(e.target.value)} 
                  placeholder="Paste Bearer Token..." 
                  className="w-full px-6 py-5 bg-slate-900 border border-white/5 rounded-2xl font-mono text-xs text-white outline-none" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Database size={14}/> Batch ID</label>
                 <input 
                  value={pwBatchId} 
                  onChange={e => setPwBatchId(e.target.value)} 
                  className="w-full px-6 py-5 bg-slate-900 border border-white/5 rounded-2xl font-mono text-xs text-white outline-none" 
                 />
               </div>
               <button onClick={handlePWSync} className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest">Manual PW Pull</button>
            </div>
          </div>
        )}

        {activeTab === 'scraper' && <SmartScraper />}

        {activeTab === 'batches' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center pb-8 border-b border-white/5">
              <h2 className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-4 italic"><Database size={24} className="text-blue-500"/> Delta Library</h2>
              <button onClick={() => { setCurrentBatch(emptyBatch); setIsModalOpen(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2"><Plus size={18} /> New Batch</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
               {courses.map(course => (
                 <div key={course.id} className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-8 group hover:border-blue-500 transition-all">
                    <div className="aspect-video mb-6 rounded-2xl relative overflow-hidden shadow-sm border border-white/5"><img alt={course.title} src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                    <h3 className="font-black text-white text-xl mb-8 line-clamp-2 uppercase tracking-tight italic leading-tight">{course.title || 'Untitled Batch'}</h3>
                    <div className="flex gap-4">
                      <button onClick={() => { setCurrentBatch(course); setIsModalOpen(true); }} className="flex-1 bg-white/5 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">Studio</button>
                      <button onClick={() => deleteCourseFromDB(course.id)} className="p-4 bg-red-500/10 text-red-400 hover:text-red-500 rounded-xl transition-all"><Trash2 size={20}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="max-w-4xl space-y-12 animate-study">
            <div className="pb-8 border-b border-white/5">
               <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic flex items-center gap-4"><Globe size={32} className="text-blue-600"/> Platform Params</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-2"><label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Portal Name</label><input value={tempSettings.appName} onChange={e => setTempSettings({...tempSettings, appName: e.target.value})} className="w-full px-6 py-5 bg-slate-900 border border-white/5 rounded-2xl text-white outline-none" /></div>
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-2xl transition-all">Save Core Config</button>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="space-y-10 animate-delta">
              <div className="relative">
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Query Student Ledger..." 
                  className="w-full pl-20 pr-8 py-6 bg-slate-900 border border-white/5 rounded-[2.5rem] font-black text-sm uppercase text-white outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                 {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(student => (
                    <div key={student.id} className="p-8 bg-slate-900 border border-white/5 rounded-[2.5rem] flex items-center gap-6">
                       <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-xl">{student.name?.charAt(0) || '?'}</div>
                       <div className="min-w-0">
                          <p className="font-black text-white uppercase tracking-tight truncate leading-none mb-2">{student.name}</p>
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">{student.email}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-study">
           <div className="bg-[#0f172a] w-full max-w-6xl h-[95vh] rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/5">
              <div className="p-12 border-b border-white/5 flex justify-between items-center">
                 <div><h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">Academic Studio</h2></div>
                 <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-white/5 rounded-3xl text-slate-400 transition-all"><X size={32}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-[#020617] space-y-12">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-left">
                    <div className="lg:col-span-4 space-y-10">
                       <div className="bg-[#0f172a] p-10 border border-white/5 rounded-[3rem] space-y-8 shadow-sm">
                          <h3 className="font-black text-slate-500 text-[12px] uppercase tracking-[0.3em] border-b border-white/5 pb-4">Module Visuals</h3>
                          <div className="aspect-video bg-slate-900 border-2 border-dashed border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group shadow-inner" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? <img alt="Preview" src={currentBatch.image} className="w-full h-full object-cover" /> : <div className="text-center p-8"><Upload size={40} className="text-slate-800 mx-auto mb-4"/><p className="text-[10px] font-black uppercase text-slate-700">Set Banner</p></div>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, image: r.result as string}); r.readAsDataURL(f); } }} />
                          </div>
                          <div className="space-y-6">
                             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Batch Name</label><input value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-6 py-5 bg-slate-900 border border-white/5 rounded-2xl font-bold text-sm text-white" /></div>
                             <div className="space-y-2"><label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Pricing (₹)</label><input type="number" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-900 border border-white/5 rounded-2xl font-bold text-sm text-white" /></div>
                          </div>
                       </div>
                    </div>
                    <div className="lg:col-span-8 space-y-10">
                       <div className="flex items-center justify-between"><h3 className="font-black text-2xl text-white uppercase italic tracking-tighter">Module Framework</h3><button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-blue-600 text-white px-8 py-4 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest shadow-xl">+ Add Subject</button></div>
                       <div className="space-y-8 pb-20">
                          {currentBatch.subjects?.map((sub) => (
                             <div key={sub.id} className="bg-[#0f172a] border border-white/5 rounded-[3rem] p-10 shadow-sm">
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-white/5">
                                   <div className="flex items-center gap-5 flex-1"><Layers size={24} className="text-blue-600"/><input value={sub.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, title: e.target.value} : s)})} className="bg-transparent font-black text-white outline-none w-full text-xl uppercase tracking-tighter italic" /></div>
                                   <button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== sub.id)})} className="text-red-500/30 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                                </div>
                                <div className="space-y-6">
                                   {sub.chapters.map(chap => (
                                      <div key={chap.id} className="p-8 bg-slate-900 rounded-[2rem] border border-white/5">
                                         <div className="flex justify-between items-center mb-8"><div className="flex items-center gap-4 flex-1"><Folder size={20} className="text-slate-700"/><input value={chap.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, title: e.target.value} : c)} : s)})} className="bg-transparent font-black text-slate-300 outline-none w-full text-[12px] uppercase tracking-widest" /></div><button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s)})} className="text-slate-700 hover:text-red-500"><X size={20}/></button></div>
                                         <div className="space-y-4">
                                            {chap.lectures.map(lec => (
                                               <div key={lec.id} className="p-6 bg-[#0f172a] border border-white/5 rounded-2xl space-y-4 shadow-sm">
                                                  <input value={lec.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, title: e.target.value} : l)} : c)} : s)})} className="w-full bg-transparent font-black text-[11px] uppercase tracking-tight text-white outline-none" placeholder="Lecture Title" />
                                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                     <input value={lec.videoUrl} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, videoUrl: e.target.value} : l)} : c)} : s)})} className="w-full bg-slate-950 px-4 py-3 rounded-xl text-[10px] font-mono outline-none border border-white/5 text-blue-400" placeholder="Stream Link" />
                                                     <input value={lec.thumbnail} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, thumbnail: e.target.value} : l)} : c)} : s)})} className="w-full bg-slate-950 px-4 py-3 rounded-xl text-[10px] font-mono outline-none border border-white/5 text-slate-500" placeholder="Thumb Image" />
                                                  </div>
                                               </div>
                                            ))}
                                            <button onClick={() => { const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Lesson', videoUrl: '', duration: 'Live', description: '', resources: [], thumbnail: '' }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: [...c.lectures, newLec]} : c)} : s)}); }} className="w-full py-4 border-2 border-dashed border-white/5 rounded-[1.5rem] text-[10px] font-black uppercase text-slate-700 hover:text-blue-500 transition-all">+ Add Lecture Segment</button>
                                         </div>
                                      </div>
                                   ))}
                                   <button onClick={() => { const newCh: Chapter = { id: `ch-${Date.now()}`, title: 'New Unit', lectures: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: [...s.chapters, newCh]} : s)}); }} className="w-full py-5 bg-white/5 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">+ New Course Unit</button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-12 border-t border-white/5 bg-[#0f172a] flex justify-end gap-6 shadow-2xl">
                 <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 font-black text-slate-500 hover:text-white transition-all uppercase tracking-[0.2em] text-[11px]">Discard</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-20 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-[13px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30 active:scale-[0.98]">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={24}/> : 'Deploy Module Live'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
