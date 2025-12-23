import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ExternalLink, Youtube as YoutubeIcon, RefreshCw } from 'lucide-react';
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
  const [retryCount, setRetryCount] = useState(0);

  const getCleanId = (input: string) => {
    if (!input || typeof input !== 'string') return '';
    let str = input.trim();
    
    // Handle iframe strings
    if (str.includes('<iframe')) {
      const srcMatch = str.match(/src=["'](.*?)["']/);
      if (srcMatch && srcMatch[1]) str = srcMatch[1];
    }

    // Extract ID from URL
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = str.match(regex);
    if (match && match[1]) return match[1];
    
    // Check if it's already just the ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    
    return '';
  };

  const cleanId = getCleanId(videoId);
  const youtubeUrl = `https://www.youtube.com/watch?v=${cleanId}`;

  useEffect(() => {
    if (!cleanId || !containerRef.current) return;

    // Destroy previous instance
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    setLoadError(false);
    setIsReady(false);

    // Initialize Plyr using the YouTube provider
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
        modestbranding: 1
      },
    });

    player.on('ready', () => {
      setIsReady(true);
    });
    
    player.on('error', () => {
      setLoadError(true);
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [cleanId, retryCount]);

  const handleRedirect = () => {
    window.open(youtubeUrl, '_blank');
  };

  if (!cleanId || loadError) {
    return (
      <div className="w-full aspect-video bg-slate-950 rounded-[3rem] flex flex-col items-center justify-center text-center p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center max-w-md">
          <div className="w-20 h-20 mb-8 rounded-[2rem] bg-slate-900 border border-slate-800 flex items-center justify-center text-red-500 shadow-2xl">
            <YoutubeIcon size={44} className={loadError ? "animate-pulse" : ""} />
          </div>
          <h3 className="text-white font-black text-2xl mb-3 tracking-tight">Stream Unavailable</h3>
          <p className="text-slate-400 text-sm font-medium mb-10 leading-relaxed">
            This video might be restricted or the ID provided is incorrect. Try refreshing the stream or watch directly on YouTube.
          </p>
          <div className="flex gap-4">
            <button 
              onClick={() => setRetryCount(c => c + 1)}
              className="bg-slate-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-slate-700 transition-all"
            >
              <RefreshCw size={18} /> Retry
            </button>
            <button 
              onClick={handleRedirect}
              className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-red-500 transition-all shadow-xl shadow-red-600/20"
            >
              Watch on YouTube <ExternalLink size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-[3rem] overflow-hidden shadow-2xl ring-1 ring-white/10">
       {!isReady && (
         <div className="absolute inset-0 z-20 bg-slate-950 flex flex-col items-center justify-center gap-4">
            <RefreshCw className="text-blue-500 animate-spin" size={40} />
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Securing Lecture Stream...</p>
         </div>
       )}
       <div className="w-full h-full">
         <div 
           ref={containerRef}
           data-plyr-provider="youtube"
           data-plyr-embed-id={cleanId}
         ></div>
       </div>
    </div>
  );
};

export default VideoPlayer;