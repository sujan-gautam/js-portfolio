import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { feedAPI, FeedPost, FeedComment, settingsDB, AdminSettings } from "@/lib/adminData";
import { SmartText } from "@/components/ui/SmartText";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Send, 
  ChevronLeft, ChevronRight, X, Play, Pause, Music, Volume2, VolumeX,
  PieChart, BarChart2, Eye, MapPin, Pin, Loader2, PlayCircle, Camera, Quote,
  Link, Flag, User, EyeOff, Lock
} from "lucide-react";
import YouTube from "react-youtube";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/config";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentSection } from "@/components/CommentSection";
import { ReactionBar, REACTIONS } from "@/components/ReactionBar";
import { PollCard } from "@/components/PollCard";
import { timeAgo, getVoterId } from "@/lib/feedUtils";
import SEO from "@/components/SEO";
const timelineStyles = `
  @keyframes music-bar { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }
`;

// Load cute handwritten font for polaroids
const loadHandwrittenFont = () => {
  if (typeof document !== 'undefined' && !document.getElementById('polaroid-font')) {
    const style = document.createElement('style');
    style.textContent = timelineStyles;
    document.head.appendChild(style);

    const link = document.createElement('link');
    link.id = 'polaroid-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=swap';
    document.head.appendChild(link);
  }
};
loadHandwrittenFont();

// ── Helpers ───────────────────────────────────────────
const VOTER_ID_KEY = "feed_voter_id";






// ── Comment Section ───────────────────────────────────





// ── Shared Music Types ────────────────────────────────
interface MusicData {
  id: string;
  videoId: string;
  startTime: number;
  endTime?: number;
}

