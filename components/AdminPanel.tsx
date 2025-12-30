
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, X, 
  Upload, LayoutDashboard, ChevronDown, ChevronUp, Layers, Folder, Inbox, Sparkles, Zap,
  Loader2, Database, Settings as SettingsIcon, Bell, Megaphone,
  Target, QrCode, RefreshCw, CheckCircle2, AlertCircle, Play, History, Users as UsersIcon, BarChart3, Search, Clock, Shield, Globe, Key, UserPlus
} from 'lucide-react';
import { Course, Subject, Chapter, Lecture, StaffMember, SiteSettings, Notice, Student, LectureProgress } from '../types';
import { 
  subscribeToStaff, 
  saveCourseToDB, 
  deleteCourseFromDB, 
  subscribeToTelegramFeed, 
  TelegramPost, 
  subscribeToNotices, 
  addNoticeToDB, 
  deleteNoticeFromDB,
  addStaffToDB,
  deleteStaffFromDB,
  saveSiteSettings,
  addManualIngestItem,
  subscribeToStudents,
  subscribeToAllProgress
} from '../services/db';
import { runAIAutomation, SyncLog } from '../services/automation';

interface AdminPanelProps {
  userRole: 'student' | 'admin' | 'manager';
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onClose: () => void;
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ userRole, courses, setCourses, onClose, siteSettings, setSiteSettings }) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'staff' | 'inbox' | 'notices' | 'config' | 'users'>('batches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrInputRef = useRef<HTMLInputElement>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [newNotice, setNewNotice] = useState({ text: '', type: 'update' as Notice['type'] });
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'manager' as 'manager' | 'admin' });
  const [tempSettings, setTempSettings] = useState<SiteSettings>(siteSettings);
  
  // Progress/Users State
  const [students, setStudents] = useState<Student[]>([]);
  const [allProgress, setAllProgress] = useState<LectureProgress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Ingestor State
  const [ingestForm, setIngestForm] = useState({ title: '', url: '', type: 'youtube' as any });
  const [ingestStatus, setIngestStatus] = useState<'idle' | 'adding'>('idle');
  const [directPlacement, setDirectPlacement] = useState(false);
  const [targetBatchId, setTargetBatchId] = useState('');
  const [targetSubjectId, setTargetSubjectId] = useState('');
  const [targetChapterId, setTargetChapterId] = useState('');
  const [telegramPosts, setTelegramPosts] = useState<TelegramPost[]>([]);

  // Automation State
  const [isAutomating, setIsAutomating] = useState(false);
  const [syncLogs, setSyncLogs] = useState<SyncLog[]>([]);

  const emptyBatch: Course = {
    id: '', title: '', description: '', instructor: 'Academic Specialist', price: 0, rating: 5.0, students: 0, category: 'Class 10', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000', subjects: [], shortLink: '', accessCode: '', qrCode: ''
  };

  const [currentBatch, setCurrentBatch] = useState<Course>(emptyBatch);

  useEffect(() => {
    const unsubStaff = subscribeToStaff(setStaff);
    const unsubTG = subscribeToTelegramFeed(setTelegramPosts);
    const unsubNotices = subscribeToNotices(setNotices);
    const unsubStudents = subscribeToStudents(setStudents);
    const unsubAllProgress = subscribeToAllProgress(setAllProgress);
    return () => { unsubStaff(); unsubTG(); unsubNotices(); unsubStudents(); unsubAllProgress(); };
  }, []);

  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  
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

  // Fix: Added missing handleSaveBatch function to persist curriculum changes
  const handleSaveBatch = async () => {
    setSaveStatus('saving');
    try {
      const batchToSave = { ...currentBatch };
      if (!batchToSave.id) {
        batchToSave.id = batchToSave.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
      }
      await saveCourseToDB(batchToSave);
      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        setIsModalOpen(false);
      }, 1500);
    } catch (e) {
      console.error("Save Batch Error:", e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAddStaff = async () => {
    if (!newStaff.email || !newStaff.password) return;
    await addStaffToDB({ ...newStaff, id: `staff-${Date.now()}`, joinedAt: new Date().toLocaleDateString() });
    setNewStaff({ name: '', email: '', password: '', role: 'manager' });
  };

  const selectedBatch = courses.find(c => c.id === targetBatchId);
  const availableSubjects = selectedBatch?.subjects || [];
  const selectedSubject = availableSubjects.find(s => s.id === targetSubjectId);
  const availableChapters = selectedSubject?.chapters || [];

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-left">
      <div className="bg-white p-6 border border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white"><LayoutDashboard size={24} /></div>
           <div><h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Control Center</h1><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Portal Administrator Interface</p></div>
        </div>
        
        <div className="flex bg-slate-100 p-1 border border-slate-200 overflow-x-auto max-w-full">
           <button onClick={() => setActiveTab('batches')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Batches</button>
           <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Students</button>
           <button onClick={() => setActiveTab('inbox')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Ingestor</button>
           <button onClick={() => setActiveTab('notices')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Notices</button>
           {isAdmin && (
             <>
               <button onClick={() => setActiveTab('staff')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Staff</button>
               <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Portal Config</button>
             </>
           )}
        </div>
      </div>

      <div className="bg-white min-h-[600px] border border-slate-200 p-8 shadow-sm">
        {activeTab === 'config' && isAdmin && (
          <div className="max-w-4xl space-y-10 animate-fadeIn">
            <div className="pb-6 border-b border-slate-100">
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><Globe size={24} className="text-blue-600"/> White-Label Settings</h2>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Rebrand your portal and AI identity</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Branding</h3>
                  <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">App Name</label><input value={tempSettings.appName} onChange={e => setTempSettings({...tempSettings, appName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">AI Assistant Name</label><input value={tempSettings.botName} onChange={e => setTempSettings({...tempSettings, botName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" /></div>
               </div>
               <div className="space-y-4">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Master Credentials</h3>
                  <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Super Admin Email</label><input value={tempSettings.adminEmail} onChange={e => setTempSettings({...tempSettings, adminEmail: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Super Admin Password</label><input type="password" value={tempSettings.adminPassword || ''} onChange={e => setTempSettings({...tempSettings, adminPassword: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" placeholder="Keep current password if empty" /></div>
               </div>
               <div className="space-y-4">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Link Protection</h3>
                  <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">API Endpoint</label><input value={tempSettings.shortenerUrl} onChange={e => setTempSettings({...tempSettings, shortenerUrl: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs text-blue-600" /></div>
                  <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">API Key</label><input value={tempSettings.shortenerApiKey} onChange={e => setTempSettings({...tempSettings, shortenerApiKey: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs font-mono" /></div>
               </div>
               <div className="space-y-4">
                  <h3 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Payment Gateway</h3>
                  <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">Business UPI ID</label><input value={tempSettings.paymentUpiId || ''} onChange={e => setTempSettings({...tempSettings, paymentUpiId: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs" placeholder="example@upi" /></div>
               </div>
            </div>

            <button onClick={handleSaveSettings} disabled={saveStatus === 'saving'} className="w-full bg-slate-900 text-white py-5 font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-2">
               {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={20}/> : <Shield size={18}/>}
               {saveStatus === 'success' ? 'Portal Rebranded Successfully' : 'Apply White-Label Changes'}
            </button>
          </div>
        )}

        {activeTab === 'staff' && isAdmin && (
           <div className="space-y-10 animate-fadeIn">
              <div className="pb-6 border-b border-slate-100 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><UserPlus size={24} className="text-blue-600"/> Team Management</h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Manage sub-admins and managers</p>
                 </div>
              </div>

              <div className="bg-slate-50 p-8 border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                 <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400">Full Name</label><input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 font-bold text-xs" /></div>
                 <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400">Email Address</label><input value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 font-bold text-xs" /></div>
                 <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400">Access Key</label><input value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 font-bold text-xs" /></div>
                 <button onClick={handleAddStaff} className="bg-slate-900 text-white py-3.5 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600">Assign Role</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {staff.map(member => (
                    <div key={member.id} className="p-6 bg-white border border-slate-200 flex justify-between items-center hover:border-blue-200 transition-all">
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 flex items-center justify-center font-black text-white ${member.role === 'admin' ? 'bg-amber-500' : 'bg-slate-900'}`}>{member.name.charAt(0)}</div>
                          <div><p className="font-black text-xs uppercase text-slate-900">{member.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.role}</p></div>
                       </div>
                       {member.email !== siteSettings.adminEmail && (
                         <button onClick={() => deleteStaffFromDB(member.id)} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                       )}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* Previous tabs kept for functionality */}
        {activeTab === 'batches' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center pb-6 border-b border-slate-100"><h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><Database size={20} className="text-blue-600"/> Batch Manager</h2><button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2"><Plus size={16} /> Create Batch</button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {courses.map(course => (
                 <div key={course.id} className="bg-slate-50 p-6 border border-slate-200 group hover:border-blue-500 transition-all">
                    <div className="aspect-video mb-4 border border-slate-200 relative overflow-hidden"><img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                    <h3 className="font-black text-slate-900 text-base mb-4 truncate uppercase tracking-tight">{course.title}</h3>
                    <div className="flex gap-2"><button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-2.5 font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">Edit Curriculum</button>{isAdmin && <button onClick={() => deleteCourseFromDB(course.id)} className="p-2.5 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>}</div>
                 </div>
               ))}
            </div>
          </div>
        )}
        {/* ... (Users, Ingestor, Notices remain unchanged) ... */}
      </div>

      {/* Curriculum Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-6xl h-[95vh] rounded-none shadow-2xl flex flex-col overflow-hidden border border-slate-800">
              <div className="p-8 border-b border-slate-200 flex justify-between items-center bg-white">
                 <div><h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Curriculum Editor</h2><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Configure Batch Syllabi and Monetization</p></div>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 text-slate-400"><X size={32}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4 space-y-8">
                       <div className="bg-white p-8 border border-slate-200 space-y-6">
                          <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-widest border-b border-slate-100 pb-2">Batch Visuals</h3>
                          <div className="aspect-video bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden group" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? <img src={currentBatch.image} className="w-full h-full object-cover" /> : <Upload size={32} className="text-slate-300"/>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, image: r.result as string}); r.readAsDataURL(f); } }} />
                          </div>
                          <div className="space-y-6 mt-12">
                             <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-widest border-b border-slate-100 pb-2">Monetization</h3>
                             <div className="space-y-1"><label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Enrollment Fee (INR)</label><input type="number" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-5 py-4 bg-white border border-slate-200 font-bold text-sm outline-none focus:border-blue-500" placeholder="0 for Free" /></div>
                             <div className="space-y-2"><label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Merchant QR Code</label><div className="aspect-square bg-slate-50 border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer overflow-hidden" onClick={() => qrInputRef.current?.click()}>{currentBatch.qrCode ? <img src={currentBatch.qrCode} className="w-full h-full object-contain" /> : <div className="text-center p-6"><QrCode size={32} className="text-slate-300 mx-auto mb-3"/><p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Click to Upload</p></div>}<input type="file" ref={qrInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, qrCode: r.result as string}); r.readAsDataURL(f); } }} /></div></div>
                          </div>
                       </div>
                    </div>
                    <div className="lg:col-span-8 space-y-8">
                       <div className="flex items-center justify-between border-b border-slate-200 pb-4"><h3 className="font-black text-xl text-slate-900 tracking-tight uppercase">Syllabus Structure</h3><button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-slate-900 text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 flex items-center gap-2 transition-all"><Plus size={16}/> Add Subject</button></div>
                       <div className="space-y-6">
                          {currentBatch.subjects?.map((sub) => (
                             <div key={sub.id} className="bg-white border border-slate-200 shadow-sm">
                                <div className="p-6 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedSubject(expandedSubject === sub.id ? null : sub.id)}>
                                   <div className="flex items-center gap-4 flex-1"><Layers size={22} className="text-blue-600"/><input type="text" value={sub.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, title: e.target.value} : s)})} className="bg-transparent font-black text-slate-900 outline-none w-full text-lg tracking-tight uppercase" /></div>
                                   <div className="flex items-center gap-4"><button onClick={e => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== sub.id)}); }} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>{expandedSubject === sub.id ? <ChevronUp size={24}/> : <ChevronDown size={24}/>}</div>
                                </div>
                                {expandedSubject === sub.id && (
                                   <div className="p-8 border-t border-slate-100 bg-slate-50/20 space-y-6">
                                      {sub.chapters.map((chap) => (
                                         <div key={chap.id} className="bg-white border border-slate-200 shadow-md">
                                            <div className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer border-b border-slate-100" onClick={() => setExpandedChapter(expandedChapter === chap.id ? null : chap.id)}><div className="flex items-center gap-3 flex-1"><Folder size={18} className="text-slate-400"/><input type="text" value={chap.title} onClick={e => e.stopPropagation()} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, title: e.target.value} : c)} : s)})} className="bg-transparent font-black text-slate-700 outline-none w-full text-xs uppercase tracking-widest" /></div><div className="flex items-center gap-3"><button onClick={e => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s)}); }} className="p-1.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>{expandedChapter === chap.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}</div></div>
                                            {expandedChapter === chap.id && (
                                               <div className="p-6 space-y-6">
                                                  {chap.lectures.map(lec => (
                                                     <div key={lec.id} className="bg-slate-50 p-6 border border-slate-200 flex flex-col gap-4">
                                                        <div className="flex justify-between items-start gap-4"><input value={lec.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, title: e.target.value} : l)} : c)} : s)})} className="flex-1 bg-white px-4 py-3 border border-slate-200 font-bold text-[11px] outline-none uppercase" placeholder="Module Title" /><div className="flex items-center gap-2"><button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.filter(l => l.id !== lec.id)} : c)} : s)})} className="p-2 text-red-200 hover:text-red-500 transition-colors"><X size={20}/></button></div></div>
                                                        <input value={lec.videoUrl} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, videoUrl: e.target.value} : l)} : c)} : s)})} className="w-full bg-white px-4 py-3 border border-slate-200 text-[10px] font-mono text-slate-500 outline-none" placeholder="Video / Stream URL" />
                                                     </div>
                                                  ))}
                                                  <button onClick={() => { const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Module', videoUrl: '', duration: 'Live', description: '', resources: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: [...c.lectures, newLec]} : c)} : s)}); }} className="w-full py-4 border-2 border-dashed border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-all">+ Add Module</button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
                                      <button onClick={() => { const newCh: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: [...s.chapters, newCh]} : s)}); }} className="w-full py-4 bg-white border border-slate-200 font-black text-[10px] text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all shadow-sm">+ Create New Chapter</button>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-10 border-t border-slate-200 bg-white flex justify-end gap-6 shadow-2xl">
                 <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest text-[10px]">Discard Changes</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-16 py-5 bg-blue-600 text-white font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={20}/> : 'Publish Curriculum Live'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
