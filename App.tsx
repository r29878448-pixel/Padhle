
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, LogOut,
  Settings, ChevronRight, FileText, Download, Loader2, ExternalLink, Layers, Folder, Zap, Play, Bell, Sparkles, ChevronLeft,
  ArrowRight, Database, Link as LinkIcon, CheckCircle2, Lock, Target, BarChart3, Calendar, Trophy, Search, Clock
} from 'lucide-react';
import { Course, Lecture, Notice, Banner, LectureProgress } from './types';
import { DAILY_SCHEDULE, TEST_SERIES } from './constants';
import VideoPlayer from './components/VideoPlayer';
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

const SidebarItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 relative group ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-600 hover:bg-slate-50'}`}
  >
    {active && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white rounded-r-full"></div>}
    <span className={`${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'}`}>{icon}</span>
    <span className="font-bold text-xs uppercase tracking-widest">{label}</span>
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

  const handleMarkComplete = async () => {
    if (user && selectedCourse && selectedLecture) {
      const userId = user.email.replace(/\./g, '_');
      await markLectureComplete(userId, selectedCourse.id, selectedLecture.id);
      showToast('Module marked as completed!');
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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-10 animate-fadeIn">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center text-white font-black text-3xl mx-auto shadow-2xl shadow-blue-500/40">S</div>
          <div className="space-y-4">
            <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase italic">Study Portal</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] leading-relaxed">India's most loved educational community.</p>
          </div>
          <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all flex items-center justify-center gap-3 shadow-xl"><UserIcon size={18}/> Access Student Portal</button>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FD] flex font-sans text-slate-900">
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-8 py-4 font-black text-[10px] uppercase tracking-widest flex items-center gap-4 shadow-2xl animate-slideUp rounded-full">
           <CheckCircle2 className="text-emerald-400" size={18}/> {toast.message}
        </div>
      )}

      {/* Professional PW Sidebar */}
      <aside className={`fixed left-0 top-0 bottom-0 w-72 bg-white border-r border-slate-100 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 shadow-2xl md:shadow-none'}`}>
        <div className="flex flex-col h-full">
          <div className="py-10 px-10 border-b border-slate-50 flex items-center gap-4 cursor-pointer" onClick={() => { setHasDirectLink(false); setActiveView('home'); }}>
            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">S</div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tighter uppercase italic block">Study Portal</span>
              <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Future of Learning</span>
            </div>
          </div>
          
          <div className="flex-1 py-6 overflow-y-auto scrollbar-hide">
            <SidebarItem icon={<Home size={20}/>} label="Dashboard" active={activeView === 'home'} onClick={() => {setActiveView('home'); setHasDirectLink(false); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<BookOpen size={20}/>} label="My Batches" active={activeView === 'course'} onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<Calendar size={20}/>} label="Study Planner" active={activeView === 'planner'} onClick={() => {setActiveView('planner'); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<Trophy size={20}/>} label="Test Series" active={activeView === 'tests'} onClick={() => {setActiveView('tests'); setIsSidebarOpen(false);}} />
            
            {(user?.role === 'admin' || user?.role === 'manager') && (
               <div className="mt-8 pt-8 border-t border-slate-50">
                 <p className="text-[9px] uppercase font-black text-slate-400 px-8 mb-6 tracking-[0.2em]">Administration</p>
                 <SidebarItem icon={<Settings size={20}/>} label="Management Hub" active={activeView === 'admin'} onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} />
               </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-50 bg-slate-50/50">
            {user && (
              <button onClick={() => {setUser(null); localStorage.removeItem('study_portal_user'); setHasDirectLink(false); setActiveView('home');}} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-500 font-black hover:bg-red-100/50 transition-all text-[10px] uppercase tracking-widest bg-white border border-red-50">
                <LogOut size={18} /> Exit Session
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-72 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center px-8 md:px-12 justify-between sticky top-0 z-40 backdrop-blur-md bg-white/80">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-3 bg-slate-50 rounded-xl hover:bg-slate-100"><Menu size={22} /></button>
          
          <div className="hidden md:flex items-center gap-4">
             <div className="bg-blue-50 px-5 py-2.5 rounded-2xl flex items-center gap-3 border border-blue-100">
               <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
               <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">Physics Class Live Now</p>
             </div>
          </div>

          <div className="flex items-center gap-6">
             <div className="relative">
                <Bell size={20} className="text-slate-400 hover:text-blue-600 cursor-pointer transition-colors" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border-2 border-white">3</span>
             </div>
             {user && (
               <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setActiveView('profile')}>
                 <div className="text-right hidden sm:block">
                   <p className="text-[11px] font-black uppercase tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">{user.name}</p>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{user.role} Account</p>
                 </div>
                 <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-105"><UserIcon size={20} /></div>
               </div>
             )}
          </div>
        </header>

        <main className="flex-1 p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            {activeView === 'home' && (
              <div className="space-y-12 animate-fadeIn">
                {/* Hero Banner Section */}
                <section className="relative h-[400px] rounded-[3rem] overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 group">
                   <img src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500"} className="w-full h-full object-cover opacity-60 transition-transform duration-1000 group-hover:scale-105" />
                   <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-center p-12 md:p-20">
                      <div className="max-w-2xl">
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20 w-fit mb-6">
                           <Sparkles size={14} className="text-blue-400 fill-blue-400"/>
                           <span className="text-[10px] font-black text-white uppercase tracking-widest">PW Study Hub Live</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-white leading-[1.1] tracking-tighter mb-6 uppercase italic">Start Your <br/>Success <span className="text-blue-500 underline decoration-white/20 underline-offset-8">Journey.</span></h1>
                        <p className="text-slate-300 text-sm font-medium mb-10 leading-relaxed max-w-md uppercase tracking-wide">Accelerate your learning with India's most advanced AI-powered educational platform.</p>
                        <div className="flex items-center gap-4">
                           <button onClick={() => courses.length > 0 && handleCourseClick(courses[0])} className="bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center gap-3 shadow-2xl shadow-blue-600/30">Browse Batches <ArrowRight size={16}/></button>
                           <button className="bg-white/10 backdrop-blur-md text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all border border-white/10">Free Library</button>
                        </div>
                      </div>
                   </div>
                </section>

                {/* Batch Directory */}
                <section>
                   <div className="flex items-center justify-between mb-10">
                      <div>
                         <h2 className="text-2xl font-black tracking-tight text-slate-900 uppercase italic flex items-center gap-3"><Layers size={24} className="text-blue-600"/> Featured Batches</h2>
                         <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest mt-1">Curated for 2025 Board & Competitive Exams</p>
                      </div>
                      <div className="flex gap-2">
                         <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50">JEE</button>
                         <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50">NEET</button>
                         <button className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-50">Board</button>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                      {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-[2.5rem] border border-slate-100 hover:border-blue-500/50 hover:shadow-2xl transition-all cursor-pointer group flex flex-col overflow-hidden" onClick={() => handleCourseClick(course)}>
                          <div className="relative aspect-[16/10] overflow-hidden">
                            <img src={course.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                            {course.price > 0 && !enrolledBatches.includes(course.id) && (
                               <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md text-slate-900 px-4 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 border border-white">
                                  <Lock size={12} className="text-blue-600"/> Paid Batch
                               </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                               <p className="text-white font-black text-[10px] uppercase tracking-widest flex items-center gap-2">Explore Curriculum <ChevronRight size={14}/></p>
                            </div>
                          </div>
                          <div className="p-8 flex-1 flex flex-col">
                            <h3 className="font-black text-lg mb-3 text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic tracking-tight">{course.title}</h3>
                            <p className="text-slate-500 text-xs font-medium line-clamp-2 mb-6 uppercase tracking-tight">{course.description}</p>
                            <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-50">
                              <div>
                                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Enrollment</p>
                                 <span className="text-sm font-black text-slate-900">
                                   {enrolledBatches.includes(course.id) ? 'Enrolled' : (course.price > 0 ? `₹${course.price}` : 'FREE')}
                                 </span>
                              </div>
                              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
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

            {activeView === 'planner' && (
               <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                     <h2 className="text-3xl font-black text-slate-900 uppercase italic mb-2">My Schedule</h2>
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-10">Stay ahead of your academic goals</p>
                     
                     <div className="space-y-4">
                        {DAILY_SCHEDULE.map(ev => (
                           <div key={ev.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-blue-50 hover:border-blue-100 transition-all">
                              <div className="flex items-center gap-6">
                                 <div className="w-16 h-16 bg-white rounded-2xl flex flex-col items-center justify-center text-slate-400 font-black border border-slate-100 group-hover:text-blue-600 transition-colors">
                                    <Clock size={20} className="mb-1" />
                                 </div>
                                 <div>
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full mb-1 inline-block ${ev.type === 'Live' ? 'bg-red-100 text-red-600' : ev.type === 'Test' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>{ev.type}</span>
                                    <h4 className="font-black text-slate-900 uppercase tracking-tight">{ev.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{ev.time} • {ev.subject}</p>
                                 </div>
                              </div>
                              <button className="bg-white p-3 rounded-xl border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all"><ArrowRight size={18}/></button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {activeView === 'tests' && (
               <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn">
                  <div className="bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm">
                     <h2 className="text-3xl font-black text-slate-900 uppercase italic mb-2">Test Series</h2>
                     <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-10">Evaluate your performance</p>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {TEST_SERIES.map(test => (
                           <div key={test.id} className="p-8 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group">
                              <div className="flex justify-between items-start mb-6">
                                 <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 transition-colors"><Trophy size={24}/></div>
                                 <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${test.status === 'Live' ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>{test.status}</span>
                              </div>
                              <h4 className="font-black text-slate-900 uppercase tracking-tight mb-2 italic">{test.title}</h4>
                              <div className="flex gap-4 mb-8">
                                 <div className="text-center bg-slate-50 px-4 py-2 rounded-xl flex-1 border border-slate-100">
                                    <p className="text-[7px] font-black text-slate-400 uppercase">Time</p>
                                    <p className="text-[9px] font-black">{test.duration}</p>
                                 </div>
                                 <div className="text-center bg-slate-50 px-4 py-2 rounded-xl flex-1 border border-slate-100">
                                    <p className="text-[7px] font-black text-slate-400 uppercase">Qs</p>
                                    <p className="text-[9px] font-black">{test.questions}</p>
                                 </div>
                              </div>
                              <button className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all">Start Assessment</button>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}
            
            {activeView === 'course' && selectedCourse && (
              <div className="max-w-5xl mx-auto animate-fadeIn pb-20">
                <button onClick={() => { setHasDirectLink(false); setActiveView('home'); }} className="mb-10 flex items-center gap-3 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all"><ChevronLeft size={16}/> Back to Dashboard</button>
                
                <div className="relative rounded-[3rem] overflow-hidden bg-slate-900 mb-12 shadow-2xl">
                   <img src={selectedCourse.image} className="w-full h-56 object-cover opacity-40" />
                   <div className="absolute inset-0 flex flex-col justify-center px-12 md:px-20">
                      <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">{selectedCourse.title}</h1>
                      <div className="flex items-center gap-6 mt-6">
                         <div className="flex-1 max-w-sm bg-white/10 h-2.5 rounded-full overflow-hidden backdrop-blur-md">
                            <div className="h-full bg-blue-500 shadow-lg shadow-blue-500/40" style={{ width: `${calculateBatchProgress(selectedCourse)}%` }}></div>
                         </div>
                         <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest bg-blue-500/10 px-4 py-1.5 rounded-full">{calculateBatchProgress(selectedCourse)}% Completed</span>
                      </div>
                   </div>
                </div>
                
                <div className="space-y-8">
                   {selectedCourse.subjects.map(subject => (
                      <div key={subject.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden relative">
                         <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4 uppercase italic"><div className="w-1.5 h-8 bg-blue-600 rounded-full"></div> {subject.title}</h3>
                         <div className="space-y-12">
                            {subject.chapters.map(chapter => (
                               <div key={chapter.id}>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-3"><Folder size={14} className="text-blue-400"/> Chapter: {chapter.title}</p>
                                  <div className="grid grid-cols-1 gap-3">
                                  {chapter.lectures.map(lecture => (
                                     <button 
                                       key={lecture.id}
                                       onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                       className="w-full flex items-center justify-between p-5 bg-[#FBFBFF] border border-slate-100 hover:border-blue-400 hover:bg-white transition-all rounded-[2rem] group"
                                     >
                                       <div className="flex items-center gap-6">
                                         <div className={`w-12 h-12 rounded-2xl ${isCompleted(lecture.id) ? 'bg-emerald-500' : 'bg-white group-hover:bg-blue-600'} flex items-center justify-center text-white transition-all shadow-sm group-hover:shadow-blue-500/20`}>
                                            {isCompleted(lecture.id) ? <CheckCircle2 size={18} /> : <Play size={18} className="text-slate-400 group-hover:text-white" fill="currentColor" />}
                                         </div>
                                         <div className="text-left">
                                             <p className={`text-sm font-black uppercase tracking-tight ${isCompleted(lecture.id) ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{lecture.title}</p>
                                             <div className="flex items-center gap-4 mt-1">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{lecture.duration}</p>
                                                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                                                <p className="text-[9px] text-blue-600 font-black uppercase tracking-widest">Video Lecture</p>
                                             </div>
                                         </div>
                                       </div>
                                       <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-blue-600 transition-colors"><ChevronRight size={18} /></div>
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
                <button onClick={() => { setHasDirectLink(false); setActiveView('course'); }} className="mb-8 flex items-center gap-3 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest"><ChevronLeft size={16}/> Back to Curriculum</button>
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className="xl:col-span-8">
                    <VideoPlayer key={selectedLecture.id} videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    <div className="bg-white p-10 rounded-[3rem] border border-slate-100 mt-8 flex flex-col md:flex-row items-center justify-between gap-10">
                      <div>
                         <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic">{selectedLecture.title}</h1>
                         <div className="flex items-center gap-4 mt-3">
                            <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100">Live Session Recorded</span>
                            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{selectedLecture.duration} Playtime</span>
                         </div>
                      </div>
                      <button 
                        onClick={handleMarkComplete}
                        disabled={isCompleted(selectedLecture.id)}
                        className={`px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl ${isCompleted(selectedLecture.id) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-emerald-500/5' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'}`}
                      >
                         {isCompleted(selectedLecture.id) ? <CheckCircle2 size={20}/> : <Target size={20}/>}
                         {isCompleted(selectedLecture.id) ? 'Topic Mastered' : 'Complete Topic'}
                      </button>
                    </div>
                  </div>
                  <div className="xl:col-span-4 space-y-8">
                     <div className="bg-white p-2 rounded-[2rem] border border-slate-100 flex shadow-sm">
                        <button onClick={() => setLectureTab('ai')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${lectureTab === 'ai' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}><Sparkles size={16}/> AI Teacher</button>
                        <button onClick={() => setLectureTab('notes')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${lectureTab === 'notes' ? 'bg-white text-slate-900 shadow-lg border border-slate-200' : 'text-slate-400'}`}><FileText size={16}/> Resources</button>
                     </div>
                     {lectureTab === 'ai' ? <DoubtSolver currentContext={selectedLecture.title} /> : (
                        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 min-h-[400px]">
                           <h3 className="font-black text-lg mb-8 text-slate-900 uppercase italic">Chapter Assets</h3>
                           <div className="space-y-3">
                              {selectedLecture.resources?.map(res => (
                                 <button key={res.id} onClick={() => window.open(res.url, '_blank')} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform"><Download size={18}/></div>
                                       <span className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{res.title}</span>
                                    </div>
                                    <ExternalLink size={16} className="text-slate-300 group-hover:text-blue-600" />
                                 </button>
                              ))}
                              {(!selectedLecture.resources || selectedLecture.resources.length === 0) && (
                                 <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200"><FileText size={32}/></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No assets uploaded yet</p>
                                 </div>
                              )}
                           </div>
                        </div>
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
