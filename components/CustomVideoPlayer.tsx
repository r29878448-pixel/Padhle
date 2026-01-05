
import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Loader2, Radio, SkipBack, SkipForward, Settings, Activity
} from 'lucide-react';

interface CustomVideoPlayerProps {
  videoUrl: string;
  title: string;
}

const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({ videoUrl, title }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<number | null>(null);

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
          backBufferLength: 60,
          liveSyncDuration: 3
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => setIsPlaying(false));
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
    };
  }, [videoUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      switch(e.code) {
        case 'Space': e.preventDefault(); togglePlay(); break;
        case 'KeyM': setIsMuted(prev => !prev); break;
        case 'KeyF': toggleFullScreen(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLive, isPlaying]);

  const togglePlay = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  };

  const handleProgress = () => {
    if (videoRef.current && !isLive) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current && !isLive) {
      const time = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setProgress(Number(e.target.value));
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

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = window.setTimeout(() => setShowControls(false), 3000);
    }
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full aspect-video bg-black group overflow-hidden rounded-[3rem] shadow-2xl select-none"
    >
      <video 
        ref={videoRef}
        onClick={togglePlay}
        onTimeUpdate={handleProgress}
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
              <Activity size={12}/> Low Latency
           </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-50 text-center p-12">
           <p className="text-white text-xl font-black uppercase tracking-tight mb-8 leading-tight">{error}</p>
           <button onClick={() => window.location.reload()} className="px-12 py-5 bg-blue-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-blue-500/20">Retry Stream</button>
        </div>
      )}

      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xl z-50">
          <Loader2 className="w-20 h-20 text-blue-500 animate-spin" strokeWidth={1.5} />
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mt-10">Optimizing Content Flow...</p>
        </div>
      )}

      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="p-10 bg-blue-600 rounded-full text-white shadow-2xl scale-125 opacity-100 transition-all">
            <Play size={48} fill="currentColor" />
          </div>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20 transition-opacity duration-700 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        <div className="p-12 flex justify-between items-start">
           <h2 className="text-white font-black text-xl uppercase italic tracking-tighter drop-shadow-2xl">{title}</h2>
           <button className="p-4 bg-white/10 hover:bg-white/20 rounded-[1.5rem] text-white backdrop-blur-md border border-white/10 transition-all"><Settings size={22}/></button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-12 space-y-8">
          {!isLive && (
            <div className="relative group/progress">
               <input 
                type="range" min="0" max="100" value={progress} onChange={seek}
                className="w-full h-2 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-12">
              <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-all active:scale-90">
                {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" />}
              </button>
              
              {!isLive && (
                <div className="flex items-center gap-8">
                  <button onClick={() => {if(videoRef.current) videoRef.current.currentTime -= 10}} className="text-white/60 hover:text-white transition-all"><SkipBack size={32}/></button>
                  <button onClick={() => {if(videoRef.current) videoRef.current.currentTime += 10}} className="text-white/60 hover:text-white transition-all"><SkipForward size={32}/></button>
                </div>
              )}

              <div className="hidden sm:flex items-center gap-5 text-white group/volume">
                 <button onClick={() => setIsMuted(!isMuted)} className="hover:text-blue-500 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={28}/> : <Volume2 size={28}/>}
                 </button>
                 <input 
                   type="range" min="0" max="1" step="0.05" 
                   value={volume} 
                   onChange={(e) => {setVolume(Number(e.target.value)); if(videoRef.current) videoRef.current.volume = Number(e.target.value);}}
                   className="w-0 group-hover/volume:w-28 transition-all accent-white h-1.5 cursor-pointer"
                 />
              </div>
            </div>

            <div className="flex items-center gap-8">
              {!isLive && (
                <button onClick={() => {
                  const speeds = [1, 1.25, 1.5, 2, 0.75];
                  const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
                  if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
                  setPlaybackSpeed(nextSpeed);
                }} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all backdrop-blur-md active:scale-95">
                  {playbackSpeed}x Speed
                </button>
              )}
              <button onClick={toggleFullScreen} className="text-white hover:text-blue-600 transition-all active:scale-90">
                {isFullScreen ? <Minimize size={32}/> : <Maximize size={32}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
