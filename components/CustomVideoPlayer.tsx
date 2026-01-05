
import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Loader2, Radio, SkipBack, SkipForward, Settings
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
          backBufferLength: 60
        });
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          video.play().catch(() => setIsPlaying(false));
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) setError("Stream currently unavailable.");
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
        video.addEventListener('loadedmetadata', () => setIsLoading(false));
      } else {
        setError("Browser mismatch for HLS.");
      }
    } else {
      video.src = videoUrl;
      video.addEventListener('loadeddata', () => setIsLoading(false));
      video.addEventListener('error', () => setError("Failed to load session."));
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
      className="relative w-full aspect-video bg-black group overflow-hidden rounded-[2.5rem] shadow-2xl select-none"
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
        <div className="absolute top-6 left-6 z-40">
           <div className="bg-red-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-2xl animate-pulse">
              <Radio size={14} strokeWidth={3} /> LIVE SESSION
           </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950 z-50 text-center p-10">
           <p className="text-white text-lg font-black uppercase tracking-tight mb-6">{error}</p>
           <button onClick={() => window.location.reload()} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Retry Session</button>
        </div>
      )}

      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md z-50">
          <Loader2 className="w-16 h-16 text-blue-500 animate-spin" strokeWidth={3} />
          <p className="text-white/40 text-[9px] font-black uppercase tracking-[0.3em] mt-8">Optimizing Stream...</p>
        </div>
      )}

      {!isPlaying && !isLoading && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
          <div className="p-8 bg-blue-600/95 rounded-full text-white shadow-2xl scale-125 transition-all">
            <Play size={48} fill="currentColor" />
          </div>
        </div>
      )}

      <div className={`absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/20 transition-opacity duration-500 z-30 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        
        <div className="p-10 flex justify-between items-start">
           <h2 className="text-white font-black text-lg uppercase italic tracking-tighter drop-shadow-lg">{title}</h2>
           <button className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl text-white backdrop-blur-md border border-white/10"><Settings size={20}/></button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-10 space-y-6">
          {!isLive && (
            <input 
              type="range" min="0" max="100" value={progress} onChange={seek}
              className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-600"
            />
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-10">
              <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-all">
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" />}
              </button>
              
              {!isLive && (
                <div className="flex items-center gap-6">
                  <button onClick={() => {if(videoRef.current) videoRef.current.currentTime -= 10}} className="text-white/60 hover:text-white transition-all"><SkipBack size={24}/></button>
                  <button onClick={() => {if(videoRef.current) videoRef.current.currentTime += 10}} className="text-white/60 hover:text-white transition-all"><SkipForward size={24}/></button>
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
                   className="w-0 group-hover/volume:w-24 transition-all accent-white h-1 cursor-pointer"
                 />
              </div>
            </div>

            <div className="flex items-center gap-6">
              {!isLive && (
                <button onClick={handleSpeedChange} className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all backdrop-blur-md">
                  {playbackSpeed}x
                </button>
              )}
              <button onClick={toggleFullScreen} className="text-white hover:text-blue-500 transition-all">
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
