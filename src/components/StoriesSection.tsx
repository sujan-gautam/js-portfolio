import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import YouTube from "react-youtube";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Play, Pause, Loader2, Send, MessageSquare, X, UserCheck, Music, Star, Volume2, VolumeX, Lock, ExternalLink, BarChart2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import { storiesDB, musicDB, StoryItem, MusicItem } from "@/lib/adminData";
import { API_BASE } from "@/config";
import { SmartText } from "@/components/ui/SmartText";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

import profileImgFallback from "@/assets/profile-3.jpg";
import { cn } from "@/lib/utils";

const storyAnimations = `
  @keyframes float-up-fade {
    0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
    20% { opacity: 1; scale: 1.2; }
    80% { opacity: 1; }
    100% { transform: translateY(-160px) scale(0.8) rotate(15deg); opacity: 0; }
  }
`;

const StoriesSection = () => {
  const { user } = useAuth();
  const [stories, setStories] = useState<StoryItem[]>([]);
  const [music, setMusic] = useState<MusicItem[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();

  const [bgPlayer, setBgPlayer] = useState<any>(null);
  const [isPlayingBg, setIsPlayingBg] = useState(false);
  const [isBgPlayerReady, setIsBgPlayerReady] = useState(false);

  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  const [commentText, setCommentText] = useState("");
  const [commentsDrawerOpen, setCommentsDrawerOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [flyingReacts, setFlyingReacts] = useState<{ id: number; emoji: string; x: number; delay: number }[]>([]);
  const [isIOS, setIsIOS] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [storyPlayer, setStoryPlayer] = useState<any>(null);

  const showAlert = (msg: string) => {
    setAlertMessage(msg);
  };

  useEffect(() => {
    if (storyViewerOpen) {
      document.documentElement.classList.add("story-open");
    } else {
      document.documentElement.classList.remove("story-open");
    }
  }, [storyViewerOpen]);

  useEffect(() => {
    // Detect iOS
    const checkIOS = () => {
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                          (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setIsIOS(isIOSDevice);
      if (isIOSDevice) setIsMuted(true);
      else setIsMuted(false);
    };
    checkIOS();

    async function loadResources() {
      setIsLoading(true);
      const activeStories = (await storiesDB.getAll()).filter(s => s.active);
      const activeMusic = (await musicDB.getAll()).filter(m => m.active);
      setStories(activeStories);
      setMusic(activeMusic);
      setIsLoading(false);
    }
    loadResources();
  }, [storyViewerOpen]);

  useEffect(() => {
    if (!storyViewerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextStory(e);
      else if (e.key === "ArrowLeft") prevStory(e);
      else if (e.key === "Escape") closeStories();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [storyViewerOpen, storyIndex]);

  useEffect(() => {
    if (storyViewerOpen && stories[storyIndex]?.id) {
      axios.put(`${API_BASE}/collection/stories/${stories[storyIndex].id}/view`, {
        device: navigator.userAgent
      }).catch(() => { });
    }
    setStoryPlayer(null);
  }, [storyViewerOpen, storyIndex]);

  // Auto-open story from URL query parameter
  useEffect(() => {
    if (stories.length > 0) {
      const storyId = searchParams.get("story");
      if (storyId) {
        const idx = stories.findIndex(s => s.id === storyId);
        if (idx !== -1) {
          setStoryIndex(idx);
          setStoryViewerOpen(true);
        }
      }
    }
  }, [stories, searchParams]);

  // Sync URL query parameter with current story state
  useEffect(() => {
    if (storyViewerOpen && stories.length > 0 && stories[storyIndex]) {
      const currentId = stories[storyIndex].id;
      if (searchParams.get("story") !== currentId) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            next.set("story", currentId);
            return next;
          },
          { replace: true }
        );
      }
    } else if (!storyViewerOpen && !isLoading && searchParams.has("story")) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("story");
          return next;
        },
        { replace: true }
      );
    }
  }, [storyViewerOpen, storyIndex, stories, searchParams, setSearchParams, isLoading]);

  const getMediaUrl = (storyUrl: string | undefined, isMembersOnly: boolean) => {
    if (!storyUrl) return "";
    if (isMembersOnly) {
      if (!user) return ""; // scrub URL if not logged in
      if (storyUrl.includes('res.cloudinary.com')) {
         const token = localStorage.getItem("admin_token");
         return `${API_BASE}/collection/stories/secure-media?url=${encodeURIComponent(storyUrl)}&token=${token}`;
      }
    }
    return storyUrl;
  };

  const hasMusic = music.length > 0 && music[0].videoId;
  const currentBgMusic = hasMusic ? music[0] : null;
  const hasStories = stories.length > 0;
  const isFirstStoryRestricted = hasStories && stories[0].isMembersOnly && !user;
  const storyImage = hasStories ? getMediaUrl(stories[0].image, stories[0].isMembersOnly || false) : "";
  const currentViewerStory = hasStories ? stories[storyIndex] : null;

  const togglePlayBg = () => {
    if (!bgPlayer) return;
    if (isPlayingBg) { bgPlayer.pauseVideo(); setIsPlayingBg(false); }
    else { bgPlayer.playVideo(); setIsPlayingBg(true); }
  };

  const openStories = () => {
    if (isPlayingBg && bgPlayer) { bgPlayer.pauseVideo(); setIsPlayingBg(false); }
    setStoryIndex(0);
    setStoryViewerOpen(true);
    setCommentsDrawerOpen(false);
  };

  const handlePollVote = async (layerId: string, optionId: string) => {
    if (!currentViewerStory) return;
    
    // Local update for instant feedback
    setStories(prev => prev.map(s => {
      if (s.id === currentViewerStory.id) {
        const layers = s.layers?.map(l => {
          if (l.id === layerId && l.pollOptions) {
            const opts = l.pollOptions.map(o => {
              if (o.id === optionId) return { ...o, votes: o.votes + 1 };
              return o;
            });
            return { ...l, pollOptions: opts };
          }
          return l;
        });
        return { ...s, layers };
      }
      return s;
    }));

    try {
      await axios.post(`${API_BASE}/collection/stories/${currentViewerStory.id}/vote`, { layerId, optionId });
    } catch { /* Silent fail fallback */ }
  };

  const closeStories = () => {
    if (storyPlayer && typeof storyPlayer.pauseVideo === 'function') {
      try {
        storyPlayer.pauseVideo();
      } catch (err) {
        console.warn("YouTube pause failed:", err);
      }
    }
    setStoryViewerOpen(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (storyPlayer) {
        if (isMuted) {
          if (typeof storyPlayer.unMute === 'function') storyPlayer.unMute();
          if (typeof storyPlayer.playVideo === 'function') storyPlayer.playVideo();
        } else {
          if (typeof storyPlayer.mute === 'function') storyPlayer.mute();
        }
      }
      setIsMuted(!isMuted);
    } catch (err) {
      console.warn("YouTube mute toggle failed:", err);
      setIsMuted(!isMuted);
    }
  };

  const nextStory = (e: any) => {
    e.stopPropagation();
    if (storyIndex < stories.length - 1) { setStoryIndex(i => i + 1); setCommentsDrawerOpen(false); }
    else closeStories();
  };

  const prevStory = (e: any) => {
    e.stopPropagation();
    if (storyIndex > 0) { setStoryIndex(i => i - 1); setCommentsDrawerOpen(false); }
  };

  const handleReact = async (e: any, type: string) => {
    e.stopPropagation();
    if (!currentViewerStory) return;

    // Trigger visual feedback flurry
    const emojiMap: any = { heart: "❤️", fire: "🔥" };
    const newReacts = Array(8).fill(0).map(() => ({
      id: Math.random(),
      emoji: emojiMap[type] || "❤️",
      x: (Math.random() - 0.5) * 60, // random spread
      delay: Math.random() * 0.4
    }));
    setFlyingReacts(prev => [...prev, ...newReacts]);
    setTimeout(() => {
      setFlyingReacts(prev => prev.filter(r => !newReacts.find(nr => nr.id === r.id)));
    }, 2000);

    setStories(prev => prev.map(s => {
      if (s.id === currentViewerStory.id) {
        return { ...s, reacts: { ...s.reacts, [type]: ((s.reacts as any)?.[type] || 0) + 1 } as any };
      }
      return s;
    }));
    try {
      await axios.post(`${API_BASE}/collection/stories/${currentViewerStory.id}/react`, { type });
    } catch (err: any) {
      setStories(prev => prev.map(s => s.id === currentViewerStory.id ? { ...s, reacts: { ...s.reacts, [type]: Math.max(0, ((s.reacts as any)?.[type] || 0) - 1) } as any } : s));
      if (err.response?.data?.error) showAlert(err.response.data.error);
    }
  };

  const postComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !currentViewerStory) return;

    const textPayload = commentText;
    setCommentText("");

    const tempComment = { id: Date.now().toString(), text: textPayload, createdAt: new Date().toISOString(), ip: 'You', device: 'Anonymous' };
    setStories(prev => prev.map(s => s.id === currentViewerStory.id ? { ...s, comments: [...(s.comments || []), tempComment] } : s));

    try {
      await axios.post(`${API_BASE}/collection/stories/${currentViewerStory.id}/comment`, { text: textPayload, device: navigator.userAgent });
    } catch (err: any) {
      setStories(prev => prev.map(s => s.id === currentViewerStory.id ? { ...s, comments: (s.comments || []).filter(c => c.text !== textPayload) } : s));
      if (err.response?.data?.error) showAlert(err.response.data.error);
    }
  };

  // Helper formatter for the "Yesterday", "Today" UI
  const formatStoryDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const handleGoogleLogin = () => {
    localStorage.setItem("auth_return", window.location.pathname);
    window.location.href = `${API_BASE}/auth/google`;
  };

  if (!isLoading && !hasStories && !hasMusic) return null;

  return (
    <div className="px-4 py-4 relative">
      <style>{storyAnimations}</style>
      <p className="text-xs font-bold tracking-[0.2em] text-white mb-4 uppercase">
        STORIES:
      </p>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="flex gap-4">
            <Skeleton className="w-16 h-16 rounded-full opacity-20 border border-white/5" />
            <Skeleton className="w-40 h-10 rounded-2xl opacity-10 border border-white/5" />
          </div>
        ) : (
          <>
            {hasStories && (
              <button onClick={openStories} className="relative w-16 h-16 rounded-full p-[3px] flex-shrink-0 cursor-pointer group focus:outline-none">
                <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#CB2729] animate-[spin_8s_linear_infinite] group-hover:border-solid transition-all" />
                <div className="w-full h-full rounded-full overflow-hidden border-4 border-background bg-secondary relative z-10 shadow-md flex items-center justify-center">
                  {!isFirstStoryRestricted && storyImage ? (
                    <img 
                      src={storyImage} 
                      alt="Story" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                       {isFirstStoryRestricted ? <Lock size={14} className="text-white/20" /> : <Plus size={14} className="text-white/20" />}
                    </div>
                  )}
                </div>
                <div className="absolute -top-1 -right-1 bg-[#CB2729] text-[9px] text-white font-bold px-1.5 py-0.5 rounded-full z-20 shadow-sm uppercase tracking-wider">
                  {isFirstStoryRestricted ? 'Member' : 'Live'}
                </div>
              </button>
            )}

            {hasMusic && currentBgMusic && (
              <div 
                className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 pr-4 shadow-xl hover:bg-white/10 transition-all cursor-pointer w-fit group font-inter animate-in fade-in slide-in-from-right-4 duration-700 active:scale-95" 
                onClick={togglePlayBg}
              >
                {/* Compact Album Art with Waveform Overlay */}
                <div className="relative w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-900/50">
                  <img 
                    src={`https://i.ytimg.com/vi/${currentBgMusic.videoId}/mqdefault.jpg`} 
                    alt="Album Art" 
                    className={`w-full h-full object-cover transition-opacity duration-500 ${isPlayingBg ? 'opacity-40' : 'opacity-20'}`} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center gap-[2px] px-2.5">
                    {[10, 18, 8, 20, 12].map((h, i) => (
                      <div 
                        key={i} 
                        className="w-[2px] bg-white rounded-full transition-all duration-300"
                        style={{ 
                          height: isPlayingBg ? `${h}px` : '3px',
                          animation: isPlayingBg ? `musicWave 0.7s ease-in-out infinite alternate ${i * 0.1}s` : 'none'
                        }} 
                      />
                    ))}
                  </div>
                </div>

                {/* Song Info - High Density */}
                <div className="flex flex-col min-w-[70px] max-w-[110px] overflow-hidden">
                  <div className="flex whitespace-nowrap animate-marquee group-hover:pause-animation">
                    <h3 className="text-white text-[11px] font-black tracking-tight leading-none uppercase pr-6">
                       {currentBgMusic.title}
                    </h3>
                    <h3 className="text-white text-[11px] font-black tracking-tight leading-none uppercase pr-6" aria-hidden="true">
                       {currentBgMusic.title}
                    </h3>
                  </div>
                  <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest leading-none mt-1">
                    {currentBgMusic.artist || (currentBgMusic.title.includes('-') ? currentBgMusic.title.split('-')[1].trim() : 'Artist')}
                  </p>
                </div>

                {/* Minimalist Play Button */}
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center transition-all group-hover:scale-110 shadow-lg flex-shrink-0">
                   {!isBgPlayerReady ? (
                     <Loader2 size={12} className="text-white animate-spin" />
                   ) : isPlayingBg ? (
                     <Pause size={12} className="fill-white text-white" />
                   ) : (
                     <Play size={12} className="fill-white text-white translate-x-[1px]" />
                   )}
                </div>

                {/* YouTube Handler */}
                <div className="absolute opacity-0 w-0 h-0 pointer-events-none">
                  <YouTube 
                    videoId={currentBgMusic.videoId} 
                    opts={{ 
                      width: '1', 
                      height: '1', 
                      playerVars: { 
                        autoplay: 0, 
                        start: currentBgMusic.startTime || 0, 
                        end: currentBgMusic.endTime, 
                        controls: 0,
                        origin: window.location.origin
                      } 
                    }} 
                    onReady={e => { setBgPlayer(e.target); setIsBgPlayerReady(true); }} 
                    onStateChange={e => { 
                      if (e.data === 0) { setIsPlayingBg(false); e.target.seekTo(currentBgMusic.startTime || 0); } 
                      if (e.data === 2) setIsPlayingBg(false); 
                      if (e.data === 1) setIsPlayingBg(true); 
                    }} 
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Dialog open={storyViewerOpen} onOpenChange={setStoryViewerOpen}>
        <DialogContent className="max-w-[420px] w-full h-[100dvh] md:h-[85vh] p-0 bg-black md:border md:border-white/10 md:rounded-3xl overflow-hidden shadow-2xl flex flex-col [&>button]:hidden font-inter">
          <DialogTitle className="sr-only">Story Viewer</DialogTitle>
          <DialogDescription className="sr-only">Viewing community stories with music and interactions.</DialogDescription>

          {/* Custom Instagram-Style Center Alert */}
          {alertMessage && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 pointer-events-auto" onClick={() => setAlertMessage(null)}>
              <div className="bg-[#1c1c1e] border border-white/10 w-[270px] rounded-2xl flex flex-col items-center overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 flex flex-col items-center text-center gap-2 w-full pt-6 pb-5">
                  <p className="text-[16px] font-bold text-white tracking-tight">System Alert</p>
                  <p className="text-[13px] text-white/80 leading-relaxed font-medium">{alertMessage}</p>
                </div>
                <button onClick={() => setAlertMessage(null)} className="w-full py-3.5 border-t border-white/10 text-[#0a84ff] font-bold text-[15px] hover:bg-white/5 active:bg-white/10 transition-colors">
                  OK
                </button>
              </div>
            </div>
          )}

          {currentViewerStory && (
            <div className="relative flex-1 w-full flex flex-col bg-black overflow-hidden">

              {/* Fixed Safe Header Area - Highest z-index for core controls */}
              <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-black/60 to-transparent pt-4 pb-16 z-[80] px-5 flex flex-col gap-4">
                
                {/* Progress Indicators */}
                <div className="flex gap-1.5 px-1">
                  {stories.map((_, idx) => (
                    <div key={idx} className="h-[2px] flex-1 bg-white/20 rounded-full overflow-hidden">
                      <div className={`h-full bg-white transition-all duration-3000 ease-linear origin-left ${idx < storyIndex ? 'scale-x-100' : idx === storyIndex ? 'scale-x-100' : 'scale-x-0'}`} />
                    </div>
                  ))}
                </div>

                {/* Pro Header Layout */}
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-3 w-full pr-10 overflow-hidden">
                    <div className="w-10 h-10 rounded-full ring-1 ring-white/20 p-[2px] bg-gradient-to-tr from-white/10 to-transparent flex-shrink-0">
                      <div className="w-full h-full rounded-full overflow-hidden bg-neutral-800 flex items-center justify-center">
                         {currentViewerStory.isMembersOnly && !user ? (
                           <Lock size={14} className="text-white/30" />
                         ) : (
                           getMediaUrl(currentViewerStory.image, currentViewerStory.isMembersOnly || false) ? (
                           <img src={getMediaUrl(currentViewerStory.image, currentViewerStory.isMembersOnly || false)} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-neutral-900 flex items-center justify-center">
                             <Plus size={14} className="text-white/20" />
                           </div>
                         )
                         )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 min-w-0 w-full overflow-hidden">
                      <div className="flex items-center gap-2">
                        {currentViewerStory.title && (
                          <p className="text-white font-bold text-[14px] tracking-wide leading-none truncate max-w-[130px] drop-shadow-md">
                            {currentViewerStory.title}
                          </p>
                        )}
                        {currentViewerStory.isMembersOnly && (
                           <span className="text-white/90 drop-shadow-md" title="Members Only Access">
                             <Lock size={10} strokeWidth={3} />
                           </span>
                        )}
                        <span className="text-white/40 text-[10px] select-none translate-y-[0.5px] ml-0.5">•</span>
                        <p className="text-white/60 text-[11px] font-medium tracking-tight translate-y-[0.5px]">
                          {formatStoryDate(currentViewerStory.createdAt)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full">
                        {(() => {
                          const hasAudio = Boolean(currentViewerStory.musicVideoId || currentViewerStory.type === "video" || (currentViewerStory.image && currentViewerStory.image.match(/\.(mp4|webm|mov|ogg)$/i)));
                          if (!hasAudio || (currentViewerStory.isMembersOnly && !user)) return null;
                          return (
                            <div className="flex items-center gap-2">
                               <button 
                                 onClick={(e) => toggleMute(e)}
                                 className="flex items-center justify-center w-8 h-8 rounded-full bg-black/20 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
                                 title={isMuted ? "Unmute Audio" : "Mute Audio"}
                               >
                                 {isMuted ? <VolumeX size={14} className="text-white/60" /> : <Volume2 size={14} className="text-white/90" />}
                               </button>
                               
                               {/* Only show marquee if sticker is HIDDEN (Style 3) and it has YouTube music */}
                               {currentViewerStory.musicVideoId && currentViewerStory.musicStyle === 3 && (
                                 <div className="bg-black/30 backdrop-blur-md pl-1.5 pr-2 py-[3px] rounded border border-white/10 overflow-hidden flex-1 max-w-[160px]">
                                   <div className="flex whitespace-nowrap overflow-hidden relative w-full" style={{ WebkitMaskImage: 'linear-gradient(to right, black 85%, transparent 100%)' }}>
                                     <div className="flex animate-marquee">
                                       <span className="text-[9.5px] text-white/90 font-medium tracking-tight pr-6 drop-shadow-md">
                                         {(() => {
                                            if (currentViewerStory.musicTitle) return `${currentViewerStory.musicTitle} - ${currentViewerStory.musicArtist || 'Audio'}`;
                                            const m = music.find(i => i.videoId === currentViewerStory.musicVideoId);
                                            return m ? `${m.title} - ${m.artist}` : "Original Audio";
                                         })()}
                                       </span>
                                       <span className="text-[9.5px] text-white/90 font-medium tracking-tight pr-6 drop-shadow-md" aria-hidden="true">
                                         {(() => {
                                            if (currentViewerStory.musicTitle) return `${currentViewerStory.musicTitle} - ${currentViewerStory.musicArtist || 'Audio'}`;
                                            const m = music.find(i => i.videoId === currentViewerStory.musicVideoId);
                                            return m ? `${m.title} - ${m.artist}` : "Original Audio";
                                         })()}
                                       </span>
                                     </div>
                                   </div>
                                 </div>
                               )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pointer-events-auto">
                     <button onClick={closeStories} className="w-10 h-10 flex items-center justify-center bg-white/5 backdrop-blur-md border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                        <X size={18} className="text-white" />
                     </button>
                  </div>
                </div>
              </div>

              {/* Stage Asset */}
              <div 
                className={`absolute inset-0 w-full h-full transition-all duration-700 ${currentViewerStory.isMembersOnly && !user ? 'opacity-20' : ''}`}
                style={{ filter: currentViewerStory.filter || 'none' }}
              >
                {!(currentViewerStory.isMembersOnly && !user) ? (
                  currentViewerStory.type === "video" || (currentViewerStory.image && currentViewerStory.image.match(/\.(mp4|webm|mov|ogg)$/)) ? (
                    <video 
                      src={getMediaUrl(currentViewerStory.image, currentViewerStory.isMembersOnly || false)} 
                      autoPlay 
                      loop 
                      muted={isMuted} 
                      playsInline 
                      className="absolute inset-0 w-full h-full object-cover flex-shrink-0" 
                    />
                  ) : currentViewerStory.image ? (
                    <img src={getMediaUrl(currentViewerStory.image, currentViewerStory.isMembersOnly || false)} alt="Story Layout" className="absolute inset-0 w-full h-full object-cover flex-shrink-0" />
                  ) : (
                    <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center" />
                  )
                ) : (
                  <div className="absolute inset-0 bg-neutral-900" />
                )}
              </div>



              {/* Members Only Overlay */}
              {currentViewerStory.isMembersOnly && !user && (
                 <div className="absolute inset-0 z-[75] flex flex-col items-center justify-center p-8 text-center bg-black/20 backdrop-blur-xl">
                    {/* Navigation for Restricted View */}
                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 pointer-events-none">
                       <button 
                         onClick={prevStory} 
                         className={cn(
                           "w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 pointer-events-auto",
                           storyIndex === 0 && "opacity-0 pointer-events-none"
                         )}
                       >
                          <ChevronLeft size={24} className="text-white/40" />
                       </button>
                       <button 
                         onClick={nextStory} 
                         className={cn(
                           "w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all active:scale-90 pointer-events-auto",
                           storyIndex === stories.length - 1 && "opacity-0 pointer-events-none"
                         )}
                       >
                          <ChevronRight size={24} className="text-white/40" />
                       </button>
                    </div>

                    <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                       <Lock size={22} className="text-white/40" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1 tracking-tight">Members Only Content</h3>
                    <p className="text-white/40 text-[13px] mb-8 max-w-[200px] leading-relaxed">
                       Please sign in to view this story.
                    </p>
                    <button 
                      onClick={handleGoogleLogin}
                      className="h-11 px-6 bg-white text-black font-semibold text-[13px] rounded-full hover:bg-neutral-200 active:scale-95 transition-all shadow-xl flex items-center gap-2.5"
                    >
                       <img src="https://www.google.com/favicon.ico" className="w-3.5 h-3.5" alt="google" />
                       Continue with Google
                    </button>
                 </div>
              )}

              {/* Overlays / Typographies */}
              <div className={`absolute inset-0 z-[66] pointer-events-none transition-opacity duration-700 ${currentViewerStory.isMembersOnly && !user ? 'opacity-0' : 'opacity-100'}`}>
                  {currentViewerStory.layers?.map(l => (
                    <div key={l.id} 
                      className={cn(
                        "absolute whitespace-pre-wrap font-black uppercase",
                        (l.type === "text" || l.type === "link" || l.type === "poll") ? "pointer-events-auto" : ""
                      )}
                      style={{ 
                        top: `${l.top}%`, 
                        left: `${l.left}%`, 
                        width: l.width ? `${l.width}%` : undefined,
                        height: l.height ? `${l.height}%` : undefined,
                        transform: l.width ? "none" : `translate(-50%, -50%) scale(${l.scale}) rotate(${l.rotation}deg)`, 
                        zIndex: l.type === "poll" || l.type === "link" ? 70 : 60
                      }}
                    >
                      {l.type === "text" && (
                         <div style={{ color: l.color, fontFamily: l.fontFamily || "Inter", fontSize: `${l.fontSize || 24}px`, textShadow: '0 4px 12px rgba(0,0,0,0.5)', letterSpacing: '-0.02em' }}>
                           <SmartText text={l.content} />
                         </div>
                      )}
                      
                      {l.type === "link" && (
                         <a 
                           href={l.linkUrl} 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-5 py-2.5 rounded-full shadow-2xl border border-white/20 group hover:scale-105 transition-all active:scale-95"
                         >
                            <span className="text-[13px] font-bold text-slate-900 tracking-tight">{l.linkLabel || "Learn More"}</span>
                            <ExternalLink size={14} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
                         </a>
                      )}

                      {l.type === "poll" && (
                         <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-white/10 min-w-[200px]">
                            <p className="text-[14px] font-bold text-white mb-4 text-center tracking-tight drop-shadow-md">{l.pollQuestion}</p>
                            <div className="space-y-2">
                               {l.pollOptions?.map(opt => {
                                  const total = l.pollOptions?.reduce((acc, curr) => acc + curr.votes, 0) || 0;
                                  const pct = total === 0 ? 0 : Math.round((opt.votes / total) * 100);
                                  return (
                                     <button 
                                       key={opt.id}
                                       onClick={(e) => { e.stopPropagation(); handlePollVote(l.id, opt.id); }}
                                       className="w-full h-11 relative rounded-xl border border-white/5 overflow-hidden group hover:border-white/20 transition-all bg-white/5 active:scale-[0.98]"
                                     >
                                        <div className="absolute inset-0 bg-white/10 origin-left transition-transform duration-1000 ease-out" style={{ transform: `scaleX(${pct / 100})` }} />
                                        <div className="relative h-full px-4 flex items-center justify-between text-white">
                                           <span className="text-[13px] font-bold truncate max-w-[140px]">{opt.label}</span>
                                           {total > 0 && <span className="text-[11px] font-black opacity-60">{pct}%</span>}
                                        </div>
                                     </button>
                                  );
                               })}
                            </div>
                         </div>
                      )}

                      {(l.type === "image" || l.type === "gif" || l.type === "sticker") && (
                         <img src={l.content} className={cn("w-full h-full drop-shadow-2xl", l.width ? "object-cover" : "object-contain")} alt="Layer asset" />
                      )}
                      {l.type === "video" && (
                         <video src={l.content} autoPlay loop muted playsInline className={cn("w-full h-full", l.width ? "object-cover" : "object-contain")} />
                      )}
                    </div>
                  ))}

                  {/* ── On-Canvas Music Sticker (Persisted Styles) ── */}
                  {currentViewerStory.musicVideoId && !(currentViewerStory.isMembersOnly && !user) && (
                    <div 
                      className="absolute z-50 select-none pointer-events-none"
                      style={{ 
                        left: `${currentViewerStory.musicX ?? 50}%`, 
                        top: `${currentViewerStory.musicY ?? 75}%`, 
                        transform: 'translate(-50%, -50%)' 
                      }}
                    >
                       {/* Style 0: Pill (Default) */}
                       {(currentViewerStory.musicStyle === 0 || !currentViewerStory.musicStyle) && (
                         <div className="w-[180px] bg-white rounded-xl p-2 shadow-2xl flex items-center gap-2.5 border border-slate-100 animate-in zoom-in-95 duration-500">
                            <img src={`https://img.youtube.com/vi/${currentViewerStory.musicVideoId}/mqdefault.jpg`} className="w-8 h-8 rounded-lg object-cover" />
                            <div className="flex-1 overflow-hidden">
                               <p className="text-[10px] font-bold text-slate-900 truncate tracking-tight leading-tight">{currentViewerStory.musicTitle}</p>
                               <p className="text-[7px] font-medium text-slate-400 truncate mt-0.5">{currentViewerStory.musicArtist}</p>
                            </div>
                            <Music size={10} className="text-slate-300" />
                         </div>
                       )}

                       {/* Style 1: Square / Large Pill */}
                       {currentViewerStory.musicStyle === 1 && (
                         <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 flex flex-col items-center gap-3 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-500 w-[140px]">
                            <img src={`https://img.youtube.com/vi/${currentViewerStory.musicVideoId}/mqdefault.jpg`} className="w-20 h-20 rounded-xl object-cover shadow-lg" />
                            <div className="text-center overflow-hidden w-full">
                               <p className="text-[11px] font-bold text-white truncate">{currentViewerStory.musicTitle}</p>
                               <p className="text-[8px] font-medium text-white/40 truncate mt-0.5">{currentViewerStory.musicArtist}</p>
                            </div>
                         </div>
                       )}

                       {/* Style 2: Minimalist Capsule */}
                       {currentViewerStory.musicStyle === 2 && (
                         <div className="bg-white/95 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center gap-3 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-500">
                            <Music size={14} className="text-slate-900" />
                            <div className="overflow-hidden max-w-[120px]">
                               <p className="text-[11px] font-bold text-slate-900 truncate tracking-tight">{currentViewerStory.musicTitle}</p>
                            </div>
                         </div>
                       )}

                       {/* Style 3: Hidden (Ghost Icon - Barely visible for viewer) */}
                       {currentViewerStory.musicStyle === 3 && (
                         <div className="opacity-0 pointer-events-none" />
                       )}
                    </div>
                  )}
              </div>

              {/* Now Playing Badge if music */}
              {(() => {
                const storyMusic = music.find(m => m.videoId === currentViewerStory.musicVideoId);
                if (!storyMusic || (currentViewerStory.isMembersOnly && !user)) return null;
                return (
                  <div className="absolute bottom-[160px] left-6 z-30 animate-in slide-in-from-left-4 duration-500">
                    <div className="bg-primary px-3 py-1.5 rounded-md flex items-center gap-2 shadow-xl">
                      <Music className="text-white" size={14} />
                      <span className="text-[10px] text-white font-black uppercase tracking-[0.2em]">{storyMusic.title || "Now Playing"}</span>
                    </div>
                  </div>
                );
              })()}

              {/* Interaction Hotzones - Elevated z-index to stay above text layers */}
              <div className="absolute inset-0 z-[65] flex pointer-events-none">
                <div className={cn("flex-[0.35] pointer-events-auto cursor-pointer flex items-center justify-start px-4 group", storyIndex === 0 && "opacity-0 pointer-events-none")} onClick={prevStory}>
                   <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-90">
                      <ChevronLeft size={24} className="text-white/40" />
                   </div>
                </div>
                <div className={cn("flex-[0.65] pointer-events-auto cursor-pointer flex items-center justify-end px-4 group", storyIndex === stories.length - 1 && "opacity-0 pointer-events-none")} onClick={nextStory}>
                   <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all active:scale-90">
                      <ChevronRight size={24} className="text-white/40" />
                   </div>
                </div>
              </div>

              {/* YouTube Invisible Wrapper */}
              {currentViewerStory.musicVideoId && !(currentViewerStory.isMembersOnly && !user) && (
                <div className="absolute opacity-0 pointer-events-none z-0">
                  <YouTube 
                    videoId={currentViewerStory.musicVideoId} 
                    opts={{ 
                      playerVars: { 
                        autoplay: 1, 
                        start: currentViewerStory.musicStartTime || 0, 
                        end: currentViewerStory.musicEndTime, 
                        controls: 0, 
                        origin: window.location.origin,
                        mute: isIOS ? 1 : 0
                      } 
                    }} 
                    onReady={(e) => {
                      setStoryPlayer(e.target);
                      if (isIOS) e.target.mute();
                      else e.target.unMute();
                    }}
                  />
                </div>
              )}

              {/* Professional Interaction Deck */}
              <div className={`absolute bottom-0 inset-x-0 z-[70] bg-gradient-to-t from-black via-black/80 to-transparent pt-32 pb-8 px-6 pointer-events-none flex flex-col justify-end gap-6 min-h-[400px] transition-all duration-700 ${currentViewerStory.isMembersOnly && !user ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>

                {/* Instagram-Style Comments Drawer */}
                {commentsDrawerOpen && (
                  <div className="pointer-events-auto max-h-[50vh] overflow-y-auto bg-[#121212]/95 backdrop-blur-2xl rounded-t-[20px] shadow-2xl animate-in slide-in-from-bottom-full duration-300 scrollbar-none border-t border-white/10 flex flex-col">
                    
                    {/* Handle */}
                    <div className="flex justify-center py-2 sticky top-0 bg-[#121212] z-20">
                       <div className="w-10 h-1 bg-white/10 rounded-full" />
                    </div>



                    {/* Comments List */}
                    <div className="p-5 space-y-6">
                      {currentViewerStory.comments && currentViewerStory.comments.length > 0 ? currentViewerStory.comments.map((c) => (
                        <div key={c.id} className="flex gap-4">
                          <div className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center shrink-0 border border-white/5 overflow-hidden">
                             <Star size={14} className="text-white/40" />
                          </div>
                          <div className="flex flex-col gap-1 pt-1">
                             <div className="flex items-baseline gap-2">
                                <span className="text-[13px] font-bold text-white leading-none">Yapper</span>
                                <p className="text-[14px] text-white/80 leading-[1.4] tracking-tight">{c.text}</p>
                             </div>
                             <div className="flex items-center gap-4 mt-0.5">
                                <span className="text-[11px] text-white/40 font-medium">Just now</span>
                                <button className="text-[11px] text-white/40 font-bold hover:text-white transition-colors">Reply</button>
                             </div>
                          </div>
                        </div>
                      )) : (
                        <div className="py-20 text-center flex flex-col items-center gap-3">
                           <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                              <MessageSquare size={24} className="text-white/20" />
                           </div>
                           <p className="text-[13px] font-bold text-white/40">No comments yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                  <div className="flex items-center gap-3 pointer-events-auto">
                    {/* Input Field */}
                    {(currentViewerStory.allowComments ?? true) && (
                      <form onSubmit={postComment} className="flex-1" onClick={e=>e.stopPropagation()}>
                        <Input 
                          placeholder="Reply to story..." 
                          value={commentText} 
                          onChange={e=>setCommentText(e.target.value)} 
                          className="rounded-full bg-white/10 border-white/5 hover:bg-white/15 focus:bg-white/15 text-white h-12 px-6 text-sm placeholder:text-white/30 transition-all shadow-inner" 
                        />
                      </form>
                    )}

                    {/* Quick Reactions */}
                    <div className="relative">
                      {flyingReacts.map(r => (
                        <div 
                          key={r.id}
                          className="absolute pointer-events-none select-none text-[20px] left-1/2 -translate-x-1/2 bottom-12"
                          style={{ 
                            animation: `float-up-fade 1.5s ease-out forwards`,
                            animationDelay: `${r.delay}s`,
                            marginLeft: `${r.x}px`
                          }}
                        >
                          {r.emoji}
                        </div>
                      ))}
                      <button onClick={(e) => handleReact(e, 'heart')} className="w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 shadow-lg">
                         <span className="text-[18px]">❤️</span>
                      </button>
                    </div>

                    <button onClick={(e) => handleReact(e, 'fire')} className="w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center hover:bg-white/20 transition-all active:scale-95 shadow-lg">
                       <span className="text-[18px]">🔥</span>
                    </button>

                    {/* Send / Comment Toggle */}
                    {commentText.trim() ? (
                      <button onClick={postComment} className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shadow-xl shadow-primary/20 animate-in zoom-in group">
                        <Send size={18} className="text-white -ml-0.5 mt-0.5" />
                      </button>
                    ) : (
                      (currentViewerStory.allowComments ?? true) && (
                        <button onClick={(e) => { e.stopPropagation(); setCommentsDrawerOpen(!commentsDrawerOpen); }} className="w-12 h-12 rounded-full bg-white/10 border border-white/5 flex items-center justify-center hover:bg-white/20 transition-colors shadow-lg">
                          <MessageSquare size={18} className="text-white" />
                        </button>
                      )
                    )}
                  </div>

              </div>

            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default StoriesSection;
