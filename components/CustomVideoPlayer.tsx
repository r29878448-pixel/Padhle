
import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Loader2, Radio, Activity
} from 'lucide-react';

interface CustomVideoPlayerProps {
  videoUrl: string;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number>(0);
  const hlsRef = useRef<Hls | null>(null);
  const syncIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);
    
    const isHls = videoUrl.includes('.m3u8') || videoUrl.includes('/live') || videoUrl.includes('playlist');
    setIsLive(isHls);
    
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          liveSyncDuration: 3, // Target 3s behind live
          liveMaxLatencyDuration: 6, // Max allowed drift before hard seek
          maxLiveSyncPlaybackRate: 1.1, // Speed up to catch up
          liveSyncDurationCount: 3,
        });
        
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => setIsPlaying(false));
        });

        hls.on(Hls.Events.FRAG_LOADED, () => {
          if (hls.liveSyncPosition) {
            const currentLatency = hls.liveSyncPosition - video.currentTime;
            setLatency(Math.max(0, Math.floor(currentLatency)));
            
            // Auto-sync if latency > 5 seconds
            if (currentLatency > 5) {
              video.currentTime = hls.liveSyncPosition - 3;
            }
          }
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError("Live session server connection failed.");
        });
        
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', () => setIsLoading(false));
      } else {
        setError("Browser mismatch for high-end playback.");
      }
    } else {
      video.src = videoUrl;
      video.addEventListener('loadeddata', () => setIsLoading(false));
      video.addEventListener('error', () => setError("Failed to synchronize session."));
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      if (syncIntervalRef.current) window.clearInterval(syncIntervalRef.current);
    };
  }, [videoUrl]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullScreen(true);
    } else {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={() => setShowControls(true)}
      className="relative w-full aspect-video bg-black group overflow-hidden rounded-[3rem] shadow-2xl select-none"
    >
      <video 
        ref={videoRef}
        onClick={togglePlay}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        muted={isMuted}
      />

      {isLive && (
        <div className="absolute top-8 left-8 z-40 flex items-center gap-3">
           <div className="bg-red-600 text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl live-pulse">
              <Radio size={14} strokeWidth={3} /> LIVE SESSION
           </div>
           <div className="bg-black/40 backdrop-blur-md text-white/80 px-4 py-2 rounded-2xl text-[8px] font-black uppercase tracking-widest border border-white/10 flex items-center gap-2">
              <Activity size={12}/> {latency}s Delay
           </div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl z-50">
          <Loader2 className="w-20 h-20 text-blue-500 animate-spin" strokeWidth={1.5} />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-10">Syncing Alpha Stream...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-50 text-center p-12">
           <p className="text-white text-xl font-black uppercase tracking-tight mb-8 leading-tight">{error}</p>
           <button onClick={() => window.location.reload()} className="px-12 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest">Retry Stream</button>
        </div>
      )}

      <div className={`absolute bottom-0 left-0 right-0 p-12 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-500 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-10">
            <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-all">
              {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" />}
            </button>
            <div className="flex items-center gap-5 text-white">
               <button onClick={() => setIsMuted(!isMuted)}>
                  {isMuted || volume === 0 ? <VolumeX size={28}/> : <Volume2 size={28}/>}
               </button>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <button onClick={toggleFullScreen} className="text-white hover:text-blue-600 transition-all">
              {isFullScreen ? <Minimize size={32}/> : <Maximize size={32}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
