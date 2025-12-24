
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, PlayCircle, GraduationCap, LogOut,
  Settings, ChevronRight, Clock, FileText, Download, Loader2, ExternalLink, Layers, Folder, Send, Zap, Play, Bell, Info, Sparkles, ChevronLeft,
  Shield, ArrowRight
} from 'lucide-react';
import { Course, Lecture, SiteSettings, Chapter, Subject, Resource, Notice, Banner } from './types';
import VideoPlayer from './components/VideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AccessGate from './components/AccessGate';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import { subscribeToCourses, getSiteSettings, subscribeToTelegramFeed, TelegramPost, subscribeToNotices, subscribeToBanners } from './services/db';

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
    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 ${active ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    <span className={active ? 'text-white' : 'text-slate-400'}>{icon}</span>
    <span className="font-bold text-sm">{label}</span>
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
  const [accessExpiry, setAccessExpiry] = useState<number | null>(null);
  const [showAccessGate, setShowAccessGate] = useState(false);
  const [lectureTab, setLectureTab] = useState<'ai' | 'notes'>('ai');

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    shortenerUrl: 'https://vplink.in/api',
    shortenerApiKey: '320f263d298979dc11826b8e2574610ba0cc5d6b'
  });

  const handleAuthSuccess = (userData: { name: string; email: string; role: UserRole }) => {
    setUser(userData);
    localStorage.setItem('study_portal_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const handleUpdateSettings = (settings: SiteSettings) => {
    setSiteSettings(settings);
  };

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
    const unsubCourses = subscribeToCourses(setCourses);
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

    const savedExpiry = localStorage.getItem('study_portal_access_expiry');
    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      if (expiryTime > Date.now()) {
        setAccessExpiry(expiryTime);
      } else {
        localStorage.removeItem('study_portal_access_expiry');
      }
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto_verify') === 'true') {
      grantAccess();
      window.history.replaceState({}, '', window.location.pathname);
    }

    return () => {
      unsubCourses(); unsubTG(); unsubNotices(); unsubBanners();
    };
  }, []);

  const handleTGPostClick = (post: TelegramPost) => {
    if (!checkAccess()) { setShowAccessGate(true); return; }
    if (post.type === 'youtube' || post.type === 'video') {
       setSelectedLecture({ id: post.id, title: post.title, videoUrl: post.url, duration: 'TG Live', description: 'Synced from your Telegram channel.', resources: [] });
       setActiveView('video');
    } else if (post.type === 'pdf') {
       window.open(post.url, '_blank');
    }
  };

  const checkAccess = () => {
    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
    const hasValidAccess = accessExpiry !== null && accessExpiry > Date.now();
    return isAdminOrManager || hasValidAccess;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      {/* SIDEBAR */}
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => setActiveView('home')}>
            <div className="w-12 h-12 bg-slate-900 rounded-[1.25rem] flex items-center justify-center text-white font-black text-2xl shadow-xl">S</div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">STUDY PORTAL</span>
          </div>
          <div className="space-y-3 flex-1">
            <SidebarItem icon={<Home size={22}/>} label="Home Dashboard" active={activeView === 'home'} onClick={() => {setActiveView('home'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<BookOpen size={22}/>} label="My Enrollments" active={activeView === 'course'} onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<UserIcon size={22}/>} label="Profile Settings" active={activeView === 'profile'} onClick={() => {setActiveView('profile'); setIsSidebarOpen(false);}} />
            {user?.role !== 'student' && (
               <div className="mt-8 pt-8 border-t border-slate-100">
                 {/* Fixed: Shield icon added to lucide-react imports */}
                 <p className="text-[10px] uppercase font-black text-slate-400 px-4 mb-4 tracking-widest flex items-center gap-2"><Shield className="text-blue-500" size={12}/> Control Center</p>
                 <SidebarItem icon={<Settings size={22}/>} label="Admin Panel" active={activeView === 'admin'} onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} />
               </div>
            )}
          </div>
          {user && (
            <div className="pt-8 mt-auto border-t border-slate-50">
              <button onClick={() => {setUser(null); localStorage.removeItem('study_portal_user'); setActiveView('home');}} className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-all">
                <LogOut size={22} /> Logout
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        {/* TOP NAV */}
        <nav className="h-20 bg-white border-b border-slate-100 flex items-center px-6 md:px-12 justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-3 hover:bg-slate-50 rounded-2xl">
              <Menu size={24} />
            </button>
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
               <Bell size={16} className="text-blue-500 animate-bounce" />
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notice:</span>
               <div className="w-64 overflow-hidden whitespace-nowrap">
                  <div className="animate-marquee inline-block text-[11px] font-bold text-slate-700">
                    {notices.length > 0 ? notices[0].text : "Welcome to Study Portal - All new batches launched!"}
                  </div>
               </div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className={`hidden sm:flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${accessExpiry && accessExpiry > Date.now() ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-50 border-amber-100'}`}>
              {accessExpiry && accessExpiry > Date.now() ? <NavbarTimer expiry={accessExpiry} /> : 'Trial Version'}
            </div>
            {!user ? (
               <button onClick={() => setIsAuthModalOpen(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl">Sign In</button>
            ) : (
               <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setActiveView('profile')}>
                  <div className="text-right">
                    <p className="text-xs font-black text-slate-900 leading-none">{user.name}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase mt-1 tracking-widest">{user.role}</p>
                  </div>
                  <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-[1.25rem] flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <UserIcon size={24} />
                  </div>
               </div>
            )}
          </div>
        </nav>

        <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {activeView === 'home' && (
              <div className="space-y-12 animate-fadeIn">
                {/* HERO / BANNER SLIDER */}
                <section className="relative h-[400px] rounded-[3.5rem] overflow-hidden shadow-2xl group">
                   <img src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1523050335102-c6744740bb16?auto=format&fit=crop&q=80&w=1500"} className="w-full h-full object-cover brightness-50" />
                   <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex flex-col justify-end p-16">
                      <div className="max-w-xl">
                        <span className="bg-blue-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Featured Batch 2025</span>
                        <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter mb-8">Master Your <span className="text-blue-500">Future.</span></h1>
                        <p className="text-slate-300 text-lg font-medium mb-10 leading-relaxed">Join 100k+ students learning with top India faculty. New Lakshya JEE 2025 Batch enrolling now.</p>
                        {/* Fixed: ArrowRight icon added to lucide-react imports */}
                        <button onClick={() => navigateToCourse(courses[0])} className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl flex items-center gap-3">
                           Browse All Batches <ArrowRight size={20}/>
                        </button>
                      </div>
                   </div>
                </section>

                {/* TELEGRAM SYNCED UPDATES */}
                {tgPosts.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-8 px-4">
                       <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                          <div className="w-10 h-10 bg-[#229ED9] rounded-xl flex items-center justify-center text-white"><Send size={20} className="-rotate-12"/></div>
                          Channel Feed
                       </h2>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide px-4">
                      {tgPosts.slice(0, 10).map(post => (
                        <div key={post.id} onClick={() => handleTGPostClick(post)} className="min-w-[300px] bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all cursor-pointer group shrink-0">
                          <div className="flex items-center justify-between mb-4">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${post.type === 'youtube' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                {post.type}
                             </span>
                             <span className="text-[10px] font-bold text-slate-400">{new Date(post.timestamp).toLocaleDateString()}</span>
                          </div>
                          <h4 className="font-black text-slate-900 line-clamp-2 leading-tight mb-4 group-hover:text-blue-600 transition-colors h-10">{post.title}</h4>
                          <div className="flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest gap-2">
                             Access Lecture <ChevronRight size={14} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* COURSE BATCHES */}
                <section>
                   <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-10 px-4">Premier Batches</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 px-4">
                    {courses.map(course => (
                      <div key={course.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-slate-100 cursor-pointer flex flex-col group" onClick={() => navigateToCourse(course)}>
                        <div className="relative aspect-video overflow-hidden">
                          <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute top-6 left-6 bg-slate-900/80 backdrop-blur-md text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">
                            {course.category}
                          </div>
                        </div>
                        <div className="p-8 flex-1 flex flex-col">
                          <h3 className="font-black text-2xl text-slate-900 mb-2 leading-tight group-hover:text-blue-600 transition-colors">{course.title}</h3>
                          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest flex items-center gap-2 mb-8">
                             <UserIcon size={14}/> {course.instructor}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-8 border-t border-slate-50">
                            <span className="text-2xl font-black text-slate-900">₹{course.price}</span>
                            <div className="bg-slate-50 text-slate-600 group-hover:bg-slate-900 group-hover:text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">Explore Batch</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
            
            {/* COURSE CURRICULUM VIEW */}
            {activeView === 'course' && selectedCourse && (
              <div className="animate-fadeIn max-w-5xl mx-auto">
                <button onClick={() => setActiveView('home')} className="mb-10 flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
                   <div className="p-2 bg-white rounded-xl border border-slate-100 group-hover:border-slate-900 group-hover:bg-slate-900 group-hover:text-white transition-all"><ChevronLeft size={20}/></div>
                   <span className="text-[10px] font-black uppercase tracking-widest">Return to Dashboard</span>
                </button>
                <div className="bg-slate-900 rounded-[3.5rem] p-12 md:p-16 text-white mb-12 shadow-2xl relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12">
                     <GraduationCap size={200} />
                   </div>
                   <div className="relative z-10">
                      <h1 className="text-5xl font-black mb-6 tracking-tighter">{selectedCourse.title}</h1>
                      <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">{selectedCourse.description || "Start your academic journey with our highly specialized curriculum designed by top educators."}</p>
                   </div>
                </div>
                
                <div className="space-y-10">
                   {selectedCourse.subjects.map(subject => (
                      <div key={subject.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                         <h3 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-[1.25rem] flex items-center justify-center"><Layers size={24} /></div>
                            {subject.title}
                         </h3>
                         <div className="space-y-8">
                            {subject.chapters.map(chapter => (
                               <div key={chapter.id} className="space-y-4">
                                  <div className="flex items-center gap-2 text-slate-400 px-2">
                                     <Folder size={14} />
                                     <p className="text-[11px] font-black uppercase tracking-widest">{chapter.title}</p>
                                  </div>
                                  <div className="grid grid-cols-1 gap-3">
                                  {chapter.lectures.map(lecture => (
                                     <button 
                                        key={lecture.id}
                                        onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                        className="w-full flex items-center justify-between p-6 rounded-2xl bg-slate-50 hover:bg-slate-900 hover:text-white transition-all group border border-slate-100"
                                     >
                                        <div className="flex items-center gap-5">
                                           <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                                              <Play size={16} fill="currentColor" />
                                           </div>
                                           <div className="text-left">
                                              <span className="text-sm font-black block">{lecture.title}</span>
                                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Lecture • {lecture.duration}</span>
                                           </div>
                                        </div>
                                        <div className="p-2 bg-white/10 rounded-lg group-hover:bg-blue-600 transition-colors">
                                          <ChevronRight size={18} />
                                        </div>
                                     </button>
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
            
            {/* LECTURE VIDEO VIEW */}
            {activeView === 'video' && selectedLecture && (
              <div className="animate-fadeIn">
                <div className="flex flex-col lg:flex-row items-center justify-between mb-8 gap-6">
                   <button onClick={() => setActiveView('course')} className="flex items-center gap-3 text-slate-400 hover:text-slate-900 transition-colors group">
                      <div className="p-2 bg-white rounded-xl border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all"><ChevronLeft size={18}/></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Back to Curriculum</span>
                   </button>
                   <div className="flex items-center gap-2 bg-slate-900 px-6 py-2.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest shadow-xl">
                      <Zap size={14} className="text-blue-500 fill-blue-500" /> Premium Learning Mode
                   </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                  <div className="xl:col-span-8 space-y-10">
                    <VideoPlayer key={selectedLecture.videoUrl} videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                      <h1 className="text-3xl font-black text-slate-900 mb-6">{selectedLecture.title}</h1>
                      <p className="text-slate-500 text-lg font-medium leading-relaxed">{selectedLecture.description}</p>
                    </div>
                  </div>
                  
                  <div className="xl:col-span-4 space-y-10">
                     <div className="bg-white rounded-[3rem] p-2 flex border border-slate-100 shadow-sm">
                        <button 
                           onClick={() => setLectureTab('ai')}
                           className={`flex-1 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'ai' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <Sparkles size={16}/> AI Doubt Solver
                        </button>
                        <button 
                           onClick={() => setLectureTab('notes')}
                           className={`flex-1 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'notes' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                           <FileText size={16}/> DPP & Notes
                        </button>
                     </div>

                     {lectureTab === 'ai' ? (
                        <DoubtSolver currentContext={selectedLecture.title} />
                     ) : (
                        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 min-h-[500px] shadow-sm">
                           <h3 className="font-black text-slate-900 text-lg mb-8">Lecture Resources</h3>
                           <div className="space-y-4">
                              {selectedLecture.resources.length > 0 ? selectedLecture.resources.map(res => (
                                 <button key={res.id} onClick={() => window.open(res.url, '_blank')} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:border-blue-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 shadow-sm">
                                          <Download size={18}/>
                                       </div>
                                       <div className="text-left">
                                          <p className="text-sm font-black text-slate-800">{res.title}</p>
                                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF Document</p>
                                       </div>
                                    </div>
                                    <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-500" />
                                 </button>
                              )) : (
                                 <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300"><Info size={32}/></div>
                                    <p className="text-sm text-slate-400 font-bold">No resources attached to this lecture yet.</p>
                                 </div>
                              )}
                           </div>
                        </div>
                     )}
                  </div>
                </div>
              </div>
            )}
            
            {activeView === 'admin' && <AdminPanel userRole={user?.role || 'student'} courses={courses} setCourses={setCourses} onClose={() => setActiveView('home')} siteSettings={siteSettings} setSiteSettings={handleUpdateSettings} />}
            {activeView === 'profile' && user && <ProfileSection user={user as any} onUpdate={(u) => setUser(u as any)} onLogout={() => {setUser(null); localStorage.removeItem('study_portal_user'); setActiveView('home');}} />}
          </div>
        </main>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      {showAccessGate && <AccessGate siteSettings={siteSettings} onClose={() => setShowAccessGate(false)} onAccessGranted={grantAccess} />}
    </div>
  );
};

export default App;
