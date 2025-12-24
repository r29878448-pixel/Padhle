
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, 
  Video as VideoIcon, Upload, 
  RefreshCw, Check, User as UserIcon, Shield, UserPlus, Globe, Key, Save, LayoutDashboard, ChevronDown, ChevronUp, FileText, Youtube, Image, Lock, Link as LinkIcon, Layers, Folder, Info, Inbox, Sparkles, Send, ArrowRight, Zap,
  Loader2, Bell, Megaphone
} from 'lucide-react';
import { Course, Subject, Chapter, Lecture, StaffMember, SiteSettings, Resource, Notice } from '../types';
import { subscribeToStaff, addStaffToDB, removeStaffFromDB, saveCourseToDB, deleteCourseFromDB, saveSiteSettings, subscribeToTelegramFeed, TelegramPost, markPostAsIngested, subscribeToNotices, addNoticeToDB, deleteNoticeFromDB } from '../services/db';
import { classifyContent } from '../services/geminiService';

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

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ text: '', type: 'update' as any });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'manager' as 'manager' | 'admin' });
  const [tempSettings, setTempSettings] = useState<SiteSettings>(siteSettings);

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

  const handleAddNotice = async () => {
    if (!newNotice.text.trim()) return;
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
    if (!post || !suggestion) return;
    const targetCourse = courses.find(c => c.id === suggestion.courseId);
    if (!targetCourse) return;
    const updatedCourse = JSON.parse(JSON.stringify(targetCourse));
    let targetSubject = updatedCourse.subjects.find((s: any) => s.title.toLowerCase().trim() === suggestion.subjectTitle.toLowerCase().trim());
    if (!targetSubject) { targetSubject = { id: `sub-${Date.now()}`, title: suggestion.subjectTitle, chapters: [] }; updatedCourse.subjects.push(targetSubject); }
    let targetChapter = targetSubject.chapters.find((c: any) => c.title.toLowerCase().trim() === suggestion.chapterTitle.toLowerCase().trim());
    if (!targetChapter) { targetChapter = { id: `ch-${Date.now()}`, title: suggestion.chapterTitle, lectures: [] }; targetSubject.chapters.push(targetChapter); }
    if (post.type === 'youtube' || post.type === 'video') {
      const newLecture: Lecture = { id: `lec-${Date.now()}`, title: post.title, videoUrl: post.url, duration: 'Live Sync', description: 'Auto-organized from Telegram channel.', resources: [] };
      targetChapter.lectures.push(newLecture);
    } else if (post.type === 'pdf') {
      if (targetChapter.lectures.length > 0) {
        targetChapter.lectures[targetChapter.lectures.length - 1].resources.push({ id: `res-${Date.now()}`, title: post.title, url: post.url, type: 'pdf' });
      } else {
        const pdfLecture: Lecture = { id: `lec-${Date.now()}`, title: `Study Material: ${post.title}`, videoUrl: '', duration: '--:--', description: 'Lecture notes and resources.', resources: [{ id: `res-${Date.now()}`, title: post.title, url: post.url, type: 'pdf' }] };
        targetChapter.lectures.push(pdfLecture);
      }
    }
    await saveCourseToDB(updatedCourse);
    await markPostAsIngested(postId);
    const remainingSuggestions = { ...sortSuggestions }; delete remainingSuggestions[postId]; setSortSuggestions(remainingSuggestions);
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return alert("All fields are required.");
    await addStaffToDB({ id: `staff-${Date.now()}`, ...newStaff, joinedAt: new Date().toLocaleDateString() });
    setNewStaff({ name: '', email: '', password: '', role: 'manager' });
  };

  const handleSaveBatch = async () => {
    if (!currentBatch.title.trim()) return alert("Batch title is required.");
    setSaveStatus('saving');
    try {
      await saveCourseToDB(editingId ? currentBatch : { ...currentBatch, id: `batch-${Date.now()}` });
      setSaveStatus('success'); setTimeout(() => { setIsModalOpen(false); setSaveStatus('idle'); setEditingId(null); }, 800);
    } catch (e) { setSaveStatus('error'); }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6 animate-fadeIn pb-20 text-left">
      {/* ADMIN HEADER */}
      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-5">
           <div className="w-14 h-14 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl"><LayoutDashboard size={28} /></div>
           <div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tight">Portal Management</h1>
             <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Status: <span className="text-blue-600">Administrative Online</span></p>
           </div>
        </div>
        
        <div className="flex bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100 overflow-x-auto max-w-full">
           <button onClick={() => setActiveTab('batches')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>Batches</button>
           <button onClick={() => setActiveTab('inbox')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>
             <Inbox size={14}/> Ingestor
           </button>
           <button onClick={() => setActiveTab('notices')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>Notices</button>
           {isAdmin && (
             <>
               <button onClick={() => setActiveTab('staff')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>Staff</button>
               <button onClick={() => setActiveTab('config')} className={`px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-400'}`}>System</button>
             </>
           )}
        </div>
      </div>

      {activeTab === 'batches' && (
        <div className="space-y-8">
          <div className="flex justify-between items-center px-4">
             <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Curriculum</h2>
             <button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-3 shadow-xl shadow-slate-900/10">
               <Plus size={18} /> Add New Batch
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
             {courses.map(course => (
               <div key={course.id} className="bg-white p-6 rounded-[3rem] border border-slate-100 hover:shadow-2xl transition-all group">
                  <div className="aspect-video rounded-[2rem] overflow-hidden mb-6 relative">
                    <img src={course.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                  <h3 className="font-black text-slate-900 text-xl mb-6 truncate">{course.title}</h3>
                  <div className="flex gap-3">
                    <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">Manage Curriculum</button>
                    <button onClick={() => deleteCourseFromDB(course.id)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-900 text-xl mb-8 flex items-center gap-3"><Megaphone className="text-blue-600" size={24}/> New Notice</h3>
              <div className="space-y-6">
                 <textarea rows={4} placeholder="Type your announcement..." value={newNotice.text} onChange={e => setNewNotice({...newNotice, text: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" />
                 <select value={newNotice.type} onChange={e => setNewNotice({...newNotice, type: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none">
                    <option value="update">Platform Update</option>
                    <option value="urgent">Urgent Alert</option>
                    <option value="new_batch">New Batch Launch</option>
                 </select>
                 <button onClick={handleAddNotice} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Push to All Students</button>
              </div>
           </div>
           <div className="lg:col-span-2 space-y-4">
              {notices.map(notice => (
                 <div key={notice.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex items-center justify-between group">
                    <div className="flex items-center gap-5">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${notice.type === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}><Bell size={24}/></div>
                       <div>
                          <p className="font-black text-slate-900">{notice.text}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(notice.timestamp).toLocaleString()}</p>
                       </div>
                    </div>
                    <button onClick={() => deleteNoticeFromDB(notice.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Inbox Ingestor code remains same as previous version but integrated in this UI */}
      {activeTab === 'inbox' && (
        <div className="space-y-8">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 p-10 rounded-[3.5rem] text-white shadow-2xl">
              <div>
                <h2 className="text-3xl font-black tracking-tighter flex items-center gap-3"><Zap className="text-blue-500 fill-blue-500" size={32}/> AI Live Ingestor</h2>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-1">Syncing from <span className="text-blue-400">Telegram Bot Webhook</span></p>
              </div>
              <button onClick={handleAISortAll} disabled={isSorting || telegramPosts.filter(p => !p.isIngested).length === 0} className="bg-blue-600 text-white px-10 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-3 shadow-xl shadow-blue-500/20 disabled:opacity-50">
                {isSorting ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} Analyze Feed
              </button>
           </div>
           <div className="grid grid-cols-1 gap-6">
              {telegramPosts.filter(p => !p.isIngested).map(post => {
                 const sug = sortSuggestions[post.id];
                 return (
                  <div key={post.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 flex flex-col lg:flex-row lg:items-center gap-8 group hover:shadow-2xl transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-4 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest ${post.type === 'pdf' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>{post.type}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-xl leading-tight mb-2">{post.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-md font-mono">{post.url}</p>
                    </div>
                    {sug ? (
                      <div className="flex flex-col sm:flex-row items-center gap-8 bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 animate-slideUp">
                         <div className="text-left flex-1 min-w-[250px] space-y-1">
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2"><Sparkles size={12}/> AI Recommendation</p>
                            <p className="text-xs font-bold text-slate-800"><span className="text-slate-400">Target:</span> {courses.find(c => c.id === sug.courseId)?.title || sug.courseId}</p>
                            <p className="text-xs font-bold text-slate-800"><span className="text-slate-400">Chapter:</span> {sug.chapterTitle}</p>
                         </div>
                         <button onClick={() => applyIngestion(post.id)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
                            <Check size={18}/> Push to Portal
                         </button>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[10px] font-black uppercase tracking-widest bg-slate-50 px-8 py-4 rounded-2xl border border-dashed border-slate-200">Awaiting AI Sync</div>
                    )}
                    <button onClick={() => markPostAsIngested(post.id)} className="p-4 text-slate-200 hover:text-red-500 transition-colors"><X size={24}/></button>
                  </div>
                 );
              })}
           </div>
        </div>
      )}

      {/* Staff and Config sections */}
      {activeTab === 'staff' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
           <div className="lg:col-span-1 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-900 text-xl mb-8 flex items-center gap-3"><UserPlus className="text-blue-600" size={24}/> Faculty Registry</h3>
              <div className="space-y-5">
                 <input type="text" placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" />
                 <input type="email" placeholder="Email Address" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" />
                 <input type="password" placeholder="Secure Password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" />
                 <button onClick={handleAddStaff} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Create Faculty Portal</button>
              </div>
           </div>
           <div className="lg:col-span-2 space-y-4">
              {staff.map(member => (
                <div key={member.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex items-center justify-between shadow-sm group">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase text-xl">{member.name[0]}</div>
                      <div>
                        <h4 className="font-black text-slate-900 text-lg">{member.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{member.email} • <span className="text-blue-600">{member.role}</span></p>
                      </div>
                   </div>
                   {member.email !== 'r29878448@gmail.com' && <button onClick={() => removeStaffFromDB(member.id)} className="p-4 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* CURRICULUM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl animate-fadeIn">
           <div className="bg-white w-full max-w-6xl h-[90vh] rounded-[4rem] shadow-2xl flex flex-col overflow-hidden border border-white/20">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                 <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">{editingId ? 'Edit Batch Content' : 'Initialize New Batch'}</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Syllabus Orchestrator</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-slate-100 rounded-full text-slate-300 transition-colors"><X size={32}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/40">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                    <div className="md:col-span-4 space-y-8">
                       <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-6 shadow-sm">
                          <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest flex items-center gap-2"><Image size={18} className="text-blue-500"/> Batch Visuals</h3>
                          <div className="aspect-video bg-slate-50 rounded-[2rem] overflow-hidden relative border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? <img src={currentBatch.image} className="w-full h-full object-cover" /> : <><Upload size={40} className="text-slate-200"/><span className="text-[10px] font-black text-slate-400 uppercase mt-3">Upload Cover</span></>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, image: r.result as string}); r.readAsDataURL(f); } }} />
                          </div>
                          <div className="space-y-4">
                             <input type="text" placeholder="Batch Name" value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" />
                             <input type="number" placeholder="Enrollment Price (₹)" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:border-blue-500" />
                          </div>
                       </div>
                    </div>
                    <div className="md:col-span-8 space-y-8">
                       <div className="flex items-center justify-between">
                          <h3 className="font-black text-slate-900 text-xl tracking-tight">Curriculum Hierarchy</h3>
                          <button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/10"><Plus size={16}/> Add Subject</button>
                       </div>
                       <div className="space-y-6">
                          {currentBatch.subjects?.map((sub) => (
                             <div key={sub.id} className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                                <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}>
                                   <div className="flex items-center gap-5 flex-1">
                                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center"><Layers size={24}/></div>
                                      <input type="text" value={sub.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, title: e.target.value} : s)})} className="bg-transparent font-black text-slate-900 outline-none w-full text-xl" />
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <button onClick={e => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== sub.id)}); }} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={24}/></button>
                                      {expandedSubject === sub.id ? <ChevronUp size={28} className="text-slate-300"/> : <ChevronDown size={28} className="text-slate-300"/>}
                                   </div>
                                </div>
                                {expandedSubject === sub.id && (
                                   <div className="p-8 border-t border-slate-50 bg-slate-50/30 space-y-8">
                                      {sub.chapters.map((chap) => (
                                         <div key={chap.id} className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden">
                                            <div className="p-5 bg-slate-50 flex items-center justify-between cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chap.id ? null : chap.id)}>
                                               <div className="flex items-center gap-3 flex-1"><Folder size={20} className="text-slate-400"/><input type="text" value={chap.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, title: e.target.value} : c)} : s)})} className="bg-transparent font-black text-slate-800 outline-none w-full text-base" /></div>
                                               <div className="flex items-center gap-2"><button onClick={e => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s)}); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>{expandedChapter === chap.id ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}</div>
                                            </div>
                                            {expandedChapter === chap.id && (
                                               <div className="p-6 border-t bg-white space-y-5">
                                                  {chap.lectures.map(lec => (
                                                     <div key={lec.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col gap-4">
                                                        <div className="flex gap-4"><input value={lec.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, title: e.target.value} : l)} : c)} : s)})} className="flex-1 bg-white px-4 py-3 rounded-xl font-black text-sm outline-none border border-slate-200" placeholder="Lecture Title" /><button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.filter(l => l.id !== lec.id)} : c)} : s)})} className="p-2 text-red-300 hover:text-red-500 transition-colors"><X size={24}/></button></div>
                                                        <input value={lec.videoUrl} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, videoUrl: e.target.value} : l)} : c)} : s)})} className="w-full bg-white px-4 py-3 rounded-xl text-[11px] font-mono text-slate-500 outline-none border border-slate-200" placeholder="Video URL (YouTube/Telegram)" />
                                                     </div>
                                                  ))}
                                                  <button onClick={() => { const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Lecture', videoUrl: '', duration: '--:--', description: '', resources: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: [...c.lectures, newLec]} : c)} : s)}); }} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">+ Add New Lecture</button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
                                      <button onClick={() => { const newCh: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: [...s.chapters, newCh]} : s)}); }} className="w-full py-5 bg-white border border-slate-200 rounded-2xl font-black text-[10px] text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all">+ Add Chapter</button>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-10 border-t border-slate-100 bg-white flex justify-end gap-6 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
                 <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest text-xs">Discard</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-16 py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-2xl">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={24}/> : (saveStatus === 'success' ? 'All Synced!' : 'Finalize & Publish')}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
