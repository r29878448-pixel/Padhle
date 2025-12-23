import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, 
  Video as VideoIcon, Upload, 
  RefreshCw, Check, User as UserIcon, Shield, UserPlus, Globe, Key, Save, LayoutDashboard, ChevronDown, ChevronUp, FileText, Youtube, Image, Lock
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
  const [activeTab, setActiveTab] = useState<'batches' | 'staff' | 'config'>('batches');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  // Accordion state for chapters
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resourceInputRef = useRef<HTMLInputElement>(null);
  const [activeChapterForResource, setActiveChapterForResource] = useState<string | null>(null);

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '', role: 'manager' as 'manager' | 'admin' });
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

  // Helper to extract YouTube ID from a full link
  const extractYoutubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return alert("Please fill all fields including password.");
    
    // Normalize email to lowercase to prevent login issues
    const normalizedEmail = newStaff.email.trim().toLowerCase();
    
    // Check for duplicate
    if (staff.some(s => s.email === normalizedEmail)) {
        alert("This email is already registered.");
        return;
    }

    const staffMember: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaff.name,
      email: normalizedEmail,
      password: newStaff.password,
      role: newStaff.role,
      joinedAt: new Date().toLocaleDateString()
    };
    const updatedStaff = [...staff, staffMember];
    setStaff(updatedStaff);
    localStorage.setItem('study_portal_staff', JSON.stringify(updatedStaff));
    setNewStaff({ name: '', email: '', password: '', role: 'manager' });
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
    alert("Configuration saved successfully!");
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
    <div className="space-y-6 animate-fadeIn pb-20 text-left font-sans">
      <input type="file" ref={resourceInputRef} className="hidden" accept=".pdf" onChange={onResourceFileSelect} />
      
      {/* Top Header */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg">
             <LayoutDashboard size={24} />
           </div>
           <div>
             <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
             <p className="text-slate-500 text-sm font-medium">Manage Content & Settings</p>
           </div>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl">
           <button onClick={() => setActiveTab('batches')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'batches' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Batches</button>
           {isAdmin && (
             <>
               <button onClick={() => setActiveTab('staff')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Faculty</button>
               <button onClick={() => setActiveTab('config')} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'config' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}>Settings</button>
             </>
           )}
        </div>
      </div>

      {/* BATCHES TAB */}
      {activeTab === 'batches' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-2">
             <h2 className="text-lg font-black text-slate-800">Active Batches</h2>
             <button onClick={() => { setCurrentBatch(emptyBatch); setEditingId(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-500/30">
               <Plus size={18} /> New Batch
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {courses.map(course => (
               <div key={course.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-all group">
                  <div className="aspect-video rounded-xl overflow-hidden mb-4 relative">
                    <img src={course.image} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                       {course.chapters.length} Modules
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{course.title}</h3>
                  <p className="text-slate-400 text-xs font-medium mb-4">{course.category} • ₹{course.price}</p>
                  
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-50 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={() => setCourses(courses.filter(c => c.id !== course.id))} className="w-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all">
                      <Trash2 size={18} />
                    </button>
                  </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* FACULTY TAB */}
      {activeTab === 'staff' && isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-1 bg-white p-8 rounded-[2.5rem] border border-slate-100 h-fit">
              <h3 className="font-black text-slate-900 text-lg mb-6 flex items-center gap-2"><UserPlus size={20} className="text-blue-600"/> Add Staff</h3>
              <div className="space-y-4">
                 <input type="text" placeholder="Full Name" value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" />
                 <input type="email" placeholder="Email Address" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" />
                 <input type="text" placeholder="Set Password" value={newStaff.password} onChange={e => setNewStaff({...newStaff, password: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-blue-500" />
                 
                 <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                    {['manager', 'admin'].map(role => (
                      <button key={role} onClick={() => setNewStaff({...newStaff, role: role as any})} className={`flex-1 py-2 rounded-lg text-xs font-black uppercase transition-all ${newStaff.role === role ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>
                        {role}
                      </button>
                    ))}
                 </div>
                 <button onClick={handleAddStaff} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold text-sm hover:bg-slate-800">Add Member</button>
              </div>
           </div>

           <div className="lg:col-span-2 space-y-4">
              {staff.map(member => (
                <div key={member.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">{member.name[0]}</div>
                      <div>
                        <h4 className="font-bold text-slate-900">{member.name}</h4>
                        <p className="text-xs text-slate-400">{member.email} • <span className="uppercase text-blue-500 font-black">{member.role}</span></p>
                      </div>
                   </div>
                   {member.email !== 'r29878448@gmail.com' && (
                     <button onClick={() => handleRemoveStaff(member.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all"><Trash2 size={18}/></button>
                   )}
                </div>
              ))}
           </div>
        </div>
      )}

      {/* CONFIG TAB */}
      {activeTab === 'config' && isAdmin && (
         <div className="max-w-xl mx-auto bg-white p-8 rounded-[2.5rem] border border-slate-100">
            <div className="text-center mb-8">
               <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4"><Key size={32}/></div>
               <h3 className="font-black text-slate-900 text-xl">Monetization Settings</h3>
               <p className="text-slate-500 text-sm">Configure URL Shortener for Premium Access</p>
            </div>

            <div className="space-y-5">
               <div>
                 <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">API Endpoint</label>
                 <input type="text" value={tempSettings.shortenerUrl} onChange={e => setTempSettings({...tempSettings, shortenerUrl: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500" placeholder="https://vplink.in/api" />
               </div>
               <div>
                 <label className="text-xs font-bold text-slate-500 ml-1 mb-1 block">Publisher API Key</label>
                 <input type="text" value={tempSettings.shortenerApiKey} onChange={e => setTempSettings({...tempSettings, shortenerApiKey: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-blue-500 font-mono" placeholder="Paste your API key here" />
               </div>
               <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                 <Save size={18} /> Save Settings
               </button>
            </div>
         </div>
      )}

      {/* BATCH EDITOR MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
           <div className="bg-white w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
                 <h2 className="text-xl font-black text-slate-900">
                    {editingId ? 'Edit Batch' : 'Create New Batch'}
                 </h2>
                 <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Left Column: Details */}
                    <div className="md:col-span-1 space-y-6">
                       <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-4">
                          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><Image size={16}/> Cover Image</h3>
                          <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden relative group cursor-pointer border-2 border-dashed border-slate-200" onClick={() => fileInputRef.current?.click()}>
                             {currentBatch.image ? (
                               <img src={currentBatch.image} className="w-full h-full object-cover" />
                             ) : (
                               <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                 <Upload size={24} />
                                 <span className="text-[10px] font-bold mt-2">Upload</span>
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

                       <div className="bg-white p-5 rounded-[2rem] border border-slate-100 space-y-4">
                          <h3 className="font-bold text-slate-900 text-sm">Batch Info</h3>
                          <input type="text" placeholder="Batch Title" value={currentBatch.title} onChange={e => setCurrentBatch({...currentBatch, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500" />
                          <input type="number" placeholder="Price (₹)" value={currentBatch.price} onChange={e => setCurrentBatch({...currentBatch, price: Number(e.target.value)})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500" />
                          <input type="text" placeholder="Category (e.g., Class 10)" value={currentBatch.category} onChange={e => setCurrentBatch({...currentBatch, category: e.target.value})} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-blue-500" />
                       </div>
                    </div>

                    {/* Right Column: Curriculum */}
                    <div className="md:col-span-2 space-y-6">
                       <div className="flex items-center justify-between">
                          <h3 className="font-black text-slate-900">Curriculum</h3>
                          <button onClick={() => setCurrentBatch({...currentBatch, chapters: [...currentBatch.chapters, { id: `ch-${Date.now()}`, title: 'New Module', videos: [], notes: [] }]})} className="text-blue-600 text-xs font-black uppercase hover:underline flex items-center gap-1">
                            <Plus size={14}/> Add Module
                          </button>
                       </div>

                       <div className="space-y-4">
                          {currentBatch.chapters.map((chapter, index) => (
                             <div key={chapter.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden transition-all">
                                {/* Chapter Header */}
                                <div className="p-4 flex items-center justify-between bg-slate-50 cursor-pointer" onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}>
                                   <div className="flex items-center gap-3 flex-1">
                                      <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold">{index + 1}</span>
                                      <input 
                                        type="text" 
                                        value={chapter.title} 
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setCurrentBatch({
                                          ...currentBatch, 
                                          chapters: currentBatch.chapters.map(c => c.id === chapter.id ? {...c, title: e.target.value} : c)
                                        })}
                                        className="bg-transparent font-bold text-slate-700 outline-none w-full"
                                        placeholder="Module Name"
                                      />
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.filter(c => c.id !== chapter.id)}); }} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                      {expandedChapter === chapter.id ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                                   </div>
                                </div>

                                {/* Chapter Body (Videos & Notes) */}
                                {expandedChapter === chapter.id && (
                                   <div className="p-4 space-y-6 border-t border-slate-100">
                                      {/* Videos */}
                                      <div className="space-y-3">
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Videos</p>
                                         {chapter.videos.map(video => (
                                           <div key={video.id} className="flex gap-3 items-center">
                                              <div className="w-8 h-8 bg-red-50 text-red-500 rounded-lg flex items-center justify-center shrink-0"><Youtube size={16}/></div>
                                              <input 
                                                type="text" 
                                                placeholder="Video Title" 
                                                value={video.title} 
                                                onChange={e => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === chapter.id ? {...c, videos: c.videos.map(v => v.id === video.id ? {...v, title: e.target.value} : v)} : c)})}
                                                className="flex-1 text-sm font-bold bg-slate-50 px-3 py-2 rounded-lg outline-none" 
                                              />
                                              <input 
                                                type="text" 
                                                placeholder="YouTube Link" 
                                                value={video.youtubeId} 
                                                onChange={e => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === chapter.id ? {...c, videos: c.videos.map(v => v.id === video.id ? {...v, youtubeId: e.target.value} : v)} : c)})}
                                                onBlur={(e) => {
                                                   // Auto-extract ID on blur
                                                   const cleanId = extractYoutubeId(e.target.value);
                                                   if (cleanId !== e.target.value) {
                                                     setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === chapter.id ? {...c, videos: c.videos.map(v => v.id === video.id ? {...v, youtubeId: cleanId} : v)} : c)});
                                                   }
                                                }}
                                                className="w-1/3 text-xs font-mono bg-slate-50 px-3 py-2 rounded-lg outline-none text-slate-500" 
                                              />
                                              <button onClick={() => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === chapter.id ? {...c, videos: c.videos.filter(v => v.id !== video.id)} : c)})} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                                           </div>
                                         ))}
                                         <button onClick={() => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === chapter.id ? {...c, videos: [...c.videos, { id: `v-${Date.now()}`, title: '', youtubeId: '', duration: '00:00', thumbnail: '', description: '' }]} : c)})} className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-lg transition-all">+ Add Video</button>
                                      </div>

                                      {/* Notes */}
                                      <div className="space-y-3 pt-4 border-t border-slate-100">
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes (PDF)</p>
                                         {chapter.notes?.map(note => (
                                            <div key={note.id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                                               <span className="text-xs font-bold text-slate-700 flex items-center gap-2"><FileText size={14} className="text-blue-500"/> {note.title}</span>
                                               <button onClick={() => setCurrentBatch({...currentBatch, chapters: currentBatch.chapters.map(c => c.id === chapter.id ? {...c, notes: c.notes?.filter(n => n.id !== note.id)} : c)})} className="text-slate-400 hover:text-red-500"><X size={14}/></button>
                                            </div>
                                         ))}
                                         <button onClick={() => handleUploadResource(chapter.id)} className="text-xs font-bold text-slate-500 hover:text-blue-600 border border-dashed border-slate-300 px-3 py-2 rounded-lg w-full">Upload PDF</button>
                                      </div>
                                   </div>
                                )}
                             </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-white flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-all">Cancel</button>
                 <button onClick={handleSaveBatch} disabled={saveStatus !== 'idle'} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
                    {saveStatus === 'saving' ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18}/>}
                    {saveStatus === 'success' ? 'Saved!' : 'Save Batch'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;