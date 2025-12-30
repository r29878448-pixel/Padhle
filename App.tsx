
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, LogOut,
  Settings, ChevronRight, FileText, Download, Loader2, ExternalLink, Layers, Folder, Zap, Play, Bell, Sparkles, ChevronLeft,
  ArrowRight, Database, Link as LinkIcon, CheckCircle2, ShieldLock, Target, BarChart
} from 'lucide-react';
import { Course, Lecture, Notice, Banner, LectureProgress } from './types';
import VideoPlayer from './components/VideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import PaymentModal from './components/PaymentModal';
import { 
  subscribeToCourses, 
  getSiteSettings, 
  subscribeToTelegramFeed, 
  TelegramPost, 
  subscribeToNotices, 
  subscribeToBanners,
  subscribeToUserProgress,
  markLectureComplete
} from './services/db';

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
  
  // Progress & Enrollment
  const [enrolledBatches, setEnrolledBatches] = useState<string[]>([]);
  const [userProgress, setUserProgress] = useState<LectureProgress[]>([]);
  const [paymentCourse, setPaymentCourse] = useState<Course | null>(null);

  const [siteSettings, setSiteSettings] = useState({ shortenerUrl: '', shortenerApiKey: '' });

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

    const savedEnrollments = localStorage.getItem('study_portal_enrollments');
    if (savedEnrollments) setEnrolledBatches(JSON.parse(savedEnrollments));

    return () => { unsubCourses(); unsubNotices(); unsubBanners(); };
  }, []);

  // Progress Subscription
  useEffect(() => {
    if (user && user.role === 'student') {
      const unsubProgress = subscribeToUserProgress(user.email.replace(/\./g, '_'), setUserProgress);
      return () => unsubProgress();
    }
  }, [user]);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleAuthSuccess = (userData: { name: string; email: string; role: UserRole }) => {
    setUser(userData);
    localStorage.setItem('study_portal_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const handleCourseClick = (course: Course) => {
    if (user?.role === 'admin' || user?.role === 'manager') {
       navigateToCourse(course);
       return;
    }
    if (course.price > 0 && !enrolledBatches.includes(course.id)) {
      setPaymentCourse(course);
    } else {
      navigateToCourse(course);
    }
  };

  const handleMarkComplete = async () => {
    if (user && selectedCourse && selectedLecture) {
      const userId = user.email.replace(/\./g, '_');
      await markLectureComplete(userId, selectedCourse.id, selectedLecture.id);
      showToast('Module marked as completed!');
    }
  };

  // Fix: Added handlePaymentSuccess to handle successful course enrollment after payment
  const handlePaymentSuccess = () => {
    if (paymentCourse) {
      const updatedEnrollments = [...enrolledBatches, paymentCourse.id];
      setEnrolledBatches(updatedEnrollments);
      localStorage.setItem('study_portal_enrollments', JSON.stringify(updatedEnrollments));
      navigateToCourse(paymentCourse);
      setPaymentCourse(null);
      showToast(`Welcome to ${paymentCourse.title}!`);
    }
  };

  const isCompleted = (lectureId: string) => userProgress.some(p => p.lectureId === lectureId);

  const calculateBatchProgress = (course: Course) => {
    let total = 0;
    let completed = 0;
    course.subjects.forEach(s => s.chapters.forEach(c => c.lectures.forEach(l => {
      total++;
      if (isCompleted(l.id)) completed++;
    })));
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  const navigateToCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveView('course');
    window.scrollTo(0, 0);
  };

  if (isLoading) return <div className="min-h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>;

  const isDirectAccess = hasDirectLink && activeView === 'video' && !!selectedLecture;
  const shouldBlock = !user && !isDirectAccess;

  if (shouldBlock) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-fadeIn">
          <div className="w-16 h-16 bg-blue-600 rounded-none flex items-center justify-center text-white font-black text-2xl mx-auto shadow-lg">S</div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Study Portal</h1>
            <p className="text-slate-500 font-medium leading-relaxed px-4 text-sm uppercase tracking-tight">Premium academic environment. Please sign in to access your dashboard.</p>
          </div>
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-4 font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3"><UserIcon size={16}/> Secure Log In</button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-900">
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3 font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-2xl animate-slideUp">
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
            <SidebarItem icon={<BookOpen size={18}/>} label="MY BATCHES" active={activeView === 'course'} onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} />
            
            {(user?.role === 'admin' || user?.role === 'manager') && (
               <div className="mt-6 pt-6 border-t border-slate-100">
                 <p className="text-[9px] uppercase font-black text-slate-400 px-8 mb-4 tracking-widest">Faculty Controls</p>
                 <SidebarItem icon={<Settings size={18}/>} label="ADMIN CONSOLE" active={activeView === 'admin'} onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} />
               </div>
            )}
          </div>
          <div className="mt-auto border-t border-slate-100 p-6">
            {!user ? <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-3 rounded-none font-black text-xs uppercase tracking-widest hover:bg-blue-600">Sign In</button> : <button onClick={() => {setUser(null); localStorage.removeItem('study_portal_user'); setHasDirectLink(false); setActiveView('home');}} className="w-full flex items-center gap-4 px-4 py-3 rounded-none text-red-500 font-bold hover:bg-red-50 transition-all text-xs uppercase tracking-widest"><LogOut size={18} /> Logout Session</button>}
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <nav className="h-16 bg-white border-b border-slate-100 flex items-center px-6 md:px-10 justify-between sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-50"><Menu size={20} /></button>
          <div className="hidden md:flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-none border border-slate-200"><Bell size={12} className="text-blue-600" /><p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">AES-256 Secured Learning Environment</p></div>
          <div className="flex items-center gap-4">
             {user && (
               <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('profile')}>
                 <div className="text-right hidden sm:block"><p className="text-[10px] font-black uppercase tracking-tight">{user.name}</p><p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{user.role}</p></div>
                 <div className="w-8 h-8 bg-slate-900 rounded-none flex items-center justify-center text-white"><UserIcon size={16} /></div>
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
                        <span className="bg-blue-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest mb-4 inline-block">Study Portal Live</span>
                        <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-5 uppercase">Master Your <br/><span className="text-blue-400">Curriculum.</span></h1>
                        <p className="text-slate-300 text-sm font-medium mb-8 leading-relaxed max-w-sm uppercase tracking-tight">Access high-definition video sessions and instant AI support.</p>
                        <button onClick={() => courses.length > 0 && handleCourseClick(courses[0])} className="bg-white text-slate-900 px-8 py-4 font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 border-b-4 border-slate-300">Explore Batches <ArrowRight size={14}/></button>
                      </div>
                   </div>
                </section>

                <section>
                   <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-4">
                      <h2 className="text-xl font-black tracking-tight text-slate-900 uppercase flex items-center gap-3"><Layers size={20} className="text-blue-600"/> Batch Directory</h2>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-none border border-slate-200 hover:border-blue-500 hover:shadow-2xl transition-all cursor-pointer group flex flex-col" onClick={() => handleCourseClick(course)}>
                          <div className="relative aspect-video overflow-hidden">
                            <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            {course.price > 0 && !enrolledBatches.includes(course.id) && <div className="absolute top-4 left-4 bg-amber-600 text-white px-3 py-1 text-[8px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2"><ShieldLock size={10}/> Paid Access</div>}
                            {enrolledBatches.includes(course.id) && (
                               <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200">
                                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${calculateBatchProgress(course)}%` }}></div>
                               </div>
                            )}
                          </div>
                          <div className="p-6 flex-1 flex flex-col border-t border-slate-100">
                            <h3 className="font-black text-base mb-1 truncate uppercase tracking-tight">{course.title}</h3>
                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                {enrolledBatches.includes(course.id) ? `${calculateBatchProgress(course)}% Completed` : (course.price > 0 ? `₹${course.price}` : 'Free')}
                              </span>
                              <div className="p-2 bg-slate-50 border border-slate-200 group-hover:bg-blue-600 group-hover:text-white transition-all"><ChevronRight size={16}/></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                </section>
              </div>
            )}
            
            {activeView === 'course' && selectedCourse && (
              <div className="max-w-4xl mx-auto animate-fadeIn">
                <button onClick={() => { setHasDirectLink(false); setActiveView('home'); }} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={14}/> Dashboard</button>
                <div className="bg-slate-900 p-10 text-white mb-8 border border-slate-700">
                   <h1 className="text-3xl font-black mb-4 tracking-tight uppercase">{selectedCourse.title}</h1>
                   <div className="flex items-center gap-4 mt-6">
                      <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                         <div className="h-full bg-blue-500" style={{ width: `${calculateBatchProgress(selectedCourse)}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">{calculateBatchProgress(selectedCourse)}% Done</span>
                   </div>
                </div>
                
                <div className="space-y-6">
                   {selectedCourse.subjects.map(subject => (
                      <div key={subject.id} className="bg-white p-8 border border-slate-200 shadow-sm">
                         <h3 className="text-xl font-black text-blue-600 mb-8 flex items-center gap-3 uppercase tracking-tight"><Layers size={20} /> {subject.title}</h3>
                         <div className="space-y-8">
                            {subject.chapters.map(chapter => (
                               <div key={chapter.id}>
                                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Folder size={12} className="text-blue-400"/> {chapter.title}</p>
                                  <div className="grid grid-cols-1 gap-2">
                                  {chapter.lectures.map(lecture => (
                                     <button 
                                       key={lecture.id}
                                       onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                       className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 hover:border-blue-500 hover:bg-white transition-all shadow-sm group"
                                     >
                                       <div className="flex items-center gap-4">
                                         <div className={`w-8 h-8 ${isCompleted(lecture.id) ? 'bg-emerald-500' : 'bg-slate-900 group-hover:bg-blue-600'} flex items-center justify-center text-white transition-colors`}>
                                            {isCompleted(lecture.id) ? <CheckCircle2 size={14} /> : <Play size={14} fill="currentColor" />}
                                         </div>
                                         <div className="text-left">
                                             <p className={`text-xs font-black uppercase tracking-tight ${isCompleted(lecture.id) ? 'text-emerald-600 line-through opacity-60' : 'text-slate-900'}`}>{lecture.title}</p>
                                             <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest mt-1">{lecture.duration}</p>
                                         </div>
                                       </div>
                                       <ChevronRight size={14} className="text-slate-300" />
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
            
            {activeView === 'video' && selectedLecture && (
              <div className="animate-fadeIn">
                <button onClick={() => { setHasDirectLink(false); setActiveView('course'); }} className="mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[9px] uppercase tracking-widest"><ChevronLeft size={14}/> Back</button>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                  <div className="xl:col-span-8">
                    <VideoPlayer key={selectedLecture.id} videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    <div className="bg-white p-8 border border-slate-200 mt-6 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div>
                         <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{selectedLecture.title}</h1>
                         <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Official Module Session</p>
                      </div>
                      <button 
                        onClick={handleMarkComplete}
                        disabled={isCompleted(selectedLecture.id)}
                        className={`px-8 py-3 font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${isCompleted(selectedLecture.id) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      >
                         {isCompleted(selectedLecture.id) ? <CheckCircle2 size={16}/> : <Target size={16}/>}
                         {isCompleted(selectedLecture.id) ? 'Session Mastered' : 'Mark as Completed'}
                      </button>
                    </div>
                  </div>
                  <div className="xl:col-span-4 space-y-6">
                     <div className="bg-slate-50 p-1 flex border border-slate-200">
                        <button onClick={() => setLectureTab('ai')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'ai' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500'}`}><Sparkles size={12}/> AI Teacher</button>
                        <button onClick={() => setLectureTab('notes')} className={`flex-1 py-3 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'notes' ? 'bg-white text-slate-900 shadow-md border border-slate-200' : 'text-slate-500'}`}><FileText size={12}/> Notes</button>
                     </div>
                     {lectureTab === 'ai' ? <DoubtSolver currentContext={selectedLecture.title} /> : (
                        <div className="bg-white p-6 border border-slate-200 min-h-[400px]"><h3 className="font-black text-base mb-6 text-slate-900 uppercase tracking-tight">Attachments</h3><div className="space-y-2">{selectedLecture.resources?.map(res => <button key={res.id} onClick={() => window.open(res.url, '_blank')} className="w-full p-4 bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-blue-50 transition-all"><div className="flex items-center gap-3"><Download size={14} className="text-blue-600"/><span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{res.title}</span></div><ExternalLink size={12} className="text-slate-300" /></button>)}</div></div>
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
      {paymentCourse && <PaymentModal isOpen={!!paymentCourse} course={paymentCourse} onClose={() => setPaymentCourse(null)} onSuccess={handlePaymentSuccess} />}
    </div>
  );
};

export default App;
