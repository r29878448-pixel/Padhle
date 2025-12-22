import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import Plyr from 'plyr';

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, title }) => {
  const playerRef = useRef<Plyr | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isValid, setIsValid] = useState(true);

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
    if (!isValid || !cleanId || !containerRef.current) return;

    // Initialize Plyr using the iframe wrapper structure
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
        enablejsapi: 1
      },
    });

    playerRef.current = player;

    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
      }
    };
  }, [cleanId, isValid]);

  if (!isValid) {
    return (
      <div className="w-full aspect-video bg-[#0f172a] rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 border border-slate-800 shadow-2xl overflow-hidden">
        <div className="w-16 h-16 mb-6 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg">
          <AlertTriangle className="text-amber-500" size={32} strokeWidth={1.5} />
        </div>
        <h3 className="text-white font-black text-lg mb-2">Lecture Stream Offline</h3>
        <p className="text-slate-400 text-xs font-medium max-w-xs">The provided video source link is invalid or restricted. Please check the batch settings.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group">
       <div className="player-wrapper w-full h-full">
         <div 
           ref={containerRef} 
           className="plyr__video-embed"
         >
           <iframe
             src={`https://www.youtube.com/embed/${cleanId}?modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1`}
             allowFullScreen
             allow="autoplay; encrypted-media"
             title={title}
           ></iframe>
         </div>
       </div>
       {/* UI Polish: Decorative Inner Ring */}
       <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/5 rounded-[2.5rem] z-10"></div>
    </div>
  );
};

export default VideoPlayer;