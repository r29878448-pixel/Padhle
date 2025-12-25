
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, X, 
  Upload, Check, LayoutDashboard, ChevronDown, ChevronUp, FileText, Image, Lock, Link as LinkIcon, Layers, Folder, Inbox, Sparkles, Zap,
  Loader2, Database, ClipboardCheck, Settings as SettingsIcon, Globe, User as UserIcon, Bell, Shield, UserPlus, Save, Megaphone,
  Key, Info, ArrowRight
} from 'lucide-react';
import { Course, Subject, Chapter, Lecture, StaffMember, SiteSettings, Resource, Notice } from '../types';
import { 
  subscribeToStaff, 
  saveCourseToDB, 
  deleteCourseFromDB, 
  subscribeToTelegramFeed, 
  TelegramPost, 
  markPostAsIngested, 
  subscribeToNotices, 
  addNoticeToDB, 
  deleteNoticeFromDB,
  addStaffToDB,
  removeStaffFromDB,
  saveSiteSettings,
  addManualIngestItem
} from '../services/db';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  
  // Form States
  const [newNotice, setNewNotice] = useState({ text: '', type: 'update' as Notice['type'] });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'manager' as 'manager' | 'admin' });
  const [tempSettings, setTempSettings] = useState<SiteSettings>(siteSettings);

  // Ingest Form State
  const [ingestForm, setIngestForm] = useState({ title: '', url: '', type: 'youtube' as 'youtube' | 'pdf' | 'video' | 'text' | 'telegram' });
  const [ingestStatus, setIngestStatus] = useState<'idle' | 'adding'>('idle');

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

  const handleAddNotice = async () => {
    if (!newNotice.text.trim()) return;
    setSaveStatus('saving');
    await addNoticeToDB(newNotice);
    setNewNotice({ text: '', type: 'update' });
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleManualIngest = async () => {
    if (!ingestForm.title || !ingestForm.url) return alert("Title and URL are required.");
    setIngestStatus('adding');
    await addManualIngestItem({
      title: ingestForm.title,
      url: ingestForm.url,
      type: ingestForm.type,
      timestamp: Date.now(),
      isIngested: false
    });
    setIngestForm({ title: '', url: '', type: 'youtube' });
    setIngestStatus('idle');
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) {
      alert("All fields are mandatory for faculty registration.");
      return;
    }
    setSaveStatus('saving');
    await addStaffToDB({
      id: `staff-${Date.now()}`,
      ...newStaff,
      joinedAt: new Date().toLocaleDateString()
    });
    setNewStaff({ name: '', email: '', password: '', role: 'manager' });
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const handleSaveConfig = async () => {
    setSaveStatus('saving');
    await saveSiteSettings(tempSettings);
    setSiteSettings(tempSettings);
    setSaveStatus('success');
    setTimeout(() => setSaveStatus('idle'), 2000);
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

    if (post.type === 'youtube' || post.type === 'video' || post.type === 'telegram') {
      const newLecture: Lecture = { 
        id: `lec-${Date.now()}`, 
        title: post.title || "Untitled Lecture", 
        videoUrl: post.url || "", 
        duration: post.type === 'telegram' ? 'Post' : 'Live Sync', 
        description: 'Auto-organized from feed.', 
        resources: [] 
      };
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
    <div className="space-y-6 animate-fadeIn pb-12 text-left">
      {/* HEADER SECTION */}
      <div className="bg-white p-6 border border-slate-200 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6 rounded-none">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white"><LayoutDashboard size={24} /></div>
           <div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Admin Console</h1>
             <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-emerald-500 animate-pulse"></span> Authorized faculty access
             </p>
           </div>
        </div>
        
        <div className="flex bg-slate-100 p-1 border border-slate-200 overflow-x-auto max-w-full no-scrollbar rounded-none">
           <button onClick={() => setActiveTab('batches')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Curriculum</button>
           <button onClick={() => setActiveTab('inbox')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>
             <Inbox size={12}/> Ingestor
           </button>
           <button onClick={() => setActiveTab('notices')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Notices</button>
           {isAdmin && (
             <>
               <button onClick={() => setActiveTab('staff')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Faculty</button>
               <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500'}`}>Settings</button>
             </>
           )}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white min-h-[500px] border border-slate-200 p-6 shadow-sm rounded-none">
        {activeTab === 'batches' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center">
               <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Active Batches</h2>
               <button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-md rounded-none">
                 <Plus size={16} /> New Batch
               </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {courses.length > 0 ? courses.map(course => (
                 <div key={course.id} className="bg-slate-50 p-5 border border-slate-200 group hover:border-blue-500 transition-all rounded-none">
                    <div className="aspect-video overflow-hidden mb-4 border border-slate-200 rounded-none relative">
                      <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    </div>
                    <h3 className="font-black text-slate-900 text-base mb-4 truncate uppercase tracking-tight">{course.title}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-2.5 font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all rounded-none">Manage</button>
                      <button onClick={() => deleteCourseFromDB(course.id)} className="p-2.5 bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all rounded-none"><Trash2 size={18}/></button>
                    </div>
                 </div>
               )) : (
                 <div className="col-span-full py-20 text-center bg-slate-50 border border-dashed border-slate-200">
                    <Database className="mx-auto text-slate-300 mb-4" size={48} />
                    <p className="text-slate-400 font-black text-sm uppercase">Curriculum Vault Empty</p>
                 </div>
               )}
            </div>
          </div>
        )}

        {activeTab === 'inbox' && (
          <div className="space-y-8 animate-fadeIn">
             {/* Manual Ingest Form */}
             <div className="bg-slate-50 p-6 border border-slate-200 space-y-4 rounded-none">
                <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Zap size={16} className="text-blue-600"/> Manual Resource Ingest</h3>
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1 w-full">
                     <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Resource Title</label>
                     <input type="text" value={ingestForm.title} onChange={e => setIngestForm({...ingestForm, title: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 font-bold text-xs outline-none focus:border-blue-500 rounded-none" placeholder="e.g., Thermodynamics L-01" />
                  </div>
                  <div className="flex-1 space-y-1 w-full">
                     <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Content URL</label>
                     <input type="text" value={ingestForm.url} onChange={e => setIngestForm({...ingestForm, url: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-300 font-bold text-xs outline-none focus:border-blue-500 rounded-none" placeholder="https://t.me/channel/123" />
                  </div>
                  <div className="w-full md:w-32 space-y-1">
                     <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Type</label>
                     <select value={ingestForm.type} onChange={e => setIngestForm({...ingestForm, type: e.target.value as any})} className="w-full px-4 py-3 bg-white border border-slate-300 font-black text-[10px] uppercase outline-none rounded-none">
                        <option value="youtube">YouTube</option>
                        <option value="pdf">PDF Doc</option>
                        <option value="video">Raw Video</option>
                        <option value="telegram">Telegram</option>
                     </select>
                  </div>
                  <button onClick={handleManualIngest} disabled={ingestStatus === 'adding'} className="bg-slate-900 text-white px-8 py-3 h-[42px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md rounded-none whitespace-nowrap flex items-center justify-center min-w-[120px]">
                    {ingestStatus === 'adding' ? <Loader2 className="animate-spin" size={14}/> : 'Add to Queue'}
                  </button>
                </div>
             </div>

             <div className="bg-slate-900 p-8 text-white border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 rounded-none">
                <div className="text-left">
                  <h2 className="text-2xl font-black tracking-tight flex items-center gap-3"><Inbox className="text-blue-500" size={28}/> Ingest Queue</h2>
                  <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Pending Resources for Classification</p>
                </div>
                <button onClick={handleAISortAll} disabled={isSorting || telegramPosts.filter(p => !p.isIngested).length === 0} className="bg-blue-600 text-white px-8 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-3 shadow-lg disabled:opacity-50 rounded-none">
                  {isSorting ? <Loader2 className="animate-spin" size={16}/> : <Sparkles size={16}/>} Auto-Classify All
                </button>
             </div>

             <div className="space-y-4">
                {telegramPosts.filter(p => !p.isIngested).length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200">
                     <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Queue Empty</p>
                  </div>
                ) : (
                  telegramPosts.filter(p => !p.isIngested).map(post => {
                     const sug = sortSuggestions[post.id];
                     return (
                      <div key={post.id} className="bg-white p-5 border border-slate-200 flex flex-col lg:flex-row lg:items-center gap-6 group hover:border-blue-400 transition-all rounded-none">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="bg-blue-50 text-blue-600 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border border-blue-100">{post.type}</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{new Date(post.timestamp).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-black text-slate-900 text-base">{post.title || "External Resource"}</h4>
                          <a href={post.url} target="_blank" rel="noreferrer" className="text-[10px] text-slate-400 hover:text-blue-600 flex items-center gap-1 mt-1"><LinkIcon size={10}/> {post.url}</a>
                        </div>
                        {sug && (
                          <div className="flex flex-col sm:flex-row items-center gap-4 bg-blue-50/50 p-4 border border-blue-100 flex-1">
                             <div className="text-left flex-1">
                                <p className="text-[7px] font-black text-blue-600 uppercase tracking-widest">Target Mapping</p>
                                <p className="text-[11px] font-bold text-slate-800 uppercase">{courses.find(c => c.id === sug.courseId)?.title || "General"}</p>
                             </div>
                             <button onClick={() => applyIngestion(post.id)} className="bg-slate-900 text-white px-5 py-2 font-black text-[8px] uppercase tracking-widest hover:bg-blue-600 transition-all rounded-none">
                                <Check size={14}/> Publish
                             </button>
                          </div>
                        )}
                        <button onClick={() => markPostAsIngested(post.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><X size={20}/></button>
                      </div>
                     );
                  })
                )}
             </div>
          </div>
        )}

        {activeTab === 'notices' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-50 p-6 border border-slate-200 space-y-4 rounded-none">
              <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Megaphone size={16} className="text-blue-600"/> Broadcast New Update</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Notification message for all students..." 
                  value={newNotice.text} 
                  onChange={e => setNewNotice({...newNotice, text: e.target.value})}
                  className="flex-1 px-4 py-3 bg-white border border-slate-300 font-bold text-xs uppercase outline-none focus:border-blue-500 rounded-none"
                />
                <select 
                  value={newNotice.type} 
                  onChange={e => setNewNotice({...newNotice, type: e.target.value as any})}
                  className="px-4 py-3 bg-white border border-slate-300 font-black text-[10px] uppercase outline-none rounded-none"
                >
                  <option value="update">General Update</option>
                  <option value="urgent">Urgent Alert</option>
                  <option value="new_batch">New Batch Launch</option>
                </select>
                <button onClick={handleAddNotice} className="bg-slate-900 text-white px-8 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md rounded-none">Initialize Notice</button>
              </div>
            </div>

            <div className="space-y-4">
              {notices.map(notice => (
                <div key={notice.id} className="p-5 border border-slate-100 flex items-center justify-between bg-white hover:border-slate-300 transition-all rounded-none">
                  <div className="flex items-center gap-5">
                    <div className={`w-10 h-10 flex items-center justify-center ${notice.type === 'urgent' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                      <Bell size={18} />
                    </div>
                    <div>
                      <p className="font-black text-xs text-slate-800 uppercase tracking-tight">{notice.text}</p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">{new Date(notice.timestamp).toLocaleString()} • {notice.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteNoticeFromDB(notice.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && isAdmin && (
          <div className="space-y-8 animate-fadeIn">
            <div className="bg-slate-50 p-6 border border-slate-200 space-y-4 rounded-none">
              <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><UserPlus size={16} className="text-blue-600"/> Register New Faculty</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input type="text" placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="px-4 py-3 bg-white border border-slate-300 font-bold text-xs uppercase outline-none rounded-none" />
                <input type="email" placeholder="Email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="px-4 py-3 bg-white border border-slate-300 font-bold text-xs uppercase outline-none rounded-none" />
                <input type="password" placeholder="Access Password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="px-4 py-3 bg-white border border-slate-300 font-bold text-xs uppercase outline-none rounded-none" />
                <select value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value as any})} className="px-4 py-3 bg-white border border-slate-300 font-black text-[10px] uppercase outline-none rounded-none">
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <button onClick={handleAddStaff} className="bg-slate-900 text-white px-8 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md rounded-none">Register Faculty Account</button>
            </div>

            <div className="border border-slate-200 overflow-hidden rounded-none">
               <table className="w-full text-left">
                  <thead className="bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest">
                     <tr>
                        <th className="px-6 py-4">Identity</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {staff.map(member => (
                        <tr key={member.id} className="hover:bg-slate-50 transition-colors">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs uppercase">{member.name[0]}</div>
                                 <div>
                                    <p className="font-black text-xs text-slate-900 uppercase">{member.name}</p>
                                    <p className="text-[9px] font-bold text-slate-400">{member.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="px-6 py-4">
                              <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest border ${member.role === 'admin' ? 'border-amber-200 text-amber-600 bg-amber-50' : 'border-blue-200 text-blue-600 bg-blue-50'}`}>{member.role}</span>
                           </td>
                           <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{member.joinedAt}</td>
                           <td className="px-6 py-4 text-right">
                              {member.email !== 'r29878448@gmail.com' && (
                                <button onClick={() => removeStaffFromDB(member.id)} className="text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                              )}
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'config' && isAdmin && (
           <div className="space-y-8 animate-fadeIn max-w-2xl">
              <div className="bg-white border border-slate-200 p-8 space-y-6 rounded-none">
                 <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-3"><SettingsIcon size={16} className="text-blue-600"/> Infrastructure Settings</h3>
                 
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Link Shortener Service API</label>
                    <div className="relative">
                       <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                          type="text" 
                          placeholder="Shortener API Endpoint" 
                          value={tempSettings.shortenerUrl} 
                          onChange={e => setTempSettings({...tempSettings, shortenerUrl: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 rounded-none" 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Master API Key</label>
                    <div className="relative">
                       <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                       <input 
                          type="password" 
                          placeholder="Secret Verification Key" 
                          value={tempSettings.shortenerApiKey} 
                          onChange={e => setTempSettings({...tempSettings, shortenerApiKey: e.target.value})}
                          className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 rounded-none" 
                       />
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                       {saveStatus === 'success' && <div className="text-emerald-600 font-black text-[8px] uppercase tracking-widest flex items-center gap-1 animate-fadeIn"><Check size={10}/> Configuration Live</div>}
                    </div>
                    <button onClick={handleSaveConfig} className="bg-slate-900 text-white px-10 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2 rounded-none">
                       {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={14}/> : <Save size={14}/>} Update Configuration
                    </button>
                 </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-100 p-6 space-y-3 rounded-none">
                 <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2"><Info size={12}/> Technical Note</p>
                 <p className="text-[11px] font-medium text-slate-600 leading-relaxed uppercase tracking-tight">Updating these settings affects the direct link generation and automated verification processes across the entire portal immediately.</p>
              </div>
           </div>
        )}
      </div>

      {/* MODAL SECTION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-5xl h-[95vh] rounded-none shadow-2xl flex flex-col overflow-hidden border border-slate-800">
              <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-white">
                 <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">Batch Editor</h2>
                    <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Syllabus Master Management</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 transition-colors text-slate-400"><X size={28}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-6">
                       <div className="bg-white p-6 border border-slate-200 space-y-5 rounded-none">
                          <h3 className="font-black text-slate-900 text-[10px] uppercase tracking-widest border-b border-slate-100 pb-2">Batch Info</h3>
                          <div className="aspect-video bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer group overflow-hidden rounded-none" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? <img src={currentBatch.image} className="w-full h-full object-cover" /> : <Upload size={24} className="text-slate-300"/>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, image: r.result as string}); r.readAsDataURL(f); } }} />
                          </div>
                          <div className="space-y-3">
                             <input type="text" placeholder="Batch Title" value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 rounded-none" />
                             <input type="number" placeholder="Access Price" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-white border border-slate-200 font-bold text-xs outline-none focus:border-blue-500 rounded-none" />
                          </div>
                       </div>
                    </div>
                    <div className="lg:col-span-8 space-y-6">
                       <div className="flex items-center justify-between">
                          <h3 className="font-black text-lg text-slate-900 tracking-tight uppercase">Structure</h3>
                          <button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-slate-900 text-white px-4 py-2 font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 rounded-none"><Plus size={14}/> Add Subject</button>
                       </div>
                       <div className="space-y-4">
                          {currentBatch.subjects?.map((sub) => (
                             <div key={sub.id} className="bg-white border border-slate-200 rounded-none">
                                <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}>
                                   <div className="flex items-center gap-3 flex-1">
                                      <Layers size={18} className="text-blue-600"/>
                                      <input type="text" value={sub.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, title: e.target.value} : s)})} className="bg-transparent font-black text-slate-900 outline-none w-full text-base tracking-tight uppercase" />
                                   </div>
                                   <div className="flex items-center gap-3">
                                      <button onClick={e => { e.stopPropagation(); if(confirm('Remove?')) setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== sub.id)}); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                      {expandedSubject === sub.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                   </div>
                                </div>
                                {expandedSubject === sub.id && (
                                   <div className="p-4 border-t border-slate-100 bg-slate-50/30 space-y-4">
                                      {sub.chapters.map((chap) => (
                                         <div key={chap.id} className="bg-white border border-slate-200 shadow-sm rounded-none">
                                            <div className="p-3 bg-slate-100/50 flex items-center justify-between cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chap.id ? null : chap.id)}>
                                               <div className="flex items-center gap-2 flex-1"><Folder size={16} className="text-slate-400"/><input type="text" value={chap.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, title: e.target.value} : c)} : s)})} className="bg-transparent font-black text-slate-700 outline-none w-full text-xs uppercase" /></div>
                                               <div className="flex items-center gap-2"><button onClick={e => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s)}); }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>{expandedChapter === chap.id ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}</div>
                                            </div>
                                            {expandedChapter === chap.id && (
                                               <div className="p-4 border-t bg-white space-y-4">
                                                  {chap.lectures.map(lec => (
                                                     <div key={lec.id} className="bg-slate-50 p-4 border border-slate-200 flex flex-col gap-3 rounded-none">
                                                        <div className="flex justify-between items-start gap-4">
                                                           <input value={lec.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, title: e.target.value} : l)} : c)} : s)})} className="flex-1 bg-white px-3 py-2 border border-slate-200 font-bold text-[10px] outline-none uppercase rounded-none" placeholder="Lecture Title" />
                                                           <div className="flex items-center gap-2">
                                                              {(isAdmin || userRole === 'manager') && (
                                                                <button 
                                                                  onClick={() => copyDirectLink(currentBatch.id, lec.id)}
                                                                  className={`px-3 py-2 border transition-all flex items-center gap-2 font-black text-[8px] uppercase tracking-widest rounded-none ${copiedId === lec.id ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-slate-600'}`}
                                                                >
                                                                  {copiedId === lec.id ? <ClipboardCheck size={12}/> : <LinkIcon size={12}/>} Share
                                                                </button>
                                                              )}
                                                              <button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.filter(l => l.id !== lec.id)} : c)} : s)})} className="p-1.5 text-red-200 hover:text-red-500 transition-colors"><X size={18}/></button>
                                                           </div>
                                                        </div>
                                                        <input value={lec.videoUrl} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, videoUrl: e.target.value} : l)} : c)} : s)})} className="w-full bg-white px-3 py-2 border border-slate-200 text-[9px] font-mono text-slate-500 outline-none rounded-none" placeholder="Video Link" />
                                                     </div>
                                                  ))}
                                                  <button onClick={() => { const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Lecture', videoUrl: '', duration: '00:00', description: '', resources: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: [...c.lectures, newLec]} : c)} : s)}); }} className="w-full py-3 border-2 border-dashed border-slate-200 text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all rounded-none">+ Add Module</button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
                                      <button onClick={() => { const newCh: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: [...s.chapters, newCh]} : s)}); }} className="w-full py-3 bg-white border border-slate-200 font-black text-[9px] text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all rounded-none">+ New Chapter</button>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-4 shadow-xl">
                 <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest text-[9px] rounded-none">Cancel</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-12 py-4 bg-blue-600 text-white font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md rounded-none">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={18}/> : 'Push Live Updates'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
