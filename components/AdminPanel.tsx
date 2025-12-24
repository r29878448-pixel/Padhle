
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, 
  Video as VideoIcon, Upload, 
  RefreshCw, Check, User as UserIcon, Shield, UserPlus, Globe, Key, Save, LayoutDashboard, ChevronDown, ChevronUp, FileText, Youtube, Image, Lock, Link as LinkIcon, Layers, Folder, Info, Inbox, Sparkles, Send, ArrowRight, Zap,
  Loader2, Bell, Megaphone, Database, ClipboardCheck
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

  const handleSeedProject45 = async () => {
    if (!confirm("This will seed the official 'Project 45 10th Batch' into your portal. Continue?")) return;
    setSaveStatus('saving');
    try {
      for (const demoCourse of DEMO_COURSES) {
        await saveCourseToDB(demoCourse);
      }
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      setSaveStatus('error');
    }
  };

  const handleAddNotice = async () => {
    if (!newNotice.text || !newNotice.text.trim()) return;
    await addNoticeToDB(newNotice);
    setNewNotice({ text: '', type: 'update' });
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
    const cleanSubTitle = subTitleRaw.toLowerCase().trim();
    const cleanChapTitle = chapTitleRaw.toLowerCase().trim();

    let targetSubject = updatedCourse.subjects.find((s: any) => (s.title || "").toLowerCase().trim() === cleanSubTitle);
    
    if (!targetSubject) { 
      targetSubject = { id: `sub-${Date.now()}`, title: subTitleRaw, chapters: [] }; 
      updatedCourse.subjects.push(targetSubject); 
    }
    
    let targetChapter = targetSubject.chapters.find((c: any) => (c.title || "").toLowerCase().trim() === cleanChapTitle);
    
    if (!targetChapter) { 
      targetChapter = { id: `ch-${Date.now()}`, title: chapTitleRaw, lectures: [] }; 
      targetSubject.chapters.push(targetChapter); 
    }

    if (post.type === 'youtube' || post.type === 'video') {
      const newLecture: Lecture = { id: `lec-${Date.now()}`, title: post.title || "Untitled Lecture", videoUrl: post.url || "", duration: 'Live Sync', description: 'Auto-organized from Telegram channel.', resources: [] };
      targetChapter.lectures.push(newLecture);
    } else if (post.type === 'pdf') {
      if (targetChapter.lectures.length > 0) {
        targetChapter.lectures[targetChapter.lectures.length - 1].resources.push({ id: `res-${Date.now()}`, title: post.title || "Study Material", url: post.url || "", type: 'pdf' });
      } else {
        const pdfLecture: Lecture = { id: `lec-${Date.now()}`, title: `Study Material: ${post.title || "Resource"}`, videoUrl: '', duration: '--:--', description: 'Lecture notes and resources.', resources: [{ id: `res-${Date.now()}`, title: post.title || "Study Material", url: post.url || "", type: 'pdf' }] };
        targetChapter.lectures.push(pdfLecture);
      }
    }
    
    await saveCourseToDB(updatedCourse);
    await markPostAsIngested(postId);
    const remainingSuggestions = { ...sortSuggestions }; 
    delete remainingSuggestions[postId]; 
    setSortSuggestions(remainingSuggestions);
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return alert("All fields are required.");
    await addStaffToDB({ id: `staff-${Date.now()}`, ...newStaff, joinedAt: new Date().toLocaleDateString() });
    setNewStaff({ name: '', email: '', password: '', role: 'manager' });
  };

  const handleSaveBatch = async () => {
    if (!currentBatch.title || !currentBatch.title.trim()) return alert("Batch title is required.");
    setSaveStatus('saving');
    try {
      await saveCourseToDB(editingId ? currentBatch : { ...currentBatch, id: `batch-${Date.now()}` });
      setSaveStatus('success'); setTimeout(() => { setIsModalOpen(false); setSaveStatus('idle'); setEditingId(null); }, 800);
    } catch (e) { setSaveStatus('error'); }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-10 animate-fadeIn pb-24 text-left">
      <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-10">
        <div className="flex items-center gap-6">
           <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl"><LayoutDashboard size={32} /></div>
           <div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tight">Portal Console</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
               <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
               Session: Professional Secure
             </p>
           </div>
        </div>
        
        <div className="flex bg-slate-50 p-2.5 rounded-[1.8rem] border border-slate-100 overflow-x-auto max-w-full">
           <button onClick={() => setActiveTab('batches')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-xl border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Curriculum</button>
           <button onClick={() => setActiveTab('inbox')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-xl border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>
             <Inbox size={14}/> Ingestor
           </button>
           <button onClick={() => setActiveTab('notices')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-xl border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Updates</button>
           {isAdmin && (
             <>
               <button onClick={() => setActiveTab('staff')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-xl border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>Faculty</button>
               <button onClick={() => setActiveTab('config')} className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-xl border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>System</button>
             </>
           )}
        </div>
      </div>

      {activeTab === 'batches' && (
        <div className="space-y-10">
          <div className="flex justify-between items-center px-6">
             <h2 className="text-2xl font-black text-slate-900 tracking-tight">Active Learning Batches</h2>
             <button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-3 shadow-2xl shadow-blue-500/20">
               <Plus size={20} /> Initialize New Batch
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
             {courses.length > 0 ? courses.map(course => (
               <div key={course.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 hover:shadow-2xl transition-all group">
                  <div className="aspect-video rounded-[2.5rem] overflow-hidden mb-8 relative">
                    <img src={course.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <h3 className="font-black text-slate-900 text-2xl mb-8 truncate">{course.title}</h3>
                  <div className="flex gap-4">
                    <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">Manage Content</button>
                    <button onClick={() => deleteCourseFromDB(course.id)} className="p-5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
                  </div>
               </div>
             )) : (
               <div className="col-span-full py-32 text-center bg-slate-50/50 rounded-[4rem] border-2 border-dashed border-slate-100">
                  <Database className="mx-auto text-slate-200 mb-8" size={80} />
                  <p className="text-slate-400 font-black text-xl">Curriculum Vault is Empty</p>
                  <p className="text-[11px] uppercase tracking-widest font-black text-slate-300 mt-3">Start by seeding Project 45 from the 'System' tab.</p>
               </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="space-y-10">
           <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div>
                  <h2 className="text-4xl font-black tracking-tight flex items-center gap-4"><Zap className="text-blue-500 fill-blue-500" size={40}/> AI Academic Ingestor</h2>
                  <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-3">Syncing Live Feed from <span className="text-blue-400">Telegram Hub</span></p>
                </div>
                <button onClick={handleAISortAll} disabled={isSorting || telegramPosts.filter(p => !p.isIngested).length === 0} className="bg-blue-600 text-white px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-4 shadow-2xl shadow-blue-500/30 disabled:opacity-50">
                  {isSorting ? <Loader2 className="animate-spin" size={24}/> : <Sparkles size={24}/>} Analyze Resource Stream
                </button>
              </div>
              <div className="absolute right-[-5%] bottom-[-20%] opacity-5 rotate-12">
                <Inbox size={300} />
              </div>
           </div>

           <div className="grid grid-cols-1 gap-8">
              {telegramPosts.filter(p => !p.isIngested).map(post => {
                 const sug = sortSuggestions[post.id];
                 return (
                  <div key={post.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 flex flex-col lg:flex-row lg:items-center gap-10 group hover:shadow-2xl transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <span className={`px-5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] ${post.type === 'pdf' ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>{post.type}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-2xl leading-tight mb-3">{post.title || "Untitled Resource"}</h4>
                      <p className="text-[11px] text-slate-400 font-mono bg-slate-50 px-3 py-1.5 rounded-lg inline-block">{post.url}</p>
                    </div>
                    {sug ? (
                      <div className="flex flex-col sm:flex-row items-center gap-10 bg-blue-50/40 p-8 rounded-[2.5rem] border border-blue-100/50 animate-slideUp">
                         <div className="text-left flex-1 min-w-[280px] space-y-2">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><Sparkles size={14}/> Academic Recommendation</p>
                            <p className="text-sm font-bold text-slate-800"><span className="text-slate-400 uppercase text-[9px] mr-2">Target Batch:</span> {courses.find(c => c.id === sug.courseId)?.title || "General Batch"}</p>
                            <p className="text-sm font-bold text-slate-800"><span className="text-slate-400 uppercase text-[9px] mr-2">Chapter:</span> {sug.chapterTitle}</p>
                         </div>
                         <button onClick={() => applyIngestion(post.id)} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-lg">
                            <Check size={20}/> Publish to Batch
                         </button>
                      </div>
                    ) : (
                      <div className="text-slate-300 text-[11px] font-black uppercase tracking-widest bg-slate-50/50 px-10 py-6 rounded-[2.5rem] border border-dashed border-slate-200">Awaiting AI Mapping</div>
                    )}
                    <button onClick={() => markPostAsIngested(post.id)} className="p-5 text-slate-200 hover:text-red-500 transition-colors"><X size={32}/></button>
                  </div>
                 );
              })}
           </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
           <div className="bg-white w-full max-w-6xl h-[92vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
              <div className="p-12 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                 <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Syllabus Orchestrator</h2>
                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest mt-2">Managing Batch: {currentBatch.title || 'Initializing...'}</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-5 hover:bg-slate-50 rounded-full text-slate-300 transition-colors"><X size={40}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-slate-50/30">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-10">
                       <div className="bg-white p-10 rounded-[3rem] border border-slate-100 space-y-8 shadow-sm">
                          <h3 className="font-black text-slate-900 text-xs uppercase tracking-widest flex items-center gap-3"><Image size={20} className="text-blue-500"/> Batch Profile</h3>
                          <div className="aspect-video bg-slate-50 rounded-[2.5rem] overflow-hidden relative border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? <img src={currentBatch.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <><Upload size={48} className="text-slate-200"/><span className="text-[11px] font-black text-slate-400 uppercase mt-4">Upload Cover</span></>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, image: r.result as string}); r.readAsDataURL(f); } }} />
                          </div>
                          <div className="space-y-5">
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Batch Identification</label>
                                <input type="text" placeholder="e.g. Lakshya JEE 2025" value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-blue-500 transition-all" />
                             </div>
                             <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Enrollment Value (₹)</label>
                                <input type="number" placeholder="0 for free access" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-2xl font-black text-sm outline-none focus:border-blue-500 transition-all" />
                             </div>
                          </div>
                       </div>
                    </div>
                    <div className="lg:col-span-8 space-y-10">
                       <div className="flex items-center justify-between px-2">
                          <h3 className="font-black text-2xl text-slate-900 tracking-tight">Batch Hierarchy</h3>
                          <button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl"><Plus size={18}/> Add Subject</button>
                       </div>
                       <div className="space-y-8">
                          {currentBatch.subjects?.map((sub) => (
                             <div key={sub.id} className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                                <div className="p-8 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}>
                                   <div className="flex items-center gap-6 flex-1">
                                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Layers size={28}/></div>
                                      <input type="text" value={sub.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, title: e.target.value} : s)})} className="bg-transparent font-black text-slate-900 outline-none w-full text-2xl tracking-tight" />
                                   </div>
                                   <div className="flex items-center gap-4">
                                      <button onClick={e => { e.stopPropagation(); if(confirm('Delete subject?')) setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== sub.id)}); }} className="p-4 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                                      {expandedSubject === sub.id ? <ChevronUp size={32} className="text-slate-300"/> : <ChevronDown size={32} className="text-slate-300"/>}
                                   </div>
                                </div>
                                {expandedSubject === sub.id && (
                                   <div className="p-10 border-t border-slate-50 bg-slate-50/20 space-y-10">
                                      {sub.chapters.map((chap) => (
                                         <div key={chap.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                                            <div className="p-6 bg-slate-50/50 flex items-center justify-between cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chap.id ? null : chap.id)}>
                                               <div className="flex items-center gap-4 flex-1"><Folder size={24} className="text-slate-400"/><input type="text" value={chap.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, title: e.target.value} : c)} : s)})} className="bg-transparent font-black text-slate-800 outline-none w-full text-lg" /></div>
                                               <div className="flex items-center gap-3"><button onClick={e => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s)}); }} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>{expandedChapter === chap.id ? <ChevronUp size={28}/> : <ChevronDown size={28}/>}</div>
                                            </div>
                                            {expandedChapter === chap.id && (
                                               <div className="p-8 border-t bg-white space-y-6">
                                                  {chap.lectures.map(lec => (
                                                     <div key={lec.id} className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100 flex flex-col gap-5">
                                                        <div className="flex justify-between items-start">
                                                           <div className="flex-1 flex gap-4">
                                                              <input value={lec.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, title: e.target.value} : l)} : c)} : s)})} className="flex-1 bg-white px-5 py-4 rounded-xl font-black text-sm outline-none border border-slate-200" placeholder="Lecture Title" />
                                                           </div>
                                                           <div className="flex items-center gap-2">
                                                              <button 
                                                                onClick={() => copyDirectLink(currentBatch.id, lec.id)}
                                                                className={`p-4 rounded-xl shadow-sm border border-slate-200 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest ${copiedId === lec.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200'}`}
                                                              >
                                                                {copiedId === lec.id ? <ClipboardCheck size={14}/> : <LinkIcon size={14}/>} {copiedId === lec.id ? 'Copied' : 'Access Link'}
                                                              </button>
                                                              <button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.filter(l => l.id !== lec.id)} : c)} : s)})} className="p-3 text-red-200 hover:text-red-500 transition-colors"><X size={28}/></button>
                                                           </div>
                                                        </div>
                                                        <input value={lec.videoUrl} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, videoUrl: e.target.value} : l)} : c)} : s)})} className="w-full bg-white px-5 py-4 rounded-xl text-[12px] font-mono text-slate-500 outline-none border border-slate-200" placeholder="Video Resource URL (YouTube/Direct)" />
                                                     </div>
                                                  ))}
                                                  <button onClick={() => { const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Lecture', videoUrl: '', duration: '00:00', description: '', resources: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: [...c.lectures, newLec]} : c)} : s)}); }} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all flex items-center justify-center gap-3">+ Add Lecture Module</button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
                                      <button onClick={() => { const newCh: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: [...s.chapters, newCh]} : s)}); }} className="w-full py-6 bg-white border border-slate-200 rounded-[1.8rem] font-black text-[11px] text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all">+ Initialize New Chapter</button>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-12 border-t border-slate-100 bg-white flex justify-end gap-8 shadow-2xl">
                 <button onClick={() => setIsModalOpen(false)} className="px-12 py-6 font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-[0.2em] text-xs">Discard Changes</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-20 py-6 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/30">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={28}/> : (saveStatus === 'success' ? 'Database Synced!' : 'Confirm & Publish')}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
