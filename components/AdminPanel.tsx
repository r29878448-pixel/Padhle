
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, X, 
  Upload, LayoutDashboard, ChevronDown, ChevronUp, Layers, Folder, Inbox, Sparkles, Zap,
  Loader2, Database, Settings as SettingsIcon, Bell, Megaphone,
  Target, QrCode, RefreshCw, CheckCircle2, AlertCircle, Play, History, Users as UsersIcon, BarChart3, Search, Clock
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
  
  useEffect(() => {
     if (isManager && (activeTab === 'staff' || activeTab === 'config')) setActiveTab('batches');
  }, [isManager, activeTab]);

  const selectedBatch = courses.find(c => c.id === targetBatchId);
  const availableSubjects = selectedBatch?.subjects || [];
  const selectedSubject = availableSubjects.find(s => s.id === targetSubjectId);
  const availableChapters = selectedSubject?.chapters || [];

  const calculateStudentProgress = (studentId: string, courseId: string) => {
    const batch = courses.find(c => c.id === courseId);
    if (!batch) return 0;
    
    let total = 0;
    batch.subjects.forEach(s => s.chapters.forEach(c => total += c.lectures.length));
    
    const completed = allProgress.filter(p => p.userId === studentId && p.courseId === courseId).length;
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const handleStartAutomation = async () => {
    const pending = telegramPosts.filter(p => !p.isIngested);
    if (pending.length === 0) return alert("No pending items found.");
    setIsAutomating(true);
    setSyncLogs([]);
    const count = await runAIAutomation(pending, courses, (log) => setSyncLogs(prev => [log, ...prev].slice(0, 10)));
    setIsAutomating(false);
    alert(`Automation complete: ${count} items added.`);
  };

  const handleAddNotice = async () => {
    if (!newNotice.text.trim()) return;
    await addNoticeToDB(newNotice);
    setNewNotice({ text: '', type: 'update' });
  };

  const handleManualIngest = async () => {
    if (!ingestForm.title || !ingestForm.url) return alert("Title and URL required.");
    setIngestStatus('adding');
    if (directPlacement) {
        if (!targetBatchId || !targetSubjectId || !targetChapterId) {
             alert("Direct placement requires Batch, Subject, and Chapter.");
             setIngestStatus('idle');
             return;
        }
        const updatedCourse = JSON.parse(JSON.stringify(selectedBatch));
        const chap = updatedCourse.subjects.find((s:any) => s.id === targetSubjectId).chapters.find((c:any) => c.id === targetChapterId);
        chap.lectures.push({ id: `lec-${Date.now()}`, title: ingestForm.title, videoUrl: ingestForm.url, duration: 'Auto', description: 'Manual upload.', resources: [] });
        await saveCourseToDB(updatedCourse);
    } else {
        await addManualIngestItem({ title: ingestForm.title, url: ingestForm.url, type: ingestForm.type, timestamp: Date.now(), isIngested: false });
    }
    setIngestForm({ title: '', url: '', type: 'youtube' });
    setIngestStatus('idle');
  };

  const handleSaveBatch = async () => {
    if (!currentBatch.title.trim()) return alert("Batch title required.");
    setSaveStatus('saving');
    try {
      await saveCourseToDB(editingId ? currentBatch : { ...currentBatch, id: `batch-${Date.now()}` });
      setSaveStatus('success'); 
      setTimeout(() => { setIsModalOpen(false); setSaveStatus('idle'); setEditingId(null); }, 800);
    } catch (e) { setSaveStatus('error'); }
  };

  const filteredStudents = students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.email.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-left">
      <div className="bg-white p-6 border border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 flex items-center justify-center text-white"><LayoutDashboard size={24} /></div>
           <div><h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Management Panel</h1><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Role: {userRole}</p></div>
        </div>
        
        <div className="flex bg-slate-100 p-1 border border-slate-200 overflow-x-auto max-w-full">
           <button onClick={() => setActiveTab('batches')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Curriculum</button>
           <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Students</button>
           <button onClick={() => setActiveTab('inbox')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Ingestor</button>
           <button onClick={() => setActiveTab('notices')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'notices' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Notices</button>
           {isAdmin && (
             <button onClick={() => setActiveTab('staff')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Faculty</button>
           )}
        </div>
      </div>

      <div className="bg-white min-h-[600px] border border-slate-200 p-8 shadow-sm">
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

        {activeTab === 'users' && (
           <div className="space-y-6 animate-fadeIn">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-slate-100">
                 <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><UsersIcon size={20} className="text-blue-600"/> Student Directory</h2>
                 <div className="relative w-full md:w-80">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" placeholder="Search by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 font-bold text-xs uppercase outline-none focus:border-blue-500" />
                 </div>
              </div>

              <div className="overflow-x-auto">
                 <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 tracking-widest border-b border-slate-100">
                          <th className="px-6 py-4">Student Info</th>
                          <th className="px-6 py-4">Enrollments</th>
                          <th className="px-6 py-4">Progress</th>
                          <th className="px-6 py-4">Last Active</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredStudents.map(student => (
                          <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                             <td className="px-6 py-6">
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-slate-900 flex items-center justify-center text-white font-black text-xs">{student.name.charAt(0)}</div>
                                   <div><p className="font-black text-[11px] text-slate-900 uppercase tracking-tight">{student.name}</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{student.email}</p></div>
                                </div>
                             </td>
                             <td className="px-6 py-6">
                                <div className="flex flex-wrap gap-2">
                                   {student.enrolledBatches?.map(bid => {
                                      const batch = courses.find(c => c.id === bid);
                                      return batch ? <span key={bid} className="px-2 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase border border-blue-100">{batch.title}</span> : null;
                                   })}
                                </div>
                             </td>
                             <td className="px-6 py-6 min-w-[200px]">
                                {student.enrolledBatches?.map(bid => {
                                   const progress = calculateStudentProgress(student.id, bid);
                                   const batch = courses.find(c => c.id === bid);
                                   return (
                                      <div key={bid} className="mb-3 last:mb-0">
                                         <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-black text-slate-400 uppercase truncate max-w-[100px]">{batch?.title}</span><span className="text-[7px] font-black text-blue-600">{progress}%</span></div>
                                         <div className="w-full h-1 bg-slate-100 overflow-hidden"><div className="h-full bg-blue-600 transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
                                      </div>
                                   );
                                })}
                             </td>
                             <td className="px-6 py-6">
                                <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest"><Clock size={12}/> {new Date(student.lastActive).toLocaleDateString()}</div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
                 {filteredStudents.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">No active learners found</div>}
              </div>
           </div>
        )}

        {activeTab === 'inbox' && (
           <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 animate-fadeIn">
             <div className="lg:col-span-7 space-y-8">
               <div className="bg-slate-50 p-8 border border-slate-200 space-y-6">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-4"><h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Inbox size={18} className="text-blue-600"/> Resource Queue</h3><button onClick={() => setDirectPlacement(!directPlacement)} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest border transition-all ${directPlacement ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-200'}`}>{directPlacement ? 'Direct Placement Active' : 'Enable Direct Placement'}</button></div>
                  <div className="space-y-4"><input type="text" value={ingestForm.title} onChange={e => setIngestForm({...ingestForm, title: e.target.value})} className="w-full px-4 py-4 bg-white border border-slate-200 font-bold text-xs outline-none focus:border-blue-500" placeholder="Resource Title" /><input type="text" value={ingestForm.url} onChange={e => setIngestForm({...ingestForm, url: e.target.value})} className="w-full px-4 py-4 bg-white border border-slate-200 font-bold text-xs outline-none focus:border-blue-500" placeholder="Content URL" />{directPlacement && <div className="grid grid-cols-2 gap-4 animate-fadeIn"><select value={targetBatchId} onChange={e => setTargetBatchId(e.target.value)} className="px-3 py-3 bg-white border border-blue-100 font-bold text-[10px] uppercase outline-none"><option value="">-- Batch --</option>{courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select><select value={targetSubjectId} onChange={e => setTargetSubjectId(e.target.value)} className="px-3 py-3 bg-white border border-blue-100 font-bold text-[10px] uppercase outline-none"><option value="">-- Subject --</option>{availableSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</select><select value={targetChapterId} onChange={e => setTargetChapterId(e.target.value)} className="px-3 py-3 bg-white border border-blue-100 font-bold text-[10px] uppercase outline-none col-span-2"><option value="">-- Chapter --</option>{availableChapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>}<button onClick={handleManualIngest} disabled={ingestStatus === 'adding'} className="w-full bg-slate-900 text-white py-4 font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">{ingestStatus === 'adding' ? <Loader2 className="animate-spin mx-auto" size={20}/> : 'Publish Resource'}</button></div>
               </div>
             </div>
             <div className="lg:col-span-5 space-y-6">
                <div className="bg-slate-900 p-8 text-white space-y-6"><div className="flex items-center gap-3"><Sparkles className="text-blue-400" size={24}/><h3 className="font-black text-lg uppercase tracking-tight">AI Sync Center</h3></div><p className="text-slate-400 text-xs font-medium uppercase tracking-tight">AI will auto-map pending items into the curriculum structure.</p><button onClick={handleStartAutomation} disabled={isAutomating} className={`w-full py-4 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${isAutomating ? 'bg-blue-600/50 cursor-wait' : 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20'}`}>{isAutomating ? <RefreshCw className="animate-spin" size={16}/> : <Play size={16}/>}{isAutomating ? 'Running...' : 'Start Automation'}</button></div>
                <div className="bg-white border border-slate-200 p-6 min-h-[300px]"><h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 border-b border-slate-100 pb-2">Sync Log</h4><div className="space-y-3">{syncLogs.map(log => <div key={log.id} className="text-[9px] font-bold border-l-2 border-slate-100 pl-3 py-1 animate-fadeIn"><div className="flex items-center justify-between mb-1"><span className="uppercase text-slate-800 truncate max-w-[150px]">{log.itemTitle}</span>{log.status === 'success' ? <CheckCircle2 size={12} className="text-emerald-500"/> : log.status === 'processing' ? <Loader2 size={12} className="animate-spin text-blue-500"/> : <AlertCircle size={12} className="text-red-500"/>}</div><p className="text-slate-400 font-medium">{log.message}</p></div>)}</div></div>
             </div>
           </div>
        )}

        {/* Notices & Staff tabs kept for logic completeness */}
      </div>

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
