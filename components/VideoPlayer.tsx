
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
      setError("Academic resource currently unavailable.");
      return;
    }

    const cleanUrl = videoUrl.trim();
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = cleanUrl.match(ytRegex);

    if (ytMatch) {
      setIsYoutube(true);
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
    <div className="w-full space-y-4 animate-fadeIn">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl ring-1 ring-slate-800 group border border-slate-900">
        
        {error && !isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-4 p-10 text-center">
             <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-amber-500">
                <AlertTriangle size={32} />
             </div>
             <p className="text-white text-lg font-black tracking-tight">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-5">
            <div className="w-12 h-12 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Securing Stream...</p>
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
            />
          )
        )}

        <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
           <div className="flex justify-between items-start">
              <h3 className="text-white font-black text-lg tracking-tight truncate max-w-[70%]">{title}</h3>
              <div className="bg-blue-600 px-4 py-1.5 rounded text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                 Live Study Session
              </div>
           </div>
        </div>

        <div className="absolute bottom-8 left-8 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
           <div className="bg-slate-900/90 backdrop-blur-md border border-slate-700 px-4 py-2 rounded-md flex items-center gap-3">
              <ShieldCheck className="text-blue-500" size={14}/>
              <span className="text-[9px] font-black text-white uppercase tracking-widest">Distraction Free Environment</span>
           </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 bg-slate-50 rounded-lg border border-slate-100 shadow-sm gap-4">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <Zap size={14} className="text-blue-600"/> 1.0x Normal
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
               <Monitor size={14} className="text-blue-600"/> 1080p Playback
            </div>
         </div>
         <div className="flex items-center gap-4">
            <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2 hover:bg-blue-600 hover:text-white px-3 py-2 rounded transition-all border border-blue-600/20">
               Settings <Settings size={12}/>
            </button>
            <button className="p-2 bg-white rounded border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors">
               <Maximize size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
