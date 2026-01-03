
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, LogOut,
  Settings, ChevronRight, FileText, Download, Loader2, ExternalLink, Layers, Folder, Zap, Play, Bell, Sparkles, ChevronLeft,
  ArrowRight, Database, Link as LinkIcon, CheckCircle2, Lock, Target, BarChart3, Calendar, Trophy, Search, Clock, RefreshCw, Radio
} from 'lucide-react';
import { Course, Lecture, Notice, Banner, LectureProgress, SiteSettings } from './types';
import { DAILY_SCHEDULE, TEST_SERIES } from './constants';
import CustomVideoPlayer from './components/CustomVideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import PaymentModal from './components/PaymentModal';
import { 
  subscribeToCourses, 
  getSiteSettings, 
  subscribeToNotices, 
  subscribeToBanners,
  subscribeToUserProgress,
  markLectureComplete
} from './services/db';

type UserRole = 'student' | 'admin' | 'manager';

const BottomNavItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-2 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'course' | 'video' | 'admin' | 'profile' | 'planner' | 'tests'>('home');
  const [courses, setCourses] = useState<Course[]>([]);
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
  
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<LectureProgress[]>([]);
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null);

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ 
    appName: 'Study Portal', 
    botName: 'AI Guru', 
    shortenerUrl: '', 
    shortenerApiKey: '',
    adminEmail: 'admin@portal.com'
  });

  useEffect(() => {
    const unsubCourses = subscribeToCourses(setCourses);
    const unsubNotices = subscribeToNotices(setNotices);
    const unsubBanners = subscribeToBanners(setBanners);

    getSiteSettings().then(s => s && setSiteSettings(s));
    setIsLoading(false);

    const savedUser = localStorage.getItem('study_portal_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedEnrollments = localStorage.getItem('study_portal_enrollments');
    if (savedEnrollments) setEnrolledBatches(JSON.parse(savedEnrollments));

    return () => { unsubCourses(); unsubNotices(); unsubBanners(); };
  }, []);

  useEffect(() => {
    if (user?.role === 'student') {
      const unsubProgress = subscribeToUserProgress(user.email.replace(/\./g, '_'), setUserProgress);
      return () => unsubProgress();
    }
  }, [user]);

  const handleCourseClick = (course: Course) => {
    if (user?.role === 'admin' || user?.role === 'manager' || !course.price || enrolledBatches.includes(course.id)) {
      setSelectedCourse(course);
      setActiveView('course');
      window.scrollTo(0,0);
    } else {
      setPaymentCourse(course);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  const showAuth = !user && !hasDirectLink;

  if (showAuth) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-12 animate-fadeIn">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl mx-auto shadow-2xl shadow-blue-600/30">
            {siteSettings.appName.charAt(0)}
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">{siteSettings.appName}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">India's Next Gen Digital School</p>
          </div>
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3">
             <UserIcon size={20}/> Unlock Portal Access
          </button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      </div>
    );
  }

  const PW_SUBJECTS = [
    { name: 'Physics', icon: '⚛️', color: 'bg-blue-100' },
    { name: 'Maths', icon: '📐', color: 'bg-emerald-100' },
    { name: 'Chemistry', icon: '🧪', color: 'bg-amber-100' },
    { name: 'Biology', icon: '🧬', color: 'bg-rose-100' },
    { name: 'SST', icon: '🌍', color: 'bg-indigo-100' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FBFF] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar - Desktop Only */}
      <aside className="hidden md:flex w-72 bg-white border-r border-slate-100 flex-col sticky top-0 h-screen z-50">
        <div className="p-10 border-b border-slate-50 flex items-center gap-4 cursor-pointer" onClick={() => setActiveView('home')}>
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            {siteSettings.appName.charAt(0)}
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">{siteSettings.appName}</span>
            <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest block">Learn with the best</span>
          </div>
        </div>
        <nav className="flex-1 py-10">
          <button onClick={() => setActiveView('home')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'home' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
            <Home size={18}/> Home
          </button>
          <button onClick={() => setActiveView('course')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'course' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
            <BookOpen size={18}/> My Batches
          </button>
          <button onClick={() => setActiveView('planner')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'planner' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
            <Calendar size={18}/> Planner
          </button>
          <button onClick={() => setActiveView('tests')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'tests' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
            <Trophy size={18}/> Mock Tests
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button onClick={() => setActiveView('admin')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'admin' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
              <Settings size={18}/> Admin Hub
            </button>
          )}
        </nav>
        <div className="p-8">
           <button onClick={() => setActiveView('profile')} className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><UserIcon size={18}/></div>
              <div className="text-left"><p className="text-[10px] font-black text-slate-900 uppercase truncate">{user?.name}</p><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">My Profile</p></div>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 relative pb-24 md:pb-0 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-50 flex items-center px-6 md:px-12 sticky top-0 z-40 backdrop-blur-md bg-white/80">
           <div className="flex-1 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Cloud System Syncing</p>
           </div>
           <div className="flex items-center gap-4">
              {(user?.role === 'admin') && (
                <button onClick={() => setActiveView('admin')} className="hidden md:flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-600 transition-all">
                  <RefreshCw size={14}/> Batch Sync
                </button>
              )}
              <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Bell size={20}/></button>
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-slate-900 text-white rounded-xl"><Menu size={20}/></button>
           </div>
        </header>

        <main className="p-6 md:p-12 max-w-7xl mx-auto w-full">
           {activeView === 'home' && (
              <div className="space-y-12 animate-fadeIn">
                 {/* PW Hero Carousel */}
                 <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-900 h-64 md:h-80">
                    <img src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000"} className="w-full h-full object-cover opacity-50" />
                    <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-20">
                       <h1 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter">Your Journey to<br/><span className="text-blue-500 underline decoration-white/30 underline-offset-8">Academic Success.</span></h1>
                       <p className="mt-4 text-slate-300 text-xs font-bold uppercase tracking-widest">Enroll in India's top rated batches today.</p>
                    </div>
                 </div>

                 {/* PW Subject Quick Access */}
                 <section className="overflow-x-auto no-scrollbar pb-4">
                    <div className="flex items-center gap-6 min-w-max">
                       {PW_SUBJECTS.map((sub, i) => (
                          <div key={i} className="flex flex-col items-center gap-3 group cursor-pointer">
                             <div className={`w-20 h-20 ${sub.color} rounded-full flex items-center justify-center text-4xl shadow-sm group-hover:scale-110 transition-transform`}>
                                {sub.icon}
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-blue-600">{sub.name}</span>
                          </div>
                       ))}
                    </div>
                 </section>

                 {/* Batch Store */}
                 <section>
                    <div className="flex items-center justify-between mb-8">
                       <h2 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-3"><Layers className="text-blue-600"/> Batch Store</h2>
                       <button className="text-blue-600 font-black text-[9px] uppercase tracking-widest hover:underline">Explore Store</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {courses.map(course => (
                          <div 
                            key={course.id} 
                            onClick={() => handleCourseClick(course)}
                            className="bg-white rounded-[2rem] border border-slate-100 hover:shadow-2xl transition-all cursor-pointer overflow-hidden group flex flex-col"
                          >
                             <div className="aspect-[16/10] overflow-hidden relative">
                                <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                {course.price > 0 && !enrolledBatches.includes(course.id) && (
                                  <div className="absolute top-6 left-6 px-4 py-2 bg-slate-900/90 backdrop-blur-md rounded-xl text-[9px] font-black uppercase tracking-widest text-white flex items-center gap-2 border border-white/20">
                                     <Lock size={12} className="text-blue-400"/> Paid Access
                                  </div>
                                )}
                             </div>
                             <div className="p-8 flex-1 flex flex-col">
                                <h3 className="font-black text-slate-900 uppercase italic tracking-tight mb-2 truncate text-lg group-hover:text-blue-600 transition-colors">{course.title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{course.instructor}</p>
                                <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-400 uppercase">Subscription</span>
                                      <span className="text-sm font-black text-slate-900">{enrolledBatches.includes(course.id) ? 'ENROLLED' : (course.price > 0 ? `₹${course.price}` : 'FREE')}</span>
                                   </div>
                                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm"><ChevronRight size={20}/></div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
              </div>
           )}

           {activeView === 'course' && selectedCourse && (
              <div className="animate-fadeIn pb-12 text-left">
                 <button onClick={() => setActiveView('home')} className="mb-10 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all">
                    <ChevronLeft size={16}/> Exit Batch
                 </button>
                 <div className="flex flex-col lg:flex-row gap-12">
                    <div className="lg:w-80 shrink-0">
                       <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm text-center sticky top-32">
                          <img src={selectedCourse.image} className="w-full rounded-3xl mb-6 shadow-xl" />
                          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight leading-tight mb-2">{selectedCourse.title}</h2>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">{selectedCourse.instructor}</p>
                          <div className="space-y-4">
                             {selectedCourse.subjects.map(sub => (
                                <button key={sub.id} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl text-left hover:bg-blue-600 hover:text-white transition-all group flex items-center justify-between">
                                   <span className="text-[11px] font-black uppercase tracking-tight">{sub.title}</span>
                                   <ChevronRight size={16} className="text-slate-300 group-hover:text-white"/>
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                    <div className="flex-1 space-y-12">
                       {selectedCourse.subjects.map(subject => (
                          <div key={subject.id} className="space-y-8">
                             <div className="flex items-center gap-4">
                               <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
                               <h3 className="text-2xl font-black text-slate-900 uppercase italic">{subject.title} Curriculum</h3>
                             </div>
                             <div className="space-y-6">
                                {subject.chapters.map(chapter => (
                                   <div key={chapter.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-sm">
                                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-8 flex items-center gap-3"><Folder size={18} className="text-blue-500"/> {chapter.title}</p>
                                      <div className="grid grid-cols-1 gap-6">
                                         {chapter.lectures.map(lecture => (
                                            <button 
                                              key={lecture.id}
                                              onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                              className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-between hover:bg-white hover:border-blue-600 transition-all group"
                                            >
                                               <div className="flex items-center gap-6">
                                                  <div className="w-24 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm relative overflow-hidden shrink-0">
                                                     {lecture.thumbnail ? (
                                                        <img src={lecture.thumbnail} className="w-full h-full object-cover" alt="" />
                                                     ) : (
                                                        <Play size={24} fill="currentColor"/>
                                                     )}
                                                     {lecture.duration === 'LIVE' && (
                                                       <div className="absolute top-1 left-1 bg-red-600 text-white text-[6px] font-black px-1 rounded flex items-center gap-1">
                                                         <Radio size={8}/> LIVE
                                                       </div>
                                                     )}
                                                  </div>
                                                  <div className="text-left min-w-0">
                                                     <p className="text-sm font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors truncate">{lecture.title}</p>
                                                     <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-2">
                                                        {lecture.duration === 'LIVE' ? <span className="text-red-500">Currently Streaming</span> : `${lecture.duration} Session`}
                                                     </p>
                                                  </div>
                                               </div>
                                               <ChevronRight size={20} className="text-slate-200 group-hover:text-blue-600 shrink-0"/>
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
              </div>
           )}

           {activeView === 'video' && selectedLecture && (
              <div className="animate-fadeIn max-w-6xl mx-auto space-y-10 pb-12 text-left">
                 <button onClick={() => setActiveView('course')} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all">
                    <ChevronLeft size={16}/> Return to Batch
                 </button>
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-8">
                       <CustomVideoPlayer videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                       <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                          <div>
                             <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tight">{selectedLecture.title}</h1>
                             <div className="flex items-center gap-4 mt-4">
                                <span className={`px-4 py-2 ${selectedLecture.duration === 'LIVE' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} rounded-xl text-[10px] font-black uppercase`}>
                                   {selectedLecture.duration === 'LIVE' ? 'Live Stream Active' : 'Module Lesson'}
                                </span>
                                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{selectedLecture.duration === 'LIVE' ? 'Unlimited Duration' : selectedLecture.duration}</span>
                             </div>
                          </div>
                          <button 
                            onClick={() => markLectureComplete(user!.email.replace(/\./g, '_'), selectedCourse!.id, selectedLecture.id)}
                            className="w-full md:w-auto px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-600 shadow-xl transition-all"
                          >
                             Complete Module
                          </button>
                       </div>
                    </div>
                    <div className="lg:col-span-4 space-y-8">
                       <div className="flex bg-white p-2 rounded-2xl border border-slate-100">
                          <button onClick={() => setLectureTab('ai')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'ai' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                             <Sparkles size={18}/> AI Guru
                          </button>
                          <button onClick={() => setLectureTab('notes')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'notes' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400'}`}>
                             <FileText size={18}/> Resources
                          </button>
                       </div>
                       {lectureTab === 'ai' ? <DoubtSolver currentContext={selectedLecture.title} /> : (
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 min-h-[400px]">
                             <h4 className="text-sm font-black text-slate-900 uppercase italic mb-8 border-b pb-4">Study Material</h4>
                             <div className="space-y-4">
                                {[1,2].map(i => (
                                   <div key={i} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group cursor-pointer hover:bg-white hover:border-blue-600 transition-all">
                                      <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-all shadow-sm"><FileText size={24}/></div>
                                         <p className="text-[11px] font-black text-slate-800 uppercase">DPP Practice #{i}</p>
                                      </div>
                                      <Download size={20} className="text-slate-300 group-hover:text-blue-600"/>
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           )}

           {activeView === 'admin' && user && (
              <AdminPanel 
                userRole={user.role} 
                courses={courses} 
                setCourses={setCourses} 
                onClose={() => setActiveView('home')} 
                siteSettings={siteSettings} 
                setSiteSettings={setSiteSettings} 
              />
           )}
           {activeView === 'profile' && user && <ProfileSection user={user as any} onUpdate={(u) => { setUser(u as any); localStorage.setItem('study_portal_user', JSON.stringify(u)); }} onLogout={() => { setUser(null); localStorage.removeItem('study_portal_user'); setActiveView('home'); }} />}
        </main>

        {/* Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center px-4 z-50 pb-2">
           <BottomNavItem icon={<Home size={22}/>} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')}/>
           <BottomNavItem icon={<BookOpen size={22}/>} label="My Batch" active={activeView === 'course'} onClick={() => setActiveView('course')}/>
           <BottomNavItem icon={<Calendar size={22}/>} label="Planner" active={activeView === 'planner'} onClick={() => setActiveView('planner')}/>
           <BottomNavItem icon={<UserIcon size={22}/>} label="Profile" active={activeView === 'profile'} onClick={() => setActiveView('profile')}/>
        </nav>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      {paymentCourse && <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} onClose={() => setPaymentCourse(null)} onSuccess={() => { setEnrolledBatches([...enrolledBatches, paymentCourse.id]); setPaymentCourse(null); }} />}
    </div>
  );
};

export default App;
