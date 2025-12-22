import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Search, Bell, Menu, PlayCircle, 
  Star, GraduationCap, LogOut,
  ShieldCheck, UserPlus, LogIn, Settings,
  ShieldAlert, ChevronRight, X, Clock, HelpCircle, MessageSquare, Copy, Check, FileText, Download
} from 'lucide-react';
import { Course, Video, SiteSettings, Chapter, Resource } from './types';
import VideoPlayer from './components/VideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AccessGate from './components/AccessGate';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';

type UserRole = 'student' | 'admin' | 'manager';

const SidebarItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/25' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
    <span className="font-bold text-sm">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'course' | 'video' | 'admin' | 'profile'>('home');
  const [courseTab, setCourseTab] = useState<'description' | 'subjects' | 'resources' | 'tests'>('subjects');
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, role: UserRole} | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [unlockedBatches, setUnlockedBatches] = useState<string[]>([]);
  const [showAccessGate, setShowAccessGate] = useState<string | null>(null);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    shortenerUrl: 'https://gplinks.in/api',
    shortenerApiKey: 'pt63YffOiEwMZ8rZ3uGaIuLX' 
  });
  
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  useEffect(() => {
    const savedCourses = localStorage.getItem('study_portal_courses');
    if (savedCourses) setCourses(JSON.parse(savedCourses));
    const savedUser = localStorage.getItem('study_portal_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedAccess = localStorage.getItem('study_portal_unlocked_batches');
    if (savedAccess) setUnlockedBatches(JSON.parse(savedAccess));
    const savedSettings = localStorage.getItem('study_portal_settings');
    if (savedSettings) setSiteSettings(JSON.parse(savedSettings));

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('unlocked_code');
    if (code) {
      setRevealedKey(code);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const handleUpdateSettings = (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
    localStorage.setItem('study_portal_settings', JSON.stringify(newSettings));
  };

  const handleAuthSuccess = (userData: {name: string, email: string, role: UserRole}) => {
    setUser(userData);
    localStorage.setItem('study_portal_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('study_portal_user');
    setActiveView('home');
    setSelectedCourse(null);
    setSelectedChapter(null);
    setSelectedVideo(null);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const unlockBatch = (batchId: string) => {
    const updated = [...unlockedBatches, batchId];
    setUnlockedBatches(updated);
    localStorage.setItem('study_portal_unlocked_batches', JSON.stringify(updated));
    setShowAccessGate(null);
  };

  const navigateToCourse = (course: Course) => {
    setSelectedCourse(course);
    setSelectedChapter(null);
    setActiveView('course');
    setCourseTab('subjects');
    window.scrollTo(0, 0);
  };

  const attemptVideoAccess = (video: Video, course: Course) => {
    if (unlockedBatches.includes(course.id) || user?.role === 'admin' || user?.role === 'manager') {
      setSelectedVideo(video);
      setActiveView('video');
      window.scrollTo(0, 0);
    } else {
      setShowAccessGate(course.id);
    }
  };

  const isStaff = user?.role === 'admin' || user?.role === 'manager';

  const downloadNote = (resource: Resource) => {
    const link = document.createElement('a');
    link.href = resource.url;
    link.download = resource.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#FDFEFE] selection:bg-blue-600 selection:text-white flex">
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveView('home')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">S</div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">STUDY PORTAL</span>
          </div>

          <div className="space-y-2 flex-1">
            <SidebarItem icon={<Home size={20}/>} label="Home Dashboard" active={activeView === 'home'} onClick={() => {setActiveView('home'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<BookOpen size={20}/>} label="My Enrollments" active={activeView === 'course'} onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<UserIcon size={20}/>} label="Student Profile" active={activeView === 'profile'} onClick={() => {setActiveView('profile'); setIsSidebarOpen(false);}} />
            
            {isStaff && (
               <div className="mt-8 pt-8 border-t border-slate-100">
                 <p className="text-[10px] uppercase font-black text-slate-400 px-4 mb-4 tracking-widest">Administration</p>
                 <SidebarItem icon={<Settings size={20}/>} label="Control Panel" active={activeView === 'admin'} onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} />
               </div>
            )}
          </div>

          {user && (
            <div className="pt-8 mt-auto border-t border-slate-50">
              <SidebarItem icon={<LogOut size={20}/>} label="Logout Session" active={false} onClick={handleLogout} />
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0 transition-all duration-300">
        <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-10 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-black text-slate-400 uppercase tracking-widest">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Network Status: Online
            </div>
          </div>

          <div className="flex items-center gap-4">
             {!user ? (
                <button onClick={() => setIsAuthModalOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-lg transition-all">Sign In</button>
             ) : (
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter mt-1">{user.role}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600 shadow-inner">
                    <UserIcon size={20} />
                  </div>
                </div>
             )}
          </div>
        </nav>

        <main className="flex-1 p-4 md:p-10">
          <div className="max-w-7xl mx-auto">
            {activeView === 'home' && (
              <div className="space-y-12 animate-fadeIn text-left">
                <section className="bg-slate-900 rounded-[3.5rem] p-10 md:p-16 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-700 group-hover:scale-[1.6]">
                    <GraduationCap size={240} />
                  </div>
                  <div className="relative z-10 max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8">
                      Premier Academic Portal
                    </div>
                    <h1 className="text-4xl md:text-7xl font-black leading-[1.05] mb-8 tracking-tighter">
                      Learn from the <br/><span className="text-blue-500 italic">Best Educators.</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 max-w-lg">Experience elite study modules, high-definition lecture streaming, and AI-powered academic support tailored for Class 9-12 success.</p>
                  </div>
                </section>

                <section>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-10 px-2">Featured Batches</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {courses.map(course => (
                      <div key={course.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 cursor-pointer flex flex-col group" onClick={() => navigateToCourse(course)}>
                        <div className="relative aspect-video overflow-hidden">
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                          <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2">{course.category}</div>
                          <h3 className="font-black text-2xl text-slate-900 mb-2 leading-tight tracking-tight">{course.title}</h3>
                          <p className="text-slate-500 text-sm font-medium mb-10">Expert Faculty: {course.instructor}</p>
                          <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                            <span className="text-2xl font-black text-slate-900">₹{course.price}</span>
                            <button className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Engage Batch</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {courses.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-bold">No active batches found. Please check the Admin Panel.</p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            {activeView === 'course' && selectedCourse && (
              <div className="animate-fadeIn max-w-4xl mx-auto text-left">
                 <div className="flex items-center gap-4 mb-10">
                    <button onClick={() => setActiveView('home')} className="p-3 hover:bg-slate-100 rounded-2xl transition-colors"><ChevronRight size={24} className="rotate-180 text-slate-400"/></button>
                    <div>
                      <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">{selectedCourse.title}</h1>
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-2">Active Enrollment</p>
                    </div>
                 </div>
                 
                 <div className="flex border-b border-slate-200 mb-10 gap-8 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    {[
                      {id: 'subjects', label: 'Curriculum'}, 
                      {id: 'description', label: 'Details'}, 
                      {id: 'resources', label: 'Study Notes'}
                    ].map(tab => (
                      <button key={tab.id} onClick={() => {setCourseTab(tab.id as any); setSelectedChapter(null);}} className={`pb-4 px-2 text-sm font-black transition-all relative ${courseTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-800'}`}>
                        {tab.label}
                        {courseTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-blue-600 rounded-t-full shadow-[0_-2px_8px_rgba(37,99,235,0.4)]"></div>}
                      </button>
                    ))}
                 </div>

                 {courseTab === 'subjects' && (
                   <div className="animate-fadeIn space-y-6">
                      {selectedChapter ? (
                        <div className="space-y-6">
                           <button onClick={() => setSelectedChapter(null)} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline mb-4 flex items-center gap-1">← Return to subject list</button>
                           <h2 className="text-xl font-black text-slate-900 mb-8">{selectedChapter.title} Lectures</h2>
                           <div className="grid gap-5">
                             {selectedChapter.videos.map(v => (
                               <button key={v.id} onClick={() => attemptVideoAccess(v, selectedCourse)} className="w-full flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-xl transition-all group text-left">
                                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all"><PlayCircle size={32} /></div>
                                  <div className="flex-1">
                                    <h4 className="font-black text-slate-900 text-lg tracking-tight group-hover:text-blue-600 transition-colors">{v.title}</h4>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1 flex items-center gap-2"><Clock size={12}/> Academic Session • {v.duration}</p>
                                  </div>
                                  <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"/>
                               </button>
                             ))}
                             {selectedChapter.videos.length === 0 && <p className="text-center py-10 text-slate-400 font-bold">No lectures uploaded in this subject yet.</p>}
                           </div>
                        </div>
                      ) : (
                        <div className="grid gap-5">
                          {selectedCourse.chapters.map(ch => (
                            <button key={ch.id} onClick={() => setSelectedChapter(ch)} className="w-full flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-[3rem] hover:shadow-xl transition-all group text-left">
                               <div className="w-16 h-16 bg-slate-50 text-slate-900 font-black text-xl rounded-3xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                 {ch.title.substring(0, 1).toUpperCase()}
                               </div>
                               <div className="flex-1">
                                 <h4 className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{ch.title}</h4>
                                 <div className="flex items-center gap-4 mt-3">
                                   <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full bg-blue-500 w-0"></div>
                                   </div>
                                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrollment Status: Active</span>
                                 </div>
                               </div>
                               <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-all"/>
                            </button>
                          ))}
                        </div>
                      )}
                   </div>
                 )}

                 {courseTab === 'resources' && (
                   <div className="animate-fadeIn space-y-10">
                      <div className="bg-blue-600 p-12 rounded-[3.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-blue-500/25 overflow-hidden relative">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                          <FileText size={160} />
                        </div>
                        <div className="relative z-10">
                           <h2 className="text-3xl font-black mb-2 tracking-tight">Academic Vault</h2>
                           <p className="text-blue-100 text-sm font-medium max-w-sm">Access exclusive chapter-wise notes, PDFs, and assignments curated for competitive excellence.</p>
                        </div>
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center border border-white/20 shadow-inner relative z-10"><Download size={36} /></div>
                      </div>

                      <div className="grid gap-6">
                        {selectedCourse.chapters.every(ch => !ch.notes || ch.notes.length === 0) ? (
                           <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                             <FileText className="mx-auto text-slate-200 mb-4" size={64} />
                             <p className="text-slate-400 font-bold">The Academic Vault is currently empty for this batch.</p>
                           </div>
                        ) : (
                          selectedCourse.chapters.map(ch => (
                            ch.notes && ch.notes.length > 0 && (
                              <div key={ch.id} className="space-y-4">
                                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">{ch.title} Study Material</h3>
                                {ch.notes.map(note => (
                                  <div key={note.id} className="bg-white p-7 rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-center justify-between group hover:shadow-2xl transition-all gap-4">
                                    <div className="flex items-center gap-6">
                                      <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm shrink-0">
                                        <FileText size={28} />
                                      </div>
                                      <div className="text-center sm:text-left">
                                        <h4 className="font-black text-slate-900 text-lg leading-tight">{note.title}</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase mt-1 tracking-widest flex items-center gap-2"><Check size={12}/> Verified Academic Reference • PDF</p>
                                      </div>
                                    </div>
                                    <button onClick={() => downloadNote(note)} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95">
                                      <Download size={18} /> Download Material
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )
                          ))
                        )}
                      </div>
                   </div>
                 )}
              </div>
            )}

            {activeView === 'video' && selectedVideo && (
              <div className="animate-fadeIn text-left">
                <button onClick={() => setActiveView('course')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-10 flex items-center gap-2 transition-colors">
                  <ChevronRight size={16} className="rotate-180" /> Back to curriculum subjects
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    {/* CRITICAL: Key ensures the player re-mounts on video change */}
                    <VideoPlayer key={selectedVideo.youtubeId} videoId={selectedVideo.youtubeId} title={selectedVideo.title} />
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
                      <h1 className="text-4xl font-black text-slate-900 mb-6 tracking-tight leading-tight">{selectedVideo.title}</h1>
                      <div className="prose prose-slate max-w-none">
                        <p className="text-slate-500 text-lg leading-relaxed font-medium">This lecture focuses on the fundamental concepts of the current subject. Use the AI Doubt Solver to clarify any misconceptions in real-time.</p>
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <DoubtSolver currentContext={selectedVideo.title} />
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'profile' && user && (
              <ProfileSection 
                user={user as any} 
                onUpdate={(u) => { setUser(u as any); localStorage.setItem('study_portal_user', JSON.stringify(u)); }} 
                onLogout={handleLogout} 
              />
            )}

            {activeView === 'admin' && (
              <AdminPanel 
                userRole={user?.role || 'student'} 
                courses={courses} 
                setCourses={setCourses} 
                onClose={() => setActiveView('home')} 
                siteSettings={siteSettings}
                setSiteSettings={handleUpdateSettings}
              />
            )}
          </div>
        </main>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      {showAccessGate && (
        <AccessGate 
          onUnlock={() => unlockBatch(showAccessGate)} 
          batchId={showAccessGate} 
          siteSettings={siteSettings}
          courses={courses}
        />
      )}
    </div>
  );
};

export default App;