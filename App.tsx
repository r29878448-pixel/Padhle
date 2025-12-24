
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, PlayCircle, GraduationCap, LogOut,
  Settings, ChevronRight, Clock, FileText, Download, Loader2, ExternalLink, Layers, Folder, Send, Zap, Play
} from 'lucide-react';
import { Course, Lecture, SiteSettings, Chapter, Subject, Resource } from './types';
import VideoPlayer from './components/VideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AccessGate from './components/AccessGate';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import { subscribeToCourses, getSiteSettings, subscribeToTelegramFeed, TelegramPost } from './services/db';

type UserRole = 'student' | 'admin' | 'manager';

const NavbarTimer: React.FC<{ expiry: number }> = ({ expiry }) => {
  const [timeLeft, setTimeLeft] = useState<string>("--:--:--");

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const distance = expiry - now;
      if (distance < 0) {
        setTimeLeft("00:00:00");
      } else {
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiry]);

  return <span className="font-mono font-black text-emerald-600">{timeLeft}</span>;
};

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [tgPosts, setTgPosts] = useState<TelegramPost[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, role: UserRole} | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [accessExpiry, setAccessExpiry] = useState<number | null>(null);
  const [showAccessGate, setShowAccessGate] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    shortenerUrl: 'https://vplink.in/api',
    shortenerApiKey: '320f263d298979dc11826b8e2574610ba0cc5d6b'
  });

  // Fixed: Implemented handleAuthSuccess to update user state after successful login
  const handleAuthSuccess = (userData: { name: string; email: string; role: UserRole }) => {
    setUser(userData);
    localStorage.setItem('study_portal_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  // Fixed: Implemented handleUpdateSettings to sync local settings state
  const handleUpdateSettings = (settings: SiteSettings) => {
    setSiteSettings(settings);
  };

  // Fixed: Implemented navigateToCourse to handle navigation to a specific batch curriculum
  const navigateToCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveView('course');
    window.scrollTo(0, 0);
  };

  const grantAccess = () => {
    const newExpiry = Date.now() + (24 * 60 * 60 * 1000);
    setAccessExpiry(newExpiry);
    localStorage.setItem('study_portal_access_expiry', newExpiry.toString());
    setShowAccessGate(false);
  };

  useEffect(() => {
    const unsubCourses = subscribeToCourses((data) => {
      setCourses(data);
      setIsLoading(false);
    });

    const unsubTG = subscribeToTelegramFeed((posts) => {
      setTgPosts(posts);
    });

    const loadSettings = async () => {
      const dbSettings = await getSiteSettings();
      if (dbSettings) setSiteSettings(dbSettings);
    };
    loadSettings();
    
    const savedUser = localStorage.getItem('study_portal_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    const savedExpiry = localStorage.getItem('study_portal_access_expiry');
    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      if (expiryTime > Date.now()) {
        setAccessExpiry(expiryTime);
      } else {
        localStorage.removeItem('study_portal_access_expiry');
        setAccessExpiry(null);
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto_verify') === 'true') {
      grantAccess();
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      unsubCourses();
      unsubTG();
    };
  }, []);

  const handleTGPostClick = (post: TelegramPost) => {
    if (!checkAccess()) {
      setShowAccessGate(true);
      return;
    }
    if (post.type === 'youtube' || post.type === 'video') {
       setSelectedLecture({
         id: post.id,
         title: post.title,
         videoUrl: post.url,
         duration: 'TG Live',
         description: 'Synced from your Telegram channel.',
         resources: []
       });
       setActiveView('video');
       window.scrollTo(0, 0);
    } else if (post.type === 'pdf') {
       window.open(post.url, '_blank');
    }
  };

  const checkAccess = () => {
    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
    const hasValidAccess = accessExpiry !== null && accessExpiry > Date.now();
    return isAdminOrManager || hasValidAccess;
  };

  const handleLogout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('study_portal_user');
    setActiveView('home');
    setIsSidebarOpen(false);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFEFE] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFEFE] flex">
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer" onClick={() => setActiveView('home')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">S</div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">STUDY PORTAL</span>
          </div>
          <div className="space-y-2 flex-1">
            <SidebarItem icon={<Home size={20}/>} label="Home Dashboard" active={activeView === 'home'} onClick={() => {setActiveView('home'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<BookOpen size={20}/>} label="Enrollments" active={activeView === 'course'} onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<UserIcon size={20}/>} label="My Profile" active={activeView === 'profile'} onClick={() => {setActiveView('profile'); setIsSidebarOpen(false);}} />
            {user?.role !== 'student' && (
               <div className="mt-8 pt-8 border-t border-slate-100">
                 <p className="text-[10px] uppercase font-black text-slate-400 px-4 mb-4 tracking-widest">Admin</p>
                 <SidebarItem icon={<Settings size={20}/>} label="Control Panel" active={activeView === 'admin'} onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} />
               </div>
            )}
          </div>
          {user && (
            <div className="pt-8 mt-auto border-t border-slate-50">
              <SidebarItem icon={<LogOut size={20}/>} label="Logout" active={false} onClick={handleLogout} />
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <nav className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 md:px-10 justify-between sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-100 rounded-xl">
            <Menu size={20} />
          </button>
          <div className={`hidden sm:flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${accessExpiry && accessExpiry > Date.now() ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-100'}`}>
            {accessExpiry && accessExpiry > Date.now() ? <NavbarTimer expiry={accessExpiry} /> : 'Basic Access'}
          </div>
          {!user ? (
             <button onClick={() => setIsAuthModalOpen(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 shadow-lg">Sign In</button>
          ) : (
             <div className="flex items-center gap-4">
                <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
                <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-center text-slate-600">
                  <UserIcon size={20} />
                </div>
             </div>
          )}
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
                    <h1 className="text-4xl md:text-7xl font-black leading-[1.05] mb-8 tracking-tighter">
                      Elite Learning <br/><span className="text-blue-500 italic">Redefined.</span>
                    </h1>
                    <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 max-w-lg">Professional academic platform with instant Telegram sync and AI assistance.</p>
                  </div>
                </section>

                {tgPosts.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-8 px-2">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#229ED9] rounded-xl flex items-center justify-center text-white shadow-lg">
                             <Send size={20} className="-rotate-12" />
                          </div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Channel Updates</h2>
                       </div>
                       <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> Live Sync
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {tgPosts.map(post => (
                        <div key={post.id} onClick={() => handleTGPostClick(post)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all cursor-pointer group">
                          <div className="flex items-center justify-between mb-4">
                             <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${post.type === 'youtube' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {post.type}
                             </span>
                             <span className="text-[8px] font-bold text-slate-400">{new Date(post.timestamp).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-black text-slate-900 line-clamp-2 leading-tight mb-4 group-hover:text-blue-600 transition-colors">{post.title}</h4>
                          <div className="flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest gap-2">
                             Access Update <ChevronRight size={12} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-10 px-2">Academic Batches</h2>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                    {courses.map(course => (
                      <div key={course.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 cursor-pointer flex flex-col group" onClick={() => navigateToCourse(course)}>
                        <div className="relative aspect-video overflow-hidden">
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                          <h3 className="font-black text-2xl text-slate-900 mb-2 leading-tight">{course.title}</h3>
                          <p className="text-slate-500 text-sm font-medium mb-10">{course.instructor}</p>
                          <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-50">
                            <span className="text-2xl font-black text-slate-900">₹{course.price}</span>
                            <div className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest">Enroll Now</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
            
            {/* Added: Section to render the curriculum of the selected course */}
            {activeView === 'course' && selectedCourse && (
              <div className="animate-fadeIn text-left">
                <button onClick={() => setActiveView('home')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-10 flex items-center gap-2">
                  <ChevronRight size={16} className="rotate-180" /> Back to Dashboard
                </button>
                <div className="mb-10">
                   <h1 className="text-4xl font-black text-slate-900 mb-2">{selectedCourse.title}</h1>
                   <p className="text-slate-500 font-medium">Explore the curriculum and start watching your lectures.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {selectedCourse.subjects.map(subject => (
                      <div key={subject.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                         <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <Layers className="text-blue-600" size={24} /> {subject.title}
                         </h3>
                         <div className="space-y-6">
                            {subject.chapters.map(chapter => (
                               <div key={chapter.id} className="space-y-3">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                     <Folder size={12} /> {chapter.title}
                                  </p>
                                  {chapter.lectures.map(lecture => (
                                     <button 
                                        key={lecture.id}
                                        onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                        className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-blue-50 hover:text-blue-600 transition-all group"
                                     >
                                        <div className="flex items-center gap-3">
                                           <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm">
                                              <Play size={14} fill="currentColor" />
                                           </div>
                                           <span className="text-sm font-bold text-left">{lecture.title}</span>
                                        </div>
                                        <ChevronRight size={16} className="text-slate-300" />
                                     </button>
                                  ))}
                               </div>
                            ))}
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            )}
            
            {activeView === 'video' && selectedLecture && (
              <div className="animate-fadeIn text-left">
                <button onClick={() => setActiveView('home')} className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-10 flex items-center gap-2">
                  <ChevronRight size={16} className="rotate-180" /> Back to Dashboard
                </button>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    <VideoPlayer key={selectedLecture.videoUrl} videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4">{selectedLecture.title}</h1>
                      <p className="text-slate-500 font-medium">{selectedLecture.description}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-4">
                    <DoubtSolver currentContext={selectedLecture.title} />
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'admin' && <AdminPanel userRole={user?.role || 'student'} courses={courses} setCourses={setCourses} onClose={() => setActiveView('home')} siteSettings={siteSettings} setSiteSettings={handleUpdateSettings} />}
            {activeView === 'profile' && user && <ProfileSection user={user as any} onUpdate={(u) => setUser(u as any)} onLogout={handleLogout} />}
          </div>
        </main>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      {showAccessGate && <AccessGate siteSettings={siteSettings} onClose={() => setShowAccessGate(false)} onAccessGranted={grantAccess} />}
    </div>
  );
};

export default App;
