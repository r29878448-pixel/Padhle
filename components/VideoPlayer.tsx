
import React, { useState, useEffect, useRef } from 'react';
import { 
  Youtube as YoutubeIcon, Loader2, Play, Pause, 
  RotateCcw, RotateCw, Maximize, Volume2, VolumeX,
  Settings, Bookmark, BookmarkPlus, ChevronRight, 
  ChevronLeft, Zap, Gauge, Highlighter, Monitor
} from 'lucide-react';

interface BookmarkItem {
  id: string;
  time: number;
  label: string;
}

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [quality, setQuality] = useState('1080p');
  const [showControls, setShowControls] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isYoutube, setIsYoutube] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<any>(null);

  // Parse Video Source
  useEffect(() => {
    if (!videoUrl) {
      setIsLoading(false);
      return;
    }
    
    const url = videoUrl.trim();
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);

    if (ytMatch) {
      setIsYoutube(true);
      const videoId = ytMatch[1];
      
      const initPlayer = () => {
        if (ytPlayerRef.current && ytPlayerRef.current.loadVideoById) {
          ytPlayerRef.current.loadVideoById(videoId);
          return;
        }
        ytPlayerRef.current = new window.YT.Player('yt-player', {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: 1,
            controls: 0,
            modestbranding: 1,
            rel: 0,
            showinfo: 0,
            iv_load_policy: 3,
            disablekb: 1
          },
          events: {
            onReady: (event: any) => {
              setIsLoading(false);
              setDuration(event.target.getDuration());
            },
            onStateChange: (event: any) => {
              setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
            }
          }
        });
      };

      if (!window.YT) {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        window.onYouTubeIframeAPIReady = initPlayer;
      } else if (window.YT.Player) {
        initPlayer();
      }
    } else {
      setIsYoutube(false);
      setIsLoading(false);
    }
  }, [videoUrl]);

  // Unified Playback Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (isYoutube && ytPlayerRef.current?.getCurrentTime) {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      } else if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    }, 500);
    return () => clearInterval(interval);
  }, [isYoutube]);

  const togglePlay = () => {
    if (isYoutube) {
      isPlaying ? ytPlayerRef.current.pauseVideo() : ytPlayerRef.current.playVideo();
    } else if (videoRef.current) {
      isPlaying ? videoRef.current.pause() : videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const skip = (seconds: number) => {
    if (isYoutube) {
      const targetTime = ytPlayerRef.current.getCurrentTime() + seconds;
      ytPlayerRef.current.seekTo(targetTime, true);
      setCurrentTime(targetTime);
    } else if (videoRef.current) {
      videoRef.current.currentTime += seconds;
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (isYoutube) {
      ytPlayerRef.current.seekTo(time, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    setCurrentTime(time);
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    if (isYoutube) ytPlayerRef.current.setPlaybackRate(rate);
    else if (videoRef.current) videoRef.current.playbackRate = rate;
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const addBookmark = () => {
    const label = prompt("Enter a label for this bookmark:", `Important at ${formatTime(currentTime)}`);
    if (label === null) return;
    const newBookmark: BookmarkItem = {
      id: Math.random().toString(36).substr(2, 9),
      time: currentTime,
      label: label || `Timestamp ${formatTime(currentTime)}`
    };
    setBookmarks(prev => [...prev, newBookmark].sort((a, b) => a.time - b.time));
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSpeedMenu(false);
        setShowQualityMenu(false);
      }
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group select-none"
        style={{ cursor: showControls ? 'default' : 'none' }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-blue-600 animate-spin" size={48} />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Optimizing Data Stream...</p>
          </div>
        )}

        {/* Video Area */}
        <div className="w-full h-full" onClick={togglePlay}>
          {isYoutube ? (
            <div id="yt-player" className="w-full h-full pointer-events-none scale-[1.01]"></div>
          ) : (
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
          )}
        </div>

        {/* Overlay Controls */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/60 transition-opacity duration-500 flex flex-col justify-between p-6 md:p-10 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            <h3 className="text-white font-black text-lg md:text-xl tracking-tight drop-shadow-xl line-clamp-1 max-w-[70%]">{title}</h3>
            <div className="flex items-center gap-3">
               <div className="bg-blue-600 px-4 py-2 rounded-xl text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  <Zap size={12} className="fill-white" /> Pro Experience
               </div>
            </div>
          </div>

          {/* Center Play Button Overlay */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-12">
             <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="p-4 text-white/40 hover:text-white transition-all transform hover:scale-110"><RotateCcw size={32}/></button>
             <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className="w-24 h-24 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all">
                {isPlaying ? <Pause size={40} fill="currentColor" /> : <Play size={40} className="ml-2" fill="currentColor" />}
             </button>
             <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="p-4 text-white/40 hover:text-white transition-all transform hover:scale-110"><RotateCw size={32}/></button>
          </div>

          {/* Bottom Bar */}
          <div className="space-y-6">
            <div className="relative group/seek">
               <input 
                  type="range"
                  min="0"
                  max={duration || 0}
                  step="0.1"
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500 hover:h-2 transition-all"
               />
               <div 
                 className="absolute -top-10 bg-slate-900 px-3 py-1.5 rounded-lg text-[10px] font-black text-white pointer-events-none opacity-0 group-hover/seek:opacity-100 transition-opacity whitespace-nowrap" 
                 style={{ left: `${(currentTime / (duration || 1)) * 100}%`, transform: 'translateX(-50%)' }}
               >
                  {formatTime(currentTime)}
               </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8">
                <button onClick={togglePlay} className="text-white hover:text-blue-400 transition-colors">
                  {isPlaying ? <Pause size={28} /> : <Play size={28} />}
                </button>
                <div className="text-white/60 text-xs font-black tracking-widest flex items-center gap-2">
                   <span className="text-white">{formatTime(currentTime)}</span>
                   <span className="text-white/20">/</span>
                   <span>{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <button onClick={addBookmark} className="text-white/60 hover:text-blue-400 transition-colors flex items-center gap-2 group/pin">
                  <BookmarkPlus size={22} />
                  <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest group-hover/pin:text-white">Pin Moment</span>
                </button>

                {/* Quality Menu */}
                <div className="relative">
                  <button onClick={() => { setShowQualityMenu(!showQualityMenu); setShowSpeedMenu(false); }} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                    <Monitor size={22} />
                    <span className="text-[10px] font-black tracking-tighter">{quality}</span>
                  </button>
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl p-2 min-w-[120px] animate-slideUp">
                       {['1080p', '720p', '480p', '360p', 'Auto'].map(q => (
                         <button key={q} onClick={() => { setQuality(q); setShowQualityMenu(false); }} className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-colors ${quality === q ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>{q}</button>
                       ))}
                    </div>
                  )}
                </div>

                {/* Speed Menu */}
                <div className="relative">
                  <button onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowQualityMenu(false); }} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                    <Gauge size={22} />
                    <span className="text-[10px] font-black tracking-tighter">{playbackRate}x</span>
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden shadow-2xl p-2 min-w-[120px] animate-slideUp">
                       {[0.5, 0.75, 1, 1.25, 1.5, 2, 2.5].map(rate => (
                         <button key={rate} onClick={() => changeSpeed(rate)} className={`w-full text-left px-5 py-3 rounded-xl text-[10px] font-black tracking-widest transition-colors ${playbackRate === rate ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}>{rate}x Speed</button>
                       ))}
                    </div>
                  )}
                </div>

                <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors">
                  <Maximize size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmarks Display */}
      {bookmarks.length > 0 && (
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Highlighter size={22}/></div>
                <div>
                   <h4 className="font-black text-slate-900 text-lg tracking-tight">Lecture Snapshots</h4>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Quick navigation for complex topics</p>
                </div>
             </div>
             <button onClick={() => setBookmarks([])} className="text-[10px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest">Clear All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
             {bookmarks.map(bm => (
                <button 
                  key={bm.id}
                  onClick={() => {
                    if (isYoutube) ytPlayerRef.current.seekTo(bm.time, true);
                    else if (videoRef.current) videoRef.current.currentTime = bm.time;
                  }}
                  className="flex flex-col gap-3 p-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] hover:border-blue-400 hover:bg-white transition-all group text-left shadow-sm hover:shadow-xl"
                >
                   <div className="flex items-center justify-between">
                      <div className="px-3 py-1 bg-blue-600 text-white rounded-lg text-[9px] font-black">{formatTime(bm.time)}</div>
                      <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                   </div>
                   <p className="text-xs font-black text-slate-800 line-clamp-2 leading-relaxed">{bm.label}</p>
                </button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
