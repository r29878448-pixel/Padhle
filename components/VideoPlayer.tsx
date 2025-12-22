import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Youtube as YoutubeIcon, RefreshCw, PlayCircle } from 'lucide-react';
import Plyr from 'plyr';

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, title }) => {
  const playerRef = useRef<Plyr | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadError, setLoadError] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const getCleanId = (input: string) => {
    if (!input || typeof input !== 'string') return '';
    let str = input.trim();
    // Handle full embed codes
    if (str.includes('<') && str.includes('>')) {
       const srcMatch = str.match(/src=["'](.*?)["']/);
       if (srcMatch && srcMatch[1]) str = srcMatch[1];
    }
    // Standard YouTube URL/ID extraction
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = str.match(regex);
    if (match && match[1]) return match[1];
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    return '';
  };

  const cleanId = getCleanId(videoId);
  const youtubeUrl = `https://www.youtube.com/watch?v=${cleanId}`;

  useEffect(() => {
    setLoadError(false);
    setIsReady(false);
  }, [cleanId]);

  useEffect(() => {
    if (!cleanId || !containerRef.current) return;

    // Initialize Plyr
    const player = new Plyr(containerRef.current, {
      controls: [
        'play-large', 'play', 'progress', 'current-time', 'duration', 
        'mute', 'volume', 'settings', 'pip', 'fullscreen'
      ],
      settings: ['quality', 'speed'],
      youtube: { 
        noCookie: true, 
        rel: 0, 
        showinfo: 0, 
        iv_load_policy: 3, 
        modestbranding: 1,
        enablejsapi: 1,
        origin: window.location.origin
      },
    });

    player.on('ready', () => setIsReady(true));
    
    // Listen for embedding errors or restricted playback
    player.on('error', () => {
      console.warn("Playback error detected, switching to fallback.");
      setLoadError(true);
    });

    playerRef.current = player;

    // Safety timeout: If video doesn't load in 10s, it might be restricted
    const timeout = setTimeout(() => {
      if (!player.ready && !loadError) {
        // We don't force error yet, but user might be on slow net
      }
    }, 12000);

    return () => {
      clearTimeout(timeout);
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [cleanId]);

  const handleRedirect = () => {
    window.open(youtubeUrl, '_blank');
  };

  if (!cleanId || loadError) {
    return (
      <div className="w-full aspect-video bg-slate-950 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex flex-col items-center max-w-sm">
          <div className="w-20 h-20 mb-8 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center text-red-500 shadow-2xl animate-pulse">
            <YoutubeIcon size={44} />
          </div>
          
          <h3 className="text-white font-black text-2xl mb-3 tracking-tight">Playback Restricted</h3>
          <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">
            This educational content is restricted for third-party embedding by the owner. Please continue your lecture on the official YouTube platform.
          </p>

          <button 
            onClick={handleRedirect}
            className="group bg-red-600 hover:bg-red-500 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-red-600/20 active:scale-95"
          >
            Watch on YouTube 
            <ExternalLink size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group">
       {!isReady && (
         <div className="absolute inset-0 z-20 bg-slate-900 flex flex-col items-center justify-center gap-4">
            <RefreshCw className="text-blue-500 animate-spin" size={40} />
            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Initializing Secure Stream...</p>
         </div>
       )}
       <div className="player-wrapper w-full h-full">
         <div 
           ref={containerRef} 
           className="plyr__video-embed"
         >
           <iframe
             src={`https://www.youtube.com/embed/${cleanId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&origin=${window.location.origin}`}
             allowFullScreen
             allow="autoplay; encrypted-media; picture-in-picture"
             title={title}
           ></iframe>
         </div>
       </div>
       
       {/* Floating Native Redirection for accessibility */}
       <button 
         onClick={handleRedirect}
         className="absolute bottom-6 right-20 z-50 p-3 bg-black/40 backdrop-blur-md border border-white/10 text-white/40 hover:text-red-500 hover:border-red-500/50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
         title="Open in YouTube"
       >
         <ExternalLink size={18} />
       </button>
       
       <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 rounded-[3rem] z-10"></div>
    </div>
  );
};

export default VideoPlayer;