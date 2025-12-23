import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, PlayCircle, GraduationCap, LogOut,
  Settings, ChevronRight, Clock, FileText, Download, Loader2, ExternalLink, Layers, Folder
} from 'lucide-react';
import { Course, Lecture, SiteSettings, Chapter, Subject, Resource } from './types';
import VideoPlayer from './components/VideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AccessGate from './components/AccessGate';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import { subscribeToCourses, getSiteSettings } from './services/db';

type UserRole = 'student' | 'admin' | 'manager';

// Navbar Compact Timer
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
    updateTimer(); // Init
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
  
  // Navigation State
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, role: UserRole} | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // 48-Hour Access Logic
  const [accessExpiry, setAccessExpiry] = useState<number | null>(null);
  const [showAccessGate, setShowAccessGate] = useState(false);
  
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    shortenerUrl: 'https://vplink.in/api',
    shortenerApiKey: '320f263d298979dc11826b8e2574610ba0cc5d6b'
  });

  // Helper to grant access
  const grantAccess = () => {
    const newExpiry = Date.now() + (48 * 60 * 60 * 1000); // 48 Hours
    setAccessExpiry(newExpiry);
    localStorage.setItem('study_portal_access_expiry', newExpiry.toString());
    setShowAccessGate(false);
  };

  useEffect(() => {
    // 1. Subscribe to Real-time Courses
    const unsubscribe = subscribeToCourses((data) => {
      setCourses(data);
      setIsLoading(false);
    });

    // 2. Load Settings from DB (fallback to local if fail)
    const loadSettings = async () => {
      const dbSettings = await getSiteSettings();
      if (dbSettings) {
        setSiteSettings(dbSettings);
      }
    };
    loadSettings();
    
    // 3. Check Local User Session
    const savedUser = localStorage.getItem('study_portal_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    // 4. Check Access Logic
    const savedExpiry = localStorage.getItem('study_portal_access_expiry');
    if (savedExpiry) {
      const expiryTime = parseInt(savedExpiry);
      // Check if expired
      if (expiryTime > Date.now()) {
        setAccessExpiry(expiryTime);
      } else {
        localStorage.removeItem('study_portal_access_expiry');
        setAccessExpiry(null);
      }
    }

    // 5. Check URL for Auto-Verify
    const urlParams = new URLSearchParams(window.location.search);
    const autoVerify = urlParams.get('auto_verify');
    
    if (autoVerify === 'true') {
      grantAccess();
      window.history.replaceState({}, '', window.location.pathname);
    }

    // 6. Check Fallback Verification
    const intervalId = setInterval(() => {
      const startTime = localStorage.getItem('study_portal_verification_start');
      if (startTime) {
        const elapsed = Date.now() - parseInt(startTime);
        if (elapsed > 20000) { // 20 seconds
           grantAccess();
           localStorage.removeItem('study_portal_verification_start'); 
        }
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, []);

  const handleUpdateSettings = (newSettings: SiteSettings) => {
    setSiteSettings(newSettings);
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
    setSelectedSubject(null);
    setSelectedChapter(null);
    setSelectedLecture(null);
    setIsSidebarOpen(false);
    window.scrollTo(0, 0);
  }, []);

  const checkAccess = () => {
    const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';
    const hasValidAccess = accessExpiry !== null && accessExpiry > Date.now();
    return isAdminOrManager || hasValidAccess;
  };

  const navigateToCourse = (course: Course) => {
    if (checkAccess()) {
      setSelectedCourse(course);
      setSelectedSubject(null);
      setSelectedChapter(null);
      setActiveView('course');
      window.scrollTo(0, 0);
    } else {
      setShowAccessGate(true);
    }
  };

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    window.scrollTo(0, 0);
  };

  const handleChapterClick = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    window.scrollTo(0, 0);
  };

  const handleLectureClick = (lecture: Lecture) => {
    if (checkAccess()) {
        setSelectedLecture(lecture);
        setActiveView('video');
        window.scrollTo(0, 0);
    } else {
        setShowAccessGate(true);
    }
  };

  const isStaff = user?.role === 'admin' || user?.role === 'manager';

  const handleResourceClick = (resource: Resource) => {
    if (checkAccess()) {
        if (resource.type === 'link') {
            window.open(resource.url, '_blank');
        } else {
            const link = document.createElement('a');
            link.href = resource.url;
            link.download = resource.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    } else {
        setShowAccessGate(true);
    }
  };

  // Breadcrumb Component
  const Breadcrumbs = () => (
    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-6 flex-wrap">
      <button onClick={() => {setSelectedCourse(null); setActiveView('home')}} className="hover:text-blue-600">Home</button>
      <ChevronRight size={14} />
      <button onClick={() => {setSelectedSubject(null); setSelectedChapter(null); setActiveView('course')}} className="hover:text-blue-600">{selectedCourse?.title}</button>
      {selectedSubject && (
        <>
            <ChevronRight size={14} />
            <button onClick={() => setSelectedChapter(null)} className="hover:text-blue-600">{selectedSubject.title}</button>
        </>
      )}
      {selectedChapter && (
        <>
            <ChevronRight size={14} />
            <span className="text-slate-900">{selectedChapter.title}</span>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FDFEFE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="font-black text-slate-900 animate-pulse">Connecting to Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFEFE] selection:bg-blue-600 selection:text-white flex">
      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-200 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-8 px-2 cursor-pointer" onClick={() => setActiveView('home')}>
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">S</div>
            <span className="text-xl font-black text-slate-900 tracking-tighter">STUDY PORTAL</span>
          </div>

          <div className="space-y-2 flex-1">
            <SidebarItem icon={<Home size={20}/>} label="Home Dashboard" active={activeView === 'home'} onClick={() => {setActiveView('home'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<BookOpen size={20}/>} label="My Enrollments" active={activeView === 'course'} onClick={() => {setActiveView('course'); setSelectedCourse(null); setIsSidebarOpen(false);}} />
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
            <div className={`hidden sm:flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full text-[11px] font-black uppercase tracking-widest ${accessExpiry && accessExpiry > Date.now() ? 'text-emerald-600 bg-emerald-50 border-emerald-100' : 'text-amber-500 bg-amber-100'}`}>
              <span className={`w-2 h-2 rounded-full animate-pulse ${accessExpiry && accessExpiry > Date.now() ? 'bg-emerald-500' : 'bg-amber-500'}`}></span> 
              {accessExpiry && accessExpiry > Date.now() ? (
                <div className="flex items-center gap-2">
                   <span>Expires in:</span>
                   <NavbarTimer expiry={accessExpiry} />
                </div>
              ) : (
                'Basic Access'
              )}
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
                    <p className="text-slate-400 text-lg font-medium leading-relaxed mb-10 max-w-lg">Experience elite study modules, high-definition lecture streaming, and AI-powered academic support.</p>
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

            {/* COURSE VIEW HIERARCHY */}
            {activeView === 'course' && (
              !selectedCourse ? (
                // 1. ALL COURSES LIST (My Enrollments)
                <div className="animate-fadeIn text-left">
                   <div className="flex items-center justify-between mb-10">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tight">My Enrollments</h2>
                      <button onClick={() => setActiveView('home')} className="text-blue-600 font-bold text-sm hover:underline">Explore More</button>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                      {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 cursor-pointer flex flex-col group" onClick={() => navigateToCourse(course)}>
                          <div className="relative aspect-video overflow-hidden">
                            <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                          </div>
                          <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-black text-xl text-slate-900 mb-2 leading-tight tracking-tight">{course.title}</h3>
                            <div className="mt-auto pt-6 border-t border-slate-50">
                               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                 <div className="h-full bg-blue-600 w-1/3"></div>
                               </div>
                               <p className="text-[10px] font-bold text-slate-400 mt-2 text-right">Active Status</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {courses.length === 0 && (
                         <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
                           <BookOpen className="mx-auto text-slate-200 mb-4" size={64} />
                           <p className="text-slate-400 font-bold">You haven't enrolled in any batches yet.</p>
                           <button onClick={() => setActiveView('home')} className="mt-4 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Browse Batches</button>
                         </div>
                      )}
                   </div>
                </div>
              ) : (
                <div className="animate-fadeIn max-w-5xl mx-auto text-left">
                  <Breadcrumbs />
                  
                  {/* 2. SUBJECTS LIST (Inside Course) */}
                  {!selectedSubject ? (
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 mb-2">{selectedCourse.title}</h1>
                      <p className="text-slate-500 font-medium mb-10">Select a subject to view chapters.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {selectedCourse.subjects.map(subject => (
                          <button 
                            key={subject.id} 
                            onClick={() => handleSubjectClick(subject)}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all text-left group flex flex-col h-full"
                          >
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                              <Layers size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{subject.title}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-auto">
                              {subject.chapters.length} Chapters
                            </p>
                          </button>
                        ))}
                        {selectedCourse.subjects.length === 0 && (
                          <div className="col-span-full py-12 text-center text-slate-400 font-bold bg-white rounded-[2rem] border border-dashed border-slate-200">
                             No subjects added yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : !selectedChapter ? (
                    // 3. CHAPTERS LIST (Inside Subject)
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 mb-2">{selectedSubject.title}</h1>
                      <p className="text-slate-500 font-medium mb-10">Select a chapter to start learning.</p>

                      <div className="space-y-4">
                        {selectedSubject.chapters.map((chapter, idx) => (
                           <button 
                             key={chapter.id}
                             onClick={() => handleChapterClick(chapter)}
                             className="w-full bg-white p-6 rounded-[2rem] border border-slate-100 hover:shadow-lg transition-all flex items-center gap-6 text-left group"
                           >
                             <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                               {idx + 1}
                             </div>
                             <div className="flex-1">
                               <h4 className="text-lg font-black text-slate-900 group-hover:text-blue-600 transition-colors">{chapter.title}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                 {chapter.lectures.length} Lectures
                               </p>
                             </div>
                             <div className="w-10 h-10 rounded-full border border-slate-100 flex items-center justify-center text-slate-300 group-hover:border-blue-100 group-hover:text-blue-600 transition-all">
                               <ChevronRight size={20} />
                             </div>
                           </button>
                        ))}
                        {selectedSubject.chapters.length === 0 && (
                          <div className="py-12 text-center text-slate-400 font-bold bg-white rounded-[2rem] border border-dashed border-slate-200">
                             No chapters added yet.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // 4. LECTURES LIST (Inside Chapter)
                    <div>
                      <h1 className="text-3xl font-black text-slate-900 mb-2">{selectedChapter.title}</h1>
                      <p className="text-slate-500 font-medium mb-10">Watch lectures and access study notes.</p>

                      <div className="grid gap-5">
                         {selectedChapter.lectures.map((lecture, idx) => (
                           <div key={lecture.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 hover:shadow-xl transition-all group flex flex-col md:flex-row gap-6">
                              <div className="w-full md:w-64 aspect-video bg-slate-900 rounded-2xl flex items-center justify-center relative overflow-hidden shrink-0 group-hover:ring-4 ring-blue-500/10 transition-all">
                                 <PlayCircle className="text-white relative z-10" size={48} />
                                 <div className="absolute inset-0 bg-blue-600/20 mix-blend-overlay"></div>
                              </div>
                              <div className="flex-1 flex flex-col">
                                 <div className="flex justify-between items-start mb-2">
                                    <h4 className="text-lg font-black text-slate-900 line-clamp-2 leading-tight">{lecture.title}</h4>
                                    <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap">{lecture.duration || "00:00"}</span>
                                 </div>
                                 <p className="text-slate-500 text-sm line-clamp-2 mb-4">{lecture.description || "No description available."}</p>
                                 
                                 <div className="mt-auto flex flex-wrap gap-3">
                                    <button onClick={() => handleLectureClick(lecture)} className="flex-1 bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-2">
                                      <PlayCircle size={16} /> Watch Now
                                    </button>
                                    {lecture.resources.length > 0 && (
                                       <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold">
                                          <FileText size={16} /> {lecture.resources.length} Notes
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                         ))}
                         {selectedChapter.lectures.length === 0 && (
                            <div className="py-12 text-center text-slate-400 font-bold bg-white rounded-[2rem] border border-dashed border-slate-200">
                               No lectures uploaded for this chapter yet.
                            </div>
                         )}
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {activeView === 'video' && selectedLecture && (
              <div className="animate-fadeIn text-left">
                <button 
                  onClick={() => {
                     // Go back to lecture list
                     setActiveView('course');
                  }} 
                  className="text-[10px] font-black text-slate-400 hover:text-blue-600 uppercase tracking-widest mb-10 flex items-center gap-2 transition-colors"
                >
                  <ChevronRight size={16} className="rotate-180" /> Back to Lectures
                </button>
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  <div className="lg:col-span-8 space-y-8">
                    {/* CRITICAL: Key ensures the player re-mounts on video change */}
                    <VideoPlayer key={selectedLecture.youtubeId} videoId={selectedLecture.youtubeId} title={selectedLecture.title} />
                    
                    <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
                      <h1 className="text-2xl md:text-3xl font-black text-slate-900 mb-4 tracking-tight leading-tight">{selectedLecture.title}</h1>
                      <div className="prose prose-slate max-w-none mb-8">
                        <p className="text-slate-500 font-medium">{selectedLecture.description || "Focus on understanding the core concepts presented in this lecture."}</p>
                      </div>

                      {/* LECTURE RESOURCES SECTION */}
                      {selectedLecture.resources.length > 0 && (
                        <div className="border-t border-slate-100 pt-8">
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                             <Folder size={18} className="text-blue-600"/> Lecture Resources
                          </h3>
                          <div className="grid gap-4">
                             {selectedLecture.resources.map(res => (
                               <div key={res.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                                  <div className="flex items-center gap-4">
                                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${res.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                        {res.type === 'pdf' ? <FileText size={20}/> : <ExternalLink size={20}/>}
                                     </div>
                                     <div>
                                        <p className="font-bold text-slate-900 text-sm">{res.title}</p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{res.type}</p>
                                     </div>
                                  </div>
                                  <button onClick={() => handleResourceClick(res)} className="p-3 bg-white rounded-xl shadow-sm hover:bg-slate-900 hover:text-white transition-all text-slate-600">
                                     <Download size={18} />
                                  </button>
                               </div>
                             ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="lg:col-span-4 space-y-6">
                    <DoubtSolver currentContext={selectedLecture.title} />
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
        <AccessGate siteSettings={siteSettings} onClose={() => setShowAccessGate(false)} />
      )}
    </div>
  );
};

export default App;