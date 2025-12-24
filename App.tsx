
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, GraduationCap, LogOut,
  Settings, ChevronRight, FileText, Download, Loader2, ExternalLink, Layers, Folder, Zap, Play, Bell, Sparkles, ChevronLeft,
  ArrowRight, Database, Link as LinkIcon, CheckCircle2
} from 'lucide-react';
import { Course, Lecture, Chapter, Subject, Notice, Banner } from './types';
import VideoPlayer from './components/VideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import { subscribeToCourses, getSiteSettings, subscribeToTelegramFeed, TelegramPost, subscribeToNotices, subscribeToBanners } from './services/db';

type UserRole = 'student' | 'admin' | 'manager';

const SidebarItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-none transition-all duration-300 ${active ? 'bg-blue-600 text-white border-l-4 border-white' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
    <span className="font-bold text-sm uppercase tracking-tight">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'course' | 'video' | 'admin' | 'profile'>('home');
  const [courses, setCourses] = useState<Course[]>([]);
  const [tgPosts, setTgPosts] = useState<TelegramPost[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, role: UserRole} | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasDirectLink, setHasDirectLink] = useState(false);
  const [lectureTab, setLectureTab] = useState<'ai' | 'notes'>('ai');
  const [toast, setToast] = useState<{message: string, show: boolean}>({ message: '', show: false });

  const [siteSettings, setSiteSettings] = useState({
    shortenerUrl: '',
    shortenerApiKey: ''
  });

  useEffect(() => {
    const unsubCourses = subscribeToCourses((data) => {
      setCourses(data);
      
      const params = new URLSearchParams(window.location.search);
      const batchId = params.get('batch_id');
      const childId = params.get('child_id');

      if (batchId && childId) {
        const foundCourse = data.find(c => c.id === batchId);
        if (foundCourse) {
          let foundLecture: Lecture | null = null;
          foundCourse.subjects.forEach(s => {
            s.chapters.forEach(ch => {
              const lec = ch.lectures.find(l => l.id === childId);
              if (lec) foundLecture = lec;
            });
          });

          if (foundLecture) {
            setSelectedCourse(foundCourse);
            setSelectedLecture(foundLecture);
            setActiveView('video');
            setHasDirectLink(true);
          }
        }
      }
    });

    const unsubTG = subscribeToTelegramFeed(setTgPosts);
    const unsubNotices = subscribeToNotices(setNotices);
    const unsubBanners = subscribeToBanners(setBanners);

    const loadSettings = async () => {
      const dbSettings = await getSiteSettings();
      if (dbSettings) setSiteSettings(dbSettings);
      setIsLoading(false);
    };
    loadSettings();
    
    const savedUser = localStorage.getItem('study_portal_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    return () => {
      unsubCourses(); unsubTG(); unsubNotices(); unsubBanners();
    };
  }, []);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleAuthSuccess = (userData: { name: string; email: string; role: UserRole }) => {
    setUser(userData);
    localStorage.setItem('study_portal_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const navigateToCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveView('course');
    window.scrollTo(0, 0);
  };

  const copyDirectLink = (batchId: string, lectureId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?batch_id=${batchId}&child_id=${lectureId}`;
    navigator.clipboard.writeText(url);
    showToast('Direct Link Copied!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  const isDirectAccess = hasDirectLink && activeView === 'video' && !!selectedLecture;
  const shouldBlock = !user && !isDirectAccess;

  if (shouldBlock) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-fadeIn">
          <div className="w-16 h-16 bg-blue-600 rounded-none flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg">S</div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Study Portal</h1>
            <p className="text-slate-500 font-medium leading-relaxed px-4 text-sm uppercase tracking-tight">
              Premium academic environment. Please sign in to access your dashboard.
            </p>
          </div>
          <div className="space-y-4 pt-4">
            <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-4 rounded-none font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-md flex items-center justify-center gap-3">
              <UserIcon size={16}/> Secure Log In
            </button>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-900">
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl animate-slideUp">
           <CheckCircle2 className="text-emerald-400" size={16}/> {toast.message}
        </div>
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-0 h-full flex flex-col">
          <div className="flex items-center gap-3 py-8 px-8 cursor-pointer border-b border-slate-100 mb-4" onClick={() => { setHasDirectLink(false); setActiveView('home'); }}>
            <div className="w-8 h-8 bg-blue-600 rounded-none flex items-center justify-center text-white font-black text-lg shadow-sm">S</div>
            <span className="text-base font-black text-slate-900 tracking-tighter uppercase">Study Portal</span>
          </div>
          <div className="flex-1">
            <SidebarItem icon={<Home size={18}/>} label="DASHBOARD" active={activeView === 'home'} onClick={() => {setActiveView('home'); setHasDirectLink(false); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<BookOpen size={18}/>} label="BATCHES" active={activeView === 'course'} onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} />
            
            {(user?.role === 'admin' || user?.role === 'manager') && (
               <div className="mt-6 pt-6 border-t border-slate-100">
                 <p className="text-[9px] uppercase font-black text-slate-400 px-8 mb-4 tracking-widest">Faculty Controls</p>
                 <SidebarItem icon={<Settings size={18}/>} label="ADMIN CONSOLE" active={activeView === 'admin'} onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} />
               </div>
            )}
          </div>
          
          <div className="mt-auto border-t border-slate-100 p-6">
            {!user ? (
               <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-3 rounded-none font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Sign In</button>
            ) : (
               <button onClick={() => {setUser(null); localStorage.removeItem('study_portal_user'); setHasDirectLink(false); setActiveView('home');}} className="w-full flex items-center gap-4 px-4 py-3 rounded-none text-red-500 font-bold hover:bg-red-50 transition-all text-xs uppercase tracking-widest">
                <LogOut size={18} /> Logout Session
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <nav className="h-16 bg-white border-b border-slate-100 flex items-center px-6 md:px-10 justify-between sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-50">
            <Menu size={20} />
          </button>
          
          <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-none border border-slate-200">
             <Bell size={12} className="text-blue-600" />
             <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Network Secure: AES-256 Stream Active.</p>
          </div>

          <div className="flex items-center gap-4">
             {user && (
               <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('profile')}>
                 <div className="text-right hidden sm:block">
                   <p className="text-[10px] font-black uppercase tracking-tight">{user.name}</p>
                   <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{user.role}</p>
                 </div>
                 <div className="w-8 h-8 bg-slate-900 rounded-none flex items-center justify-center text-white">
                    <UserIcon size={16} />
                 </div>
               </div>
             )}
          </div>
        </nav>

        <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {activeView === 'home' && (
              <div className="space-y-10 animate-fadeIn">
                <section className="relative h-[320px] rounded-none overflow-hidden shadow-xl border border-slate-200 bg-slate-900">
                   <img src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500"} className="w-full h-full object-cover opacity-80" />
                   <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/40 to-transparent flex flex-col justify-center p-10 md:p-14">
                      <div className="max-w-xl">
                        <span className="bg-blue-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest mb-4 inline-block shadow-lg">New Release</span>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-5 uppercase">Academic <br/><span className="text-blue-400">Portal.</span></h1>
                        <p className="text-slate-300 text-sm font-medium mb-8 leading-relaxed max-w-sm uppercase tracking-tight">Stream premium curriculum and interact with AI subject experts.</p>
                        <button onClick={() => courses.length > 0 && navigateToCourse(courses[0])} className="bg-white text-slate-900 px-8 py-4 rounded-none font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg border-b-4 border-slate-300 active:translate-y-1 active:border-b-0">
                           Explore Curriculum <ArrowRight size={14}/>
                        </button>
                      </div>
                   </div>
                </section>

                <section>
                   <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                      <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3">
                        <Layers size={20} className="text-blue-600"/> Enrolled Batches
                      </h2>
                   </div>
                   {courses.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-none overflow-hidden border border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all cursor-pointer group flex flex-col relative" onClick={() => navigateToCourse(course)}>
                          <div className="absolute top-4 left-4 z-10">
                            <span className="bg-slate-900/90 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest border border-slate-700 backdrop-blur-sm">Premium</span>
                          </div>
                          <div className="relative aspect-video overflow-hidden">
                            <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                            <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors duration-500"></div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col border-t border-slate-100">
                            <h3 className="font-black text-base mb-1 line-clamp-1 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{course.title}</h3>
                            <p className="text-slate-400 text-[8px] font-bold uppercase tracking-widest mb-6">{course.instructor}</p>
                            <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Access</span>
                              <div className="p-2 bg-slate-50 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={16}/>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                   ) : (
                     <div className="bg-slate-50 p-20 border border-dashed border-slate-200 text-center">
                        <Database className="mx-auto text-slate-200 mb-4" size={40} />
                        <p className="font-black text-slate-400 text-[10px] uppercase tracking-widest">Curriculum Offline</p>
                     </div>
                   )}
                </section>
              </div>
            )}
            
            {activeView === 'course' && selectedCourse && (
              <div className="max-w-4xl mx-auto animate-fadeIn">
                <button onClick={() => { setHasDirectLink(false); setActiveView('home'); }} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest">
                   <ChevronLeft size={14}/> Back to Dashboard
                </button>
                <div className="bg-slate-900 rounded-none p-10 text-white mb-8 shadow-lg relative overflow-hidden border border-slate-700">
                   <div className="relative z-10">
                      <h1 className="text-3xl font-black mb-4 tracking-tight uppercase">{selectedCourse.title}</h1>
                      <p className="text-slate-400 text-base font-medium max-w-xl leading-relaxed uppercase tracking-tight text-xs">{selectedCourse.description}</p>
                   </div>
                </div>
                
                <div className="space-y-6">
                   {selectedCourse.subjects.map(subject => (
                      <div key={subject.id} className="bg-white p-8 border border-slate-200 shadow-sm">
                         <h3 className="text-xl font-black text-blue-600 mb-8 flex items-center gap-3 uppercase tracking-tight">
                            <Layers size={20} /> {subject.title}
                         </h3>
                         <div className="space-y-8">
                            {subject.chapters.map(chapter => (
                               <div key={chapter.id}>
                                  <div className="flex items-center gap-3 mb-4">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                       <Folder size={12} className="text-blue-400"/> {chapter.title}
                                    </p>
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                  </div>
                                  <div className="grid grid-cols-1 gap-2">
                                  {chapter.lectures.map(lecture => (
                                     <div key={lecture.id} className="group relative">
                                        <button 
                                          onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                          className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-white transition-all shadow-sm"
                                        >
                                          <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 bg-slate-900 flex items-center justify-center text-white group-hover:bg-blue-600 transition-colors">
                                                <Play size={14} fill="currentColor" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{lecture.title}</p>
                                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">{lecture.duration} • Interactive</p>
                                            </div>
                                          </div>
                                          <ChevronRight size={14} className="text-slate-300" />
                                        </button>
                                        
                                        {(user?.role === 'admin' || user?.role === 'manager') && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); copyDirectLink(selectedCourse.id, lecture.id); }}
                                            className="absolute right-12 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 font-black text-[8px] uppercase tracking-widest"
                                          >
                                            <LinkIcon size={12} /> SHARE LINK
                                          </button>
                                        )}
                                     </div>
                                  ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
            
            {activeView === 'video' && selectedLecture && (
              <div className="animate-fadeIn">
                <button onClick={() => { setHasDirectLink(false); setActiveView('course'); }} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest">
                   <ChevronLeft size={14}/> Back to Curriculum
                </button>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-8">
                    <VideoPlayer videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    <div className="bg-white p-8 border border-slate-200 shadow-sm mt-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="space-y-1">
                           <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{selectedLecture.title}</h1>
                           {hasDirectLink && <div className="text-emerald-600 font-black text-[8px] uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={10}/> Academic Bypass Active</div>}
                        </div>
                        <span className="px-3 py-1 bg-slate-900 text-white text-[8px] font-black uppercase tracking-widest border border-slate-800">Premium Resource</span>
                      </div>
                      <p className="text-slate-600 font-medium text-sm leading-relaxed uppercase tracking-tight">{selectedLecture.description || "Official study materials are available for this session."}</p>
                    </div>
                  </div>
                  
                  <div className="xl:col-span-4 space-y-6">
                     <div className="bg-slate-50 p-1 flex border border-slate-200">
                        <button onClick={() => setLectureTab('ai')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'ai' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}><Sparkles size={12}/> AI Teacher</button>
                        <button onClick={() => setLectureTab('notes')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'notes' ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500'}`}><FileText size={12}/> Notes</button>
                     </div>

                     {lectureTab === 'ai' ? <DoubtSolver currentContext={selectedLecture.title} /> : (
                        <div className="bg-white p-6 border border-slate-200 min-h-[400px] shadow-sm">
                           <h3 className="font-black text-base mb-6 text-slate-900 uppercase tracking-tight">Session Attachments</h3>
                           <div className="space-y-2">
                              {selectedLecture.resources && selectedLecture.resources.length > 0 ? selectedLecture.resources.map(res => (
                                 <button key={res.id} onClick={() => window.open(res.url, '_blank')} className="w-full p-4 bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-blue-50 transition-all group">
                                    <div className="flex items-center gap-3">
                                       <Download size={14} className="text-blue-600"/>
                                       <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{res.title}</span>
                                    </div>
                                    <ExternalLink size={12} className="text-slate-300" />
                                 </button>
                              )) : (
                                <div className="text-center py-20 text-slate-300 border border-dashed border-slate-200">
                                   <p className="text-[8px] font-bold uppercase tracking-widest">Materials Not Found</p>
                                </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'admin' && user && <AdminPanel userRole={user.role} courses={courses} setCourses={setCourses} onClose={() => setActiveView('home')} siteSettings={siteSettings as any} setSiteSettings={setSiteSettings as any} />}
            {activeView === 'profile' && user && <ProfileSection user={user as any} onUpdate={(u) => setUser(u as any)} onLogout={() => {setUser(null); localStorage.removeItem('study_portal_user'); setActiveView('home');}} />}
          </div>
        </main>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
    </div>
  );
};

export default App;
