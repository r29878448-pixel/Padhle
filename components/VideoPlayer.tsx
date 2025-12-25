
import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Loader2, Zap, Monitor, AlertTriangle, ExternalLink, Globe, PlayCircle, SkipForward, Film, LayoutTemplate
} from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

const ROLEX_INTRO_URL = "https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-a-circuit-board-98-large.mp4"; // Placeholder Tech Intro

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [playerMode, setPlayerMode] = useState<'youtube' | 'vimeo' | 'native' | 'iframe' | 'telegram' | 'none'>('none');
  const [processedUrl, setProcessedUrl] = useState('');
  const [telegramPost, setTelegramPost] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forceEmbed, setForceEmbed] = useState(false); // Changed from forceNative to forceEmbed since Native is default
  
  // Intro State
  const [showIntro, setShowIntro] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  // Reset intro on new video
  useEffect(() => {
    setShowIntro(true);
    setForceEmbed(false); // Reset override on new video
  }, [videoUrl]);

  useEffect(() => {
    setError(null);
    setIsLoading(true);
    setTelegramPost(null);

    // Cleanup previous HLS
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

    // If User Forces Embed Mode (Iframe)
    if (forceEmbed) {
        setPlayerMode('iframe');
        setProcessedUrl(cleanUrl);
        setIsLoading(false);
        return;
    }

    // Standard Detection
    const getYoutubeId = (url: string) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length >= 10) ? match[2] : null;
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

    if (ytId) {
      setPlayerMode('youtube');
      setProcessedUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&origin=${window.location.origin}`);
      setIsLoading(false);
    } else if (vimeoId) {
      setPlayerMode('vimeo');
      setProcessedUrl(`https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0`);
      setIsLoading(false);
    } else if (tgMatch) {
      setPlayerMode('telegram');
      setTelegramPost(`${tgMatch[1]}/${tgMatch[2]}`);
      setIsLoading(false);
    } else {
      // DEFAULT TO NATIVE PLAYER (User Request)
      // This handles .mp4, .m3u8, and generic Rolex/External links by attempting to stream them directly
      setPlayerMode('native');
      setProcessedUrl(cleanUrl);
      setIsLoading(false);
    }
  }, [videoUrl, forceEmbed]);

  // Native Player Logic (HLS + Direct)
  useEffect(() => {
    if (!showIntro && playerMode === 'native' && processedUrl && videoRef.current) {
      
      // 1. Try HLS.js
      if (Hls.isSupported()) {
        const hls = new Hls({
            debug: false,
            enableWorker: true,
            disableAltAudio: true // Helps with some mixed streams
        });
        
        hls.loadSource(processedUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on(Hls.Events.MEDIA_ATTACHED, () => {
          videoRef.current?.play().catch(() => console.log('Autoplay blocked'));
        });
        
        hls.on(Hls.Events.ERROR, (event, data) => {
             if (data.fatal) {
                 // If HLS fails critically, we don't immediately show error, 
                 // because the video tag might handle it natively (e.g. standard MP4)
                 console.warn('HLS Fatal Error, falling back to native video tag', data);
                 hls.destroy();
             }
        });
        hlsRef.current = hls;
      } 
      // 2. Fallback to Native HLS (Safari) or Standard Video (MP4)
      else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = processedUrl;
        videoRef.current.play().catch(() => console.log('Autoplay blocked'));
      } else {
        // Just set src for standard MP4/WebM
        videoRef.current.src = processedUrl;
        videoRef.current.play().catch(() => console.log('Autoplay blocked'));
      }
    }
  }, [showIntro, playerMode, processedUrl]);

  // Handle Telegram Script
  useEffect(() => {
    if (!showIntro && playerMode === 'telegram' && telegramPost) {
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
  }, [showIntro, playerMode, telegramPost]);

  const handleIntroEnd = () => {
    setShowIntro(false);
  };

  const handleError = () => {
      // If the native video tag fails to play
      if (!forceEmbed && playerMode === 'native') {
          setError("Stream format not recognized by Native Player.");
      }
  };

  if (showIntro && !isLoading && !error && playerMode !== 'none') {
      return (
          <div className="w-full aspect-video bg-black relative overflow-hidden group">
              <video 
                src={ROLEX_INTRO_URL} 
                autoPlay 
                muted 
                onEnded={handleIntroEnd}
                className="w-full h-full object-cover"
                playsInline
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20">
                  <h2 className="text-4xl font-black text-white tracking-tighter uppercase drop-shadow-2xl animate-pulse">Rolex Coders</h2>
                  <p className="text-blue-400 font-bold tracking-widest text-xs mt-2 uppercase">Official Learning Stream</p>
              </div>
              <button 
                onClick={handleIntroEnd} 
                className="absolute bottom-8 right-8 bg-white/10 hover:bg-white/20 text-white px-6 py-2 backdrop-blur-md rounded-none border border-white/20 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
              >
                Skip Intro <SkipForward size={14} />
              </button>
          </div>
      );
  }

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
                <p className="text-slate-400 text-xs mt-2 mb-6">The link might be a webpage instead of a direct video stream.</p>
                <div className="flex gap-4 justify-center">
                    <button 
                      onClick={() => { setError(null); setForceEmbed(true); }}
                      className="px-6 py-3 bg-blue-600 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all"
                    >
                      <LayoutTemplate size={14}/> Switch to Embed Mode
                    </button>
                    <button 
                      onClick={() => window.open(videoUrl, '_blank')}
                      className="px-6 py-3 bg-slate-800 text-white text-xs font-black uppercase tracking-widest flex items-center gap-2 border border-slate-700 hover:bg-slate-700 transition-all"
                    >
                      <ExternalLink size={14}/> Open Externally
                    </button>
                </div>
             </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center gap-5">
            <div className="w-12 h-12 border-2 border-blue-600/20 border-t-blue-600 rounded-none animate-spin"></div>
            <p className="text-white text-[10px] font-black uppercase tracking-widest">Optimizing Playback...</p>
          </div>
        )}

        {!error && !isLoading && (
          playerMode === 'native' ? (
             <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
                onError={handleError}
             />
          ) : playerMode === 'telegram' ? (
             <div className="w-full h-full flex items-center justify-center overflow-y-auto p-4 bg-slate-50">
               <div id="telegram-embed-container" className="w-full max-w-md flex justify-center"></div>
             </div>
          ) : (
            <iframe 
              src={processedUrl}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              title={title}
              referrerPolicy="no-referrer-when-downgrade"
              sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation allow-presentation"
            />
          )
        )}

        {playerMode !== 'telegram' && !error && (
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300">
             <div className="flex justify-between items-start">
                <h3 className="text-white font-black text-base tracking-tight truncate max-w-[80%] uppercase">{title}</h3>
                <div className="bg-blue-600 px-3 py-1 text-white text-[8px] font-black uppercase tracking-widest border border-blue-500">
                   {forceEmbed ? 'Embed Mode' : 'Native Player'}
                </div>
             </div>
          </div>
        )}
      </div>
      
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 bg-slate-50 border border-slate-200 shadow-sm gap-4 rounded-none">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <Zap size={14} className="text-blue-600"/> {playerMode === 'native' ? 'HLS/Direct Stream' : 'Web Resource'}
            </div>
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <Monitor size={14} className="text-blue-600"/> {forceEmbed ? 'External Player' : 'App Player'}
            </div>
         </div>
         <div className="flex items-center gap-3">
             <button 
                onClick={() => { setShowIntro(true); }}
                className="text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all px-3 py-2 border bg-white text-slate-500 border-slate-200 hover:text-blue-600"
                title="Replay Intro"
            >
               <Film size={12}/> Intro
            </button>
            <button 
                onClick={() => setForceEmbed(!forceEmbed)}
                className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all px-3 py-2 border ${forceEmbed ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200 hover:text-blue-600'}`}
                title={forceEmbed ? "Switch to Native Player" : "Switch to Embed Mode (Iframe)"}
            >
               {forceEmbed ? <PlayCircle size={12}/> : <LayoutTemplate size={12}/>} {forceEmbed ? 'Use Native Player' : 'Use Embed Mode'}
            </button>
            <button 
              onClick={() => window.open(videoUrl, '_blank')}
              className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 hover:text-blue-600 transition-all px-3 py-2 border border-slate-200 bg-white"
            >
               Source <ExternalLink size={12}/>
            </button>
         </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
