
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, User as UserIcon, 
  Menu, GraduationCap, LogOut,
  Settings, ChevronRight, FileText, Download, Loader2, ExternalLink, Layers, Folder, Zap, Play, Bell, Info, Sparkles, ChevronLeft,
  Shield, ArrowRight, Database, Lock, Link as LinkIcon, CheckCircle2
} from 'lucide-react';
import { Course, Lecture, Chapter, Subject, Notice, Banner } from './types';
import VideoPlayer from './components/VideoPlayer';
import DoubtSolver from './components/DoubtSolver';
import AuthModal from './components/AuthModal';
import AdminPanel from './components/AdminPanel';
import ProfileSection from './components/ProfileSection';
import { subscribeToCourses, getSiteSettings, subscribeToTelegramFeed, TelegramPost, subscribeToNotices, subscribeToBanners } from './services/db';

type UserRole = 'student' | 'admin' | 'manager';

const SidebarItem: React.FC<{icon: React.ReactNode, label: string, active: boolean, onClick: () => void}> = ({icon, label, active, onClick}) => (
  <button 
    type="button"
    onClick={onClick} 
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-300 ${active ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}
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
  const [hasDirectLink, setHasDirectLink] = useState(false);
  const [lectureTab, setLectureTab] = useState<'ai' | 'notes'>('ai');
  const [toast, setToast] = useState<{message: string, show: boolean}>({ message: '', show: false });

  const [siteSettings, setSiteSettings] = useState({
    shortenerUrl: '',
    shortenerApiKey: ''
  });

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

    return () => {
      unsubCourses(); unsubTG(); unsubNotices(); unsubBanners();
    };
  }, []);

  const showToast = (message: string) => {
    setToast({ message, show: true });
    setTimeout(() => setToast({ message: '', show: false }), 3000);
  };

  const handleAuthSuccess = (userData: { name: string; email: string; role: UserRole }) => {
    setUser(userData);
    localStorage.setItem('study_portal_user', JSON.stringify(userData));
    setIsAuthModalOpen(false);
  };

  const navigateToCourse = (course: Course) => {
    setSelectedCourse(course);
    setActiveView('course');
    window.scrollTo(0, 0);
  };

  const copyDirectLink = (batchId: string, lectureId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?batch_id=${batchId}&child_id=${lectureId}`;
    navigator.clipboard.writeText(url);
    showToast('Direct Link Copied!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const isDirectAccess = hasDirectLink && activeView === 'video' && !!selectedLecture;
  const shouldBlock = !user && !isDirectAccess;

  if (shouldBlock) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-fadeIn">
          <div className="w-20 h-20 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-3xl mx-auto shadow-xl">S</div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight text-slate-900">Study Portal</h1>
            <p className="text-slate-500 font-medium leading-relaxed px-4">
              Access premium academic curriculum. Sign in to browse your enrolled batches and resources.
            </p>
          </div>
          <div className="space-y-4 pt-4">
            <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg flex items-center justify-center gap-3">
              <UserIcon size={18}/> Log In to Portal
            </button>
            <div className="flex items-center gap-4 py-2 opacity-30">
              <div className="h-px bg-slate-400 flex-1"></div>
              <span className="text-[10px] font-black uppercase tracking-widest">Gateway</span>
              <div className="h-px bg-slate-400 flex-1"></div>
            </div>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} onAuthSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex font-sans text-slate-900">
      {toast.show && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 text-white px-6 py-3 rounded-lg font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl animate-slideUp">
           <CheckCircle2 className="text-emerald-400" size={18}/> {toast.message}
        </div>
      )}

      <aside className={`fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => { setHasDirectLink(false); setActiveView('home'); }}>
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-lg shadow-md">S</div>
            <span className="text-lg font-black text-slate-900 tracking-tighter">STUDY PORTAL</span>
          </div>
          <div className="space-y-2 flex-1">
            <SidebarItem icon={<Home size={18}/>} label="Dashboard" active={activeView === 'home'} onClick={() => {setActiveView('home'); setHasDirectLink(false); setIsSidebarOpen(false);}} />
            <SidebarItem icon={<BookOpen size={18}/>} label="All Batches" active={activeView === 'course'} onClick={() => {setActiveView('course'); setIsSidebarOpen(false);}} />
            
            {(user?.role === 'admin' || user?.role === 'manager') && (
               <div className="mt-8 pt-8 border-t border-slate-100">
                 <p className="text-[10px] uppercase font-black text-slate-400 px-4 mb-4 tracking-widest">Control Center</p>
                 <SidebarItem icon={<Settings size={18}/>} label="Admin Console" active={activeView === 'admin'} onClick={() => {setActiveView('admin'); setIsSidebarOpen(false);}} />
               </div>
            )}
          </div>
          
          <div className="mt-auto border-t border-slate-100 pt-6">
            {!user ? (
               <button onClick={() => setIsAuthModalOpen(true)} className="w-full bg-slate-900 text-white py-3 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-600 transition-all">Sign In</button>
            ) : (
               <button onClick={() => {setUser(null); localStorage.removeItem('study_portal_user'); setHasDirectLink(false); setActiveView('home');}} className="w-full flex items-center gap-4 px-4 py-3 rounded-lg text-red-500 font-bold hover:bg-red-50 transition-all">
                <LogOut size={18} /> Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <nav className="h-16 bg-white border-b border-slate-100 flex items-center px-6 md:px-10 justify-between sticky top-0 z-40">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="md:hidden p-2 hover:bg-slate-50 rounded-lg">
            <Menu size={20} />
          </button>
          
          <div className="hidden md:flex items-center gap-3 bg-blue-50/50 px-5 py-2 rounded-lg border border-blue-100">
             <Bell size={14} className="text-blue-600 animate-pulse" />
             <p className="text-[10px] font-bold text-blue-900">Project 45 batches are now strictly regulated for premium access.</p>
          </div>

          <div className="flex items-center gap-4">
             {user && (
               <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('profile')}>
                 <div className="text-right hidden sm:block">
                   <p className="text-[11px] font-black">{user.name}</p>
                   <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">{user.role}</p>
                 </div>
                 <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500">
                    <UserIcon size={18} />
                 </div>
               </div>
             )}
          </div>
        </nav>

        <main className="flex-1 p-6 md:p-10 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">
            {activeView === 'home' && (
              <div className="space-y-10 animate-fadeIn">
                <section className="relative h-[340px] rounded-xl overflow-hidden shadow-xl border border-slate-100">
                   <img src={banners[0]?.imageUrl || "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&q=80&w=1500"} className="w-full h-full object-cover" />
                   <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-center p-10 md:p-14">
                      <div className="max-w-xl">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest mb-4 inline-block shadow-md">Premium Curriculum</span>
                        <h1 className="text-4xl md:text-5xl font-black text-white leading-tight tracking-tighter mb-5">Excellence in <br/><span className="text-blue-400">Digital Learning.</span></h1>
                        <p className="text-slate-200 text-base font-medium mb-8 leading-relaxed max-w-sm">Access expert-led batches, professional notes, and AI support in one portal.</p>
                        <button onClick={() => courses.length > 0 && navigateToCourse(courses[0])} className="bg-white text-slate-900 px-8 py-4 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center gap-2 shadow-lg">
                           View Batch <ArrowRight size={16}/>
                        </button>
                      </div>
                   </div>
                </section>

                <section>
                   <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">Available Batches</h2>
                   </div>
                   {courses.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-xl overflow-hidden border border-slate-100 hover:border-blue-200 hover:shadow-xl transition-all cursor-pointer group flex flex-col" onClick={() => navigateToCourse(course)}>
                          <div className="relative aspect-video">
                            <img src={course.image} className="w-full h-full object-cover" />
                          </div>
                          <div className="p-6 flex-1 flex flex-col">
                            <h3 className="font-black text-xl mb-1 line-clamp-1">{course.title}</h3>
                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest mb-6">{course.instructor} • {course.category}</p>
                            <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                              <span className="text-sm font-black text-blue-600">Enrolled Access</span>
                              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={18}/>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                   ) : (
                     <div className="bg-slate-50 p-20 rounded-xl text-center border border-dashed border-slate-200">
                        <Database className="mx-auto text-slate-300 mb-4" size={48} />
                        <p className="font-black text-slate-400 text-sm">Dashboard database is empty.</p>
                     </div>
                   )}
                </section>
              </div>
            )}
            
            {activeView === 'course' && selectedCourse && (
              <div className="max-w-5xl mx-auto animate-fadeIn">
                <button onClick={() => { setHasDirectLink(false); setActiveView('home'); }} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest">
                   <ChevronLeft size={16}/> Back to Dashboard
                </button>
                <div className="bg-slate-900 rounded-xl p-12 text-white mb-10 shadow-lg relative overflow-hidden border border-slate-800">
                   <div className="relative z-10">
                      <h1 className="text-4xl font-black mb-4 tracking-tight">{selectedCourse.title}</h1>
                      <p className="text-slate-400 text-lg font-medium max-w-xl leading-relaxed">{selectedCourse.description}</p>
                   </div>
                   <div className="absolute right-0 bottom-0 p-8 opacity-5">
                      <GraduationCap size={160}/>
                   </div>
                </div>
                
                <div className="space-y-8">
                   {selectedCourse.subjects.map(subject => (
                      <div key={subject.id} className="bg-white p-10 rounded-xl border border-slate-100 shadow-sm">
                         <h3 className="text-2xl font-black text-blue-600 mb-8 flex items-center gap-3">
                            <Layers size={24} /> {subject.title}
                         </h3>
                         <div className="space-y-10">
                            {subject.chapters.map(chapter => (
                               <div key={chapter.id}>
                                  <div className="flex items-center gap-4 mb-5">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                       <Folder size={12} className="text-blue-400"/> {chapter.title}
                                    </p>
                                    <div className="h-px bg-slate-100 flex-1"></div>
                                  </div>
                                  <div className="grid grid-cols-1 gap-3">
                                  {chapter.lectures.map(lecture => (
                                     <div key={lecture.id} className="group relative">
                                        <button 
                                          onClick={() => { setSelectedLecture(lecture); setActiveView('video'); window.scrollTo(0,0); }}
                                          className="w-full flex items-center justify-between p-5 rounded-lg bg-slate-50 border border-slate-100 hover:border-blue-400 hover:bg-white transition-all shadow-sm"
                                        >
                                          <div className="flex items-center gap-5">
                                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
                                                <Play size={16} fill="currentColor" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-slate-900">{lecture.title}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">{lecture.duration} • Watch Now</p>
                                            </div>
                                          </div>
                                          <div className="p-2 bg-white rounded-md border border-slate-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <ChevronRight size={16} />
                                          </div>
                                        </button>
                                        
                                        {user?.role === 'admin' && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); copyDirectLink(selectedCourse.id, lecture.id); }}
                                            className="absolute right-16 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 flex items-center gap-2 font-black text-[9px] uppercase tracking-widest"
                                          >
                                            <LinkIcon size={12} /> Share
                                          </button>
                                        )}
                                     </div>
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
                <button onClick={() => { setHasDirectLink(false); setActiveView('course'); }} className="mb-8 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-black text-[10px] uppercase tracking-widest">
                   <ChevronLeft size={16}/> Back to Batch
                </button>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                  <div className="xl:col-span-8">
                    <VideoPlayer videoUrl={selectedLecture.videoUrl} title={selectedLecture.title} />
                    <div className="bg-white p-10 rounded-xl mt-8 border border-slate-100 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <div className="space-y-1">
                           <h1 className="text-2xl font-black text-slate-900 tracking-tight">{selectedLecture.title}</h1>
                           {hasDirectLink && <div className="text-emerald-600 font-black text-[9px] uppercase tracking-widest flex items-center gap-2"><CheckCircle2 size={10}/> Guest Access Granted</div>}
                        </div>
                        <span className="px-4 py-1.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-100">Academic Module</span>
                      </div>
                      <p className="text-slate-500 font-medium text-base leading-relaxed">{selectedLecture.description || "Instructional session details are standard for this batch."}</p>
                    </div>
                  </div>
                  
                  <div className="xl:col-span-4 space-y-8">
                     <div className="bg-slate-100 p-2 rounded-lg flex shadow-inner border border-slate-200">
                        <button onClick={() => setLectureTab('ai')} className={`flex-1 py-3 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'ai' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}><Sparkles size={14}/> AI Tutor</button>
                        <button onClick={() => setLectureTab('notes')} className={`flex-1 py-3 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${lectureTab === 'notes' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}><FileText size={14}/> Notes</button>
                     </div>

                     {lectureTab === 'ai' ? <DoubtSolver currentContext={selectedLecture.title} /> : (
                        <div className="bg-white p-8 rounded-xl border border-slate-100 min-h-[450px] shadow-sm">
                           <h3 className="font-black text-lg mb-6 text-slate-900">Batch Resources</h3>
                           <div className="space-y-3">
                              {selectedLecture.resources && selectedLecture.resources.length > 0 ? selectedLecture.resources.map(res => (
                                 <button key={res.id} onClick={() => window.open(res.url, '_blank')} className="w-full p-5 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-between hover:bg-blue-50 hover:border-blue-200 transition-all group">
                                    <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-blue-600 shadow-sm border border-slate-100 group-hover:scale-105 transition-transform">
                                          <Download size={16}/>
                                       </div>
                                       <span className="text-xs font-black text-slate-800">{res.title}</span>
                                    </div>
                                    <ExternalLink size={14} className="text-slate-300 group-hover:text-blue-600" />
                                 </button>
                              )) : (
                                <div className="text-center py-20 text-slate-300">
                                   <FileText size={40} className="mx-auto mb-4 opacity-20" />
                                   <p className="text-[10px] font-bold uppercase tracking-widest">No resources assigned</p>
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
    </div>
  );
};

export default App;