const PostCard = ({ 
  post: initialPost, 
  showAlert, 
  globalMute, 
  setGlobalMute, 
  setMusicData,
  playingMusicId,
  isIOS,
  settings,
  ytPlayer,
  isMusicReady
}: { 
  post: FeedPost; 
  showAlert: (msg: string) => void; 
  globalMute: boolean; 
  setGlobalMute: (v: boolean) => void;
  setMusicData: (d: any) => void;
  playingMusicId: string | null;
  isIOS: boolean;
  settings: AdminSettings | null;
  ytPlayer: any;
  isMusicReady: boolean;
}) => {
  const showMusicUI = !isIOS || (playingMusicId === initialPost.id && isMusicReady);
  const { user } = useAuth();
  const [post, setPost] = useState(initialPost);
  const [hasLiked, setHasLiked] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`feed_liked_${initialPost.id}`) === 'true';
    }
    return false;
  });
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imgExpandedIndex, setImgExpandedIndex] = useState<number | null>(null);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState(post.videoUrl || "");
  const [fsPlaying, setFsPlaying] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<{ id: number; x: number; y: number; rotation: number; scale: number; opacity: number }[]>([]);
  const [fsMuted, setFsMuted] = useState(false);
  const [fsFlash, setFsFlash] = useState<'play' | 'pause' | null>(null);
  const fsFlashTimeout = useRef<any>(null);
  const hasTrackedView = useRef(false);
  const postRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fsVideoRef = useRef<HTMLVideoElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showReelControls, setShowReelControls] = useState(false);
  const controlsTimeoutRef = useRef<any>(null);

  const isMusicActive = playingMusicId === post.id;

  const isVideo = (url: string) => {
    if (!url) return false;
    return url.match(/\.(mp4|webm|ogg|mov|m4v)$|^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i);
  };

  const getYTThumbnail = (url: string) => {
    const idMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
    if (idMatch && idMatch[1]) {
      return `https://img.youtube.com/vi/${idMatch[1]}/maxresdefault.jpg`;
    }
    return null;
  };

  const imagesList = post.images?.length ? post.images : (post.image ? [post.image] : []);
  
  // Create a unified list of media items from both images array and videoUrl
  const allMediaUrls = [...imagesList];
  if (post.videoUrl && !allMediaUrls.includes(post.videoUrl)) {
    allMediaUrls.push(post.videoUrl);
  }

  const mediaItems = allMediaUrls.map(url => ({
    type: isVideo(url) ? 'video' as const : 'image' as const,
    url
  }));

  // Keyboard navigation for image lightbox
  useEffect(() => {
    if (imgExpandedIndex === null) return;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        setImgExpandedIndex(p => (p! + 1) % imagesList.length);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setImgExpandedIndex(p => (p! - 1 + imagesList.length) % imagesList.length);
      } else if (e.key === 'Escape') {
        setImgExpandedIndex(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imgExpandedIndex, imagesList.length]);

  useEffect(() => {
    if (!hasTrackedView.current) {
      const t = setTimeout(() => {
        feedAPI.trackView(post.id);
        hasTrackedView.current = true;
      }, 2000); // Only track if user dwells on post for 2s
      return () => clearTimeout(t);
    }
  }, [post.id]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Dynamically update the browser URL for deep-linking/sharing
            window.history.replaceState(null, '', `?post=${post.id}`);

            const isGated = post.membersOnly && !user;

            if (videoRef.current && !isGated) {
              videoRef.current.play().catch(() => {});
            }
            if (post.musicVideoId && !isGated) {
              setMusicData({
                id: post.id,
                videoId: post.musicVideoId,
                startTime: post.musicStartTime || 0,
                endTime: post.musicEndTime || undefined
              });
            }
          } else {
            if (videoRef.current) {
              videoRef.current.pause();
            }
            if (playingMusicId === post.id) {
              setMusicData(null);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    if (postRef.current) observer.observe(postRef.current);
    return () => observer.disconnect();
  }, [post.type, post.musicVideoId, post.id, playingMusicId, activeIndex]);

  // Handle auto-play when carousel index changes
  useEffect(() => {
    if (videoRef.current && !(post.membersOnly && !user)) {
      videoRef.current.play().catch(() => {});
    }
  }, [activeIndex, post.membersOnly, user]);

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
  };

  const handleGoogleLogin = () => {
    localStorage.setItem("auth_return", window.location.pathname);
    window.location.href = `${API_BASE}/auth/google`;
  };

  const openFullscreen = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    if (post.membersOnly && !user) return;
    
    if (url) setActiveVideoUrl(url);
    else setActiveVideoUrl(post.videoUrl || "");
    // Pause the inline video when opening fullscreen
    videoRef.current?.pause();
    setFsPlaying(true);
    setFsMuted(globalMute);
    setVideoFullscreen(true);
  };

  const handleReelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    openFullscreen(e);
  };

  const handleMuteToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMute = !globalMute;
    setGlobalMute(nextMute);
    if (ytPlayer && typeof ytPlayer.unMute === 'function') {
      try {
        if (nextMute) {
          ytPlayer.mute();
        } else {
          ytPlayer.unMute();
          ytPlayer.setVolume(100);
          ytPlayer.playVideo(); // Force play explicitly on interaction for iOS
        }
      } catch (err) {}
    }
  };

  const toggleFsPlay = () => {
    if (!fsVideoRef.current) return;
    if (fsVideoRef.current.paused) { 
      fsVideoRef.current.play(); 
      setFsPlaying(true); 
      setFsFlash('play');
    }
    else { 
      fsVideoRef.current.pause(); 
      setFsPlaying(false); 
      setFsFlash('pause');
    }
    if (fsFlashTimeout.current) clearTimeout(fsFlashTimeout.current);
    fsFlashTimeout.current = setTimeout(() => setFsFlash(null), 800);
  };

  const toggleFsMute = () => {
    if (!fsVideoRef.current) return;
    fsVideoRef.current.muted = !fsVideoRef.current.muted;
    setFsMuted(fsVideoRef.current.muted);
  };

  const handleReact = async (type: string) => {
    if (post.membersOnly && !user) return;
    if (type === "like") {
       setHasLiked(true);
       if (typeof window !== 'undefined') localStorage.setItem(`feed_liked_${post.id}`, 'true');
       const hearts = Array.from({ length: 10 }).map((_, i) => ({
         id: Date.now() + i,
         x: Math.random() * 60 - 30, // Drift
         y: Math.random() * -120 - 40, // Float up
         rotation: Math.random() * 90 - 45,
         scale: Math.random() * 0.4 + 0.6,
         opacity: Math.random() * 0.5 + 0.5
       }));
       setFloatingHearts(prev => [...prev, ...hearts]);
       setTimeout(() => {
         setFloatingHearts(prev => prev.filter(h => !hearts.find(nh => nh.id === h.id)));
       }, 1500);
    }

    try {
      const updated = await feedAPI.react(post.id, type);
      if (updated) {
        // Re-map blog fields if this is an integrated article to prevent layout shifts
        if (post.type === "article") {
          setPost({
            ...updated,
            type: "article",
            articleTitle: updated.title || post.articleTitle,
            articleCover: updated.featuredImage || post.articleCover,
            articleContent: updated.content || post.articleContent
          });
        } else {
          setPost(updated);
        }
      }
    } catch (err: any) {
      if (err.response?.data?.error) showAlert(err.response.data.error);
    }
  };

  const handleShare = async () => {
    if (post.membersOnly && !user) return;
    try {
      await feedAPI.trackShare(post.id);
      setPost(p => ({ ...p, shares: (p.shares || 0) + 1 }));
      if (navigator.share) {
        navigator.share({ title: "Sujan's Feed", text: post.content || post.pollQuestion || "", url: window.location.href });
      } else {
        navigator.clipboard.writeText(window.location.href);
      }
    } catch (err: any) {
      if (err.response?.data?.error) showAlert(err.response.data.error);
    }
  };

  const totalReacts = Object.values(post.reactions || {}).reduce((a, b) => a + b, 0);

  if (isHidden) {
    return (
      <div className="bg-[#0a0a0a] border border-dashed border-white/10 rounded-[20px] p-8 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-500">
        <EyeOff size={24} className="text-white/20" />
        <p className="text-[13px] text-white/40 font-medium uppercase tracking-widest">Post Hidden</p>
        <button onClick={() => setIsHidden(false)} className="text-[11px] text-[#0a84ff] font-bold hover:underline">Undo</button>
      </div>
    );
  }

  return (
    <>
      <div ref={postRef} id={`post-${post.id}`} className="bg-[#0a0a0a] border border-white/5 rounded-[20px] relative overflow-hidden">
        {/* Post Header */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-8 h-8 rounded-full bg-[#1a1a1a] flex items-center justify-center shrink-0 border border-white/10 overflow-hidden ring-1 ring-white/5">
             {settings?.feedProfileImage ? (
               <img src={settings.feedProfileImage} alt="" className="w-full h-full object-cover" />
             ) : (
               <span className="text-white/40 font-bold text-[13px]">{(settings?.feedProfileName || "S")[0]}</span>
             )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-[14px] font-semibold text-white tracking-tight leading-none">
                {settings?.feedProfileName || "Sujan"}
              </p>
              {post.pinned && (
                <div className="flex items-center gap-1 text-[#8e8e93] bg-white/5 px-1.5 py-0.5 rounded-full border border-white/5 animate-in fade-in zoom-in duration-300">
                  <Pin size={10} className="fill-[#8e8e93] rotate-45" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Pinned</span>
                </div>
              )}
              {/* Optional verified-style dot or just clean space */}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
               <p className="text-[11px] text-[#8e8e93] font-normal opacity-80">
                {timeAgo(post.createdAt)}
               </p>
               {post.musicVideoId && !(post.membersOnly && !user) && showMusicUI && (
                 <>
                   <span className="text-[#8e8e93] text-[10px] opacity-40">•</span>
                   <div className="flex items-center gap-1">
                      <Music size={10} className={isMusicActive ? "text-[#ff3b30]" : "text-[#8e8e93]"} />
                      <p className="text-[11px] text-[#8e8e93] font-medium truncate max-w-[140px]">
                        {post.musicTitle || "Original Audio"}
                      </p>
                   </div>
                 </>
               )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {post.musicVideoId && !(post.membersOnly && !user) && showMusicUI && (
              <button 
                onClick={handleMuteToggle}
                className="text-[#8e8e93] hover:text-white transition-colors px-1 h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5"
                title={globalMute ? "Unmute Audio" : "Mute Audio"}
              >
                {globalMute ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-[#8e8e93] hover:text-white transition-colors px-1 h-8 w-8 flex items-center justify-center rounded-full hover:bg-white/5"
              >
                <MoreHorizontal size={20} />
              </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-[999]" onClick={() => setMenuOpen(false)} />
                <div className="absolute top-full right-0 mt-2 w-[190px] bg-[#1c1c1e]/95 backdrop-blur-xl border border-white/10 rounded-[18px] shadow-2xl z-[1000] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                  <div className="p-1.5 space-y-0.5">
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}?post=${post.id}`;
                        navigator.clipboard.writeText(url);
                        showAlert("Link copied! 🔗");
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 rounded-xl transition-all group"
                    >
                      <Link size={14} strokeWidth={2} className="text-white/40 group-hover:text-white" />
                      <span className="text-[13px] font-medium text-white/80">Copy Link</span>
                    </button>
                    
                    <a 
                      href="/about" 
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 rounded-xl transition-all group"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={14} strokeWidth={2} className="text-white/40 group-hover:text-white" />
                      <span className="text-[13px] font-medium text-white/80">About Account</span>
                    </a>

                    <button 
                      onClick={() => {
                        setIsHidden(true);
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 rounded-xl transition-all group"
                    >
                      <EyeOff size={14} strokeWidth={2} className="text-white/40 group-hover:text-white" />
                      <span className="text-[13px] font-medium text-white/80">Not Interested</span>
                    </button>

                    <div className="h-[1px] bg-white/5 my-1 mx-2" />

                    <button 
                      onClick={() => {
                        showAlert("Post reported! 🙏");
                        setMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-white/5 rounded-xl transition-all group"
                    >
                      <Flag size={14} strokeWidth={2} className="text-red-400/60 group-hover:text-red-400" />
                      <span className="text-[13px] font-medium text-red-400/80">Report Post</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          </div>
        </div>

        {/* Members Only Gating */}
        {post.membersOnly && !user ? (
           <div className="relative overflow-hidden rounded-xl bg-[#121212] flex flex-col items-center justify-center py-20 px-8 text-center border border-white/5 mx-4 mb-4">
              <div className="absolute inset-0 bg-[#0a0a0a]/40 backdrop-blur-2xl z-0" />
              <div className="relative z-10 flex flex-col items-center">
                 <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
                    <Lock size={24} className="text-white/40" />
                 </div>
                 <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Members Only Content</h3>
                 <p className="text-white/40 text-[13px] mb-8 max-w-[240px] leading-relaxed">
                    This post is exclusive to members. Please sign in to view the media and interactions.
                 </p>
                 <button 
                   onClick={handleGoogleLogin}
                   className="h-11 px-6 bg-white text-black font-bold text-[13px] rounded-full hover:bg-neutral-200 active:scale-95 transition-all shadow-xl flex items-center gap-3"
                 >
                    <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="google" />
                    Continue with Google
                 </button>
              </div>
           </div>
        ) : (
          <>
            {/* Content */}
            {post.content && post.type !== 'article' && (
              <div className={`px-5 pb-5 text-white/90 text-[15px] leading-[1.6] font-['Inter'] ${post.textLayout === 'quote' ? 'italic font-medium text-[18px]' : ''}`}>
                <SmartText text={post.content} />
              </div>
            )}

        {/* Video / Reel - Only show if not in carousel or if standalone */}
        {mediaItems.length === 1 && mediaItems[0].type === "video" && (
          <div className="relative mx-4 mb-5 overflow-hidden rounded-[16px] bg-black shadow-lg border border-white/5">
            {post.videoUrl?.includes('youtube.com') || post.videoUrl?.includes('youtu.be') ? (
              <div className="w-full relative cursor-pointer" onClick={openFullscreen}>
                 <img src={getYTThumbnail(post.videoUrl) || ""} className="w-full object-cover" style={{maxHeight:'55vh'}} />
                 <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                       <PlayCircle size={24} className="text-white" />
                    </div>
                 </div>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                src={post.videoUrl} 
                loop 
                playsInline 
                muted 
                autoPlay 
                controls 
                className="w-full object-cover bg-black" 
                style={{maxHeight:'55vh'}} 
              />
            )}
          </div>
        )}

        {/* Fullscreen Video Player */}
        {videoFullscreen && activeVideoUrl && createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget) setVideoFullscreen(false); }}
          >
            {/* Video */}
            {activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be') ? (
              <div className="w-full aspect-video">
                <YouTube 
                  videoId={activeVideoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1] || ""} 
                  opts={{ width: "100%", height: "100%", playerVars: { autoplay: 1 } }} 
                  className="w-full h-full"
                />
              </div>
            ) : (
              <>
                <video
                  ref={fsVideoRef}
                  src={activeVideoUrl}
                  loop
                  playsInline
                  muted={fsMuted}
                  autoPlay
                  className="w-full h-full object-contain"
                  onClick={toggleFsPlay}
                />

                {/* Play/pause flash indicator centered */}
                {fsFlash && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                    <div className="w-20 h-20 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center animate-in zoom-in-50 fade-in duration-200">
                      {fsFlash === 'play' ? <Play size={32} className="translate-x-0.5 text-white" /> : <Pause size={32} className="text-white" />}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Top bar: close */}
            <div className="absolute top-0 left-0 right-0 flex justify-end px-5 pt-12 pb-4 bg-gradient-to-b from-black/70 to-transparent pointer-events-none">
              <button
                onClick={() => setVideoFullscreen(false)}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all pointer-events-auto"
              >
                <X size={16} />
              </button>
            </div>

            {/* Bottom controls */}
            {!(activeVideoUrl.includes('youtube.com') || activeVideoUrl.includes('youtu.be')) && (
              <div className="absolute bottom-0 left-0 right-0 px-6 pb-10 pt-20 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end">
                {/* Caption */}
                {post.caption && (
                  <p className="text-white text-[14px] font-medium leading-relaxed mb-4 line-clamp-3">
                    {post.caption}
                  </p>
                )}
                
                <div className="flex items-center justify-between gap-4">
                  {/* Play/Pause */}
                  <button
                    onClick={toggleFsPlay}
                    className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all"
                  >
                    {fsPlaying ? <Pause size={20} /> : <Play size={20} className="translate-x-0.5" />}
                  </button>

                  {/* Mute */}
                  <button
                    onClick={toggleFsMute}
                    className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/25 transition-all"
                  >
                    {fsMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}


        {/* Media Carousel (Images & Videos) */}
        {mediaItems.length > 0 && (mediaItems.length > 1 || mediaItems[0].type === "image") && (
          <div className="w-full relative group px-4 mb-5">
            <div className="relative overflow-hidden rounded-[16px] border border-white/5 bg-[#0a0a0a]">
              <div 
                className="flex transition-transform duration-700 ease-expo"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {mediaItems.map((item, i) => (
                  <div key={i} className="min-w-full flex justify-center bg-[#0a0a0a]">
                    {item.type === "image" ? (
                      <img 
                        src={item.url} 
                        alt="" 
                        className="w-full object-cover cursor-zoom-in" 
                        style={{maxHeight:'55vh', minHeight:'30vh'}} 
                        onClick={() => setImgExpandedIndex(imagesList.indexOf(item.url))}
                      />
                    ) : (
                      <div className="w-full relative">
                         {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                           <div className="w-full relative cursor-pointer" onClick={(e) => { e.stopPropagation(); openFullscreen(e, item.url); }}>
                             <img src={getYTThumbnail(item.url) || ""} className="w-full object-cover" style={{maxHeight:'55vh', minHeight:'30vh'}} />
                             <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                                   <PlayCircle size={24} className="text-white" />
                                </div>
                             </div>
                           </div>
                         ) : (
                           <video 
                             ref={i === activeIndex ? videoRef : null}
                             src={item.url} 
                             loop 
                             playsInline 
                             muted 
                             autoPlay={i === activeIndex}
                             controls
                             className="w-full object-cover bg-black" 
                             style={{maxHeight:'55vh', minHeight:'30vh'}} 
                           />
                         )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {mediaItems.length > 1 && (
                 <>
                   {activeIndex > 0 && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setActiveIndex(p => p - 1) }} 
                       className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 z-10 shadow-2xl"
                     >
                       <ChevronLeft size={16} />
                     </button>
                   )}
                   {activeIndex < mediaItems.length - 1 && (
                     <button 
                       onClick={(e) => { e.stopPropagation(); setActiveIndex(p => p + 1) }} 
                       className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/10 z-10 shadow-2xl"
                     >
                       <ChevronRight size={16} />
                     </button>
                   )}
                   <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
                     {mediaItems.map((_, i) => (
                       <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i === activeIndex ? 'w-5 bg-white' : 'w-1 bg-white/20'}`} />
                     ))}
                   </div>
                 </>
              )}
            </div>
          </div>
        )}

        {/* Link Preview */}
        {post.linkPreview?.url && (
          <div className="px-4 mb-5">
            <a 
              href={post.linkPreview.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="block group/link overflow-hidden rounded-[16px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
            >
              {post.linkPreview.image && (
                <div className="aspect-[1.91/1] w-full overflow-hidden border-b border-white/5 bg-black">
                  <img src={post.linkPreview.image} alt="" className="w-full h-full object-cover transition-transform duration-700 group-hover/link:scale-105" />
                </div>
              )}
              <div className="p-4 space-y-1">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">{post.linkPreview.domain || 'LINK'}</span>
                </div>
                <h4 className="text-[14px] font-bold text-white/90 line-clamp-1 leading-tight">{post.linkPreview.title || post.linkPreview.url}</h4>
                {post.linkPreview.description && (
                  <p className="text-[12px] text-[#8e8e93] line-clamp-2 leading-relaxed mt-1 font-medium">{post.linkPreview.description}</p>
                )}
              </div>
            </a>
          </div>
        )}
            
            {post.caption && (
              <div className="px-6 pb-3">
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3.5 relative">
                   <p className="text-white/80 text-[13px]">{post.caption}</p>
                </div>
              </div>
            )}
            {post.location && (
              <div className="px-6 pb-2 flex items-center gap-1.5 text-white/40 text-[12px] font-medium">
                <MapPin size={13} className="text-[#CB2729]" />{post.location}
              </div>
            )}


        {/* Article Preview */}
        {post.type === "article" && (
          <div className="px-4 mb-5">
            <a 
              href={`/post/${post.id}`} 
              className="block group/article overflow-hidden rounded-[16px] border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              {post.articleCover && (
                <div className="w-full h-48 overflow-hidden bg-[#111]">
                  <img src={post.articleCover} alt={post.articleTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover/article:scale-105" />
                </div>
              )}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-black text-[#0a84ff] uppercase tracking-[0.2em] bg-[#0a84ff]/10 px-2 py-0.5 rounded-full">
                     {post.category || 'ARTICLE'}
                   </span>
                   {post.readTime && (
                     <span className="text-[11px] font-medium text-white/40">
                       {post.readTime} min read
                     </span>
                   )}
                </div>
                <h4 className="text-[18px] font-bold text-white/90 leading-tight group-hover/article:text-[#0a84ff] transition-colors">{post.articleTitle}</h4>
                <div className="text-[14px] text-[#8e8e93] line-clamp-3 leading-relaxed font-normal">
                  {post.content && post.content !== post.articleTitle 
                    ? post.content 
                    : (post.seoDescription && post.seoDescription !== post.articleTitle 
                        ? post.seoDescription 
                        : "Explore the full narrative and research insights in this dedicated article...")}
                </div>
                <div className="pt-2 text-[12px] font-bold text-white/60 group-hover/article:text-white transition-colors flex items-center gap-1">
                  Read Full Article <ChevronRight size={14} className="translate-y-[1px] group-hover/article:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Poll */}
        {post.type === "poll" && (
          <div className="px-6 pb-4">
            <PollCard post={post} onUpdate={setPost} showAlert={showAlert} />
          </div>
        )}

        {/* Tags */}
        {post.tags?.length ? (
          <div className="px-6 pb-4 flex gap-2 flex-wrap">
            {post.tags.map((t, i) => <span key={`${t}-${i}`} className="text-[11px] font-medium bg-white/[0.04] border border-white/[0.08] text-white/50 px-3 py-1.5 rounded-full">#{t}</span>)}
          </div>
        ) : null}

        {/* Music logic keyframes */}
        <style>{`
          @keyframes music-bar { 0% { transform: scaleY(0.3); } 100% { transform: scaleY(1); } }
        `}</style>
          </>
        )}

        {!(post.membersOnly && !user) && (
          <div className="px-5 py-4 flex items-center justify-between border-t border-white/5 font-['Inter']">
          <div className="flex items-center gap-7">
            <div className="relative">
              <button
                onClick={() => handleReact("like")}
                className="flex items-center gap-2.5 text-[#8e8e93] hover:text-[#ff3b30] transition-colors relative"
              >
                <Heart size={22} strokeWidth={1.5} className={hasLiked ? "fill-[#ff3b30] text-[#ff3b30] animate-in zoom-in-125 duration-300" : ""} />
                <span className="text-[13px] font-medium">{formatCount(totalReacts) || ""}</span>
              </button>

              {/* Premium Floating Hearts */}
              {floatingHearts.map(heart => (
                <div
                  key={heart.id}
                  className="absolute left-1/2 bottom-full pointer-events-none z-50 text-[#ff3b30]/60"
                  style={{
                    '--dx': `${heart.x}px`,
                    '--dy': `${heart.y}px`,
                    '--dr': `${heart.rotation}deg`,
                    animation: `float-heart 1.2s ease-out forwards`
                  } as any}
                >
                  <Heart size={20} fill="currentColor" />
                </div>
              ))}
              {/* Animation keyframes */}
              <style>{`
                @keyframes float-heart {
                  0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
                  15% { opacity: 0.9; transform: translate(-50%, -15px) scale(1.1); }
                  100% { transform: translate(calc(-50% + var(--dx)), var(--dy)) rotate(var(--dr)) scale(0.8); opacity: 0; }
                }
              `}</style>
            </div>

            <button
              onClick={() => setCommentsOpen(true)}
              className="flex items-center gap-2.5 text-[#8e8e93] hover:text-white transition-colors"
            >
              <MessageCircle size={22} strokeWidth={1.5} />
              <span className="text-[13px] font-medium">{formatCount(post.comments?.length || 0) || ""}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center text-[#8e8e93] hover:text-white transition-colors"
            >
              <Share2 size={22} strokeWidth={1.5} />
            </button>
          </div>
        </div>
        )}

        {/* Comments Section */}
        {commentsOpen && (
          <CommentSection post={post} onUpdate={setPost} showAlert={showAlert} openOverride={commentsOpen} setOpenOverride={setCommentsOpen} />
        )}
      </div>

      {/* Expanded image lightbox */}
      {imgExpandedIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-[#050505]/95 backdrop-blur-2xl flex items-center justify-center p-4 flex-col" onClick={() => setImgExpandedIndex(null)}>
          <button className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-all z-10 backdrop-blur-md shadow-2xl">
            <X size={24} className="text-white" />
          </button>
          
          <div className="relative w-full max-w-6xl h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img src={imagesList[imgExpandedIndex]} alt="" className="max-h-[90vh] max-w-full rounded-[20px] object-contain shadow-2xl" />
            
            {imagesList.length > 1 && (
               <>
                 <button onClick={(e) => { e.stopPropagation(); setImgExpandedIndex(p => (p! - 1 + imagesList.length) % imagesList.length) }} className="absolute left-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20 hover:scale-110 z-10">
                   <ChevronLeft size={28} />
                 </button>
                 <button onClick={(e) => { e.stopPropagation(); setImgExpandedIndex(p => (p! + 1) % imagesList.length) }} className="absolute right-6 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl flex items-center justify-center text-white hover:bg-white/20 transition-all border border-white/20 hover:scale-110 z-10">
                   <ChevronRight size={28} />
                 </button>
               </>
            )}
          </div>

          {imagesList.length > 1 && (
             <div className="absolute bottom-10 flex justify-center gap-2 pointer-events-none w-full">
               {imagesList.map((_, i) => (
                  <div key={i} className={`h-2 rounded-full transition-all duration-300 shadow-lg ${i === imgExpandedIndex ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
               ))}
             </div>
          )}
        </div>
      )}
    </>
  );
};

// ── Main Feed Page ────────────────────────────────────
const Feed = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [globalMute, setGlobalMute] = useState(true);
  const [musicData, setMusicData] = useState<MusicData | null>(null);
  const [isMusicReady, setIsMusicReady] = useState(false);
  const [ytPlayer, setYtPlayer] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  useEffect(() => {
    const siteName = "Sujan Gautam | Sujan1919";
    const profession = "Software Developer & UI Architect";
    const title = `Feed | ${siteName} | ${profession}`;
    const desc = "Stay updated with the latest posts, projects, and insights from Sujan Gautam (sujan1919). Interactive feed featuring software development, UI/UX design, and creative technology.";
    const keywords = "Sujan Gautam Feed, Sujan1919 Posts, Software Developer Updates, Web Development Blog, Sujan Shrestha, Portfolio Feed";
    const url = "https://sujan1919.com.np/feed/";

    document.title = title;
    setMeta("description", desc);
    setMeta("keywords", keywords);
    setMeta("author", "Sujan Gautam");
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "website", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);

    // Canonical
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;

    // JSON-LD Series schema
    const feedSchema = {
      "@context": "https://schema.org",
      "@type": "Series",
      "name": "Sujan Gautam's Feed",
      "description": desc,
      "url": url,
      "author": {
        "@type": "Person",
        "name": "Sujan Gautam",
        "jobTitle": "Software Developer"
      }
    };

    let el = document.getElementById("ld-feed");
    if (!el) { el = document.createElement("script"); el.id = "ld-feed"; (el as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(feedSchema);

    return () => { document.getElementById("ld-feed")?.remove(); };
  }, []);

  function setMeta(key: string, value: string, isProp = false) {
    if (!value) return;
    const attr = isProp ? "property" : "name";
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute("content", value);
  }

  useEffect(() => {
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
    setGlobalMute(isIOSDevice);

    Promise.all([
      feedAPI.getPosts(),
      axios.get(`${API_BASE}/collection/blog_posts`)
    ]).then(([feedData, blogRes]) => {
      const blogData = blogRes.data || [];
      
      // Map BlogPosts to FeedPost structure
      const mappedBlogs: FeedPost[] = blogData
        .filter((b: any) => b.status === "Published")
        .map((b: any) => ({
          id: b.id || b._id,
          content: (() => {
            if (!b.content) return b.excerpt || "No content available.";
            const plain = b.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
            const title = b.title || "";
            let snippet = plain;
            if (snippet.toLowerCase().startsWith(title.toLowerCase())) {
              snippet = snippet.slice(title.length).trim();
            }
            return snippet.slice(0, 160) + (snippet.length > 160 ? "..." : "");
          })(),
          seoDescription: b.seo?.description || b.excerpt,
          type: "article",
          articleTitle: b.title,
          articleCover: b.featuredImage,
          createdAt: b.createdAt,
          updatedAt: b.updatedAt,
          pinned: b.pinned || false,
          reactions: b.reactions || { heart: 0, fire: 0, like: 0, insightful: 0 },
          views: b.views || 0,
          comments: b.comments || [],
          category: b.categoryName || "Article",
          membersOnly: b.membersOnly,
          readTime: b.readTime
        }));

      // Merge and Sort: Pinned first, then by Date (Newest first)
      const combined = [...feedData, ...mappedBlogs].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      setPosts(combined); 
      setLoading(false); 
      
      // Handle deep-linking to specific post
      const params = new URLSearchParams(window.location.search);
      const postId = params.get('post');
      if (postId) {
        setTimeout(() => {
          const el = document.getElementById(`post-${postId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    });

    settingsDB.get().then(setSettings);
  }, []);

  // Handle global volume sync
  useEffect(() => {
    if (ytPlayer && typeof ytPlayer.mute === 'function') {
      try {
        if (globalMute) ytPlayer.mute();
        else ytPlayer.unMute();
      } catch (err) { }
    }
  }, [globalMute, ytPlayer]);

  // Force play when video changes
  useEffect(() => {
    setIsMusicReady(false); // Reset when track changes
    if (ytPlayer && musicData) {
      try {
        // Only call if iframe is still in DOM
        if (ytPlayer.getIframe()) {
          ytPlayer.loadVideoById({
            videoId: musicData.videoId,
            startSeconds: musicData.startTime,
            endSeconds: musicData.endTime
          });
          ytPlayer.playVideo();
        }
      } catch (e) {
        console.warn("YT loadVideoById failed:", e);
      }
    } else if (ytPlayer) {
      try {
        if (ytPlayer.getIframe()) {
          ytPlayer.stopVideo();
        }
      } catch (e) { }
    }
  }, [musicData?.videoId, ytPlayer]);

  return (
    <>
      <SEO 
        title="Sujan Gautam | Professional Feed & Updates"
        description="Follow Sujan Gautam's professional journey, latest projects, articles, and stories. A dynamic feed of updates from a Senior Software Developer."
      />
    <div 
      className="h-screen w-full text-white font-['Inter'] overflow-y-auto snap-y snap-mandatory scroll-smooth relative no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      
      {/* System Alert Popup */}
      {alertMessage && createPortal(
        <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setAlertMessage(null)}>
          <div className="bg-[#1c1c1e] border border-white/10 w-[270px] rounded-2xl flex flex-col items-center overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="p-6 flex flex-col items-center text-center gap-2 w-full pt-6 pb-5">
              <p className="text-[16px] font-bold text-white tracking-tight">System Alert</p>
              <p className="text-[13px] text-white/80 leading-relaxed font-medium">{alertMessage}</p>
            </div>
            <button onClick={() => setAlertMessage(null)} className="w-full py-3.5 border-t border-white/10 text-[#0a84ff] font-bold text-[15px] hover:bg-white/5 active:bg-white/10 transition-colors">
              OK
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Main Timeline Wrapper */}
      <div className="max-w-6xl mx-auto w-full pb-36 px-4 pt-4 md:pt-16 relative">
        <h1 className="sr-only">Sujan Gautam | Personal Feed & Professional Updates</h1>
        {/* Simple Feed Layout */}
        <div className="flex flex-col items-center gap-10 w-full">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="w-full md:w-[460px] lg:w-[500px] space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-10 h-10 rounded-full opacity-20" />
                  <div className="space-y-1.5">
                     <Skeleton className="h-3 w-24 opacity-20" />
                     <Skeleton className="h-2 w-16 opacity-10" />
                  </div>
                </div>
                <Skeleton className="h-72 w-full rounded-2xl opacity-10" />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="py-20 text-white/20 text-xs uppercase tracking-[0.3em] font-medium">No posts here yet</div>
          ) : (
            posts.map((post) => (
              <div 
                id={`post-${post.id}`} 
                key={post.id} 
                className="w-full md:w-[460px] lg:w-[500px] snap-start snap-always py-4"
              >
                <PostCard 
                  post={post} 
                  showAlert={setAlertMessage} 
                  globalMute={globalMute} 
                  setGlobalMute={setGlobalMute} 
                  setMusicData={setMusicData}
                  playingMusicId={musicData?.id || null}
                  isIOS={isIOS}
                  settings={settings}
                  ytPlayer={ytPlayer}
                  isMusicReady={isMusicReady}
                />
              </div>
            ))
          )}
        </div>
      </div>


      {/* Global Shared YouTube Player (Fast Audio Switching) */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none z-[-1]">
        <YouTube 
          videoId="" // Video loaded dynamically via ytPlayer.loadVideoById
          opts={{ 
            playerVars: { 
              autoplay: 1, 
              mute: globalMute ? 1 : 0,
              origin: window.location.origin,
              controls: 0,
              rel: 0
            } 
          }}
          onReady={(e) => setYtPlayer(e.target)}
          onStateChange={(e) => {
             // 1=playing, 2=paused, 3=buffering, 5=cued
             if (e.data === 1 || e.data === 2 || e.data === 3 || e.data === 5) {
                setIsMusicReady(true);
             } else {
                setIsMusicReady(false);
             }
          }}
          onEnd={() => { setMusicData(null); setIsMusicReady(false); }}
          onError={() => { setMusicData(null); setIsMusicReady(false); }}
        />
      </div>
    </div>
    </>
  );
};

export default Feed;


