import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Edit2, X, 
  Video as VideoIcon, Upload, 
  RefreshCw, Check, User as UserIcon, Shield, UserPlus, Globe, Key, Save, LayoutDashboard, ChevronDown, ChevronUp, FileText, Youtube, Image, Lock, Link as LinkIcon, Layers, Folder
} from 'lucide-react';
import { Course, Subject, Chapter, Lecture, StaffMember, SiteSettings, Resource } from '../types';
import { subscribeToStaff, addStaffToDB, removeStaffFromDB, saveCourseToDB, deleteCourseFromDB, saveSiteSettings } from '../services/db';

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

  // Accordion state
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Resource Upload Refs
  const resourceInputRef = useRef<HTMLInputElement>(null);
  const [targetLectureForResource, setTargetLectureForResource] = useState<{subjId: string, chapId: string, lecId: string} | null>(null);

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
    subjects: [], // Now using subjects
    shortLink: '',
    accessCode: 'STUDY-' + Math.floor(100000 + Math.random() * 900000)
  };

  const [currentBatch, setCurrentBatch] = useState<Course>(emptyBatch);

  useEffect(() => {
    const unsubscribe = subscribeToStaff((staffList) => {
      setStaff(staffList);
    });
    return () => unsubscribe();
  }, []);

  const extractYoutubeId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : url;
  };

  const handleAddStaff = async () => {
    if (!newStaff.name || !newStaff.email || !newStaff.password) return alert("Please fill all fields including password.");
    const normalizedEmail = newStaff.email.trim().toLowerCase();
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
    await addStaffToDB(staffMember);
    setNewStaff({ name: '', email: '', password: '', role: 'manager' });
  };

  const handleRemoveStaff = async (id: string) => {
    await removeStaffFromDB(id);
  };

  const handleSaveBatch = async () => {
    if (!currentBatch.title.trim()) return alert("Batch title is required.");
    setSaveStatus('saving');
    try {
      let courseToSave: Course = currentBatch;
      if (!editingId) {
         courseToSave = { ...currentBatch, id: `batch-${Date.now()}` };
      }
      await saveCourseToDB(courseToSave);
      setSaveStatus('success');
      setTimeout(() => {
        setIsModalOpen(false);
        setSaveStatus('idle');
        setEditingId(null);
      }, 800);
    } catch (e) { 
      console.error(e);
      setSaveStatus('error'); 
    }
  };
  
  const handleDeleteBatch = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this batch?")) {
      await deleteCourseFromDB(id);
    }
  }
  
  const handleSaveSettings = async () => {
    await saveSiteSettings(tempSettings);
    setSiteSettings(tempSettings);
    alert("Configuration saved successfully!");
  };

  // Resource Handling specific to Lecture
  const triggerResourceUpload = (subjId: string, chapId: string, lecId: string) => {
    setTargetLectureForResource({ subjId, chapId, lecId });
    resourceInputRef.current?.click();
  };

  const handleResourceFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetLectureForResource) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const newResource: Resource = {
        id: `res-${Date.now()}`,
        title: file.name,
        url: reader.result as string,
        type: 'pdf' // Only PDF upload for now via file input
      };
      
      addResourceToLecture(targetLectureForResource, newResource);
      setTargetLectureForResource(null);
    };
    reader.readAsDataURL(file);
  };

  const addResourceToLecture = (target: {subjId: string, chapId: string, lecId: string}, resource: Resource) => {
      const updatedSubjects = currentBatch.subjects.map(sub => {
          if (sub.id !== target.subjId) return sub;
          return {
              ...sub,
              chapters: sub.chapters.map(chap => {
                  if (chap.id !== target.chapId) return chap;
                  return {
                      ...chap,
                      lectures: chap.lectures.map(lec => {
                          if (lec.id !== target.lecId) return lec;
                          return { ...lec, resources: [...(lec.resources || []), resource] };
                      })
                  };
              })
          };
      });
      setCurrentBatch({ ...currentBatch, subjects: updatedSubjects });
  };

  const addLinkToLecture = (subjId: string, chapId: string, lecId: string) => {
      const newResource: Resource = { id: `res-${Date.now()}`, title: 'New Web Link', url: 'https://', type: 'link' };
      addResourceToLecture({ subjId, chapId, lecId }, newResource);
  };

  const removeResourceFromLecture = (subjId: string, chapId: string, lecId: string, resId: string) => {
     const updatedSubjects = currentBatch.subjects.map(sub => {
          if (sub.id !== subjId) return sub;
          return {
              ...sub,
              chapters: sub.chapters.map(chap => {
                  if (chap.id !== chapId) return chap;
                  return {
                      ...chap,
                      lectures: chap.lectures.map(lec => {
                          if (lec.id !== lecId) return lec;
                          return { ...lec, resources: lec.resources.filter(r => r.id !== resId) };
                      })
                  };
              })
          };
      });
      setCurrentBatch({ ...currentBatch, subjects: updatedSubjects });
  };

  const updateResourceDetails = (subjId: string, chapId: string, lecId: string, resId: string, field: 'title' | 'url', value: string) => {
      const updatedSubjects = currentBatch.subjects.map(sub => {
          if (sub.id !== subjId) return sub;
          return {
              ...sub,
              chapters: sub.chapters.map(chap => {
                  if (chap.id !== chapId) return chap;
                  return {
                      ...chap,
                      lectures: chap.lectures.map(lec => {
                          if (lec.id !== lecId) return lec;
                          return { 
                             ...lec, 
                             resources: lec.resources.map(r => r.id === resId ? { ...r, [field]: value } : r) 
                          };
                      })
                  };
              })
          };
      });
      setCurrentBatch({ ...currentBatch, subjects: updatedSubjects });
  };

  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6 animate-fadeIn pb-20 text-left font-sans">
      <input type="file" ref={resourceInputRef} className="hidden" accept=".pdf" onChange={handleResourceFileSelect} />
      
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
                       {course.subjects?.length || 0} Subjects
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1 truncate">{course.title}</h3>
                  <p className="text-slate-400 text-xs font-medium mb-4">{course.category} • ₹{course.price}</p>
                  
                  <div className="flex gap-2">
                    <button onClick={() => { setCurrentBatch(course); setEditingId(course.id); setIsModalOpen(true); }} className="flex-1 bg-slate-50 text-slate-600 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                      <Edit2 size={16} /> Edit
                    </button>
                    <button onClick={() => handleDeleteBatch(course.id)} className="w-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all">
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

                    {/* Right Column: Curriculum (Nested 3 Layers) */}
                    <div className="md:col-span-2 space-y-6">
                       <div className="flex items-center justify-between">
                          <h3 className="font-black text-slate-900">Curriculum Structure</h3>
                          <button onClick={() => setCurrentBatch({...currentBatch, subjects: [...(currentBatch.subjects || []), { id: `sub-${Date.now()}`, title: 'New Subject', chapters: [] }]})} className="text-blue-600 text-xs font-black uppercase hover:underline flex items-center gap-1">
                            <Plus size={14}/> Add Subject
                          </button>
                       </div>

                       <div className="space-y-4">
                          {currentBatch.subjects?.map((subject, sIdx) => (
                             <div key={subject.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                                {/* LEVEL 1: SUBJECT */}
                                <div className="p-4 flex items-center justify-between bg-white cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedSubject(expandedSubject === subject.id ? null : subject.id)}>
                                   <div className="flex items-center gap-3 flex-1">
                                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                                         <Layers size={16} />
                                      </div>
                                      <input 
                                        type="text" 
                                        value={subject.title} 
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => setCurrentBatch({
                                          ...currentBatch, 
                                          subjects: currentBatch.subjects.map(s => s.id === subject.id ? {...s, title: e.target.value} : s)
                                        })}
                                        className="bg-transparent font-black text-slate-800 outline-none w-full text-lg"
                                        placeholder="Subject Name (e.g. Physics)"
                                      />
                                   </div>
                                   <div className="flex items-center gap-2">
                                      <button onClick={(e) => { e.stopPropagation(); setCurrentBatch({...currentBatch, subjects: currentBatch.subjects.filter(s => s.id !== subject.id)}); }} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                                      {expandedSubject === subject.id ? <ChevronUp size={18} className="text-slate-400"/> : <ChevronDown size={18} className="text-slate-400"/>}
                                   </div>
                                </div>

                                {expandedSubject === subject.id && (
                                   <div className="bg-slate-50 p-4 border-t border-slate-100 space-y-4">
                                      <div className="flex justify-between items-center px-2">
                                         <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chapters</p>
                                         <button onClick={() => {
                                            const newChapter: Chapter = { id: `ch-${Date.now()}`, title: 'New Chapter', lectures: [] };
                                            setCurrentBatch({
                                               ...currentBatch,
                                               subjects: currentBatch.subjects.map(s => s.id === subject.id ? {...s, chapters: [...s.chapters, newChapter]} : s)
                                            });
                                         }} className="text-blue-600 text-[10px] font-bold flex items-center gap-1 hover:underline"><Plus size={12}/> Add Chapter</button>
                                      </div>

                                      {/* LEVEL 2: CHAPTERS */}
                                      {subject.chapters.map((chapter, cIdx) => (
                                         <div key={chapter.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                                            <div className="p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50" onClick={() => setExpandedChapter(expandedChapter === chapter.id ? null : chapter.id)}>
                                               <div className="flex items-center gap-3 flex-1">
                                                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">{cIdx + 1}</span>
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
                                                     className="bg-transparent font-bold text-slate-700 outline-none w-full text-sm"
                                                     placeholder="Chapter Name"
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
                                                  }} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 size={14}/></button>
                                                  {expandedChapter === chapter.id ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                                               </div>
                                            </div>

                                            {expandedChapter === chapter.id && (
                                               <div className="bg-slate-100/50 p-3 border-t border-slate-100 space-y-3">
                                                  {/* LEVEL 3: LECTURES */}
                                                  {chapter.lectures.map(lecture => (
                                                     <div key={lecture.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                                                        <div className="flex gap-3 items-start">
                                                            <div className="w-8 h-8 bg-red-50 text-red-600 rounded-lg flex items-center justify-center shrink-0"><Youtube size={16}/></div>
                                                            <div className="flex-1 space-y-2">
                                                               <input 
                                                                  type="text" 
                                                                  placeholder="Lecture Title"
                                                                  value={lecture.title}
                                                                  onChange={(e) => setCurrentBatch({
                                                                     ...currentBatch,
                                                                     subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                                        ...s,
                                                                        chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                                           ...c,
                                                                           lectures: c.lectures.map(l => l.id === lecture.id ? {...l, title: e.target.value} : l)
                                                                        } : c)
                                                                     } : s)
                                                                  })}
                                                                  className="w-full text-sm font-bold bg-slate-50 px-3 py-2 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-500/10 border border-transparent focus:border-blue-500 transition-all"
                                                               />
                                                               <input 
                                                                  type="text" 
                                                                  placeholder="YouTube Link or ID"
                                                                  value={lecture.youtubeId}
                                                                  onChange={(e) => setCurrentBatch({
                                                                     ...currentBatch,
                                                                     subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                                        ...s,
                                                                        chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                                           ...c,
                                                                           lectures: c.lectures.map(l => l.id === lecture.id ? {...l, youtubeId: e.target.value} : l)
                                                                        } : c)
                                                                     } : s)
                                                                  })}
                                                                  onBlur={(e) => {
                                                                     const cleanId = extractYoutubeId(e.target.value);
                                                                     if(cleanId !== e.target.value) {
                                                                        setCurrentBatch({
                                                                           ...currentBatch,
                                                                           subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                                              ...s,
                                                                              chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                                                 ...c,
                                                                                 lectures: c.lectures.map(l => l.id === lecture.id ? {...l, youtubeId: cleanId} : l)
                                                                              } : c)
                                                                           } : s)
                                                                        });
                                                                     }
                                                                  }}
                                                                  className="w-full text-xs font-mono text-slate-500 bg-slate-50 px-3 py-2 rounded-lg outline-none focus:bg-white focus:ring-2 ring-blue-500/10 border border-transparent focus:border-blue-500 transition-all"
                                                               />
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
                                                            }} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16}/></button>
                                                        </div>

                                                        {/* LECTURE RESOURCES */}
                                                        <div className="pl-11">
                                                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><Folder size={10}/> Attached Materials</p>
                                                           <div className="space-y-2">
                                                              {lecture.resources?.map(res => (
                                                                 <div key={res.id} className="flex gap-2 items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                                                                    <span className={`p-1 rounded ${res.type === 'pdf' ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                                                                       {res.type === 'pdf' ? <FileText size={12}/> : <Globe size={12}/>}
                                                                    </span>
                                                                    <div className="flex-1 grid grid-cols-2 gap-2">
                                                                       <input 
                                                                          value={res.title}
                                                                          onChange={(e) => updateResourceDetails(subject.id, chapter.id, lecture.id, res.id, 'title', e.target.value)}
                                                                          className="bg-transparent text-xs font-bold outline-none"
                                                                          placeholder="Resource Title"
                                                                       />
                                                                       <input 
                                                                          value={res.url.substring(0, 30) + '...'}
                                                                          disabled={res.type === 'pdf'}
                                                                          onChange={(e) => updateResourceDetails(subject.id, chapter.id, lecture.id, res.id, 'url', e.target.value)}
                                                                          className="bg-transparent text-[10px] font-mono text-slate-400 outline-none"
                                                                          placeholder="URL"
                                                                       />
                                                                    </div>
                                                                    <button onClick={() => removeResourceFromLecture(subject.id, chapter.id, lecture.id, res.id)} className="text-slate-300 hover:text-red-500"><X size={14}/></button>
                                                                 </div>
                                                              ))}
                                                           </div>
                                                           <div className="flex gap-2 mt-2">
                                                              <button onClick={() => triggerResourceUpload(subject.id, chapter.id, lecture.id)} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1">
                                                                 <Upload size={12}/> Upload PDF
                                                              </button>
                                                              <button onClick={() => addLinkToLecture(subject.id, chapter.id, lecture.id)} className="px-3 py-1.5 bg-slate-50 text-slate-500 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-100 transition-all flex items-center gap-1">
                                                                 <LinkIcon size={12}/> Add Link
                                                              </button>
                                                           </div>
                                                        </div>
                                                     </div>
                                                  ))}
                                                  
                                                  <button onClick={() => {
                                                     const newLecture: Lecture = { id: `lec-${Date.now()}`, title: '', youtubeId: '', duration: '00:00', description: '', resources: [] };
                                                     setCurrentBatch({
                                                        ...currentBatch,
                                                        subjects: currentBatch.subjects.map(s => s.id === subject.id ? {
                                                           ...s,
                                                           chapters: s.chapters.map(c => c.id === chapter.id ? {
                                                              ...c,
                                                              lectures: [...c.lectures, newLecture]
                                                           } : c)
                                                        } : s)
                                                     });
                                                  }} className="w-full py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-xs font-black uppercase hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                                                     <Plus size={14}/> Add Lecture
                                                  </button>
                                               </div>
                                            )}
                                         </div>
                                      ))}
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