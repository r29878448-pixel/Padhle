
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, 
  Video as VideoIcon, Upload, 
  RefreshCw, Check, User as UserIcon, Shield, UserPlus, Globe, Key, Save, LayoutDashboard, ChevronDown, ChevronUp, FileText, Youtube, Image, Lock, Link as LinkIcon, Layers, Folder, Info, Inbox, Sparkles, Send, ArrowRight, Zap,
  Loader2
} from 'lucide-react';
import { Course, Subject, Chapter, Lecture, StaffMember, SiteSettings, Resource } from '../types';
import { subscribeToStaff, addStaffToDB, removeStaffFromDB, saveCourseToDB, deleteCourseFromDB, saveSiteSettings, subscribeToTelegramFeed, TelegramPost, markPostAsIngested } from '../services/db';
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
  const [activeTab, setActiveTab] = useState<'batches' | 'staff' | 'inbox' | 'config'>('batches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resourceInputRef = useRef<HTMLInputElement>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'manager' as 'manager' | 'admin' });
  const [tempSettings, setTempSettings] = useState<SiteSettings>(siteSettings);

  const [telegramPosts, setTelegramPosts] = useState<TelegramPost[]>([]);
  const [isSorting, setIsSorting] = useState(false);
  const [sortSuggestions, setSortSuggestions] = useState<Record<string, any>>({});

  const emptyBatch: Course = {
    id: '',
    title: '',
    description: '',
    instructor: 'Academic Specialist',
    price: 0,
    rating: 5.0,
    students: 0,
    category: 'Class 10',
    image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000',
    subjects: [],
    shortLink: '',
    accessCode: 'STUDY-' + Math.floor(100000 + Math.random() * 900000)
  };

  const [currentBatch, setCurrentBatch] = useState<Course>(emptyBatch);

  useEffect(() => {
    const unsubStaff = subscribeToStaff((staffList) => setStaff(staffList));
    const unsubTG = subscribeToTelegramFeed((posts) => setTelegramPosts(posts));
    return () => { unsubStaff(); unsubTG(); };
  }, []);

  const handleAISortAll = async () => {
    setIsSorting(true);
    const newSuggestions: Record<string, any> = {};
    for (const post of telegramPosts.filter(p => !p.isIngested)) {
      const suggestion = await classifyContent(post, courses);
      if (suggestion) {
        newSuggestions[post.id] = suggestion;
      }
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

    // DEEP CLONE to avoid direct state mutation
    const updatedCourse = JSON.parse(JSON.stringify(targetCourse));
    
    // 1. FAIL-PROOF SUBJECT FIND/CREATE
    let targetSubject = updatedCourse.subjects.find((s: any) => 
      s.title.toLowerCase().trim() === suggestion.subjectTitle.toLowerCase().trim()
    );

    if (!targetSubject) {
      targetSubject = { id: `sub-${Date.now()}`, title: suggestion.subjectTitle, chapters: [] };
      updatedCourse.subjects.push(targetSubject);
    }

    // 2. FAIL-PROOF CHAPTER FIND/CREATE
    let targetChapter = targetSubject.chapters.find((c: any) => 
      c.title.toLowerCase().trim() === suggestion.chapterTitle.toLowerCase().trim()
    );
    
    if (!targetChapter) {
      targetChapter = { id: `ch-${Date.now()}`, title: suggestion.chapterTitle, lectures: [] };
      targetSubject.chapters.push(targetChapter);
    }

    // 3. ADD CONTENT
    if (post.type === 'youtube' || post.type === 'video') {
      const newLecture: Lecture = {
        id: `lec-${Date.now()}`,
        title: post.title,
        videoUrl: post.url,
        duration: 'Live Sync',
        description: 'Auto-organized from Telegram Channel.',
        resources: []
      };
      targetChapter.lectures.push(newLecture);
    } else if (post.type === 'pdf') {
      if (targetChapter.lectures.length > 0) {
        const lastLec = targetChapter.lectures[targetChapter.lectures.length - 1];
        lastLec.resources.push({
          id: `res-${Date.now()}`,
          title: post.title,
          url: post.url,
          type: 'pdf'
        });
      } else {
        const pdfLecture: Lecture = {
          id: `lec-${Date.now()}`,
          title: `Study Material: ${post.title}`,
          videoUrl: '',
          duration: '--:--',
          description: 'Lecture notes and resources.',
          resources: [{ id: `res-${Date.now()}`, title: post.title, url: post.url, type: 'pdf' }]
        };
        targetChapter.lectures.push(pdfLecture);
      }
    }

    await saveCourseToDB(updatedCourse);
    await markPostAsIngested(postId);
    
    const remainingSuggestions = { ...sortSuggestions };
    delete remainingSuggestions[postId];
    setSortSuggestions(remainingSuggestions);
  };

  /**
   * handleAddStaff: Fixes "Cannot find name 'handleAddStaff'" error.
   * Logic to register a new faculty member into Firestore.
   */
  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return alert("All fields are required.");
    try {
      const staffMember: StaffMember = {
        id: `staff-${Date.now()}`,
        ...newStaff,
        joinedAt: new Date().toLocaleDateString()
      };
      await addStaffToDB(staffMember);
      setNewStaff({ name: '', email: '', password: '', role: 'manager' });
      alert("Faculty member added successfully!");
    } catch (e) {
      console.error("Add staff error:", e);
      alert("Failed to add staff member.");
    }
  };

  const handleSaveBatch = async () => {
    if (!currentBatch.title.trim()) return alert("Batch title is required.");
    setSaveStatus('saving');
    try {
      let courseToSave = editingId ? currentBatch : { ...currentBatch, id: `batch-${Date.now()}` };
      await saveCourseToDB(courseToSave);
      setSaveStatus('success');
      setTimeout(() => { setIsModalOpen(false); setSaveStatus('idle'); setEditingId(null); }, 800);
    } catch (e) { setSaveStatus('error'); }
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6 animate-fadeIn pb-20 text-left font-sans">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
             <LayoutDashboard size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
             <p className="text-slate-500 text-sm font-medium">Control Center • {userRole}</p>
           </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl">
           <button onClick={() => setActiveTab('batches')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Batches</button>
           <button onClick={() => setActiveTab('inbox')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'inbox' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>
             <Inbox size={16}/> Ingestor
             {telegramPosts.filter(p => !p.isIngested).length > 0 && (
               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
             )}
           </button>
           {isAdmin && (
             <>
               <button onClick={() => setActiveTab('staff')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Faculty</button>
               <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Settings</button>
             </>
           )}
        </div>
      </div>

      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
             <h2 className="text-lg font-black text-slate-800">Batch Catalog</h2>
             <button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg">
               <Plus size={18} /> Add New Batch
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {courses.map(course => (
               <div key={course.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4 relative bg-slate-100 border border-slate-100">
                    <img src={course.image} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-4 truncate">{course.title}</h3>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-50 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-600 hover:text-white transition-all">Curriculum</button>
                    <button onClick={() => deleteCourseFromDB(course.id)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {activeTab === 'inbox' && (
        <div className="space-y-6 animate-fadeIn">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
              <div>
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                  <Zap className="text-blue-500 fill-blue-500" size={24}/> AI Smart Ingestor
                </h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Organizing content from <span className="text-blue-400">Telegram Live Feed</span>.</p>
              </div>
              <button 
                onClick={handleAISortAll} 
                disabled={isSorting || telegramPosts.filter(p => !p.isIngested).length === 0}
                className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
              >
                {isSorting ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                Analyze All Posts
              </button>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {telegramPosts.filter(p => !p.isIngested).map(post => {
                const suggestion = sortSuggestions[post.id];
                const matchedCourse = courses.find(c => c.id === suggestion?.courseId);

                return (
                  <div key={post.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 flex flex-col lg:flex-row lg:items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${post.type === 'pdf' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>{post.type}</span>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(post.timestamp).toLocaleString()}</span>
                      </div>
                      <h4 className="font-black text-slate-900 text-lg leading-tight mb-2">{post.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-md font-mono">{post.url}</p>
                    </div>

                    {suggestion ? (
                      <div className="flex flex-col sm:flex-row items-center gap-6 bg-blue-50/40 p-5 rounded-[2rem] border border-blue-100/50 animate-slideUp">
                         <div className="text-left flex-1 min-w-[220px] space-y-1">
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles size={10}/> AI PROPOSAL</p>
                            <p className="text-xs font-bold text-slate-800"><span className="text-slate-400">Batch:</span> {matchedCourse?.title || suggestion.courseId}</p>
                            <p className="text-xs font-bold text-slate-800"><span className="text-slate-400">Subject:</span> {suggestion.subjectTitle}</p>
                            <p className="text-xs font-bold text-slate-800"><span className="text-slate-400">Chapter:</span> {suggestion.chapterTitle}</p>
                         </div>
                         <button onClick={() => applyIngestion(post.id)} className="bg-slate-900 text-white px-6 py-3.5 rounded-xl font-bold text-xs hover:bg-blue-600 shadow-md flex items-center gap-2 whitespace-nowrap">
                            <Check size={16}/> Confirm Placement
                         </button>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-xs font-bold flex items-center gap-2 italic bg-slate-50 px-6 py-4 rounded-2xl border border-dashed border-slate-200">
                        <Info size={14}/> Run analysis to categorize
                      </div>
                    )}

                    <button onClick={() => markPostAsIngested(post.id)} className="p-3 text-slate-300 hover:text-red-500 transition-all" title="Dismiss">
                        <X size={20}/>
                    </button>
                  </div>
                );
              })}

              {telegramPosts.filter(p => !p.isIngested).length === 0 && (
                <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                   <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 shadow-sm">
                      <Inbox size={32}/>
                   </div>
                   <h3 className="font-black text-slate-800 text-lg">Inbox Organized!</h3>
                   <p className="text-slate-500 text-sm mt-1">New content from Telegram will appear here.</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Faculty and Config tabs remain similar to previous version but with consistent styling */}
      {activeTab === 'staff' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100">
              <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2"><UserPlus size={20} className="text-blue-600"/> Register Faculty</h3>
              <div className="space-y-4">
                 <input type="text" placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" />
                 <input type="email" placeholder="Email Address" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" />
                 <input type="text" placeholder="Temporary Password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" />
                 <button onClick={handleAddStaff} className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-slate-800 shadow-lg">Create Account</button>
              </div>
           </div>
           <div className="lg:col-span-2 space-y-4">
              {staff.map(member => (
                <div key={member.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-500 uppercase">{member.name[0]}</div>
                      <div>
                        <h4 className="font-bold text-slate-900">{member.name}</h4>
                        <p className="text-xs text-slate-400">{member.email} • <span className="uppercase text-blue-600 font-black">{member.role}</span></p>
                      </div>
                   </div>
                   {member.email !== 'r29878448@gmail.com' && (
                     <button onClick={() => removeStaffFromDB(member.id)} className="p-3 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                   )}
                </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'config' && isAdmin && (
         <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h3 className="font-black text-slate-900 text-2xl text-center mb-8">System Settings</h3>
            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shortener API URL</label>
                 <input type="text" value={tempSettings.shortenerUrl} onChange={e => setTempSettings({...tempSettings, shortenerUrl: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Publisher API Key</label>
                 <input type="text" value={tempSettings.shortenerApiKey} onChange={e => setTempSettings({...tempSettings, shortenerApiKey: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none" />
               </div>
               <button onClick={async () => { await saveSiteSettings(tempSettings); setSiteSettings(tempSettings); alert("Saved!"); }} className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2">
                 <Save size={20} /> Update Portal Config
               </button>
            </div>
         </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
           <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                 <div>
                    <h2 className="text-2xl font-black text-slate-900">{editingId ? 'Edit Curriculum' : 'New Academic Batch'}</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Batch Manager</p>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-300 transition-colors"><X size={28}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                 <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
                    <div className="md:col-span-4 space-y-6">
                       <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 space-y-5 shadow-sm">
                          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2"><Image size={18} className="text-blue-500"/> Batch Identity</h3>
                          <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200 flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? (
                               <img src={currentBatch.image} className="w-full h-full object-cover" />
                             ) : (
                               <>
                                 <Upload size={32} className="text-slate-300" />
                                 <span className="text-[10px] font-black mt-2 uppercase tracking-widest text-slate-400">Add Thumbnail</span>
                               </>
                             )}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const reader = new FileReader();
                                 reader.onloadend = () => setCurrentBatch({...currentBatch, image: reader.result as string});
                                 reader.readAsDataURL(file);
                               }
                             }} />
                          </div>
                          <div className="space-y-4">
                            <input type="text" placeholder="Batch Name (e.g. Lakshya 2025)" value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
                            <input type="number" placeholder="Enrollment Fee (₹)" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500" />
                            <textarea placeholder="Description" rows={3} value={currentBatch.description} onChange={e => setCurrentBatch({...currentBatch, description: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 resize-none" />
                          </div>
                       </div>
                    </div>

                    <div className="md:col-span-8 space-y-6">
                       <div className="flex items-center justify-between px-2">
                          <h3 className="font-black text-slate-900 text-lg">Subjects & Lectures</h3>
                          <button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2">
                            <Plus size={14}/> Add Subject
                          </button>
                       </div>

                       <div className="space-y-4">
                          {currentBatch.subjects?.map((subject) => (
                             <div key={subject.id} className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
                                <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}>
                                   <div className="flex items-center gap-4 flex-1">
                                      <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                         <Layers size={20} />
                                      </div>
                                      <input 
                                        type="text" 
                                        value={subject.title} 
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setCurrentBatch({
                                          ...currentBatch, 
                                          subjects: currentBatch.subjects.map(s => s.id === subject.id ? {...s, title: e.target.value} : s)
                                        })}
                                        className="bg-transparent font-black text-slate-900 outline-none w-full text-lg"
                                      />
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== subject.id)}); }} className="p-2.5 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                                      {expandedSubject === subject.id ? <ChevronUp className="text-slate-400" size={24}/> : <ChevronDown className="text-slate-400" size={24}/>}
                                   </div>
                                </div>

                                {expandedSubject === subject.id && (
                                   <div className="bg-slate-50/50 p-6 border-t border-slate-100 space-y-6">
                                      {subject.chapters.map((chapter) => (
                                         <div key={chapter.id} className="bg-white rounded-[1.5rem] border border-slate-200 overflow-hidden">
                                            <div className="p-4 bg-slate-50 flex items-center justify-between cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}>
                                               <div className="flex items-center gap-2 flex-1">
                                                 <Folder size={16} className="text-slate-400" />
                                                 <input 
                                                   type="text" 
                                                   value={chapter.title} 
                                                   onClick={(e) => e.stopPropagation()}
                                                   onChange={(e) => setCurrentBatch({
                                                      ...currentBatch,
                                                      subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                         ...s,
                                                         chapters: s.chapters.map(c => c.id === chapter.id ? {...c, title: e.target.value} : c)
                                                      } : s)
                                                   })}
                                                   className="bg-transparent font-bold text-slate-800 outline-none w-full text-sm"
                                                 />
                                               </div>
                                               <div className="flex items-center gap-2">
                                                  <button onClick={(e) => { 
                                                     e.stopPropagation(); 
                                                     setCurrentBatch({
                                                        ...currentBatch,
                                                        subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                           ...s,
                                                           chapters: s.chapters.filter(c => c.id !== chapter.id)
                                                        } : s)
                                                     });
                                                  }} className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                                  {expandedChapter === chapter.id ? <ChevronUp size={20}/> : <ChevronDown size={20}/>}
                                               </div>
                                            </div>
                                            {expandedChapter === chapter.id && (
                                               <div className="p-5 border-t bg-white space-y-4">
                                                  {chapter.lectures.map(lecture => (
                                                     <div key={lecture.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                                                        <div className="flex gap-4">
                                                          <div className="flex-1 space-y-2">
                                                            <input value={lecture.title} onChange={e => {
                                                              setCurrentBatch({
                                                                  ...currentBatch,
                                                                  subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                                    ...s,
                                                                    chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                                        ...c,
                                                                        lectures: c.lectures.map(l => l.id === lecture.id ? {...l, title: e.target.value} : l)
                                                                    } : c)
                                                                  } : s)
                                                              })
                                                            }} className="w-full bg-white px-3 py-2 rounded-lg font-bold text-xs outline-none border border-slate-100" placeholder="Lecture Title" />
                                                            <input value={lecture.videoUrl} onChange={e => {
                                                                setCurrentBatch({
                                                                  ...currentBatch,
                                                                  subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                                    ...s,
                                                                    chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                                        ...c,
                                                                        lectures: c.lectures.map(l => l.id === lecture.id ? {...l, videoUrl: e.target.value} : l)
                                                                    } : c)
                                                                  } : s)
                                                                })
                                                            }} className="w-full bg-white px-3 py-2 rounded-lg text-[10px] text-slate-500 font-mono outline-none border border-slate-100" placeholder="Video URL (YouTube / Telegram)" />
                                                          </div>
                                                          <button onClick={() => {
                                                             setCurrentBatch({
                                                                ...currentBatch,
                                                                subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                                   ...s,
                                                                   chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                                      ...c,
                                                                      lectures: c.lectures.filter(l => l.id !== lecture.id)
                                                                   } : c)
                                                                } : s)
                                                             })
                                                          }} className="text-red-300 hover:text-red-500 transition-colors self-start p-1"><X size={18}/></button>
                                                        </div>
                                                     </div>
                                                  ))}
                                                  <button onClick={() => {
                                                     const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Lecture', videoUrl: '', duration: '--:--', description: '', resources: [] };
                                                     setCurrentBatch({
                                                        ...currentBatch,
                                                        subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                           ...s,
                                                           chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                              ...c,
                                                              lectures: [...c.lectures, newLec]
                                                           } : c)
                                                        } : s)
                                                     });
                                                  }} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all">+ Add New Lecture</button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
                                      <button onClick={() => {
                                         const newChap: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] };
                                         setCurrentBatch({
                                            ...currentBatch,
                                            subjects: currentBatch.subjects.map(s => s.id === subject.id ? {...s, chapters: [...s.chapters, newChap]} : s)
                                         });
                                      }} className="w-full py-3 bg-white border border-slate-200 rounded-xl font-black text-[10px] text-blue-600 uppercase tracking-widest hover:bg-blue-50 transition-all">+ Add Chapter</button>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                 <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 font-black text-slate-400 hover:text-slate-600 transition-all uppercase tracking-widest text-xs">Discard Changes</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-12 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2 shadow-xl">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>}
                    {saveStatus === 'success' ? 'All Synced!' : 'Save Batch'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
