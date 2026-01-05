
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, ChevronRight, Loader2, Layers, Folder, Play, Bell, ChevronLeft,
  Search, Clock, Radio, GraduationCap, FileText, Download, Target, Calendar
} from 'lucide-react';
import { Course, Lecture, Notice, Banner, SiteSettings, Resource } from './types';
import { COURSES } from './constants';
import CustomVideoPlayer from './components/CustomVideoPlayer';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import PaymentModal from './components/PaymentModal';
import { 
  subscribeToCourses, 
  getSiteSettings, 
  subscribeToNotices, 
  subscribeToBanners
} from './services/db';

type UserRole = 'student' | 'admin' | 'manager';

const BottomNavItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button onClick={onClick} className={`flex flex-col items-center gap-1 flex-1 py-3 ${active ? 'text-blue-600' : 'text-slate-400'}`}>
    <div className={`transition-transform duration-300 ${active ? 'scale-110' : ''}`}>{icon}</div>
    <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);

const ResourceItem: React.FC<{resource: Resource}> = ({resource}) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:border-blue-400 transition-all">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-xl ${resource.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
        <FileText size={18} />
      </div>
      <div>
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{resource.title}</p>
        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{resource.type.toUpperCase()}</p>
      </div>
    </div>
    <a href={resource.url} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-300 hover:text-blue-600 transition-colors">
      <Download size={18} />
    </a>
  </div>
);

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<'home' | 'course' | 'video' | 'admin' | 'profile' | 'planner' | 'tests'>('home');
  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [, setNotices] = useState<Notice[]>([]);
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

  const [siteSettings, setSiteSettings] = useState<SiteSettings>({ 
    appName: 'Study Portal', 
    botName: 'AI Guru', 
    shortenerUrl: '', 
    shortenerApiKey: '',
    adminEmail: 'admin@portal.com'
  });

  useEffect(() => {
    const unsubCourses = subscribeToCourses((dbCourses) => {
      // Robust merge: replace local constant with DB data if ID matches, else keep both
      const merged = [...COURSES];
      dbCourses.forEach(dbC => {
        const idx = merged.findIndex(c => c.id === dbC.id);
        if (idx > -1) merged[idx] = dbC;
        else merged.push(dbC);
      });
      setCourses(merged);
    });
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
        <div className="max-w-md w-full space-y-12 animate-in">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-4xl mx-auto shadow-2xl shadow-blue-600/30">
            {siteSettings.appName.charAt(0)}
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">{siteSettings.appName}</h1>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">Premium Learning Redefined</p>
          </div>
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl flex items-center justify-center gap-3">
             <UserIcon size={20}/> Student Access
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
      {/* Desktop Sidebar */}
      <aside className={`fixed md:sticky top-0 h-screen z-[60] w-72 bg-white border-r border-slate-100 flex flex-col transition-transform duration-500 md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-50 flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            {siteSettings.appName.charAt(0)}
          </div>
          <div>
            <span className="text-lg font-black text-slate-900 uppercase italic tracking-tighter leading-none block">{siteSettings.appName}</span>
            <span className="text-[7px] font-black text-blue-600 uppercase tracking-widest block mt-1">Study Portal Pro</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-auto p-2 text-slate-400"><ChevronLeft/></button>
        </div>
        
        <nav className="flex-1 py-10 px-6 space-y-2">
          <button onClick={() => {setActiveView('home'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'home' ? 'text-blue-600 bg-blue-50 shadow-sm shadow-blue-500/5' : 'text-slate-400 hover:bg-slate-50'}`}>
            <Home size={18}/> Home
          </button>
          <button onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'course' ? 'text-blue-600 bg-blue-50 shadow-sm shadow-blue-500/5' : 'text-slate-400 hover:bg-slate-50'}`}>
            <BookOpen size={18}/> My Library
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50">
            <Calendar size={18}/> Schedule
          </button>
          <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50">
            <Target size={18}/> Test Series
          </button>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeView === 'admin' ? 'text-blue-600 bg-blue-50 shadow-sm shadow-blue-500/5' : 'text-slate-400 hover:bg-slate-50'}`}>
              <Layers size={18}/> Admin Sync
            </button>
          )}
        </nav>

        <div className="p-6">
           <button onClick={() => {setActiveView('profile'); setIsSidebarOpen(false);}} className="w-full flex items-center gap-4 p-4 bg-slate-50 rounded-[1.5rem] border border-slate-100 group">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white"><UserIcon size={18}/></div>
              <div className="text-left overflow-hidden">
                <p className="text-[10px] font-black text-slate-900 uppercase truncate">{user?.name}</p>
                <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest">Portal User</p>
              </div>
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative pb-24 md:pb-0 overflow-y-auto">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 md:px-12 sticky top-0 z-40">
           <div className="flex-1 flex items-center gap-3">
              <GraduationCap className="text-blue-600" size={24} />
              <h2 className="text-[11px] font-black text-slate-900 uppercase tracking-widest hidden sm:block">Welcome back, <span className="text-blue-600">{user.name.split(' ')[0]}</span></h2>
           </div>
           <div className="flex items-center gap-4">
              <button className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-blue-600 transition-all"><Bell size={20}/></button>
              <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-3 bg-slate-900 text-white rounded-2xl"><Menu size={20}/></button>
           </div>
        </header>

        <main className="p-6 md:p-10 max-w-7xl mx-auto w-full">
           {activeView === 'home' && (
              <div className="space-y-10 animate-in">
                 {/* Hero Banner */}
                 <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-950 h-64 md:h-80 group">
                    <img alt="Banner" src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&q=80&w=1200"} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" />
                    <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-20 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent">
                       <span className="text-blue-400 font-black text-[9px] uppercase tracking-[0.4em] mb-4">India's Most Trusted Learning App</span>
                       <h1 className="text-3xl md:text-5xl font-black text-white leading-tight uppercase italic tracking-tighter">Accelerate Your<br/><span className="text-blue-500 underline decoration-white/20 underline-offset-8">Academic Success.</span></h1>
                    </div>
                 </div>

                 {/* Category Selector */}
                 <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {categories.map(cat => (
                       <button 
                         key={cat} 
                         onClick={() => setSelectedCategory(cat)}
                         className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-500/20' : 'bg-white text-slate-500 border-slate-100 hover:border-blue-200'}`}
                       >
                          {cat}
                       </button>
                    ))}
                 </div>

                 {/* Batch Directory */}
                 <section className="space-y-8">
                    <div className="flex items-center justify-between">
                       <h2 className="text-2xl font-black text-slate-900 uppercase italic flex items-center gap-3 tracking-tight">Available Batches</h2>
                       <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">New Admissions Open</span>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       {filteredCourses.map(course => (
                          <div 
                            key={course.id} 
                            onClick={() => handleCourseClick(course)}
                            className="bg-white rounded-[2rem] border border-slate-100 hover:shadow-2xl transition-all cursor-pointer overflow-hidden group flex flex-col relative"
                          >
                             <div className="aspect-[16/9] overflow-hidden relative">
                                <img alt={course.title} src={course.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                                <div className="absolute top-4 left-4 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl text-[8px] font-black uppercase tracking-widest text-slate-900 shadow-lg">
                                   {course.category}
                                </div>
                             </div>
                             <div className="p-8 flex-1 flex flex-col">
                                <h3 className="font-black text-slate-900 uppercase italic tracking-tighter mb-2 text-xl group-hover:text-blue-600 transition-colors leading-tight">{course.title}</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                                   <UserIcon size={12} className="text-blue-500" /> {course.instructor}
                                </p>
                                
                                <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                                   <div className="flex flex-col">
                                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Batch Fee</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg font-black text-slate-900">{enrolledBatches.includes(course.id) ? 'ENROLLED' : (course.price > 0 ? `₹${course.price}` : 'FREE')}</span>
                                        {course.originalPrice && !enrolledBatches.includes(course.id) && (
                                          <span className="text-[10px] text-slate-300 line-through">₹{course.originalPrice}</span>
                                        )}
                                      </div>
                                   </div>
                                   <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                                      <ChevronRight size={20}/>
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
              <div className="animate-in pb-12">
                 <button onClick={() => setActiveView('home')} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all">
                    <ChevronLeft size={16}/> Back to Segment
                 </button>
                 
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-4">
                       <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm text-center sticky top-32 overflow-hidden">
                          <img alt={selectedCourse.title} src={selectedCourse.image} className="w-full rounded-[1.5rem] mb-6 shadow-xl" />
                          <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight mb-4">{selectedCourse.title}</h2>
                          <div className="flex items-center justify-center gap-2 mb-8">
                             <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[8px] font-black uppercase">{selectedCourse.category}</span>
                             <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-[8px] font-black uppercase">Active Batch</span>
                          </div>
                          <div className="space-y-3">
                             {selectedCourse.subjects.map(sub => (
                                <div key={sub.id} className="w-full p-4 bg-slate-50 border border-slate-50 rounded-2xl text-left flex items-center justify-between">
                                   <span className="text-[10px] font-black uppercase tracking-tight">{sub.title}</span>
                                   <span className="text-[9px] font-bold text-slate-400">{sub.chapters.length} Units</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                    
                    <div className="lg:col-span-8 space-y-12">
                       {selectedCourse.subjects.map(subject => (
                          <div key={subject.id} className="space-y-6">
                             <div className="flex items-center gap-4">
                               <div className="w-1.5 h-10 bg-blue-600 rounded-full"></div>
                               <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">{subject.title} Curriculum</h3>
                             </div>
                             
                             <div className="space-y-6">
                                {subject.chapters.map(chapter => (
                                   <div key={chapter.id} className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm overflow-hidden">
                                      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-50">
                                        <Folder size={18} className="text-blue-500"/>
                                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{chapter.title}</h4>
                                      </div>
                                      
                                      <div className="grid grid-cols-1 gap-4">
                                         {chapter.lectures.map(lecture => (
                                            <button 
                                              key={lecture.id}
                                              onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                              className="p-4 bg-slate-50 rounded-2xl border border-slate-50 flex items-center justify-between hover:bg-white hover:border-blue-600 transition-all group shadow-sm"
                                            >
                                               <div className="flex items-center gap-6">
                                                  <div className="w-20 h-14 bg-white rounded-xl flex items-center justify-center text-slate-300 relative overflow-hidden shrink-0 border border-slate-100">
                                                     {lecture.thumbnail ? (
                                                        <img alt={lecture.title} src={lecture.thumbnail} className="w-full h-full object-cover" />
                                                     ) : (
                                                        <Play size={20} fill="currentColor"/>
                                                     )}
                                                     {lecture.duration === 'LIVE' && (
                                                       <div className="absolute inset-0 bg-red-600/10 flex items-center justify-center">
                                                         <div className="px-1.5 py-0.5 bg-red-600 text-white text-[6px] font-black rounded shadow-lg animate-pulse">LIVE</div>
                                                       </div>
                                                     )}
                                                  </div>
                                                  <div className="text-left">
                                                     <p className="text-xs font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors tracking-tight leading-none">{lecture.title}</p>
                                                     <div className="flex items-center gap-4 mt-2">
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                           {lecture.duration === 'LIVE' ? <Radio size={10} className="text-red-500"/> : <Clock size={10}/>} {lecture.duration}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                           <FileText size={10}/> {lecture.resources.length} Materials
                                                        </span>
                                                     </div>
                                                  </div>
                                               </div>
                                               <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600"/>
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
              <div className="animate-in pb-12">
                <button onClick={() => setActiveView('course')} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest transition-all">
                  <ChevronLeft size={16}/> Back to Course
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    <CustomVideoPlayer videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    
                    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                      <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight mb-4">{selectedLecture.title}</h1>
                      <div className="flex items-center gap-4 mb-8">
                        <span className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Premium Lecture</span>
                        <span className="px-3 py-1.5 bg-slate-50 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest">{selectedLecture.duration} Duration</span>
                      </div>
                      <p className="text-slate-600 text-sm font-medium leading-relaxed mb-8">{selectedLecture.description || "In this session, we cover core concepts and advanced applications with real-world examples."}</p>
                      
                      <div className="pt-8 border-t border-slate-50">
                         <h3 className="text-base font-black text-slate-900 uppercase italic tracking-tight mb-6 flex items-center gap-3">
                            <FileText size={20} className="text-blue-600"/> Resources & Study Material
                         </h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedLecture.resources.length > 0 ? (
                               selectedLecture.resources.map(res => <ResourceItem key={res.id} resource={res} />)
                            ) : (
                               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest py-4">Additional resources will be uploaded soon.</p>
                            )}
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-4">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm sticky top-32 overflow-hidden">
                       <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                          <Target size={16} className="text-blue-600"/> Session Checklist
                       </h3>
                       <div className="space-y-4">
                          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                             <div className="w-5 h-5 rounded-md border-2 border-blue-500 bg-blue-500 flex items-center justify-center text-white"><ChevronRight size={14}/></div>
                             <span className="text-[10px] font-black text-slate-700 uppercase">Watch Full Lecture</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                             <div className="w-5 h-5 rounded-md border-2 border-slate-200"></div>
                             <span className="text-[10px] font-black text-slate-400 uppercase">Download PDF Notes</span>
                          </div>
                          <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100">
                             <div className="w-5 h-5 rounded-md border-2 border-slate-200"></div>
                             <span className="text-[10px] font-black text-slate-400 uppercase">Solve DPP Sheet</span>
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

        {/* Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-22 bg-white/95 backdrop-blur-xl border-t border-slate-100 flex items-center px-4 z-50 pb-2 shadow-2xl">
           <BottomNavItem icon={<Home size={22}/>} label="Home" active={activeView === 'home'} onClick={() => setActiveView('home')}/>
           <BottomNavItem icon={<BookOpen size={22}/>} label="Learning" active={activeView === 'course'} onClick={() => setActiveView('course')}/>
           <BottomNavItem icon={<Target size={22}/>} label="Tests" active={activeView === 'tests'} onClick={() => {}}/>
           <BottomNavItem icon={<UserIcon size={22}/>} label="Account" active={activeView === 'profile'} onClick={() => setActiveView('profile')}/>
        </nav>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={(u) => { setUser(u); localStorage.setItem('study_portal_user', JSON.stringify(u)); setIsAuthModalOpen(false); }} />
      {paymentCourse && <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} onClose={() => setPaymentCourse(null)} onSuccess={() => { setEnrolledBatches([...enrolledBatches, paymentCourse.id]); setPaymentCourse(null); }} />}
    </div>
  );
};

export default App;
