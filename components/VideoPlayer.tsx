
import React, { useState, useEffect } from 'react';
import { 
  Loader2, Zap, Settings, Monitor, Gauge, ShieldCheck, Maximize, AlertTriangle, ExternalLink
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [playerMode, setPlayerMode] = useState<'youtube' | 'vimeo' | 'direct' | 'iframe' | 'telegram' | 'none'>('none');
  const [processedUrl, setProcessedUrl] = useState('');
  const [telegramPost, setTelegramPost] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    setIsLoading(true);
    setTelegramPost(null);

    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      setIsLoading(false);
      setPlayerMode('none');
      setError("Resource link is currently unavailable.");
      return;
    }

    const cleanUrl = videoUrl.trim();
    
    // 1. YouTube Check
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = cleanUrl.match(ytRegex);

    // 2. Vimeo Check
    const vimeoRegex = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
    const vimeoMatch = cleanUrl.match(vimeoRegex);

    // 3. Direct Video File Check (.mp4, .webm, .ogg)
    const isDirectVideo = /\.(mp4|webm|ogg|m4v)(\?.*)?$/i.test(cleanUrl);

    // 4. Telegram Post Check
    const tgRegex = /t\.me\/([a-zA-Z0-9_]+)\/([0-9]+)/;
    const tgMatch = cleanUrl.match(tgRegex);

    if (ytMatch) {
      setPlayerMode('youtube');
      setProcessedUrl(`https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&showinfo=0&autohide=1`);
      setIsLoading(false);
    } else if (vimeoMatch) {
      setPlayerMode('vimeo');
      setProcessedUrl(`https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1&title=0&byline=0&portrait=0`);
      setIsLoading(false);
    } else if (isDirectVideo) {
      setPlayerMode('direct');
      setProcessedUrl(cleanUrl);
      setIsLoading(false);
    } else if (tgMatch) {
      setPlayerMode('telegram');
      setTelegramPost(`${tgMatch[1]}/${tgMatch[2]}`);
      setIsLoading(false);
    } else {
      // 5. Default to IFrame
      setPlayerMode('iframe');
      setProcessedUrl(cleanUrl);
      setIsLoading(false);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (playerMode === 'telegram' && telegramPost) {
       const script = document.createElement('script');
       script.src = "https://telegram.org/js/telegram-widget.js?22";
       script.setAttribute('data-telegram-post', telegramPost);
       script.setAttribute('data-width', '100%');
       script.async = true;
       
       const container = document.getElementById('telegram-embed-container');
       if (container) {
         container.innerHTML = '';
         container.appendChild(script);
       }
    }
  }, [playerMode, telegramPost]);

  return (
    <div className="w-full space-y-4 animate-fadeIn">
      <div className={`relative w-full ${playerMode === 'telegram' ? 'min-h-[400px] bg-white' : 'aspect-video bg-black'} rounded-none overflow-hidden shadow-2xl ring-1 ring-slate-800 group border border-slate-900`}>
        
        {error && !isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-4 p-10 text-center">
             <div className="w-16 h-16 bg-amber-500/10 rounded-none flex items-center justify-center text-amber-500 border border-amber-500/20">
                <AlertTriangle size={32} />
             </div>
             <div>
                <p className="text-white text-lg font-black tracking-tight">{error}</p>
                <button 
                  onClick={() => window.open(videoUrl, '_blank')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 mx-auto"
                >
                  <ExternalLink size={14}/> Open in External Window
                </button>
             </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-5">
            <div className="w-12 h-12 border-2 border-blue-600/20 border-t-blue-600 rounded-none animate-spin"></div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Verifying Media Source...</p>
          </div>
        )}

        {!error && !isLoading && (
          playerMode === 'direct' ? (
            <video 
              src={processedUrl}
              className="w-full h-full object-contain"
              controls
              autoPlay
            />
          ) : playerMode === 'telegram' ? (
             <div className="w-full h-full flex items-center justify-center overflow-y-auto p-4 bg-slate-50">
               <div id="telegram-embed-container" className="w-full max-w-md flex justify-center"></div>
             </div>
          ) : (
            <iframe 
              src={processedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={title}
            />
          )
        )}

        {playerMode !== 'telegram' && (
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
             <div className="flex justify-between items-start">
                <h3 className="text-white font-black text-base tracking-tight truncate max-w-[80%] uppercase">{title}</h3>
                <div className="bg-blue-600 px-3 py-1 text-white text-[8px] font-black uppercase tracking-widest border border-blue-500">
                   Secure Link
                </div>
             </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-slate-50 border border-slate-200 shadow-sm gap-4 rounded-none">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <Zap size={14} className="text-blue-600"/> High Speed
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <Monitor size={14} className="text-blue-600"/> {playerMode === 'telegram' ? 'Secure Feed' : '1080p Stream'}
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button 
              onClick={() => window.open(videoUrl, '_blank')}
              className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-blue-600 transition-all px-3 py-2 border border-slate-200 bg-white"
            >
               Alternative Link <ExternalLink size={12}/>
            </button>
            <button className="p-2 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 transition-colors">
               <Maximize size={16} />
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
