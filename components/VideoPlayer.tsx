
import React, { useState, useEffect } from 'react';
import { Youtube as YoutubeIcon, Loader2, ExternalLink, RefreshCw, Film, Play, Zap } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

type VideoSource = 'youtube' | 'vimeo' | 'dailymotion' | 'direct' | 'telegram' | 'unknown';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [sourceType, setSourceType] = useState<VideoSource>('unknown');
  const [embedUrl, setEmbedUrl] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    const url = videoUrl.trim();

    // 1. YouTube Detection
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);
    if (ytMatch) {
      setSourceType('youtube');
      // Professional settings: no related videos, no branding, hide info
      setEmbedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&controls=1`);
      return;
    }

    // 2. Telegram File Direct Detection
    if (url.includes('api.telegram.org/file/bot')) {
      setSourceType('telegram');
      setEmbedUrl(url);
      return;
    }

    // 3. Direct File Detection
    if (url.match(/\.(mp4|webm|ogg)$/) || url.includes('archive.org/download/')) {
      setSourceType('direct');
      setEmbedUrl(url);
      return;
    }

    setSourceType('unknown');
  }, [videoUrl]);

  if (sourceType === 'unknown') {
    return (
      <div className="w-full aspect-video bg-slate-950 rounded-[2.5rem] flex flex-col items-center justify-center text-center p-8 border border-slate-800 shadow-2xl">
         <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-slate-500 mb-4 border border-slate-800">
            <Film size={32} />
         </div>
         <h3 className="text-white font-bold text-lg mb-2">Unavailable Link</h3>
         <p className="text-slate-500 text-sm mb-6 max-w-xs">This content source isn't supported yet. We recommend YouTube or direct MP4 files.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group">
       {isLoading && (
         <div className="absolute inset-0 z-10 bg-slate-900 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-blue-600 animate-spin" size={48} />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest animate-pulse">Establishing Stream...</p>
         </div>
       )}

       {(sourceType === 'direct' || sourceType === 'telegram') ? (
         <video 
            key={key}
            src={embedUrl} 
            controls 
            autoPlay 
            className="w-full h-full object-contain bg-black"
            onLoadedData={() => setIsLoading(false)}
            onContextMenu={(e) => e.preventDefault()}
         />
       ) : (
         <iframe
           key={key}
           src={embedUrl}
           title={title}
           className="absolute inset-0 w-full h-full border-none"
           allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
           allowFullScreen
           onLoad={() => setIsLoading(false)}
         ></iframe>
       )}

       <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
         <div className="bg-black/60 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <Zap size={12} className="text-blue-400 fill-blue-400" /> Premium Player
         </div>
       </div>
    </div>
  );
};

export default VideoPlayer;
