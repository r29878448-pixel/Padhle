import React, { useState } from 'react';
import { Youtube as YoutubeIcon, Loader2, ExternalLink } from 'lucide-react';

interface VideoPlayerProps {
  videoId: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoId, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); // Used to force re-render if needed

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
  
  // Construct a clean embed URL
  // autoplay=1: Starts video automatically (browser policy permitting)
  // rel=0: Shows related videos from the same channel only
  // modestbranding=1: Removes some YouTube branding
  // playsinline=1: Plays inline on iOS, but allows fullscreen
  const embedUrl = `https://www.youtube.com/embed/${cleanId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${cleanId}`;

  const handleRetry = () => {
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  if (!cleanId) {
    return (
      <div className="w-full aspect-video bg-slate-950 rounded-[2rem] flex flex-col items-center justify-center text-center p-8 border border-slate-800 shadow-2xl">
         <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-red-500 mb-4 shadow-inner border border-slate-800">
            <YoutubeIcon size={32} />
         </div>
         <h3 className="text-white font-bold text-lg mb-2">Video Unavailable</h3>
         <p className="text-slate-500 text-sm">The video source could not be verified.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-2xl ring-1 ring-slate-900/50 group">
       {/* Loading Overlay */}
       {isLoading && (
         <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-blue-600 animate-spin" size={48} />
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Class...</p>
         </div>
       )}

       {/* Native YouTube Iframe - The most stable way to play videos */}
       <iframe
         key={key}
         src={embedUrl}
         title={title}
         className="absolute inset-0 w-full h-full"
         allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
         allowFullScreen
         onLoad={() => setIsLoading(false)}
       ></iframe>

       {/* Backup link for extreme cases */}
       <a 
         href={watchUrl} 
         target="_blank" 
         rel="noopener noreferrer"
         className="absolute bottom-4 right-4 bg-black/50 hover:bg-red-600 text-white p-2 rounded-xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all scale-90 hover:scale-100 border border-white/10"
         title="Open in YouTube App"
       >
         <ExternalLink size={16} />
       </a>
    </div>
  );
};

export default VideoPlayer;