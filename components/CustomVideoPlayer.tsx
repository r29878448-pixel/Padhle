
import React, { useState, useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, Settings, 
  RotateCcw, RotateCw, PlayCircle, Loader2, FastForward, Info, Monitor, Radio
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
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setIsLive(videoUrl.includes('.m3u8') || videoUrl.includes('/live'));
    
    if (hlsRef.current) hlsRef.current.destroy();

    if (videoUrl.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(videoUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = videoUrl;
      }
    } else {
      video.src = videoUrl;
    }

    const handleLoaded = () => setIsLoading(false);
    video.addEventListener('loadeddata', handleLoaded);
    return () => video.removeEventListener('loadeddata', handleLoaded);
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
    if (videoRef.current && !isLive) videoRef.current.currentTime += seconds;
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

  return (
    <div 
      ref={containerRef}
      className="relative w-full aspect-video bg-black group overflow-hidden rounded-[2rem] shadow-2xl border border-slate-800"
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <video 
        ref={videoRef}
        onClick={togglePlay}
        onTimeUpdate={handleProgress}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* LIVE Badge */}
      {isLive && (
        <div className="absolute top-6 left-6 z-40 bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg animate-pulse">
           <Radio size={14} /> LIVE SESSION
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-20">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Middle Controls (Play/Pause Big) */}
      {!isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <button onClick={togglePlay} className="p-6 bg-blue-600 rounded-full text-white shadow-2xl hover:scale-110 transition-transform">
            <Play size={48} fill="currentColor" />
          </button>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div className={`absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent transition-opacity duration-300 z-30 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar - Hidden for Live */}
        {!isLive && (
          <div className="relative mb-6 group/progress">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progress} 
              onChange={seek}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-600 group-hover/progress:h-2.5 transition-all"
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button onClick={togglePlay} className="text-white hover:text-blue-500 transition-colors">
              {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            {!isLive && (
              <div className="flex items-center gap-4">
                <button onClick={() => skip(-10)} className="text-white/70 hover:text-white"><RotateCcw size={20}/></button>
                <button onClick={() => skip(10)} className="text-white/70 hover:text-white"><RotateCw size={20}/></button>
              </div>
            )}
            <div className="flex items-center gap-3 text-white/70 group/volume">
               <button onClick={() => setIsMuted(!isMuted)}>{isMuted || volume === 0 ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button>
               <input 
                 type="range" min="0" max="1" step="0.1" 
                 value={volume} 
                 onChange={(e) => {setVolume(Number(e.target.value)); if(videoRef.current) videoRef.current.volume = Number(e.target.value);}}
                 className="w-0 group-hover/volume:w-20 transition-all accent-white h-1"
               />
            </div>
            {!isLive && (
              <span className="text-white/60 text-[10px] font-black uppercase tracking-widest hidden sm:block">
                {videoRef.current ? Math.floor(videoRef.current.currentTime / 60) + ":" + Math.floor(videoRef.current.currentTime % 60).toString().padStart(2, '0') : "0:00"} / {videoRef.current ? Math.floor(videoRef.current.duration / 60) + ":" + Math.floor(videoRef.current.duration % 60).toString().padStart(2, '0') : "0:00"}
              </span>
            )}
          </div>

          <div className="flex items-center gap-6">
            {!isLive && (
              <button 
                onClick={handleSpeedChange} 
                className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
              >
                {playbackSpeed}x
              </button>
            )}
            <button onClick={toggleFullScreen} className="text-white hover:text-blue-500">
              {isFullScreen ? <Minimize size={22}/> : <Maximize size={22}/>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
