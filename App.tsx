import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, ChevronRight, Loader2, Layers, Folder, Play, Bell, ChevronLeft,
  Clock, Radio, FileText, Download, Target, Calendar,
  RefreshCw, Zap, HelpCircle
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
  <button onClick={onClick} className={`flex flex-col items-center gap-1.5 flex-1 py-3 transition-all ${active ? 'text-blue-600' : 'text-slate-400'}`}>
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
    appName: 'Study Portal', 
    botName: 'Delta AI', 
    shortenerUrl: '', 
    shortenerApiKey: '',
    adminEmail: 'admin@studyportal.com'
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-6">
      <Loader2 className="animate-spin text-blue-600" size={56} strokeWidth={1} />
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Optimizing Classroom...</p>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-12 animate-study">
          <div className="w-24 h-24 bg-blue-600 rounded-[2.5rem] flex items-center justify-center text-white font-black text-4xl mx-auto shadow-2xl shadow-blue-500/20">
            {siteSettings.appName?.charAt(0) || 'S'}
          </div>
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase italic">{siteSettings.appName || 'Study Portal'}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">India's Premium Educational Sync Engine</p>
          </div>
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3">
             <UserIcon size={20}/> Enter Your Portal
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
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row font-sans text-slate-900">
      {/* Sidebar Navigation */}
      <aside className={`fixed md:sticky top-0 h-screen z-[150] w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-500 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-10 border-b border-slate-50 flex items-center gap-4 cursor-pointer" onClick={() => setActiveView('home')}>
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            {siteSettings.appName?.charAt(0) || 'S'}
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none block">{siteSettings.appName || 'Study Portal'}</span>
            <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest block mt-1.5">Alpha Learning</span>
          </div>
        </div>
        
        <nav className="flex-1 py-10 px-8 space-y-2">
          <button onClick={() => {setActiveView('home'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'home' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Home size={18}/> Home
          </button>
          <button onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'course' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
            <BookOpen size={18}/> My Batches
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50">
            <Target size={18}/> Test Series
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 hover:bg-slate-50">
            <Calendar size={18}/> Planner
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeView === 'admin' ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Layers size={18}/> Management
            </button>
          )}
        </nav>

        <div className="p-8">
           <button onClick={() => {setActiveView('profile'); setIsSidebarOpen(false);}} className="w-full flex items-center gap-4 p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><UserIcon size={18}/></div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] font-black text-slate-900 uppercase truncate leading-none">{user?.name || 'User'}</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest mt-1">Classroom Access</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative pb-24 md:pb-0 overflow-y-auto">
        <header className="h-20 study-glass flex items-center px-6 md:px-12">
           <div className="flex-1 flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full border border-blue-100">
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                <span className="text-[8px] font-black uppercase tracking-widest">Last Sync: {lastSync.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
           </div>
           <div className="flex items-center gap-6">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-[10px] font-black uppercase text-slate-900 tracking-tighter leading-none">Academic 2024-25</p>
                <p className="text-[7px] font-bold uppercase text-blue-600 tracking-widest mt-1">Sync: Optimal</p>
              </div>
              <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all relative">
                <Bell size={20}/>
                <span className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-slate-900 text-white rounded-2xl"><Menu size={20}/></button>
           </div>
        </header>

        <main className="p-6 md:p-12 max-w-7xl mx-auto w-full">
           {activeView === 'home' && (
              <div className="space-y-16 animate-study">
                 {/* Hero Promotion */}
                 <div className="relative rounded-[3.5rem] overflow-hidden shadow-2xl bg-slate-950 h-72 md:h-[32rem] group">
                    <img alt="Hero" src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-24 bg-gradient-to-r from-slate-950/90 via-transparent to-transparent">
                       <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.4em] rounded-full mb-8 w-fit">
                          <Zap size={14} className="fill-white"/> New Academic Session
                       </div>
                       <h1 className="text-4xl md:text-8xl font-black text-white leading-[1.1] uppercase italic tracking-tighter">Your Future<br/><span className="text-blue-500 underline decoration-white/10 underline-offset-[16px]">Starts Here.</span></h1>
                    </div>
                 </div>

                 {/* Segmentation Bar */}
                 <div className="space-y-8">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] flex items-center gap-3">
                       <Layers size={20} className="text-blue-600"/> Browse Segments
                    </h3>
                    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4">
                        {categories.map(cat => (
                          <button 
                            key={cat} 
                            onClick={() => setSelectedCategory(cat)}
                            className={`segment-btn ${selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-2xl' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}
                          >
                              {cat}
                          </button>
                        ))}
                    </div>
                 </div>

                 {/* Batch Gallery */}
                 <section className="space-y-12">
                    <div className="flex items-center justify-between">
                       <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-4">Active Batches</h2>
                       <div className="flex items-center gap-3">
                          <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Enrolling Now</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                       {filteredCourses.map(course => (
                          <div 
                            key={course.id} 
                            onClick={() => handleCourseClick(course)}
                            className="study-card flex flex-col group cursor-pointer"
                          >
                             <div className="aspect-[16/9] overflow-hidden relative">
                                <img alt={course.title} src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                                <div className="absolute top-8 left-8 px-5 py-2 bg-white/95 backdrop-blur-md rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-900 border border-white/20 shadow-xl">
                                   {course.category}
                                </div>
                             </div>
                             <div className="p-10 flex-1 flex flex-col">
                                <h3 className="font-black text-slate-900 uppercase italic tracking-tighter mb-4 text-3xl group-hover:text-blue-600 transition-colors leading-tight line-clamp-2">{course.title}</h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mb-10 flex items-center gap-2">
                                   <UserIcon size={16} className="text-blue-500" /> {course.instructor || 'Portal Faculty'}
                                </p>
                                
                                <div className="mt-auto pt-10 border-t border-slate-50 flex items-center justify-between">
                                   <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Academic Access</span>
                                      <div className="flex items-center gap-3">
                                        <span className="text-3xl font-black text-slate-900">{enrolledBatches.includes(course.id) ? 'ENROLLED' : (course.price > 0 ? `₹${course.price}` : 'FREE')}</span>
                                        {course.originalPrice && !enrolledBatches.includes(course.id) && (
                                          <span className="text-[12px] text-slate-300 line-through font-bold">₹{course.originalPrice}</span>
                                        )}
                                      </div>
                                   </div>
                                   <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
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
              <div className="animate-study pb-20">
                 <button onClick={() => setActiveView('home')} className="mb-12 flex items-center gap-3 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
                    <ChevronLeft size={16}/> Back to Main Feed
                 </button>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Batch Summary */}
                    <div className="lg:col-span-4">
                       <div className="bg-white rounded-[3.5rem] border border-slate-100 p-12 shadow-sm text-center sticky top-32 overflow-hidden">
                          <img alt={selectedCourse.title} src={selectedCourse.image} className="w-full rounded-[2.5rem] mb-10 shadow-2xl border border-slate-50" />
                          <h2 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight mb-8">{selectedCourse.title}</h2>
                          <div className="flex items-center justify-center gap-4 mb-12">
                             <span className="px-5 py-2 bg-blue-50 text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">{selectedCourse.category}</span>
                             <span className="px-5 py-2 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest">Active License</span>
                          </div>
                          <div className="space-y-4">
                             {selectedCourse.subjects.map(sub => (
                                <div key={sub.id} className="w-full p-6 bg-slate-50 border border-slate-50 rounded-2xl text-left flex items-center justify-between group hover:bg-slate-900 hover:text-white transition-all">
                                   <span className="text-[12px] font-black uppercase tracking-tight">{sub.title}</span>
                                   <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-400">{sub.chapters.length} Units</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    
                    {/* Curriculum Content */}
                    <div className="lg:col-span-8 space-y-20">
                       {selectedCourse.subjects.map(subject => (
                          <div key={subject.id} className="space-y-12">
                             <div className="flex items-center gap-6">
                               <div className="w-3 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-500/20"></div>
                               <h3 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter">{subject.title} Curriculum</h3>
                             </div>
                             
                             <div className="space-y-10">
                                {subject.chapters.map(chapter => (
                                   <div key={chapter.id} className="bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm overflow-hidden">
                                      <div className="flex items-center gap-5 mb-12 pb-8 border-b border-slate-50">
                                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600"><Folder size={26}/></div>
                                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{chapter.title}</h4>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 gap-8">
                                         {chapter.lectures.map(lecture => (
                                            <button 
                                              key={lecture.id}
                                              onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                              className="p-8 bg-slate-50 rounded-[3rem] border border-slate-50 flex items-center justify-between hover:bg-white hover:border-blue-600 transition-all group shadow-sm active:scale-[0.98]"
                                            >
                                               <div className="flex items-center gap-10">
                                                  {/* Lecture Thumbnail Implementation */}
                                                  <div className="w-48 h-28 bg-white rounded-3xl flex items-center justify-center text-slate-300 relative overflow-hidden shrink-0 border border-slate-100 shadow-sm">
                                                     {lecture.thumbnail ? (
                                                        <img alt={lecture.title} src={lecture.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                     ) : (
                                                        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                                                            <Play size={32} fill="currentColor"/>
                                                        </div>
                                                     )}
                                                     {lecture.duration === 'LIVE' && (
                                                       <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                                         <div className="live-badge">LIVE SESSION</div>
                                                       </div>
                                                     )}
                                                  </div>
                                                  <div className="text-left min-w-0">
                                                     <p className="text-xl font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors tracking-tight leading-none truncate">{lecture.title}</p>
                                                     <div className="flex items-center gap-8 mt-5">
                                                        <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${lecture.duration === 'LIVE' ? 'text-red-600' : 'text-slate-400'}`}>
                                                           {lecture.duration === 'LIVE' ? <Radio size={14}/> : <Clock size={14}/>} {lecture.duration}
                                                        </span>
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                           <FileText size={14}/> {lecture.resources?.length || 0} Materials
                                                        </span>
                                                     </div>
                                                  </div>
                                               </div>
                                               <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-slate-200 group-hover:text-blue-600 shadow-sm transition-all"><ChevronRight size={28}/></div>
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
              <div className="animate-study pb-24">
                <button onClick={() => setActiveView('course')} className="mb-12 flex items-center gap-3 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all">
                  <ChevronLeft size={16}/> Back to Curriculum
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                  <div className="lg:col-span-8 space-y-12">
                    <CustomVideoPlayer videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    
                    <div className="bg-white p-16 rounded-[4rem] border border-slate-100 shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8 mb-12">
                        <div>
                          <h1 className="text-5xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">{selectedLecture.title}</h1>
                          <div className="flex items-center gap-6 mt-6">
                            <span className="px-6 py-2.5 bg-blue-50 text-blue-600 rounded-2xl text-[11px] font-black uppercase tracking-widest">Premium Content</span>
                            <span className="px-6 py-2.5 bg-slate-50 text-slate-400 rounded-2xl text-[11px] font-black uppercase tracking-widest">{selectedLecture.duration} Duration</span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-slate-600 text-lg font-medium leading-relaxed mb-16">{selectedLecture.description || "Expert session covering fundamental to advanced core principles."}</p>
                      
                      {/* Resources Organization (PW Style) */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-t border-slate-50 pt-16">
                         <div className="space-y-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-4 tracking-tight">
                               <FileText size={26} className="text-blue-600"/> Batch Notes
                            </h3>
                            <div className="space-y-4">
                               {selectedLecture.resources?.filter(r => r.type === 'pdf').map(res => (
                                  <div key={res.id} className="flex items-center justify-between p-7 bg-slate-50 rounded-[2.5rem] group hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                    <div className="flex items-center gap-5">
                                      <FileText size={22} className="text-blue-500 group-hover:text-white" />
                                      <p className="text-[12px] font-black uppercase tracking-tight">{res.title}</p>
                                    </div>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-white/20 rounded-xl text-slate-400 group-hover:text-white"><Download size={22}/></a>
                                  </div>
                               ))}
                               {!selectedLecture.resources?.some(r => r.type === 'pdf') && <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-[10px] font-black text-slate-300 uppercase">Updating Notes...</div>}
                            </div>
                         </div>
                         <div className="space-y-8">
                            <h3 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-4 tracking-tight">
                               <Target size={26} className="text-red-600"/> Practice (DPP)
                            </h3>
                            <div className="space-y-4">
                               {selectedLecture.resources?.filter(r => r.type === 'dpp').map(res => (
                                  <div key={res.id} className="flex items-center justify-between p-7 bg-slate-50 rounded-[2.5rem] group hover:bg-red-600 hover:text-white transition-all shadow-sm">
                                    <div className="flex items-center gap-5">
                                      <Target size={22} className="text-red-500 group-hover:text-white" />
                                      <p className="text-[12px] font-black uppercase tracking-tight">{res.title}</p>
                                    </div>
                                    <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-white/20 rounded-xl text-slate-400 group-hover:text-white"><Download size={22}/></a>
                                  </div>
                               ))}
                               {!selectedLecture.resources?.some(r => r.type === 'dpp') && <div className="p-10 border-2 border-dashed border-slate-100 rounded-[2rem] text-center text-[10px] font-black text-slate-300 uppercase">DPP sheets incoming</div>}
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Task Board */}
                  <div className="lg:col-span-4 space-y-12">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-100 shadow-sm sticky top-32 overflow-hidden">
                       <h3 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.3em] mb-12 flex items-center gap-3">
                          <Zap size={20} className="text-blue-600"/> Session Pulse
                       </h3>
                       <div className="space-y-6">
                          {[
                            { label: "Module Ingested", done: true },
                            { label: "Notes Synced", done: false },
                            { label: "DPP Self-Analysis", done: false }
                          ].map((item, idx) => (
                            <div key={idx} className={`flex items-center gap-5 p-6 rounded-[2rem] border transition-all ${item.done ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-slate-50 border-slate-50 text-slate-500'}`}>
                               <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border-2 ${item.done ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200'}`}>
                                  {item.done && <ChevronRight size={16} strokeWidth={4}/>}
                               </div>
                               <span className="text-[11px] font-black uppercase tracking-tight">{item.label}</span>
                            </div>
                          ))}
                       </div>
                       <div className="mt-12 p-10 bg-blue-600 rounded-[3rem] text-white shadow-2xl shadow-blue-500/30 text-center">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50 mb-4">Academic Help</p>
                          <h4 className="text-xl font-black uppercase italic tracking-tighter mb-8">Having Doubts?</h4>
                          <button className="w-full bg-white text-blue-600 py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all">Chat with Delta AI</button>
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

        {/* Global Nav for Mobile */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-24 bg-white/95 backdrop-blur-2xl border-t border-slate-100 flex items-center px-4 z-[200] pb-2 shadow-[0_-20px_60px_rgba(0,0,0,0.06)]">
           <BottomNavItem icon={<Home size={24}/>} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')}/>
           <BottomNavItem icon={<BookOpen size={24}/>} label="Study" active={activeView === 'course'} onClick={() => setActiveView('course')}/>
           <BottomNavItem icon={<Target size={24}/>} label="Tests" active={activeView === 'tests'} onClick={() => {}}/>
           <BottomNavItem icon={<UserIcon size={24}/>} label="Profile" active={activeView === 'profile'} onClick={() => setActiveView('profile')}/>
        </nav>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      {paymentCourse && <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} onClose={() => setPaymentCourse(null)} onSuccess={() => { setEnrolledBatches([...enrolledBatches, paymentCourse.id]); setPaymentCourse(null); }} />}
    </div>
  );
};

export default App;