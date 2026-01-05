
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, LogOut,
  Settings, ChevronRight, FileText, Download, Loader2, ExternalLink, Layers, Folder, Zap, Play, Bell, Sparkles, ChevronLeft,
  ArrowRight, Database, Link as LinkIcon, CheckCircle2, Lock, Target, BarChart3, Calendar, Trophy, Search, Clock, RefreshCw, Radio, GraduationCap
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
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, role: UserRole} | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lectureTab, setLectureTab] = useState<'ai' | 'notes'>('ai');
  
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

  const categories = ['All', 'Class 9th', 'Class 10th', 'Class 11th', 'Class 12th', 'JEE', 'NEET'];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-12 animate-fadeIn">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl mx-auto shadow-2xl shadow-blue-600/30">
            {siteSettings.appName.charAt(0)}
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">{siteSettings.appName}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Premium K-12 & Competitive Portal</p>
          </div>
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3">
             <UserIcon size={20}/> Unlock Student Access
          </button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      </div>
    );
  }

  const filteredCourses = selectedCategory === 'All' 
    ? courses 
    : courses.filter(c => c.category === selectedCategory);

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
            <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest block">Class 9-12 Specialist</span>
          </div>
        </div>
        <nav className="flex-1 py-10">
          <button onClick={() => setActiveView('home')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'home' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
            <Home size={18}/> Overview
          </button>
          <button onClick={() => setActiveView('course')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'course' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
            <BookOpen size={18}/> My Learning
          </button>
          <button onClick={() => setActiveView('tests')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'tests' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
            <Trophy size={18}/> Mock Tests
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button onClick={() => setActiveView('admin')} className={`w-full flex items-center gap-4 px-10 py-5 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'admin' ? 'text-blue-600 bg-blue-50/50 border-r-4 border-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>
              <Zap size={18}/> Sync Hub
            </button>
          )}
        </nav>
        <div className="p-8">
           <button onClick={() => setActiveView('profile')} className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><UserIcon size={18}/></div>
              <div className="text-left"><p className="text-[10px] font-black text-slate-900 uppercase truncate">{user?.name}</p><p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Account</p></div>
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 relative pb-24 md:pb-0 overflow-y-auto">
        <header className="h-20 bg-white border-b border-slate-50 flex items-center px-6 md:px-12 sticky top-0 z-40 backdrop-blur-md bg-white/80">
           <div className="flex-1 flex items-center gap-3">
              <GraduationCap className="text-blue-600" size={20} />
              <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Class 9, 10, 11 & 12 Specialized Portal</p>
           </div>
           <div className="flex items-center gap-4">
              <button className="p-3 bg-slate-50 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Bell size={20}/></button>
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-slate-900 text-white rounded-xl"><Menu size={20}/></button>
           </div>
        </header>

        <main className="p-6 md:p-12 max-w-7xl mx-auto w-full">
           {activeView === 'home' && (
              <div className="space-y-12 animate-fadeIn">
                 {/* Segment Hero */}
                 <div className="relative rounded-[3rem] overflow-hidden shadow-2xl bg-slate-900 h-72 md:h-96 group">
                    <img src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-24">
                       <span className="text-blue-400 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Academic Year 2024-25</span>
                       <h1 className="text-4xl md:text-6xl font-black text-white leading-tight uppercase italic tracking-tighter">Success in<br/><span className="text-blue-500 underline decoration-white/30 underline-offset-8">Boards & Competitive.</span></h1>
                       <p className="mt-6 text-slate-300 text-xs font-bold uppercase tracking-widest max-w-lg">Physics Wallah specialized curriculum for Class 9th to 12th students. Start your journey today.</p>
                    </div>
                 </div>

                 {/* Segment Selectors */}
                 <section className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h2 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-3 tracking-tight">Select Your Segment</h2>
                       <button className="text-blue-600 font-black text-[9px] uppercase tracking-widest border-b-2 border-blue-600 pb-1">Browse All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                       {categories.map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-300'}`}
                          >
                             {cat}
                          </button>
                       ))}
                    </div>
                 </section>

                 {/* Batch Directory */}
                 <section>
                    <div className="flex items-center justify-between mb-10">
                       <h2 className="text-3xl font-black text-slate-900 uppercase italic flex items-center gap-4 tracking-tighter"><Layers className="text-blue-600" size={32}/> {selectedCategory} Batches</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                       {filteredCourses.map(course => (
                          <div 
                            key={course.id} 
                            onClick={() => handleCourseClick(course)}
                            className="bg-white rounded-[3rem] border border-slate-100 hover:shadow-2xl transition-all cursor-pointer overflow-hidden group flex flex-col hover:-translate-y-2"
                          >
                             <div className="aspect-[16/10] overflow-hidden relative">
                                <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute top-6 left-6 px-4 py-2 bg-white/95 backdrop-blur-md rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-900 border border-white/20 shadow-lg">
                                   {course.category}
                                </div>
                             </div>
                             <div className="p-10 flex-1 flex flex-col">
                                <h3 className="font-black text-slate-900 uppercase italic tracking-tighter mb-3 truncate text-xl group-hover:text-blue-600 transition-colors leading-none">{course.title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-8 flex items-center gap-2">
                                   <UserIcon size={14} className="text-blue-500" /> {course.instructor}
                                </p>
                                <div className="flex items-center justify-between mt-auto pt-8 border-t border-slate-50">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Admission Fee</span>
                                      <span className="text-lg font-black text-slate-900">{enrolledBatches.includes(course.id) ? 'ENROLLED' : (course.price > 0 ? `₹${course.price}` : 'FREE')}</span>
                                   </div>
                                   <div className="w-14 h-14 bg-slate-50 rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm group-hover:shadow-blue-200"><ChevronRight size={24}/></div>
                                </div>
                             </div>
                          </div>
                       ))}
                       {filteredCourses.length === 0 && (
                          <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-100 rounded-[4rem]">
                             <Search size={64} className="text-slate-100 mx-auto mb-6" />
                             <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Syncing new batches for {selectedCategory}...</p>
                          </div>
                       )}
                    </div>
                 </section>
              </div>
           )}

           {activeView === 'course' && selectedCourse && (
              <div className="animate-fadeIn pb-12 text-left">
                 <button onClick={() => setActiveView('home')} className="mb-10 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all">
                    <ChevronLeft size={16}/> Back to Segment
                 </button>
                 <div className="flex flex-col lg:flex-row gap-12">
                    <div className="lg:w-96 shrink-0">
                       <div className="bg-white rounded-[3.5rem] border border-slate-100 p-10 shadow-sm text-center sticky top-32 overflow-hidden">
                          <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none">
                             <GraduationCap size={120} />
                          </div>
                          <img src={selectedCourse.image} className="w-full rounded-[2.5rem] mb-8 shadow-2xl" />
                          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight mb-4">{selectedCourse.title}</h2>
                          <div className="flex items-center justify-center gap-3 mb-10">
                             <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase">{selectedCourse.category}</span>
                             <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase">Verified Content</span>
                          </div>
                          <div className="space-y-4">
                             {selectedCourse.subjects.map(sub => (
                                <button key={sub.id} className="w-full p-6 bg-slate-50 border border-slate-50 rounded-[1.5rem] text-left hover:bg-slate-900 hover:text-white transition-all group flex items-center justify-between">
                                   <span className="text-xs font-black uppercase tracking-tight">{sub.title}</span>
                                   <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-500"/>
                                </button>
                             ))}
                          </div>
                       </div>
                    </div>
                    <div className="flex-1 space-y-12">
                       {selectedCourse.subjects.map(subject => (
                          <div key={subject.id} className="space-y-8">
                             <div className="flex items-center gap-5">
                               <div className="w-2.5 h-12 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20"></div>
                               <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{subject.title} Learning Modules</h3>
                             </div>
                             <div className="space-y-8">
                                {subject.chapters.map(chapter => (
                                   <div key={chapter.id} className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm">
                                      <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] mb-10 flex items-center gap-4 border-b border-slate-50 pb-6"><Folder size={22} className="text-blue-500"/> {chapter.title}</p>
                                      <div className="grid grid-cols-1 gap-6">
                                         {chapter.lectures.map(lecture => (
                                            <button 
                                              key={lecture.id}
                                              onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                              className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-50 flex items-center justify-between hover:bg-white hover:border-blue-600 transition-all group shadow-sm active:scale-[0.98]"
                                            >
                                               <div className="flex items-center gap-8">
                                                  <div className="w-28 h-18 bg-white rounded-[1.5rem] flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm relative overflow-hidden shrink-0">
                                                     {lecture.thumbnail ? (
                                                        <img src={lecture.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                                                     ) : (
                                                        <Play size={28} fill="currentColor"/>
                                                     )}
                                                     {lecture.duration === 'LIVE' && (
                                                       <div className="absolute top-2 left-2 bg-red-600 text-white text-[7px] font-black px-2 py-0.5 rounded flex items-center gap-1 shadow-lg animate-pulse">
                                                         <Radio size={8}/> LIVE
                                                       </div>
                                                     )}
                                                  </div>
                                                  <div className="text-left min-w-0">
                                                     <p className="text-base font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors truncate tracking-tight leading-none">{lecture.title}</p>
                                                     <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-3 tracking-widest">
                                                        {lecture.duration === 'LIVE' ? <span className="text-red-500 font-black flex items-center gap-1"><Radio size={12}/> Current Session</span> : <span className="flex items-center gap-1"><Clock size={12}/> {lecture.duration} Module</span>}
                                                     </p>
                                                  </div>
                                               </div>
                                               <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-blue-600 shadow-sm transition-all">
                                                 <ChevronRight size={24} className="shrink-0"/>
                                               </div>
                                            </button>
                                         ))}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </div>
                       ))}
                       {selectedCourse.subjects.length === 0 && (
                          <div className="p-32 text-center bg-white border border-slate-100 rounded-[4rem] shadow-inner">
                             <Database size={64} className="text-slate-100 mx-auto mb-6" />
                             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[11px]">Syncing Module Assets...</p>
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           )}

           {activeView === 'video' && selectedLecture && (
              <div className="animate-fadeIn pb-12 text-left">
                <button 
                  onClick={() => setActiveView('course')} 
                  className="mb-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all"
                >
                  <ChevronLeft size={16}/> Back to Course
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    <CustomVideoPlayer videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-none mb-4">{selectedLecture.title}</h1>
                      <div className="flex items-center gap-4 text-slate-400 font-black text-[10px] uppercase tracking-widest mb-6">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg">Class Recording</span>
                        <span>{selectedLecture.duration} Duration</span>
                      </div>
                      <p className="text-slate-600 font-medium leading-relaxed">{selectedLecture.description || "In this session, we dive deep into the fundamental concepts with practical examples and problem-solving techniques."}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-4">
                    <DoubtSolver currentContext={`Subject: ${selectedCourse?.title}, Lecture: ${selectedLecture.title}`} />
                  </div>
                </div>
              </div>
           )}

           {activeView === 'admin' && (
              <AdminPanel 
                userRole={user.role} 
                courses={courses} 
                setCourses={setCourses} 
                onClose={() => setActiveView('home')} 
                siteSettings={siteSettings} 
                setSiteSettings={setSiteSettings} 
              />
           )}
           {activeView === 'profile' && <ProfileSection user={user as any} onUpdate={(u) => { setUser(u as any); localStorage.setItem('study_portal_user', JSON.stringify(u)); }} onLogout={() => { setUser(null); localStorage.removeItem('study_portal_user'); setActiveView('home'); }} />}
        </main>

        {/* Bottom Nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-slate-100 flex items-center px-4 z-50 pb-2">
           <BottomNavItem icon={<Home size={22}/>} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')}/>
           <BottomNavItem icon={<BookOpen size={22}/>} label="Learning" active={activeView === 'course'} onClick={() => setActiveView('course')}/>
           <BottomNavItem icon={<Trophy size={22}/>} label="Tests" active={activeView === 'tests'} onClick={() => setActiveView('tests')}/>
           <BottomNavItem icon={<UserIcon size={22}/>} label="Account" active={activeView === 'profile'} onClick={() => setActiveView('profile')}/>
        </nav>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      {paymentCourse && <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} onClose={() => setPaymentCourse(null)} onSuccess={() => { setEnrolledBatches([...enrolledBatches, paymentCourse.id]); setPaymentCourse(null); }} />}
    </div>
  );
};

export default App;
