
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Plyr from 'plyr';

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [isValid, setIsValid] = useState(true);

  /**
   * Advanced YouTube ID Parser
   */
  const getCleanId = (input: string) => {
    if (!input || typeof input !== 'string') return '';
    let str = input.trim();

    if (str.includes('<') && str.includes('>')) {
       const srcMatch = str.match(/src=["'](.*?)["']/);
       if (srcMatch && srcMatch[1]) str = srcMatch[1];
    }

    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = str.match(regex);
    if (match && match[1]) return match[1];

    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    return '';
  };

  const cleanId = getCleanId(videoId);

  useEffect(() => {
    setIsValid(!!cleanId);
  }, [cleanId]);

  useEffect(() => {
    // 1. Clean up previous instance
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }

    // 2. Initialize new player if valid
    if (isValid && cleanId && containerRef.current) {
      // Create a fresh element for Plyr to use. 
      // This avoids React vs Plyr DOM conflicts and ensures a clean state.
      const element = document.createElement('div');
      containerRef.current.innerHTML = ''; 
      containerRef.current.appendChild(element);

      const player = new Plyr(element, {
        controls: [
          'play-large', 'play', 'progress', 'current-time', 'duration', 
          'mute', 'volume', 'captions', 'settings', 'pip', 'airplay', 'fullscreen'
        ],
        settings: ['captions', 'quality', 'speed'],
        youtube: { 
          noCookie: true, 
          rel: 0, 
          showinfo: 0, 
          iv_load_policy: 3, 
          modestbranding: 1,
          origin: window.location.origin // Critical for avoiding SecurityError
        },
        tooltips: { controls: true, seek: true },
        keyboard: { focused: true, global: true },
      });

      // Programmatically set source. This lets Plyr generate the iframe securely.
      player.source = {
        type: 'video',
        sources: [
          {
            src: cleanId,
            provider: 'youtube',
          },
        ],
      };

      playerRef.current = player;
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [cleanId, isValid]);

  if (!isValid) {
    return (
      <div className="w-full aspect-video bg-[#0f172a] rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <div className="w-16 h-16 mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg">
          <AlertTriangle className="text-amber-500" size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-white font-black text-lg mb-2 tracking-tight">Video playback failed</h3>
        <p className="text-slate-400 text-xs font-medium max-w-xs leading-relaxed">
          The video ID could not be resolved. Please verify the link in the Admin Panel.
        </p>
        <div className="mt-6 px-4 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
           <code className="text-[10px] text-slate-500 font-mono break-all line-clamp-1 max-w-[200px]">
             {videoId || 'No Source'}
           </code>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group bg-slate-950 z-10">
       {/* Container for Plyr injection */}
       <div ref={containerRef} className="w-full h-full" />
       
       {/* Aesthetic Border Overlay */}
       <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10 rounded-[2.5rem] z-50"></div>
    </div>
  );
};

export default VideoPlayer;
