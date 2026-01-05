
import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  RotateCcw, RotateCw, PlayCircle, Loader2, FastForward, Info, Monitor, Radio, SkipBack, SkipForward
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
    
    // Check if the source is an HLS/Live stream
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
          backBufferLength: 60
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => setIsPlaying(false));
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError("Live stream currently unavailable.");
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', () => setIsLoading(false));
      } else {
        setError("Your browser does not support HLS playback.");
      }
    } else {
      // Standard video or YouTube (YouTube handled via iframe usually, but this is a native player)
      video.src = videoUrl;
      video.addEventListener('loadeddata', () => setIsLoading(false));
      video.addEventListener('error', () => setError("Failed to load video resource."));
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [videoUrl]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
      
      switch(e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'KeyM':
          setIsMuted(prev => !prev);
          break;
        case 'KeyF':
          toggleFullScreen();
          break;
        case 'ArrowRight':
          if (!isLive) skip(10);
          break;
        case 'ArrowLeft':
          if (!isLive) skip(-10);
          break;
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

  const skip = (seconds: number) => {
    if (videoRef.current && !isLive) {
      videoRef.current.currentTime += seconds;
      setShowControls(true);
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

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 2, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    if (videoRef.current) videoRef.current.playbackRate = nextSpeed;
    setPlaybackSpeed(nextSpeed);
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
      className="relative w-full aspect-video bg-slate-950 group overflow-hidden rounded-[2.5rem] shadow-2xl border border-slate-900 select-none"
    >
      {/* Native Video Element */}
      <video 
        ref={videoRef}
        onClick={togglePlay}
        onTimeUpdate={handleProgress}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
        muted={isMuted}
      />

      {/* LIVE Indicator Overlay */}
      {isLive && (
        <div className="absolute top-8 left-8 z-40 flex items-center gap-3">
           <div className="bg-red-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-pulse">
              <Radio size={14} strokeWidth={3} /> LIVE SESSION
           </div>
           <div className="bg-slate-900/60 backdrop-blur-md text-white/80 px-4 py-1.5 rounded-xl text-[9px] font-bold uppercase border border-white/10">
              Low Latency Enabled
           </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-50 p-10 text-center">
           <Info className="text-amber-500 mb-4" size={48} />
           <p className="text-white text-xl font-black uppercase tracking-tight">{error}</p>
           <button onClick={() => window.location.reload()} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-blue-500">Retry Stream</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm z-50">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" strokeWidth={3} />
            <PlayCircle className="absolute inset-0 m-auto text-blue-500/30" size={32} />
          </div>
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mt-6">Buffering Content...</p>
        </div>
      )}

      {/* Big Play Button (Visible on Pause) */}
      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="p-8 bg-blue-600/90 rounded-full text-white shadow-2xl scale-110 opacity-100 transition-all">
            <Play size={48} fill="currentColor" />
          </div>
        </div>
      )}

      {/* Overlay UI Controls */}
      <div className={`absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20 transition-opacity duration-500 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        {/* Top Title Bar */}
        <div className="p-10 flex justify-between items-start">
           <h2 className="text-white font-black text-lg uppercase italic tracking-tighter drop-shadow-md">{title}</h2>
           <button className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-white transition-all backdrop-blur-md border border-white/5"><Settings size={20}/></button>
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-10 space-y-8">
          
          {/* Progress Slider (Hidden for LIVE) */}
          {!isLive && (
            <div className="relative group/progress px-2">
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={progress} 
                onChange={seek}
                className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-600 group-hover/progress:h-3 transition-all"
              />
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover/progress:opacity-100 transition-opacity shadow-xl border border-white/10 pointer-events-none">
                 Seek Session
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-all active:scale-90">
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              
              {!isLive && (
                <div className="flex items-center gap-6">
                  <button onClick={() => skip(-10)} className="text-white/60 hover:text-white transition-all"><SkipBack size={24}/></button>
                  <button onClick={() => skip(10)} className="text-white/60 hover:text-white transition-all"><SkipForward size={24}/></button>
                </div>
              )}

              <div className="flex items-center gap-4 text-white group/volume">
                 <button onClick={() => setIsMuted(!isMuted)} className="hover:text-blue-500 transition-colors">
                    {isMuted || volume === 0 ? <VolumeX size={24}/> : <Volume2 size={24}/>}
                 </button>
                 <input 
                   type="range" min="0" max="1" step="0.05" 
                   value={volume} 
                   onChange={(e) => {setVolume(Number(e.target.value)); if(videoRef.current) videoRef.current.volume = Number(e.target.value);}}
                   className="w-0 group-hover/volume:w-24 transition-all accent-white h-1.5 cursor-pointer"
                 />
              </div>

              {!isLive && (
                <span className="text-white/50 text-[11px] font-black uppercase tracking-[0.2em] hidden md:block border-l border-white/10 pl-10">
                  {videoRef.current ? Math.floor(videoRef.current.currentTime / 60) + ":" + Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"} 
                  <span className="mx-2 text-white/20">/</span>
                  {videoRef.current && isFinite(videoRef.current.duration) ? Math.floor(videoRef.current.duration / 60) + ":" + Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0') : "0:00"}
                </span>
              )}
            </div>

            <div className="flex items-center gap-8">
              {!isLive && (
                <button 
                  onClick={handleSpeedChange} 
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all active:scale-95 backdrop-blur-md"
                >
                  {playbackSpeed}x Speed
                </button>
              )}
              <button onClick={toggleFullScreen} className="text-white hover:text-blue-500 transition-all active:scale-90">
                {isFullScreen ? <Minimize size={28}/> : <Maximize size={28}/>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
