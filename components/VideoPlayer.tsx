
import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Loader2, Zap, Monitor, AlertTriangle, ExternalLink, Globe, PlayCircle, SkipForward, Film, LayoutTemplate, ShieldCheck
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [playerMode, setPlayerMode] = useState<'youtube' | 'vimeo' | 'native' | 'iframe' | 'telegram' | 'none'>('none');
  const [processedUrl, setProcessedUrl] = useState('');
  const [telegramPost, setTelegramPost] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceEmbed, setForceEmbed] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    setForceEmbed(false);
  }, [videoUrl]);

  useEffect(() => {
    setError(null);
    setIsLoading(true);
    setTelegramPost(null);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!videoUrl || typeof videoUrl !== 'string' || videoUrl.trim() === '') {
      setIsLoading(false);
      setPlayerMode('none');
      setError("Resource link is currently unavailable.");
      return;
    }

    const cleanUrl = videoUrl.trim();

    const getYoutubeId = (url: string) => {
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'youtu.be') return urlObj.pathname.slice(1);
        if (urlObj.hostname.includes('youtube.com')) {
          if (urlObj.pathname.includes('/shorts/')) return urlObj.pathname.split('/shorts/')[1].split(/[?#&]/)[0];
          if (urlObj.pathname.includes('/live/')) return urlObj.pathname.split('/live/')[1].split(/[?#&]/)[0];
          if (urlObj.pathname.includes('/embed/')) return urlObj.pathname.split('/embed/')[1].split(/[?#&]/)[0];
          return urlObj.searchParams.get('v');
        }
      } catch (e) {
        // Fallback to regex if URL construction fails
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|live\/|shorts\/)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length >= 10) ? match[2] : null;
      }
      return null;
    };
    
    const getVimeoId = (url: string) => {
      const regExp = /(?:vimeo\.com\/|player\.vimeo\.com\/video\/)([0-9]+)/;
      const match = url.match(regExp);
      return match ? match[1] : null;
    };

    const ytId = getYoutubeId(cleanUrl);
    const vimeoId = getVimeoId(cleanUrl);
    const tgRegex = /t\.me\/([a-zA-Z0-9_]+)\/([0-9]+)/;
    const tgMatch = cleanUrl.match(tgRegex);

    if (forceEmbed) {
        if (ytId) {
            setPlayerMode('youtube');
            setProcessedUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&rel=0&modestbranding=1`);
        } else if (vimeoId) {
            setPlayerMode('vimeo');
            setProcessedUrl(`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&title=0&byline=0&portrait=0`);
        } else {
            setPlayerMode('iframe');
            setProcessedUrl(cleanUrl);
        }
        setIsLoading(false);
        return;
    }

    if (ytId) {
      setPlayerMode('youtube');
      setProcessedUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&rel=0&modestbranding=1`);
      setIsLoading(false);
    } else if (vimeoId) {
      setPlayerMode('vimeo');
      setProcessedUrl(`https://player.vimeo.com/video/${vimeoId}?autoplay=1&muted=1&title=0&byline=0&portrait=0`);
      setIsLoading(false);
    } else if (tgMatch) {
      setPlayerMode('telegram');
      setTelegramPost(`${tgMatch[1]}/${tgMatch[2]}`);
      setIsLoading(false);
    } else {
      setPlayerMode('native');
      setProcessedUrl(cleanUrl);
      setIsLoading(false);
    }
  }, [videoUrl, forceEmbed]);

  useEffect(() => {
    if (playerMode === 'native' && processedUrl && videoRef.current) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(processedUrl);
        hls.attachMedia(videoRef.current);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          videoRef.current?.play().catch(() => {});
        });
        hlsRef.current = hls;
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = processedUrl;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.src = processedUrl;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [playerMode, processedUrl]);

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
      <div className={`relative w-full ${playerMode === 'telegram' ? 'min-h-[400px] bg-white' : 'aspect-video bg-black'} border border-slate-900 overflow-hidden shadow-2xl group rounded-2xl`}>
        {error && !isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-10 text-center">
             <AlertTriangle size={32} className="text-amber-500 mb-4" />
             <p className="text-white text-lg font-black uppercase tracking-tight">{error}</p>
             <button onClick={() => setForceEmbed(true)} className="mt-6 px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500">Switch to Embed Mode</button>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center">
            <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
            <p className="text-white text-[9px] font-black uppercase tracking-widest">Securing Connection...</p>
          </div>
        )}

        {!error && !isLoading && (
          playerMode === 'native' ? (
             <video ref={videoRef} className="w-full h-full object-contain" controls autoPlay playsInline onError={() => setError("Format failed in Native Player")} />
          ) : playerMode === 'telegram' ? (
             <div className="w-full h-full flex items-center justify-center p-4 bg-slate-50"><div id="telegram-embed-container" className="w-full max-w-md"></div></div>
          ) : (
            <iframe 
              src={processedUrl} 
              className="w-full h-full border-0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" 
              allowFullScreen 
              title={title} 
            />
          )
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-white border border-slate-200 shadow-sm gap-4 rounded-xl">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <ShieldCheck size={14} className="text-emerald-500"/> Secured Stream
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <Monitor size={14} className="text-blue-600"/> {playerMode.toUpperCase()} Mode
            </div>
         </div>
         <div className="flex items-center gap-3">
            <button onClick={() => setForceEmbed(!forceEmbed)} className={`text-[9px] font-black uppercase tracking-widest px-4 py-2 border rounded-lg transition-all ${forceEmbed ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>
               {forceEmbed ? 'Switch Native' : 'Force Embed'}
            </button>
            <button onClick={() => window.open(videoUrl, '_blank')} className="text-[9px] font-black text-slate-500 uppercase tracking-widest px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 transition-all flex items-center gap-2 rounded-lg">
               Source <ExternalLink size={12}/>
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
