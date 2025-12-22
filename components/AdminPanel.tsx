import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, Layers, 
  Video as VideoIcon, Upload, Image as ImageIcon, Link as LinkIcon,
  RefreshCw, Check, Youtube, User as UserIcon, Shield, UserPlus, Settings, Globe, Key, Info, Zap, LayoutDashboard, ChevronDown, Users, Search, Code, CheckCircle, Database, FileText, Download
} from 'lucide-react';
import { Course, Chapter, Video, StaffMember, SiteSettings, Resource } from '../types';

interface AdminPanelProps {
  userRole: 'student' | 'admin' | 'manager';
  courses: Course[];
  setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
  onClose: () => void;
  siteSettings: SiteSettings;
  setSiteSettings: (settings: SiteSettings) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ userRole, courses, setCourses, onClose, siteSettings, setSiteSettings }) => {
  const [activeTab, setActiveTab] = useState<'batches' | 'staff' | 'config' | 'students'>('batches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resourceInputRef = useRef<HTMLInputElement>(null);
  const [activeChapterForResource, setActiveChapterForResource] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'manager' as 'manager' | 'admin' });
  const [tempSettings, setTempSettings] = useState<SiteSettings>(siteSettings);

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
    chapters: [],
    shortLink: '',
    accessCode: 'STUDY-' + Math.floor(100000 + Math.random() * 900000)
  };

  const [currentBatch, setCurrentBatch] = useState<Course>(emptyBatch);

  useEffect(() => {
    const savedStaff = localStorage.getItem('study_portal_staff');
    if (savedStaff) {
      setStaff(JSON.parse(savedStaff));
    } else {
      const initialStaff: StaffMember[] = [
        { id: 's1', name: 'Primary Admin', email: 'r29878448@gmail.com', role: 'admin', joinedAt: new Date().toLocaleDateString() }
      ];
      setStaff(initialStaff);
      localStorage.setItem('study_portal_staff', JSON.stringify(initialStaff));
    }
  }, []);

  const getCleanId = (input: string) => {
    if (!input || typeof input !== 'string') return '';
    let str = input.trim();
    if (str.includes('<') && str.includes('>')) {
       const srcMatch = str.match(/src=["'](.*?)["']/);
       if (srcMatch && srcMatch[1]) str = srcMatch[1];
    }
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = str.match(regex);
    if (match && match[1]) return match[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    return ''; 
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email) return;
    const staffMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      joinedAt: new Date().toLocaleDateString()
    };
    const updatedStaff = [...staff, staffMember];
    setStaff(updatedStaff);
    localStorage.setItem('study_portal_staff', JSON.stringify(updatedStaff));
    setNewStaff({ name: '', email: '', role: 'manager' });
  };

  const handleRemoveStaff = (id: string) => {
    const updatedStaff = staff.filter(s => s.id !== id);
    setStaff(updatedStaff);
    localStorage.setItem('study_portal_staff', JSON.stringify(updatedStaff));
  };

  const handleSaveBatch = () => {
    if (!currentBatch.title.trim()) return alert("Batch title is required.");
    setSaveStatus('saving');
    setTimeout(() => {
      try {
        let updatedCourses: Course[];
        if (editingId) {
          updatedCourses = courses.map(c => c.id === editingId ? { ...currentBatch, id: editingId } : c);
        } else {
          updatedCourses = [...courses, { ...currentBatch, id: `batch-${Date.now()}` }];
        }
        setCourses(updatedCourses);
        localStorage.setItem('study_portal_courses', JSON.stringify(updatedCourses));
        setSaveStatus('success');
        setTimeout(() => {
          setIsModalOpen(false);
          setSaveStatus('idle');
          setEditingId(null);
        }, 800);
      } catch (e) { setSaveStatus('error'); }
    }, 600);
  };
  
  const handleSaveSettings = () => {
    setSiteSettings(tempSettings);
    alert("Premium Access settings updated successfully!");
  };

  const handleUploadResource = (chapterId: string) => {
    setActiveChapterForResource(chapterId);
    resourceInputRef.current?.click();
  };

  const onResourceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeChapterForResource) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newResource: Resource = {
        id: `res-${Date.now()}`,
        title: file.name,
        url: reader.result as string,
        type: file.type.includes('pdf') ? 'pdf' : 'link'
      };

      const updatedChapters = currentBatch.chapters.map(ch => {
        if (ch.id === activeChapterForResource) {
          return { ...ch, notes: [...(ch.notes || []), newResource] };
        }
        return ch;
      });

      setCurrentBatch({ ...currentBatch, chapters: updatedChapters });
      setActiveChapterForResource(null);
    };
    reader.readAsDataURL(file);
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8 animate-fadeIn pb-20 text-left">
      <input type="file" ref={resourceInputRef} className="hidden" accept=".pdf" onChange={onResourceFileSelect} />
      
      {/* Header */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center text-white shadow-xl ${isAdmin ? 'bg-slate-900' : 'bg-blue-600'}`}>
            <LayoutDashboard size={24} className="md:w-7 md:h-7" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
              {isAdmin ? 'Academic Administration' : 'Manager Dashboard'}
            </h1>
            <p className="text-slate-500 text-xs md:text-sm font-bold flex items-center gap-2">
              <Shield size={14} className={isAdmin ? "text-amber-500" : "text-blue-500"} /> 
              {userRole.toUpperCase()} Control Center
            </p>
          </div>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start md:self-center overflow-x-auto max-w-full">
          <button onClick={() => setActiveTab('batches')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Batches</button>
          <button onClick={() => setActiveTab('students')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${activeTab === 'students' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Students</button>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('staff')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Faculty</button>
              <button onClick={() => setActiveTab('config')} className={`px-4 md:px-6 py-2 md:py-2.5 rounded-xl text-xs md:text-sm font-black transition-all whitespace-nowrap ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Config</button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Batch Catalog</h2>
            <button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-blue-500 shadow-xl shadow-blue-500/20 active:scale-95">
              <Plus size={18} /> Create Batch
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map(course => (
              <div key={course.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden">
                <div className="relative aspect-[16/10] mb-6 rounded-2xl overflow-hidden">
                  <img src={course.image} className="w-full h-full object-cover group-hover:scale-105 transition-all" />
                </div>
                <h3 className="font-black text-slate-900 text-lg mb-4 truncate">{course.title}</h3>
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-xs font-mono font-black text-slate-400">ID: {course.accessCode}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                    <button onClick={() => setCourses(courses.filter(c => c.id !== course.id))} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
             <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Batch Curriculum Editor</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={24}/></button>
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar bg-white">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Title</label>
                      <input type="text" value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-blue-500 transition-all" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <input type="number" placeholder="Price" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold" />
                       <input type="text" placeholder="Access Code" value={currentBatch.accessCode} onChange={e => setCurrentBatch({...currentBatch, accessCode: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl font-black text-center tracking-widest text-blue-700" />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest block mb-2">Cover Image</label>
                    <div className="aspect-video bg-slate-50 rounded-[2.5rem] overflow-hidden relative group border-2 border-dashed border-slate-200 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                       {currentBatch.image ? <img src={currentBatch.image} className="w-full h-full object-cover" /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-400"><Upload size={40} /><p className="text-[10px] font-black mt-2">UPLOAD COVER</p></div>}
                       <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if (file) {
                           const reader = new FileReader();
                           reader.onloadend = () => setCurrentBatch({...currentBatch, image: reader.result as string});
                           reader.readAsDataURL(file);
                         }
                       }} />
                    </div>
                 </div>
               </div>

               <div className="pt-10 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-slate-900">Academic Structure</h3>
                    <button onClick={() => setCurrentBatch({...currentBatch, chapters: [...currentBatch.chapters, { id: `ch-${Date.now()}`, title: 'New Module', videos: [], notes: [] }]})} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center gap-2"><Plus size={16} /> Add Module</button>
                  </div>
                  <div className="space-y-8">
                    {currentBatch.chapters.map((ch, chIdx) => (
                      <div key={ch.id} className="p-8 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] space-y-8">
                         <div className="flex justify-between items-center">
                           <input type="text" value={ch.title} onChange={e => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === ch.id ? {...c, title: e.target.value} : c)})} className="bg-white border-2 border-slate-200 px-5 py-3 rounded-xl font-black text-base text-slate-900 outline-none focus:border-blue-500 w-2/3" />
                           <button onClick={() => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.filter(c => c.id !== ch.id)})} className="text-red-400 p-3 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                         </div>
                         
                         {/* Lectures Section */}
                         <div className="space-y-4">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lectures</h4>
                           {ch.videos.map(v => (
                             <div key={v.id} className="flex gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200 items-center">
                               <input type="text" placeholder="Title" value={v.title} onChange={e => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: c.videos.map(vid => vid.id === v.id ? {...vid, title: e.target.value} : vid)} : c)})} className="flex-1 font-bold text-sm outline-none" />
                               <input type="text" placeholder="YT Link / ID" value={v.youtubeId} onChange={e => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: c.videos.map(vid => vid.id === v.id ? {...vid, youtubeId: e.target.value} : vid)} : c)})} className="w-64 font-mono text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:border-blue-300" />
                               <button onClick={() => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: c.videos.filter(vid => vid.id !== v.id)} : c)})} className="p-2 text-red-300 hover:text-red-500"><X size={18}/></button>
                             </div>
                           ))}
                           <button onClick={() => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: [...c.videos, { id: `v-${Date.now()}`, title: '', youtubeId: '', duration: '00:00', thumbnail: '', description: '' }]} : c)})} className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 font-bold text-xs uppercase hover:border-blue-400 hover:text-blue-500 transition-all">+ Add Lecture</button>
                         </div>

                         {/* Notes/Resources Section */}
                         <div className="space-y-4 border-t border-slate-200 pt-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes & Study Material</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {(ch.notes || []).map(note => (
                               <div key={note.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl">
                                  <div className="flex items-center gap-3">
                                    <FileText className="text-blue-600" size={16} />
                                    <span className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{note.title}</span>
                                  </div>
                                  <button onClick={() => {
                                     const updated = currentBatch.chapters.map(c => c.id === ch.id ? {...c, notes: c.notes?.filter(n => n.id !== note.id)} : c);
                                     setCurrentBatch({...currentBatch, chapters: updated});
                                  }} className="text-red-300 hover:text-red-500"><Trash2 size={14} /></button>
                               </div>
                             ))}
                             <button onClick={() => handleUploadResource(ch.id)} className="flex items-center justify-center gap-2 p-3 bg-white border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                               <Plus size={16} /> Upload Notes (PDF)
                             </button>
                           </div>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             </div>

             <div className="p-8 border-t border-slate-100 bg-slate-50 flex gap-4">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-400 uppercase tracking-widest text-xs">Cancel</button>
               <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className={`flex-[2] py-4 rounded-2xl font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 ${saveStatus === 'success' ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-500'}`}>
                 {saveStatus === 'idle' ? 'DEPLOY CHANGES' : saveStatus === 'saving' ? <RefreshCw className="animate-spin" /> : <Check />}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;