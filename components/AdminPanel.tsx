import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, Layers, 
  Video as VideoIcon, Upload, Image as ImageIcon, Link as LinkIcon,
  RefreshCw, Check, Youtube, User as UserIcon, Shield, UserPlus, Settings, Globe, Key, Info, Zap, LayoutDashboard, ChevronDown, Users, Search, Code, CheckCircle, Database
} from 'lucide-react';
import { Course, Chapter, Video, StaffMember, SiteSettings } from '../types';

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
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', role: 'manager' as 'manager' | 'admin' });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Settings state
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

  // Robust ID Extractor (Matches VideoPlayer)
  const getCleanId = (input: string) => {
    if (!input || typeof input !== 'string') return '';
    let str = input.trim();

    // 1. Handle HTML Embed Codes
    if (str.includes('<') && str.includes('>')) {
       const srcMatch = str.match(/src=["'](.*?)["']/);
       if (srcMatch && srcMatch[1]) {
         str = srcMatch[1];
       }
    }

    // 2. Comprehensive Regex
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = str.match(regex);
    if (match && match[1]) return match[1];

    // 3. Fallback: Raw 11-char ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
        return str;
    }

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

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-8 animate-fadeIn pb-20 text-left">
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

      {/* Batches Tab */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2 md:px-4">
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Batch Catalog</h2>
            <button 
              onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }}
              className="bg-blue-600 text-white px-4 md:px-8 py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm flex items-center gap-3 hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              <Plus size={18} /> Create Batch
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <Layers className="mx-auto text-slate-200 mb-4" size={56} />
                <p className="text-slate-400 font-bold">No academic batches deployed yet.</p>
              </div>
            ) : (
              courses.map(course => (
                <div key={course.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden text-left">
                  <div className="relative aspect-[16/10] mb-6 rounded-2xl overflow-hidden">
                    <img src={course.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-4 left-4 px-3 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm">{course.category}</div>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mb-4 truncate" title={course.title}>{course.title}</h3>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600 font-black text-[10px] uppercase">KEY</div>
                      <span className="text-xs font-mono font-black text-slate-400">{course.accessCode}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"><Edit2 size={18} /></button>
                      <button onClick={() => { if(window.confirm('Permanent delete?')) setCourses(courses.filter(c => c.id !== course.id)) }} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 animate-fadeIn min-h-[400px]">
           <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-black text-slate-900">Enrolled Students</h2>
             <div className="relative opacity-50 pointer-events-none">
               <input 
                 type="text" 
                 placeholder="Search student..." 
                 disabled
                 className="pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-100 outline-none w-64"
               />
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             </div>
           </div>
           
           <div className="flex flex-col items-center justify-center py-20 text-center">
             <div className="w-20 h-20 bg-slate-50 rounded-[2.5rem] flex items-center justify-center text-slate-300 mb-6">
                <Database size={40} />
             </div>
             <h3 className="text-lg font-black text-slate-900 mb-2">No active enrollments</h3>
             <p className="text-slate-400 text-sm font-medium max-w-sm">
               Student records will appear here once users begin enrolling in your published batches.
             </p>
           </div>
        </div>
      )}

      {/* Staff Tab */}
      {activeTab === 'staff' && isAdmin && (
        <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 animate-fadeIn">
          <h2 className="text-2xl font-black text-slate-900 mb-8 md:mb-10">Faculty Management</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="p-6 md:p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 group">
               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors shadow-sm">
                 <UserPlus size={28} />
               </div>
               <div className="text-center space-y-4 w-full">
                 <input 
                   type="text" placeholder="Faculty Name" 
                   value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})}
                   className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm text-center text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                 />
                 <input 
                   type="email" placeholder="Email Address" 
                   value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})}
                   className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl font-bold text-sm text-center text-slate-900 placeholder:text-slate-400 outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500"
                 />
                 <button onClick={handleAddStaff} className="w-full bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Onboard Faculty</button>
               </div>
            </div>

            {staff.map(member => (
              <div key={member.id} className="p-6 md:p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm flex flex-col items-center text-center">
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-3xl flex items-center justify-center mb-4 ${member.role === 'admin' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                   {member.role === 'admin' ? <Shield size={32} /> : <UserIcon size={32} />}
                </div>
                <h3 className="font-black text-slate-900 text-lg truncate w-full">{member.name}</h3>
                <p className="text-xs text-slate-400 font-bold mb-6 tracking-tight truncate w-full">{member.email}</p>
                <div className="flex items-center gap-3 w-full">
                   <div className="flex-1 px-4 py-2 bg-slate-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 border border-slate-100 truncate">{member.role}</div>
                   {member.email !== 'r29878448@gmail.com' && (
                     <button onClick={() => handleRemoveStaff(member.id)} className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                   )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config Tab (Premium Access) */}
      {activeTab === 'config' && isAdmin && (
        <div className="bg-white p-6 md:p-10 rounded-[3rem] border border-slate-100 animate-fadeIn">
           <div className="flex items-center gap-4 mb-8">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Zap size={24} />
             </div>
             <div>
                <h2 className="text-2xl font-black text-slate-900">Premium Access Configuration</h2>
                <p className="text-sm text-slate-500 font-medium">Monetization and link shortener settings.</p>
             </div>
           </div>

           <div className="max-w-2xl space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">Link Shortener API URL</label>
                 <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={tempSettings.shortenerUrl}
                      onChange={e => setTempSettings({...tempSettings, shortenerUrl: e.target.value})}
                      placeholder="https://gplinks.in/api"
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-500"
                    />
                 </div>
                 <p className="text-[10px] text-slate-400 px-1">Endpoint used to generate secure access links. Default supports GPLinks style APIs.</p>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1">API Token / Key</label>
                 <div className="relative">
                    <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      value={tempSettings.shortenerApiKey}
                      onChange={e => setTempSettings({...tempSettings, shortenerApiKey: e.target.value})}
                      placeholder="e.g. 5d5a7d..."
                      className="w-full pl-10 pr-4 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-indigo-500"
                    />
                 </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={handleSaveSettings}
                  className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl"
                >
                  Save Configuration
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20 text-left">
             <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Edit2 size={20} />
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Curriculum Editor</h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400"><X size={24}/></button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar bg-white">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10">
                 <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block mb-2">Basic Asset Information</label>
                      <input 
                        type="text" 
                        placeholder="Batch Title (e.g. Physics Crash Course)" 
                        value={currentBatch.title} 
                        onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} 
                        className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400" 
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1">Fee (INR)</label>
                          <input type="number" placeholder="0" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-900 outline-none focus:border-blue-500" />
                       </div>
                       <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-1 text-blue-600">Access Key</label>
                          <input type="text" placeholder="KEY-123" value={currentBatch.accessCode} onChange={e => setCurrentBatch({...currentBatch, accessCode: e.target.value.toUpperCase()})} className="w-full px-6 py-4 bg-blue-50 border-2 border-blue-200 text-blue-700 rounded-2xl font-black text-center tracking-widest outline-none focus:bg-white focus:border-blue-400" />
                       </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block mb-2">Academic Description</label>
                      <textarea 
                        placeholder="Provide detailed breakdown of modules, schedules, and learning objectives..." 
                        value={currentBatch.description} 
                        onChange={e => setCurrentBatch({...currentBatch, description: e.target.value})} 
                        className="w-full px-6 py-5 bg-white border-2 border-slate-200 rounded-2xl font-medium min-h-[140px] outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400 resize-y" 
                      />
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 block">Branding Visual</label>
                    <div className="aspect-video bg-white rounded-[2.5rem] overflow-hidden relative group border-2 border-dashed border-slate-200 cursor-pointer hover:border-blue-400 transition-colors" onClick={() => fileInputRef.current?.click()}>
                       {currentBatch.image ? (
                         <>
                           <img src={currentBatch.image} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-black uppercase text-slate-900">Change Image</span>
                           </div>
                         </>
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                            <Upload size={40} strokeWidth={1.5} />
                            <p className="text-[10px] font-black mt-3 uppercase tracking-widest text-slate-500">Select Cover (16:9)</p>
                         </div>
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
                 </div>
               </div>

               <div className="pt-10 border-t border-slate-100">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-black text-slate-900">Academic Structure</h3>
                      <p className="text-xs text-slate-600 font-bold uppercase tracking-tight">Modules & Lectures</p>
                    </div>
                    <button 
                      onClick={() => setCurrentBatch({...currentBatch, chapters: [...currentBatch.chapters, { id: `ch-${Date.now()}`, title: 'New Module', videos: [] }]})} 
                      className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Add Module
                    </button>
                  </div>
                  <div className="space-y-8">
                    {currentBatch.chapters.map((ch, chIdx) => (
                      <div key={ch.id} className="p-6 md:p-8 bg-slate-50 border-2 border-slate-200 rounded-[2.5rem] relative overflow-hidden">
                         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                           <div className="flex-1 w-full sm:w-auto flex items-center gap-3">
                              <span className="w-8 h-8 bg-white border-2 border-slate-200 text-slate-600 rounded-lg flex items-center justify-center font-black text-xs shrink-0">{chIdx + 1}</span>
                              <input 
                                type="text" 
                                value={ch.title} 
                                placeholder="Module Title (e.g. Unit 1: Kinematics)"
                                onChange={e => {
                                  const updated = currentBatch.chapters.map(c => c.id === ch.id ? {...c, title: e.target.value} : c);
                                  setCurrentBatch({...currentBatch, chapters: updated});
                                }} 
                                className="flex-1 bg-white border-2 border-slate-200 px-5 py-3 rounded-xl font-black text-base text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none" 
                              />
                           </div>
                           <button onClick={() => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.filter(c => c.id !== ch.id)})} className="text-red-400 p-3 hover:bg-red-50 rounded-xl transition-all self-end sm:self-center shrink-0"><Trash2 size={20}/></button>
                         </div>
                         <div className="grid gap-4">
                           {ch.videos.map((v, vIdx) => (
                             <div key={v.id} className="flex flex-col sm:flex-row gap-4 p-4 bg-white rounded-2xl border-2 border-slate-200 group/row items-center shadow-sm">
                               <div className="w-full sm:flex-1">
                                 <input 
                                   type="text" 
                                   value={v.title} 
                                   placeholder={`Lecture ${vIdx + 1} Title`} 
                                   onChange={e => {
                                     const updated = currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: c.videos.map(vid => vid.id === v.id ? {...vid, title: e.target.value} : vid)} : c);
                                     setCurrentBatch({...currentBatch, chapters: updated});
                                   }} 
                                   className="w-full font-bold text-sm bg-white px-4 py-2.5 rounded-xl text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-100 border-2 border-slate-100 focus:border-blue-200" 
                                 />
                               </div>
                               <div className="w-full sm:w-80 flex items-center gap-2 bg-white px-3 py-1 rounded-xl border-2 border-slate-200 focus-within:border-blue-400 transition-all">
                                 <Code size={16} className="text-slate-400 shrink-0" />
                                 <input 
                                   type="text" 
                                   value={v.youtubeId} 
                                   placeholder="Embed Code, Link, or ID..." 
                                   onChange={e => {
                                     const rawVal = e.target.value;
                                     // Store raw value to let user see what they paste
                                     const updated = currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: c.videos.map(vid => vid.id === v.id ? {...vid, youtubeId: rawVal} : vid)} : c);
                                     setCurrentBatch({...currentBatch, chapters: updated});
                                   }} 
                                   className="w-full font-mono text-xs text-slate-900 placeholder:text-slate-400 bg-transparent py-2 outline-none" 
                                 />
                               </div>
                               
                               {/* Valid/Invalid Indicator based on extraction check */}
                               <div className="shrink-0">
                                  {getCleanId(v.youtubeId) ? (
                                     <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center border border-green-100" title="Valid Link"><CheckCircle size={16}/></div>
                                  ) : v.youtubeId ? (
                                     <div className="w-8 h-8 rounded-lg bg-red-50 text-red-400 flex items-center justify-center border border-red-100" title="Invalid Format"><X size={16}/></div>
                                  ) : null}
                               </div>

                               <button onClick={() => {
                                 const updated = currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: c.videos.filter(vid => vid.id !== v.id)} : c);
                                 setCurrentBatch({...currentBatch, chapters: updated});
                               }} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"><X size={18}/></button>
                             </div>
                           ))}
                           <button onClick={() => {
                             const updated = currentBatch.chapters.map(c => c.id === ch.id ? {...c, videos: [...c.videos, { id: `v-${Date.now()}`, title: '', youtubeId: '', duration: '00:00', thumbnail: '', description: '' }]} : c);
                             setCurrentBatch({...currentBatch, chapters: updated});
                           }} className="w-full py-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-600 font-black text-[10px] uppercase tracking-widest hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/30 transition-all">Add lecture record</button>
                         </div>
                      </div>
                    ))}
                  </div>
               </div>
             </div>

             <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row gap-4 shrink-0">
               <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black text-slate-600 hover:text-slate-800 transition-colors uppercase tracking-widest text-xs">Discard Changes</button>
               <button 
                  onClick={handleSaveBatch} 
                  disabled={saveStatus !== 'idle'} 
                  className={`flex-[2] py-4 rounded-[1.5rem] font-black text-white shadow-xl transition-all flex items-center justify-center gap-3 ${saveStatus === 'success' ? 'bg-green-500' : 'bg-blue-600 hover:bg-blue-500 active:scale-[0.98]'}`}
               >
                 {saveStatus === 'idle' ? 'DEPLOY CURRICULUM' : saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={20}/> : <Check size={20}/>}
               </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;