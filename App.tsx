
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
import { runDeltaAutoSync } from './services/automation';
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
  const [isSyncing, setIsSyncing] = useState(false);
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

  const handleSyncBatch = async (course: Course) => {
    if (!course.shortLink) return alert("No source URL attached to this batch.");
    setIsSyncing(true);
    try {
      await runDeltaAutoSync(course.shortLink, courses, (log) => {
        console.log(`Sync Log: ${log.message}`);
      });
      alert("Batch successfully synchronized with Delta Source.");
    } catch (e) {
      alert("Sync failed. Source server might be down.");
    } finally {
      setIsSyncing(false);
    }
  };

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
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Establishing Sync...</p>
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
            <p className="text-blue-500 font-bold uppercase tracking-widest text-[9px]">Alpha Learning Portal</p>
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
                <span className="text-[8px] font-black uppercase tracking-widest">Live Sync: Active ({lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})})</span>
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
                       <h1 className="text-4xl md:text-8xl font-black text-white leading-[1.1] uppercase italic tracking-tighter">Accelerate<br/><span className="delta-gradient-text underline decoration-white/10 underline-offset-[16px]">Your Future.</span></h1>
                    </div>
                 </div>

                 {/* Filters */}
                 <div className="space-y-8">
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
                                <h3 className="font-black text-white uppercase italic tracking-tighter mb-4 text-2xl group-hover:text-blue-400 transition-colors leading-tight line-clamp-2">{course.title}</h3>
                                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-10">{course.instructor}</p>
                                
                                <div className="mt-auto pt-10 border-t border-white/5 flex items-center justify-between">
                                   <span className="text-2xl font-black text-white">{enrolledBatches.includes(course.id) ? 'ACTIVE' : (course.price > 0 ? `₹${course.price}` : 'OPEN')}</span>
                                   <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                      <ChevronRight size={22}/>
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
                 <div className="flex items-center justify-between mb-12">
                   <button onClick={() => setActiveView('home')} className="flex items-center gap-3 text-slate-500 hover:text-blue-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
                      <ChevronLeft size={16}/> Return Home
                   </button>
                   {(user?.role === 'admin' || user?.role === 'manager') && selectedCourse.shortLink && (
                     <button 
                       onClick={() => handleSyncBatch(selectedCourse)} 
                       disabled={isSyncing}
                       className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/20"
                     >
                       {isSyncing ? <Loader2 className="animate-spin" size={16}/> : <RefreshCw size={16}/>}
                       {isSyncing ? 'Syncing...' : 'Sync Batch Source'}
                     </button>
                   )}
                 </div>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    <div className="lg:col-span-4">
                       <div className="bg-[#0f172a] rounded-[3.5rem] border border-white/5 p-10 shadow-sm text-center sticky top-32">
                          <img alt={selectedCourse.title} src={selectedCourse.image} className="w-full rounded-[2.5rem] mb-10 shadow-2xl" />
                          <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-tight mb-8">{selectedCourse.title}</h2>
                          <div className="space-y-3">
                             {selectedCourse.subjects.map(sub => (
                                <div key={sub.id} className="w-full p-6 bg-[#1e293b] border border-white/5 rounded-2xl text-left flex items-center justify-between">
                                   <span className="text-[11px] font-black uppercase tracking-tight text-slate-300">{sub.title}</span>
                                   <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{sub.chapters.length} Units</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    
                    <div className="lg:col-span-8 space-y-16">
                       {selectedCourse.subjects.map(subject => (
                          <div key={subject.id} className="space-y-10">
                             <div className="flex items-center gap-5">
                               <div className="w-2 h-10 bg-blue-600 rounded-full"></div>
                               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">{subject.title} Catalog</h3>
                             </div>
                             
                             <div className="space-y-8">
                                {subject.chapters.map(chapter => (
                                   <div key={chapter.id} className="bg-[#0f172a] border border-white/5 rounded-[3rem] p-10 shadow-sm">
                                      <div className="flex items-center gap-4 mb-10 pb-6 border-b border-white/5">
                                        <Folder size={22} className="text-blue-400"/>
                                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{chapter.title}</h4>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 gap-6">
                                         {chapter.lectures.map(lecture => (
                                            <button 
                                              key={lecture.id}
                                              onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                              className="p-6 bg-[#1e293b]/50 rounded-[2rem] border border-white/5 flex items-center justify-between hover:bg-blue-600 hover:text-white transition-all group active:scale-[0.98]"
                                            >
                                               <div className="flex items-center gap-8 min-w-0">
                                                  <div className="w-40 h-22 bg-black rounded-2xl overflow-hidden shrink-0 border border-white/5">
                                                     {lecture.thumbnail && <img alt={lecture.title} src={lecture.thumbnail} className="w-full h-full object-cover group-hover:scale-105 transition-all" />}
                                                  </div>
                                                  <div className="text-left min-w-0">
                                                     <p className="text-lg font-black text-white uppercase group-hover:text-white tracking-tight truncate leading-none mb-3">{lecture.title}</p>
                                                     <div className="flex items-center gap-6">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${lecture.duration === 'LIVE' ? 'text-blue-400 group-hover:text-white' : 'text-slate-500 group-hover:text-white'}`}>
                                                           {lecture.duration === 'LIVE' ? <Radio size={12}/> : <Clock size={12}/>} {lecture.duration}
                                                        </span>
                                                        <span className="text-[8px] font-black text-slate-500 group-hover:text-white uppercase tracking-widest flex items-center gap-2">
                                                           <FileText size={12}/> {lecture.resources?.length || 0} Assets
                                                        </span>
                                                     </div>
                                                  </div>
                                               </div>
                                               <ChevronRight size={24} className="text-slate-700 group-hover:text-white"/>
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
                    
                    <div className="bg-[#0f172a] p-12 rounded-[3rem] border border-white/5 shadow-sm">
                      <div className="mb-10">
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-tight">{selectedLecture.title}</h1>
                        <div className="flex items-center gap-4 mt-6">
                           <span className="px-5 py-2 bg-blue-500/10 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest">Alpha Stream</span>
                           <span className="px-5 py-2 bg-white/5 text-slate-500 rounded-xl text-[10px] font-black uppercase tracking-widest">{selectedLecture.duration} Duration</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-white/5 pt-12">
                         <div className="space-y-6">
                            <h3 className="text-xl font-black text-white uppercase italic flex items-center gap-3 tracking-tight">
                               <FileText size={22} className="text-blue-500"/> Study Material
                            </h3>
                            <div className="space-y-3">
                               {selectedLecture.resources?.map(res => (
                                  <a key={res.id} href={res.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-6 bg-[#1e293b] rounded-[1.5rem] group hover:bg-blue-600 transition-all">
                                    <div className="flex items-center gap-4">
                                      <FileText size={18} className="text-blue-500 group-hover:text-white" />
                                      <p className="text-[11px] font-black uppercase text-slate-300 group-hover:text-white truncate">{res.title}</p>
                                    </div>
                                    <Download size={18} className="text-slate-600 group-hover:text-white"/>
                                  </a>
                               ))}
                               {!selectedLecture.resources?.length && <p className="text-[10px] font-black uppercase text-slate-600 p-6 bg-white/5 rounded-2xl italic">No resources attached yet.</p>}
                            </div>
                         </div>
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

        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-[#0f172a]/95 backdrop-blur-2xl border-t border-white/5 flex items-center px-4 z-[200] pb-2">
           <BottomNavItem icon={<Home size={24}/>} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')}/>
           <BottomNavItem icon={<BookOpen size={24}/>} label="Library" active={activeView === 'course'} onClick={() => setActiveView('course')}/>
           <BottomNavItem icon={<UserIcon size={24}/>} label="Account" active={activeView === 'profile'} onClick={() => setActiveView('profile')}/>
        </nav>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      {paymentCourse && <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} onClose={() => setPaymentCourse(null)} onSuccess={() => { setEnrolledBatches([...enrolledBatches, paymentCourse.id]); setPaymentCourse(null); }} />}
    </div>
  );
};

export default App;
