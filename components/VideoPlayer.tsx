
import React, { useState, useEffect, useRef } from 'react';
import { 
  Youtube as YoutubeIcon, Loader2, Play, Pause, 
  RotateCcw, RotateCw, Maximize, Volume2, VolumeX,
  Settings, Bookmark, BookmarkPlus, ChevronRight, 
  ChevronLeft, Zap, Gauge, Highlighter
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
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [isYoutube, setIsYoutube] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<any>(null);

  // Parse Video Source
  useEffect(() => {
    const url = videoUrl.trim();
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);

    if (ytMatch) {
      setIsYoutube(true);
      loadYoutubeAPI(ytMatch[1]);
    } else {
      setIsYoutube(false);
      setIsLoading(false);
    }
  }, [videoUrl]);

  const loadYoutubeAPI = (videoId: string) => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    window.onYouTubeIframeAPIReady = () => {
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
          iv_load_policy: 3
        },
        events: {
          onReady: (event: any) => {
            setIsLoading(false);
            setDuration(event.target.getDuration());
            startTimer();
          },
          onStateChange: (event: any) => {
            setIsPlaying(event.data === window.YT.PlayerState.PLAYING);
          }
        }
      });
    };

    // If API already loaded
    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    }
  };

  const startTimer = () => {
    setInterval(() => {
      if (isYoutube && ytPlayerRef.current?.getCurrentTime) {
        setCurrentTime(ytPlayerRef.current.getCurrentTime());
      } else if (videoRef.current) {
        setCurrentTime(videoRef.current.currentTime);
      }
    }, 500);
  };

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
      ytPlayerRef.current.seekTo(ytPlayerRef.current.getCurrentTime() + seconds, true);
    } else if (videoRef.current) {
      videoRef.current.currentTime += seconds;
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
    if (isYoutube) {
      ytPlayerRef.current.setPlaybackRate(rate);
    } else if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
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
    const newBookmark: BookmarkItem = {
      id: Math.random().toString(36).substr(2, 9),
      time: currentTime,
      label: `Important Note at ${formatTime(currentTime)}`
    };
    setBookmarks([...bookmarks, newBookmark].sort((a, b) => a.time - b.time));
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative w-full aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-1 ring-white/10 group cursor-none"
        style={{ cursor: showControls ? 'default' : 'none' }}
      >
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center gap-4">
            <Loader2 className="text-blue-600 animate-spin" size={48} />
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Optimizing Stream...</p>
          </div>
        )}

        {/* Video Area */}
        <div className="w-full h-full">
          {isYoutube ? (
            <div id="yt-player" className="w-full h-full pointer-events-none"></div>
          ) : (
            <video 
              ref={videoRef}
              src={videoUrl}
              className="w-full h-full object-contain"
              onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
            />
          )}
        </div>

        {/* Overlay Controls */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 transition-opacity duration-500 flex flex-col justify-between p-6 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          {/* Top Bar */}
          <div className="flex justify-between items-start">
            <h3 className="text-white/90 font-black text-sm tracking-tight drop-shadow-md">{title}</h3>
            <div className="bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-white text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
               <Zap size={12} className="text-blue-400 fill-blue-400" /> Study Mode
            </div>
          </div>

          {/* Center Play Button (Mobile Style) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
             <button onClick={togglePlay} className="w-20 h-20 bg-blue-600/90 text-white rounded-full flex items-center justify-center backdrop-blur-sm shadow-2xl hover:scale-110 transition-all">
                {isPlaying ? <Pause size={32} fill="currentColor" /> : <Play size={32} className="ml-2" fill="currentColor" />}
             </button>
          </div>

          {/* Bottom Controls */}
          <div className="space-y-4">
            {/* Seek Bar */}
            <div className="relative group/seek">
               <input 
                  type="range"
                  min="0"
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-white/20 rounded-full appearance-none cursor-pointer accent-blue-500 group-hover/seek:h-2 transition-all"
               />
               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 px-2 py-1 rounded-lg text-[10px] font-bold text-white opacity-0 group-hover/seek:opacity-100 transition-opacity">
                  {formatTime(currentTime)} / {formatTime(duration)}
               </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <button onClick={() => skip(-10)} className="text-white/80 hover:text-white transition-colors"><RotateCcw size={20}/></button>
                  <button onClick={togglePlay} className="text-white hover:scale-110 transition-all">
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                  </button>
                  <button onClick={() => skip(10)} className="text-white/80 hover:text-white transition-colors"><RotateCw size={20}/></button>
                </div>

                <div className="hidden sm:flex items-center gap-2 text-white/60 text-[11px] font-black tracking-widest">
                  <span>{formatTime(currentTime)}</span>
                  <span>/</span>
                  <span className="text-white/40">{formatTime(duration)}</span>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <button onClick={addBookmark} className="text-white/70 hover:text-blue-400 transition-colors flex items-center gap-2">
                  <BookmarkPlus size={20} />
                  <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Pin Moment</span>
                </button>

                <div className="relative">
                  <button 
                    onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                    className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                  >
                    <Gauge size={20} />
                    <span className="text-[10px] font-black tracking-tighter">{playbackRate}x</span>
                  </button>
                  {showSpeedMenu && (
                    <div className="absolute bottom-full right-0 mb-4 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-2 min-w-[100px] animate-slideUp">
                       {[0.5, 0.75, 1, 1.25, 1.5, 2, 2.5].map(rate => (
                         <button 
                          key={rate}
                          onClick={() => changeSpeed(rate)}
                          className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black tracking-widest transition-colors ${playbackRate === rate ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/10'}`}
                         >
                            {rate}x Speed
                         </button>
                       ))}
                    </div>
                  )}
                </div>

                <button onClick={toggleFullscreen} className="text-white/70 hover:text-white transition-colors">
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bookmark Section */}
      {bookmarks.length > 0 && (
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Highlighter size={18}/></div>
             <h4 className="font-black text-slate-900 text-sm tracking-tight">Pinned Study Moments</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
             {bookmarks.map(bm => (
                <button 
                  key={bm.id}
                  onClick={() => {
                    if (isYoutube) ytPlayerRef.current.seekTo(bm.time, true);
                    else if (videoRef.current) videoRef.current.currentTime = bm.time;
                  }}
                  className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-200 hover:bg-blue-50 transition-all group text-left"
                >
                   <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 font-black text-[10px] shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {formatTime(bm.time)}
                   </div>
                   <div className="flex-1">
                      <p className="text-[11px] font-black text-slate-800 line-clamp-1">{bm.label}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Jump to segment</p>
                   </div>
                   <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500" />
                </button>
             ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
