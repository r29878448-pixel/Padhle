
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, ChevronRight, Loader2, Layers, Folder, Play, Bell, ChevronLeft,
  Clock, Radio, FileText, Download, Target, Calendar,
  RefreshCw, Zap, HelpCircle, ShieldCheck
} from 'lucide-react';
import { Course, Lecture, Banner, SiteSettings } from './types';
import { COURSES } from './constants';
import CustomVideoPlayer from './components/CustomVideoPlayer';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import PaymentModal from './components/PaymentModal';
import { 
  subscribeToCourses, 
  getSiteSettings, 
  subscribeToBanners
} from './services/db';

type UserRole = 'student' | 'admin' | 'manager';

const BottomNavItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 py-3 transition-all ${active ? 'text-blue-500' : 'text-slate-500'}`}>
    <div className={`transition-transform duration-500 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'course' | 'video' | 'admin' | 'profile' | 'tests'>('home');
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, role: UserRole} | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([]);
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ 
    appName: 'Delta Study', 
    botName: 'Delta AI', 
    shortenerUrl: '', 
    shortenerApiKey: '',
    adminEmail: 'admin@deltastudy.com'
  });

  const fetchData = useCallback(() => {
    setLastSync(new Date());
    
    const unsubCourses = subscribeToCourses((dbCourses) => {
      const merged = [...COURSES];
      dbCourses.forEach(dbC => {
        const idx = merged.findIndex(c => c.id === dbC.id);
        if (idx > -1) merged[idx] = dbC;
        else merged.push(dbC);
      });
      setCourses(merged);
    });

    const unsubBanners = subscribeToBanners(setBanners);
    getSiteSettings().then(s => s && setSiteSettings(s));
    
    setIsLoading(false);
    return () => { unsubCourses(); unsubBanners(); };
  }, []);

  useEffect(() => {
    const cleanup = fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000);

    const savedUser = localStorage.getItem('study_portal_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    const savedEnrollments = localStorage.getItem('study_portal_enrollments');
    if (savedEnrollments) setEnrolledBatches(JSON.parse(savedEnrollments));

    return () => {
      if (typeof cleanup === 'function') cleanup();
      clearInterval(interval);
    };
  }, [fetchData]);

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

  if (isLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#020617] gap-6">
      <Loader2 className="animate-spin text-blue-500" size={56} strokeWidth={1} />
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Synchronizing Delta Core...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[160px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600 rounded-full blur-[160px]"></div>
        </div>
        <div className="max-w-md w-full space-y-12 animate-delta relative z-10">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl mx-auto shadow-2xl shadow-blue-500/40">
            {siteSettings.appName?.charAt(0) || 'D'}
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase italic">{siteSettings.appName || 'Delta Study'}</h1>
            <p className="text-blue-500 font-bold uppercase tracking-widest text-[9px]">India's Premier Digital Academy</p>
          </div>
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3">
             <UserIcon size={20}/> Unlock Academy Portal
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
    <div className="min-h-screen bg-[#020617] flex flex-col md:flex-row font-sans text-slate-100">
      {/* Delta Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen z-[150] w-72 bg-[#0f172a] border-r border-white/5 flex flex-col transition-transform duration-500 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 border-b border-white/5 flex items-center gap-4 cursor-pointer" onClick={() => setActiveView('home')}>
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            {siteSettings.appName?.charAt(0) || 'D'}
          </div>
          <div>
            <span className="text-lg font-black text-white uppercase italic tracking-tighter leading-none block">{siteSettings.appName || 'Delta Study'}</span>
            <span className="text-[7px] font-black text-blue-500 uppercase tracking-widest block mt-1.5">Alpha Platform</span>
          </div>
        </div>
        
        <nav className="flex-1 py-10 px-8 space-y-2">
          <button onClick={() => {setActiveView('home'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'home' ? 'text-blue-400 bg-blue-500/10 shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            <Home size={18}/> Home
          </button>
          <button onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'course' ? 'text-blue-400 bg-blue-500/10 shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
            <BookOpen size={18}/> My Library
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/5">
            <Target size={18}/> Test Engine
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-white/5">
            <Calendar size={18}/> Schedule
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'admin' ? 'text-blue-400 bg-blue-500/10 shadow-sm' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <Layers size={18}/> Master Control
            </button>
          )}
        </nav>

        <div className="p-8">
           <button onClick={() => {setActiveView('profile'); setIsSidebarOpen(false);}} className="w-full flex items-center gap-4 p-5 bg-[#1e293b] rounded-[2rem] border border-white/5 group hover:border-blue-500/50 transition-all">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white"><UserIcon size={18}/></div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] font-black text-white uppercase truncate leading-none">{user?.name || 'User'}</p>
                <p className="text-[7px] font-black text-blue-500 uppercase tracking-widest mt-1">Academy Access</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col min-h-0 relative pb-24 md:pb-0 overflow-y-auto">
        <header className="h-20 delta-glass flex items-center px-6 md:px-12">
           <div className="flex-1 flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span className="text-[8px] font-black uppercase tracking-widest">Network: Optimized ({lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <button className="p-3 bg-white/5 rounded-2xl text-slate-400 hover:text-blue-400 transition-all relative">
                <Bell size={20}/>
                <span className="absolute top-3 right-3 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#020617]"></span>
              </button>
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-blue-600 text-white rounded-2xl"><Menu size={20}/></button>
           </div>
        </header>

        <main className="p-6 md:p-12 max-w-7xl mx-auto w-full">
           {activeView === 'home' && (
              <div className="space-y-16 animate-delta">
                 {/* Delta Hero */}
                 <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl bg-slate-950 h-72 md:h-[32rem] group border border-white/5">
                    <img alt="Hero" src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200"} className="w-full h-full object-cover opacity-50 group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-24 bg-gradient-to-r from-[#020617] via-transparent to-transparent">
                       <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full mb-8 w-fit">
                          <Zap size={14} className="fill-white"/> Sync Status: Active
                       </div>
                       <h1 className="text-4xl md:text-8xl font-black text-white leading-[1.1] uppercase italic tracking-tighter">Accelerate<br/><span className="delta-gradient-text underline decoration-white/10 underline-offset-[16px]">Your Growth.</span></h1>
                    </div>
                 </div>

                 {/* Filters */}
                 <div className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-3">
                          <Layers size={20} className="text-blue-500"/> Selection Feed
                       </h3>
                    </div>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                        {categories.map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`segment-btn ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-[#0f172a] text-slate-500 border-white/5 hover:border-blue-500/30'}`}
                          >
                              {cat}
                          </button>
                        ))}
                    </div>
                 </div>

                 {/* Delta Batches */}
                 <section className="space-y-12">
                    <div className="flex items-center justify-between">
                       <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter flex items-center gap-4">Active Academy</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                       {filteredCourses.map(course => (
                          <div 
                            key={course.id} 
                            onClick={() => handleCourseClick(course)}
                            className="delta-card flex flex-col group cursor-pointer"
                          >
                             <div className="aspect-[16/9] overflow-hidden relative">
                                <img alt={course.title} src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute top-8 left-8 px-5 py-2 bg-blue-600 text-white text-[8px] font-black uppercase tracking-widest rounded-xl shadow-xl">
                                   {course.category}
                                </div>
                             </div>
                             <div className="p-10 flex-1 flex flex-col">
                                <h3 className="font-black text-white uppercase italic tracking-tighter mb-4 text-3xl group-hover:text-blue-400 transition-colors leading-tight line-clamp-2">{course.title}</h3>
                                <div className="flex items-center gap-3 mb-10">
                                   <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center text-blue-500">
                                      <ShieldCheck size={16} />
                                   </div>
                                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Expert Instructor</p>
                                </div>
                                
                                <div className="mt-auto pt-10 border-t border-white/5 flex items-center justify-between">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-2">Investment</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black text-white">{enrolledBatches.includes(course.id) ? 'ACTIVE' : (course.price > 0 ? `₹${course.price}` : 'OPEN')}</span>
                                      </div>
                                   </div>
                                   <div className="w-16 h-16 bg-white/5 rounded-[2rem] flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                      <ChevronRight size={28}/>
                                   </div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 </section>
              </div>
           )}

           {activeView === 'course' && selectedCourse && (
              <div className="animate-delta pb-20">
                 <button onClick={() => setActiveView('home')} className="mb-12 flex items-center gap-3 text-slate-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
                    <ChevronLeft size={16}/> Return Home
                 </button>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-4">
                       <div className="bg-[#0f172a] rounded-[3.5rem] border border-white/5 p-12 shadow-sm text-center sticky top-32 overflow-hidden">
                          <img alt={selectedCourse.title} src={selectedCourse.image} className="w-full rounded-[2.5rem] mb-10 shadow-2xl border border-white/5" />
                          <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight mb-8">{selectedCourse.title}</h2>
                          <div className="flex items-center justify-center gap-4 mb-12">
                             <span className="px-5 py-2 bg-blue-500/10 text-blue-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">{selectedCourse.category}</span>
                             <span className="px-5 py-2 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Active License</span>
                          </div>
                          <div className="space-y-4">
                             {selectedCourse.subjects.map(sub => (
                                <div key={sub.id} className="w-full p-6 bg-[#1e293b] border border-white/5 rounded-2xl text-left flex items-center justify-between group hover:bg-blue-600 hover:text-white transition-all">
                                   <span className="text-[12px] font-black uppercase tracking-tight">{sub.title}</span>
                                   <span className="text-[10px] font-bold text-slate-400 group-hover:text-white/70">{sub.chapters.length} Modules</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    
                    <div className="lg:col-span-8 space-y-20">
                       {selectedCourse.subjects.map(subject => (
                          <div key={subject.id} className="space-y-12">
                             <div className="flex items-center gap-6">
                               <div className="w-3 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20"></div>
                               <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter">{subject.title} Feed</h3>
                             </div>
                             
                             <div className="space-y-10">
                                {subject.chapters.map(chapter => (
                                   <div key={chapter.id} className="bg-[#0f172a] border border-white/5 rounded-[3.5rem] p-12 shadow-sm overflow-hidden">
                                      <div className="flex items-center gap-5 mb-12 pb-8 border-b border-white/5">
                                        <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400"><Folder size={26}/></div>
                                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{chapter.title}</h4>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 gap-8">
                                         {chapter.lectures.map(lecture => (
                                            <button 
                                              key={lecture.id}
                                              onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                              className="p-8 bg-[#1e293b]/50 rounded-[3rem] border border-white/5 flex items-center justify-between hover:bg-blue-600 hover:text-white transition-all group active:scale-[0.98]"
                                            >
                                               <div className="flex items-center gap-10">
                                                  <div className="w-48 h-28 bg-[#020617] rounded-3xl flex items-center justify-center text-slate-700 relative overflow-hidden shrink-0 border border-white/5">
                                                     {lecture.thumbnail ? (
                                                        <img alt={lecture.title} src={lecture.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                     ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <Play size={32} fill="currentColor"/>
                                                        </div>
                                                     )}
                                                  </div>
                                                  <div className="text-left min-w-0">
                                                     <p className="text-xl font-black text-white uppercase group-hover:text-white transition-colors tracking-tight leading-none truncate">{lecture.title}</p>
                                                     <div className="flex items-center gap-8 mt-5">
                                                        <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${lecture.duration === 'LIVE' ? 'text-blue-400 group-hover:text-white' : 'text-slate-500 group-hover:text-white/70'}`}>
                                                           {lecture.duration === 'LIVE' ? <Radio size={14}/> : <Clock size={14}/>} {lecture.duration}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-500 group-hover:text-white/70 uppercase tracking-widest flex items-center gap-2">
                                                           <FileText size={14}/> {lecture.resources?.length || 0} Assets
                                                        </span>
                                                     </div>
                                                  </div>
                                               </div>
                                               <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-600 group-hover:text-white transition-all"><ChevronRight size={28}/></div>
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
              <div className="animate-delta pb-24">
                <button onClick={() => setActiveView('course')} className="mb-12 flex items-center gap-3 text-slate-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
                  <ChevronLeft size={16}/> Return to Batch
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-8 space-y-12">
                    <CustomVideoPlayer videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    
                    <div className="bg-[#0f172a] p-16 rounded-[4rem] border border-white/5 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-12">
                        <div>
                          <h1 className="text-5xl font-black text-white uppercase italic tracking-tighter leading-tight">{selectedLecture.title}</h1>
                          <div className="flex items-center gap-6 mt-6">
                            <span className="px-6 py-2.5 bg-blue-500/10 text-blue-400 rounded-2xl text-[11px] font-black uppercase tracking-widest">Alpha Content</span>
                            <span className="px-6 py-2.5 bg-white/5 text-slate-500 rounded-2xl text-[11px] font-black uppercase tracking-widest">{selectedLecture.duration} Playback</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-slate-400 text-lg font-medium leading-relaxed mb-16">{selectedLecture.description || "In-depth academic module optimized for competitive excellence."}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-white/5 pt-16">
                         <div className="space-y-8">
                            <h3 className="text-2xl font-black text-white uppercase italic flex items-center gap-4 tracking-tight">
                               <FileText size={26} className="text-blue-500"/> Module Notes
                            </h3>
                            <div className="space-y-4">
                               {selectedLecture.resources?.filter(r => r.type === 'pdf').map(res => (
                                  <div key={res.id} className="flex items-center justify-between p-7 bg-[#1e293b] rounded-[2.5rem] group hover:bg-blue-600 hover:text-white transition-all">
                                    <div className="flex items-center gap-5">
                                      <FileText size={22} className="text-blue-500 group-hover:text-white" />
                                      <p className="text-[12px] font-black uppercase tracking-tight">{res.title}</p>
                                    </div>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-white/10 rounded-xl text-slate-400 group-hover:text-white"><Download size={22}/></a>
                                  </div>
                               ))}
                            </div>
                         </div>
                         <div className="space-y-8">
                            <h3 className="text-2xl font-black text-white uppercase italic flex items-center gap-4 tracking-tight">
                               <Target size={26} className="text-indigo-500"/> Practical (DPP)
                            </h3>
                            <div className="space-y-4">
                               {selectedLecture.resources?.filter(r => r.type === 'dpp').map(res => (
                                  <div key={res.id} className="flex items-center justify-between p-7 bg-[#1e293b] rounded-[2.5rem] group hover:bg-indigo-600 hover:text-white transition-all">
                                    <div className="flex items-center gap-5">
                                      <Target size={22} className="text-indigo-500 group-hover:text-white" />
                                      <p className="text-[12px] font-black uppercase tracking-tight">{res.title}</p>
                                    </div>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-white/10 rounded-xl text-slate-400 group-hover:text-white"><Download size={22}/></a>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-4 space-y-12">
                    <div className="bg-[#0f172a] p-12 rounded-[3.5rem] border border-white/5 shadow-sm sticky top-32 overflow-hidden">
                       <h3 className="text-[13px] font-black text-white uppercase tracking-[0.3em] mb-12 flex items-center gap-3">
                          <Zap size={20} className="text-blue-500"/> Delta Sync
                       </h3>
                       <div className="space-y-6">
                          {[
                            { label: "Stream Ingested", done: true },
                            { label: "Visual Sync", done: true },
                            { label: "Resource Mapping", done: true }
                          ].map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all ${item.done ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-white/5 border-white/5 text-slate-500'}`}>
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 ${item.done ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-800'}`}>
                                  {item.done && <ChevronRight size={16} strokeWidth={4}/>}
                               </div>
                               <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                            </div>
                          ))}
                       </div>
                       <div className="mt-12 p-10 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-500/30 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">Support Engine</p>
                          <h4 className="text-xl font-black uppercase italic tracking-tighter mb-8">AI Doubts</h4>
                          <button className="w-full bg-white text-blue-600 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-100 transition-all">Launch Delta AI</button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
           )}

           {activeView === 'admin' && (
              <AdminPanel 
                userRole={user.role} 
                courses={courses} 
                onClose={() => setActiveView('home')} 
                siteSettings={siteSettings} 
                setSiteSettings={setSiteSettings} 
              />
           )}
           {activeView === 'profile' && <ProfileSection user={user as any} onUpdate={(u) => { setUser(u as any); localStorage.setItem('study_portal_user', JSON.stringify(u)); }} onLogout={() => { setUser(null); localStorage.removeItem('study_portal_user'); setActiveView('home'); }} />}
        </main>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/5 flex items-center px-4 z-[200] pb-2 shadow-[0_-20px_60px_rgba(0,0,0,0.5)]">
           <BottomNavItem icon={<Home size={24}/>} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')}/>
           <BottomNavItem icon={<BookOpen size={24}/>} label="Library" active={activeView === 'course'} onClick={() => setActiveView('course')}/>
           <BottomNavItem icon={<Target size={24}/>} label="Tests" active={activeView === 'tests'} onClick={() => {}}/>
           <BottomNavItem icon={<UserIcon size={24}/>} label="Account" active={activeView === 'profile'} onClick={() => setActiveView('profile')}/>
        </nav>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      {paymentCourse && <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} onClose={() => setPaymentCourse(null)} onSuccess={() => { setEnrolledBatches([...enrolledBatches, paymentCourse.id]); setPaymentCourse(null); }} />}
    </div>
  );
};

export default App;
