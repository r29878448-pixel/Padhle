
import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, X, 
  Upload, LayoutDashboard, Layers, Folder,
  Loader2, Database, Globe, Search
} from 'lucide-react';
import { Course, Subject, Chapter, Lecture, StaffMember, SiteSettings, Student } from '../types';
import SmartScraper from './SmartScraper';
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
  const [activeTab, setActiveTab] = useState<'batches' | 'scraper' | 'staff' | 'notices' | 'config' | 'users'>('batches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [, setStaff] = useState<StaffMember[]>([]);
  const [, setNotices] = useState<any[]>([]);
  const [tempSettings, setTempSettings] = useState<SiteSettings>(siteSettings);
  
  const [students, setStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const emptyBatch: Course = {
    id: '', title: '', description: '', instructor: 'Academic Specialist', price: 0, rating: 5.0, students: 0, category: 'JEE/NEET', image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1000', subjects: []
  };

  const [currentBatch, setCurrentBatch] = useState<Course>(emptyBatch);

  useEffect(() => {
    const unsubStaff = subscribeToStaff(setStaff);
    const unsubNotices = subscribeToNotices(setNotices);
    const unsubStudents = subscribeToStudents(setStudents);
    return () => { unsubStaff(); unsubNotices(); unsubStudents(); };
  }, []);

  const isAdmin = userRole === 'admin';
  
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

  const filteredStudents = students.filter(s => (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6 animate-fadeIn pb-12 text-left">
      <div className="bg-white p-6 border border-slate-200 flex flex-col xl:flex-row items-center justify-between gap-6 shadow-sm rounded-3xl">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white"><LayoutDashboard size={24} /></div>
           <div><h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Admin Control</h1><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Global Portal Management</p></div>
        </div>
        
        <div className="flex bg-slate-100 p-1 border border-slate-200 overflow-x-auto max-w-full rounded-2xl">
           <button onClick={() => setActiveTab('batches')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Batches</button>
           <button onClick={() => setActiveTab('scraper')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'scraper' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>AI Scraper</button>
           <button onClick={() => setActiveTab('users')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'users' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Students</button>
           {isAdmin && (
             <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest whitespace-nowrap rounded-xl transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>Settings</button>
           )}
        </div>
      </div>

      <div className="bg-white min-h-[600px] border border-slate-200 p-8 shadow-sm rounded-[3rem]">
        {activeTab === 'scraper' && <SmartScraper />}

        {activeTab === 'batches' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex justify-between items-center pb-6 border-b border-slate-100">
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><Database size={20} className="text-blue-600"/> Batch Directory</h2>
              <button onClick={() => { setCurrentBatch(emptyBatch); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 shadow-xl shadow-blue-500/20"><Plus size={16} /> New Batch</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {courses.map(course => (
                 <div key={course.id} className="bg-white border border-slate-100 rounded-[2rem] p-6 group hover:border-blue-500 transition-all shadow-sm">
                    <div className="aspect-video mb-4 rounded-xl relative overflow-hidden"><img alt={course.title} src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                    <h3 className="font-black text-slate-900 text-base mb-6 truncate uppercase tracking-tight">{course.title || 'Untitled Batch'}</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { setCurrentBatch(course); setIsModalOpen(true); }} className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">Edit Curriculum</button>
                      <button onClick={() => deleteCourseFromDB(course.id)} className="p-3 bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all"><Trash2 size={18}/></button>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {activeTab === 'config' && isAdmin && (
          <div className="max-w-4xl space-y-10 animate-fadeIn">
            <div className="pb-6 border-b border-slate-100">
               <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><Globe size={24} className="text-blue-600"/> White-Label Configuration</h2>
               <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Modify Portal Branding & AI Identity</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">App Name</label><input value={tempSettings.appName} onChange={e => setTempSettings({...tempSettings, appName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" /></div>
               <div className="space-y-1"><label className="text-[9px] font-bold text-slate-500 uppercase">AI Bot Name</label><input value={tempSettings.botName} onChange={e => setTempSettings({...tempSettings, botName: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" /></div>
            </div>
            <button onClick={handleSaveSettings} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-2xl transition-all">Apply All Changes</button>
          </div>
        )}

        {activeTab === 'users' && (
           <div className="space-y-8 animate-fadeIn">
              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Registered Students..." 
                  className="w-full pl-16 pr-6 py-5 bg-slate-50 border border-slate-100 rounded-[2rem] font-black text-xs uppercase"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredStudents.map(student => (
                    <div key={student.id} className="p-6 bg-white border border-slate-100 rounded-3xl flex items-center gap-5">
                       <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black">{student.name?.charAt(0) || '?'}</div>
                       <div>
                          <p className="font-black text-slate-900 uppercase tracking-tight truncate max-w-[150px]">{student.name || 'Unknown Student'}</p>
                          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{student.email}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-fadeIn">
           <div className="bg-white w-full max-w-6xl h-[95vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              <div className="p-10 border-b border-slate-100 flex justify-between items-center bg-white">
                 <div><h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Curriculum Studio</h2><p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-1">Manage Lessons, Subjects and Monetization</p></div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"><X size={28}/></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-[#F9FBFF]">
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <div className="lg:col-span-4 space-y-8">
                       <div className="bg-white p-8 border border-slate-200 rounded-[2.5rem] space-y-6 shadow-sm">
                          <h3 className="font-black text-slate-900 text-[11px] uppercase tracking-[0.2em] border-b border-slate-100 pb-3">Batch Branding</h3>
                          <div className="aspect-video bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer overflow-hidden group" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? <img alt="Preview" src={currentBatch.image} className="w-full h-full object-cover" /> : <div className="text-center p-6"><Upload size={32} className="text-slate-300 mx-auto mb-3"/><p className="text-[9px] font-black uppercase text-slate-400">Upload Banner</p></div>}
                             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { const r = new FileReader(); r.onloadend = () => setCurrentBatch({...currentBatch, image: r.result as string}); r.readAsDataURL(f); } }} />
                          </div>
                          <div className="space-y-4">
                             <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Batch Title</label><input value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" /></div>
                             <div className="space-y-1"><label className="text-[9px] font-black uppercase text-slate-400">Access Price (₹)</label><input type="number" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" /></div>
                          </div>
                       </div>
                    </div>
                    <div className="lg:col-span-8 space-y-8">
                       <div className="flex items-center justify-between"><h3 className="font-black text-xl text-slate-900 uppercase italic">Modules & Subjects</h3><button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl transition-all">+ Add Subject</button></div>
                       <div className="space-y-6">
                          {currentBatch.subjects?.map((sub) => (
                             <div key={sub.id} className="bg-white border border-slate-200 rounded-[2.5rem] p-8 shadow-sm">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                   <div className="flex items-center gap-4 flex-1"><Layers className="text-blue-600"/><input value={sub.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, title: e.target.value} : s)})} className="bg-transparent font-black text-slate-900 outline-none w-full text-lg uppercase tracking-tight" /></div>
                                   <button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== sub.id)})} className="text-red-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                                </div>
                                <div className="space-y-4">
                                   {sub.chapters.map(chap => (
                                      <div key={chap.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                         <div className="flex justify-between items-center mb-6"><div className="flex items-center gap-3 flex-1"><Folder size={18} className="text-slate-400"/><input value={chap.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, title: e.target.value} : c)} : s)})} className="bg-transparent font-black text-slate-700 outline-none w-full text-[11px] uppercase" /></div><button onClick={() => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.filter(c => c.id !== chap.id)} : s)})} className="text-slate-300 hover:text-red-500"><X size={18}/></button></div>
                                         <div className="space-y-3">
                                            {chap.lectures.map(lec => (
                                               <div key={lec.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                                                  <input value={lec.title} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, title: e.target.value} : l)} : c)} : s)})} className="w-full bg-transparent font-bold text-[10px] uppercase outline-none" placeholder="Lesson Name" />
                                                  <input value={lec.videoUrl} onChange={e => setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: c.lectures.map(l => l.id === lec.id ? {...l, videoUrl: e.target.value} : l)} : c)} : s)})} className="w-full bg-slate-50 px-3 py-2 rounded-lg text-[9px] font-mono outline-none" placeholder="Video URL" />
                                               </div>
                                            ))}
                                            <button onClick={() => { const newLec: Lecture = { id: `lec-${Date.now()}`, title: 'New Lesson', videoUrl: '', duration: 'Live', description: '', resources: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: s.chapters.map(c => c.id === chap.id ? {...c, lectures: [...c.lectures, newLec]} : c)} : s)}); }} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[8px] font-black uppercase text-slate-400 hover:text-blue-600">+ Add Lesson</button>
                                         </div>
                                      </div>
                                   ))}
                                   <button onClick={() => { const newCh: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] }; setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.map(s => s.id === sub.id ? {...s, chapters: [...s.chapters, newCh]} : s)}); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg">+ New Chapter</button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-10 border-t border-slate-100 bg-white flex justify-end gap-6 shadow-2xl">
                 <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 font-black text-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest text-[10px]">Cancel</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-16 py-5 bg-blue-600 text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/30">
                    {saveStatus === 'saving' ? <Loader2 className="animate-spin" size={20}/> : 'Publish Batch Live'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
