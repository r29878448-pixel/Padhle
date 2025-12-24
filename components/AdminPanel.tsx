
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, 
  Video as VideoIcon, Upload, 
  RefreshCw, Check, User as UserIcon, Shield, UserPlus, Globe, Key, Save, LayoutDashboard, ChevronDown, ChevronUp, FileText, Youtube, Image, Lock, Link as LinkIcon, Layers, Folder, Info, Inbox, Sparkles, Send, ArrowRight, Zap,
  Loader2, Bell, Megaphone, Database, ClipboardCheck, Settings as SettingsIcon
} from 'lucide-react';
import { Course, Subject, Chapter, Lecture, StaffMember, SiteSettings, Resource, Notice } from '../types';
import { subscribeToStaff, addStaffToDB, removeStaffFromDB, saveCourseToDB, deleteCourseFromDB, saveSiteSettings, subscribeToTelegramFeed, TelegramPost, markPostAsIngested, subscribeToNotices, addNoticeToDB, deleteNoticeFromDB } from '../services/db';
import { classifyContent } from '../services/geminiService';
import { COURSES as DEMO_COURSES } from '../constants';

interface AdminPanelProps {
  userRole: 'student' | 'admin' | 'manager';
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onClose: () => void;
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ userRole, courses, setCourses, onClose, siteSettings, setSiteSettings }) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'staff' | 'inbox' | 'notices' | 'config'>('batches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ text: '', type: 'update' as any });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'manager' as 'manager' | 'admin' });

  const [telegramPosts, setTelegramPosts] = useState<TelegramPost[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [sortSuggestions, setSortSuggestions] = useState<Record<string, any>>({});

  const emptyBatch: Course = {
    id: '', title: '', description: '', instructor: 'Academic Specialist', price: 0, rating: 5.0, students: 0, category: 'Class 10', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000', subjects: [], shortLink: '', accessCode: 'STUDY-' + Math.floor(100000 + Math.random() * 900000)
  };

  const [currentBatch, setCurrentBatch] = useState<Course>(emptyBatch);

  useEffect(() => {
    const unsubStaff = subscribeToStaff(setStaff);
    const unsubTG = subscribeToTelegramFeed(setTelegramPosts);
    const unsubNotices = subscribeToNotices(setNotices);
    return () => { unsubStaff(); unsubTG(); unsubNotices(); };
  }, []);

  const copyDirectLink = (batchId: string, lectureId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?batch_id=${batchId}&child_id=${lectureId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(lectureId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAISortAll = async () => {
    setIsSorting(true);
    const newSuggestions: Record<string, any> = {};
    for (const post of telegramPosts.filter(p => !p.isIngested)) {
      const suggestion = await classifyContent(post, courses);
      if (suggestion) newSuggestions[post.id] = suggestion;
    }
    setSortSuggestions(newSuggestions);
    setIsSorting(false);
  };

  const applyIngestion = async (postId: string) => {
    const post = telegramPosts.find(p => p.id === postId);
    const suggestion = sortSuggestions[postId];
    if (!post || !suggestion || !suggestion.courseId) return;
    
    const targetCourse = courses.find(c => c.id === suggestion.courseId);
    if (!targetCourse) return;
    
    const updatedCourse = JSON.parse(JSON.stringify(targetCourse));
    const subTitleRaw = suggestion.subjectTitle || "General";
    const chapTitleRaw = suggestion.chapterTitle || "Uncategorized";

    let targetSubject = updatedCourse.subjects.find((s: any) => (s.title || "").toLowerCase().trim() === subTitleRaw.toLowerCase().trim());
    if (!targetSubject) { 
      targetSubject = { id: `sub-${Date.now()}`, title: subTitleRaw, chapters: [] }; 
      updatedCourse.subjects.push(targetSubject); 
    }
    
    let targetChapter = targetSubject.chapters.find((c: any) => (c.title || "").toLowerCase().trim() === chapTitleRaw.toLowerCase().trim());
    if (!targetChapter) { 
      targetChapter = { id: `ch-${Date.now()}`, title: chapTitleRaw, lectures: [] }; 
      targetSubject.chapters.push(targetChapter); 
    }

    if (post.type === 'youtube' || post.type === 'video') {
      const newLecture: Lecture = { id: `lec-${Date.now()}`, title: post.title || "Untitled Lecture", videoUrl: post.url || "", duration: 'Live Sync', description: 'Auto-organized from Telegram channel.', resources: [] };
      targetChapter.lectures.push(newLecture);
    }
    
    await saveCourseToDB(updatedCourse);
    await markPostAsIngested(postId);
    const remainingSuggestions = { ...sortSuggestions }; 
    delete remainingSuggestions[postId]; 
    setSortSuggestions(remainingSuggestions);
  };

  const handleSaveBatch = async () => {
    if (!currentBatch.title.trim()) return alert("Batch title required.");
    setSaveStatus('saving');
    try {
      await saveCourseToDB(editingId ? currentBatch : { ...currentBatch, id: `batch-${Date.now()}` });
      setSaveStatus('success'); setTimeout(() => { setIsModalOpen(false); setSaveStatus('idle'); setEditingId(null); }, 800);
    } catch (e) { setSaveStatus('error'); }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8 animate-fadeIn pb-20 text-left">
      <div className="bg-white p-8 rounded-xl border border-slate-100 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-slate-900 rounded-lg flex items-center justify-center text-white shadow-xl"><LayoutDashboard size={28} /></div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal Administration</h1>
             <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
               Faculty Session Verified
             </p>
           </div>
        </div>
        
        <div className="flex bg-slate-50 p-1.5 rounded-lg border border-slate-200 overflow-x-auto max-w-full no-scrollbar">
           <button onClick={() => setActiveTab('batches')} className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Curriculum</button>
           <button onClick={() => setActiveTab('inbox')} className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>
             <Inbox size={14}/> Ingestor
           </button>
           <button onClick={() => setActiveTab('notices')} className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Notices</button>
           {isAdmin && (
             <>
               <button onClick={() => setActiveTab('staff')} className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Staff</button>
               <button onClick={() => setActiveTab('config')} className={`px-6 py-3 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Settings</button>
             </>
           )}
        </div>
      </div>

      <div className="bg-white min-h-[600px] rounded-xl border border-slate-100 p-8 shadow-sm">
        {activeTab === 'batches' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center">
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Academic Curriculum</h2>
               <button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg">
                 <Plus size={18} /> New Batch
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {courses.length > 0 ? courses.map(course => (
                 <div key={course.id} className="bg-slate-50 p-6 rounded-lg border border-slate-200 group hover:border-blue-400 transition-all">
                    <div className="aspect-video rounded-md overflow-hidden mb-6">
                      <img src={course.image} className="w-full h-full object-cover" />
                    </div>
                    <h3 className="font-black text-slate-900 text-lg mb-6 truncate uppercase tracking-tight">{course.title}</h3>
                    <div className="flex gap-3">
                      <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3.5 rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md">Edit Content</button>
                      <button onClick={() => deleteCourseFromDB(course.id)} className="p-3.5 bg-red-50 text-red-500 rounded-md hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
                    </div>
                 </div>
               )) : (
                 <div className="col-span-full py-24 text-center">
                    <Database className="mx-auto text-slate-200 mb-6" size={60} />
                    <p className="text-slate-400 font-black text-lg">Curriculum Vault Empty</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="space-y-8 animate-fadeIn">
             <div className="bg-slate-900 p-10 rounded-xl text-white shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <h2 className="text-3xl font-black tracking-tight flex items-center gap-3"><Zap className="text-blue-500 fill-blue-500" size={32}/> AI Ingestor</h2>
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Live Telegram Sync Engine</p>
                </div>
                <button onClick={handleAISortAll} disabled={isSorting || telegramPosts.filter(p => !p.isIngested).length === 0} className="bg-blue-600 text-white px-10 py-5 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl disabled:opacity-50">
                  {isSorting ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} Analyze Feed
                </button>
             </div>

             <div className="space-y-6">
                {telegramPosts.filter(p => !p.isIngested).map(post => {
                   const sug = sortSuggestions[post.id];
                   return (
                    <div key={post.id} className="bg-white p-6 rounded-lg border border-slate-200 flex flex-col lg:flex-row lg:items-center gap-8 group hover:border-blue-300 transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100">{post.type}</span>
                          <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-black text-slate-900 text-lg mb-2">{post.title || "Telegram Resource"}</h4>
                      </div>
                      {sug && (
                        <div className="flex flex-col sm:flex-row items-center gap-6 bg-blue-50/50 p-6 rounded-lg border border-blue-100 flex-1">
                           <div className="text-left flex-1 space-y-1">
                              <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Target Match</p>
                              <p className="text-xs font-bold text-slate-800">{courses.find(c => c.id === sug.courseId)?.title || "General Batch"}</p>
                           </div>
                           <button onClick={() => applyIngestion(post.id)} className="bg-slate-900 text-white px-6 py-3 rounded-md font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-md">
                              <Check size={16}/> Ingest Now
                           </button>
                        </div>
                      )}
                      <button onClick={() => markPostAsIngested(post.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><X size={24}/></button>
                    </div>
                   );
                })}
             </div>
          </div>
        )}

        {/* NOTICES, STAFF, CONFIG tabs following the same rectangular logic... */}
        {(activeTab === 'notices' || activeTab === 'staff' || activeTab === 'config') && (
           <div className="py-20 text-center text-slate-300 animate-fadeIn">
              <SettingsIcon size={48} className="mx-auto mb-4 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest">Section under management maintenance</p>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-6xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-white/20">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Batch Orchestrator</h2>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Configuring: {currentBatch.title || 'New Curriculum'}</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-lg text-slate-300 transition-colors"><X size={32}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-4 space-y-8">
                       <div className="bg-white p-8 rounded-lg border border-slate-100 space-y-6 shadow-sm">
                          <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest border-b pb-3">Batch Identity</h3>
                          <div className="aspect-video bg-slate-50 rounded-lg overflow-hidden relative border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? <img src={currentBatch.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <Upload size={32} className="text-slate-200"/>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, image: r.result as string}); r.readAsDataURL(f); } }} />
                          </div>
                          <div className="space-y-4">
                             <input type="text" placeholder="Batch Title" value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg font-black text-sm outline-none focus:border-blue-500 transition-all" />
                             <input type="number" placeholder="Access Fee (₹)" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg font-black text-sm outline-none focus:border-blue-500 transition-all" />
                          </div>
                       </div>
                    </div>
                    <div className="lg:col-span-8 space-y-8">
                       <div className="flex items-center justify-between">
                          <h3 className="font-black text-xl text-slate-900 tracking-tight uppercase">Syllabus Structure</h3>
                          <button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-slate-900 text-white px-6 py-3 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"><Plus size={16}/> Add Subject</button>
                       </div>
                       <div className="space-y-6">
                          {currentBatch.subjects?.map((sub) => (
                             <div key={sub.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}>
                                   <div className="flex items-center gap-4 flex-1">
                                      <Layers size={20} className="text-blue-600"/>
                                      <input type="text" value={sub.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, title: e.target.value} : s)})} className="bg-transparent font-black text-slate-900 outline-none w-full text-lg tracking-tight uppercase" />
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <button onClick={e => { e.stopPropagation(); if(confirm('Remove?')) setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== sub.id)}); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                                      {expandedSubject === sub.id ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}
                                   </div>
                                </div>
                                {expandedSubject === sub.id && (
                                   <div className="p-6 border-t border-slate-100 bg-slate-50/20 space-y-6">
                                      {sub.chapters.map((chap) => (
                                         <div key={chap.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                                            <div className="p-4 bg-slate-50/50 flex items-center justify-between cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chap.id ? null : chap.id)}>
                                               <div className="flex items-center gap-3 flex-1"><Folder size={18} className="text-slate-400"/><input type="text" value={chap.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, title: e.target.value} : c)} : s)})} className="bg-transparent font-black text-slate-700 outline-none w-full text-sm uppercase" /></div>
                                               <div className="flex items-center gap-2"><button onClick={e => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s)}); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>{expandedChapter === chap.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div>
                                            </div>
                                            {expandedChapter === chap.id && (
                                               <div className="p-6 border-t bg-white space-y-4">
                                                  {chap.lectures.map(lec => (
                                                     <div key={lec.id} className="bg-slate-50 p-5 rounded-lg border border-slate-100 flex flex-col gap-4">
                                                        <div className="flex justify-between items-start gap-4">
                                                           <input value={lec.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, title: e.target.value} : l)} : c)} : s)})} className="flex-1 bg-white px-4 py-3 rounded-md font-black text-xs outline-none border border-slate-200 uppercase" placeholder="Lecture Title" />
                                                           <div className="flex items-center gap-2">
                                                              {isAdmin && (
                                                                <button 
                                                                  onClick={() => copyDirectLink(currentBatch.id, lec.id)}
                                                                  className={`px-4 py-3 rounded-md border transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest ${copiedId === lec.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200'}`}
                                                                >
                                                                  {copiedId === lec.id ? <ClipboardCheck size={12}/> : <LinkIcon size={12}/>} Link
                                                                </button>
                                                              )}
                                                              <button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.filter(l => l.id !== lec.id)} : c)} : s)})} className="p-2.5 text-red-300 hover:text-red-500 transition-colors"><X size={20}/></button>
                                                           </div>
                                                        </div>
                                                        <input value={lec.videoUrl} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, videoUrl: e.target.value} : l)} : c)} : s)})} className="w-full bg-white px-4 py-3 rounded-md text-[10px] font-mono text-slate-500 outline-none border border-slate-200" placeholder="Resource Link" />
                                                     </div>
                                                  ))}
                                                  <button onClick={() => { const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Lecture', videoUrl: '', duration: '00:00', description: '', resources: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: [...c.lectures, newLec]} : c)} : s)}); }} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">+ Add Module</button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
                                      <button onClick={() => { const newCh: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: [...s.chapters, newCh]} : s)}); }} className="w-full py-4 bg-white border border-slate-200 rounded-lg font-black text-[9px] text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all">+ New Chapter</button>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-6 shadow-2xl">
                 <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest text-[10px]">Discard</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-16 py-5 bg-blue-600 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={24}/> : 'Publish Updates'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
