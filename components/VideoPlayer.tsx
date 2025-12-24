
import React, { useState, useEffect } from 'react';
import { 
  Loader2, Zap, Settings, Monitor, Gauge, ShieldCheck, Maximize, AlertTriangle
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isYoutube, setIsYoutube] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      setIsLoading(false);
      setError("Resource link is currently unavailable or restricted.");
      return;
    }

    const cleanUrl = videoUrl.trim();
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = cleanUrl.match(ytRegex);

    if (ytMatch) {
      setIsYoutube(true);
      // Enhanced parameters for a professional learning experience
      setEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&autohide=1&color=white`);
    } else {
      setIsYoutube(false);
      setEmbedUrl(cleanUrl);
    }
    
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [videoUrl]);

  return (
    <div className="w-full space-y-5 animate-fadeIn">
      <div className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-slate-100 group transition-all duration-700">
        
        {error && !isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-6 p-12 text-center">
             <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500 mb-2">
                <AlertTriangle size={40} />
             </div>
             <div>
                <p className="text-white text-xl font-black tracking-tight">{error}</p>
                <p className="text-slate-500 text-sm mt-2 max-w-sm mx-auto">Please contact the administrator or check your session connectivity.</p>
             </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <Zap className="absolute inset-0 m-auto text-blue-500" size={20} />
            </div>
            <div className="text-center space-y-2">
               <p className="text-white text-sm font-black uppercase tracking-[0.2em]">Optimizing Stream</p>
               <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Establishing secure academic link...</p>
            </div>
          </div>
        )}

        {!error && (
          isYoutube ? (
            <iframe 
              src={embedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          ) : (
            <video 
              src={embedUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
              poster="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1500"
            >
              Your browser does not support the video tag.
            </video>
          )
        )}

        {/* Pro HUD Overlay */}
        <div className="absolute top-0 left-0 right-0 p-10 bg-gradient-to-b from-black/80 via-black/20 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
           <div className="flex justify-between items-start">
              <div className="space-y-2">
                 <h3 className="text-white font-black text-xl tracking-tight drop-shadow-2xl">{title}</h3>
                 <div className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,1)]"></span>
                    <p className="text-[11px] text-blue-400 font-black uppercase tracking-widest">Active Study Session</p>
                 </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-white/10">
                   <Monitor size={14} className="text-blue-400" /> Auto HD
                </div>
              </div>
           </div>
        </div>

        {/* Focus Mode Badge */}
        <div className="absolute bottom-10 left-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500 transform translate-y-6 group-hover:translate-y-0">
           <div className="bg-blue-600/90 backdrop-blur-xl border border-blue-400/30 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-2xl">
              <ShieldCheck className="text-white" size={18}/>
              <span className="text-[11px] font-black text-white uppercase tracking-widest">Distraction Free Mode</span>
           </div>
        </div>
      </div>
      
      {/* Player Utility Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-5 bg-slate-50 rounded-[2rem] border border-slate-100 shadow-sm gap-4">
         <div className="flex items-center gap-8">
            <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
               <Zap size={16} className="text-blue-600"/> 1.0x Speed
            </div>
            <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest">
               <Monitor size={16} className="text-blue-600"/> 1080p Playback
            </div>
         </div>
         <div className="flex items-center gap-6">
            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white px-4 py-2 rounded-xl transition-all border border-blue-600/20">
               Player Settings <Settings size={14}/>
            </button>
            <button className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors">
               <Maximize size={18} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
