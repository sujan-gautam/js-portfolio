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
import { Skeleton } from "@/components/ui/skeleton";

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
const getVoterId = () => {
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem(VOTER_ID_KEY, id); }
  return id;
};

const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

const REACTIONS: Record<string, { emoji: string; label: string; color: string }> = {
  heart: { emoji: "❤️", label: "Love", color: "text-red-500" },
  fire:  { emoji: "🔥", label: "Fire", color: "text-orange-500" },
  like:  { emoji: "❤️", label: "Like", color: "text-red-500" },
  wow:   { emoji: "😮", label: "Wow",  color: "text-yellow-400" },
  sad:   { emoji: "😢", label: "Sad",  color: "text-indigo-400" },
};

// ── Reaction Bar ──────────────────────────────────────
const ReactionBar = ({ post, onReact }: { post: FeedPost; onReact: (type: string) => void }) => {
  const [open, setOpen] = useState(false);
  const total = Object.values(post.reactions || {}).reduce((a, b) => a + b, 0);
  const topReaction = Object.entries(post.reactions || {}).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="relative">
      <button
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setTimeout(() => setOpen(false), 300)}
        onClick={() => onReact("like")}
        className="flex items-center gap-1.5 text-white/50 hover:text-white transition-all text-[13px] font-medium"
      >
        <span className="text-[14px]">
          {topReaction?.[1] > 0 ? REACTIONS[topReaction[0]]?.emoji : <Heart size={14} />}
        </span>
        <span>{total > 0 ? total : "React"}</span>
      </button>

      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className="absolute bottom-8 left-0 flex gap-1 bg-[#1a1a1a] border border-white/10 rounded-2xl px-2 py-1.5 shadow-2xl z-20 animate-in fade-in slide-in-from-bottom-2"
        >
          {Object.entries(REACTIONS).map(([key, r]) => (
            <button
              key={key}
              onClick={() => { onReact(key); setOpen(false); }}
              title={r.label}
              className="text-xl hover:scale-125 hover:-translate-y-1 transition-all duration-300 px-1.5"
            >
              {r.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Comment Section ───────────────────────────────────
const CommentSection = ({ post, onUpdate, showAlert, openOverride, setOpenOverride }: { post: FeedPost; onUpdate: (p: FeedPost) => void, showAlert: (msg: string) => void, openOverride?: boolean, setOpenOverride?: (v: boolean) => void }) => {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const voterId = getVoterId();
  const hasCommented = post.comments?.some(c => c.votersId === voterId);
  const allComments = post.comments || [];
  
  const showModal = openOverride !== undefined ? openOverride : isModalOpen;
  const setModal = setOpenOverride || setIsModalOpen;
  
  const previewComments = allComments.slice(-2);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || hasCommented) return;
    setSubmitting(true);
    try {
      const updated = await feedAPI.addComment(post.id, text.trim(), "Anonymous", voterId);
      if (updated) onUpdate(updated);
      setText("");
    } catch (err: any) {
      if (err.response?.data?.error) showAlert(err.response.data.error);
    }
    setSubmitting(false);
  };

  return (
    <div className="px-5 pb-4 space-y-3 w-full font-['Inter']">
      {/* Inline Comment Preview */}
      {allComments.length > 0 && (
        <div className="space-y-2">
          {previewComments.map((c, i) => (
            <div key={c.id || i} className="flex items-baseline gap-2">
              <span className="text-[13px] font-bold text-white shrink-0">Anonymous</span>
              <p className="text-[13px] text-white/70 leading-relaxed line-clamp-2">{c.text}</p>
            </div>
          ))}
          {allComments.length > 2 && (
            <button 
              onClick={() => setModal(true)} 
              className="text-[12px] text-[#8e8e93] hover:text-white transition-colors font-medium mt-1"
            >
              View all {allComments.length} comments
            </button>
          )}
        </div>
      )}

      {/* Modern Fake Input */}
      <div 
        onClick={() => setModal(true)} 
        className="flex items-center gap-3 pt-1 cursor-pointer group"
      >
        <div className="w-7 h-7 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-[11px] font-black text-white/40 group-hover:bg-white/10 transition-colors">
          Y
        </div>
        <span className="text-[13px] text-white/30 group-hover:text-white/40 transition-colors">Add a comment...</span>
      </div>

      {/* Premium Bottom Sheet Modal */}
      {showModal && createPortal(
        <div 
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-end bg-black/70 backdrop-blur-[6px] animate-in fade-in duration-300"
          onClick={() => setModal(false)}
        >
          <div 
            className="w-full max-w-[500px] h-[80vh] bg-[#0a0a0a] rounded-t-[32px] border-t border-x border-white/10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
            onClick={e => e.stopPropagation()}
          >
            {/* Drag Handle Indicator */}
            <div className="w-full flex justify-center py-3">
              <div className="w-10 h-1 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 pb-4 border-b border-white/5">
               <h3 className="text-white font-bold text-[17px] tracking-tight">Comments</h3>
               <button onClick={() => setModal(false)} className="p-2 -mr-2 text-white/40 hover:text-white transition-colors">
                 <X size={22} />
               </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-none">
              {allComments.length > 0 ? (
                allComments.map((c, i) => (
                  <div key={c.id || i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-[13px] font-semibold text-white/30">
                      A
                    </div>
                    <div className="space-y-1 pt-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-white">Anonymous</span>
                        <span className="text-[11px] text-[#8e8e93] font-normal opacity-60">{timeAgo(c.createdAt)}</span>
                      </div>
                      <p className="text-[14px] text-white/70 leading-relaxed font-normal break-words">{c.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 opacity-10">
                  <MessageCircle size={48} strokeWidth={1} />
                  <span className="text-[12px] font-semibold uppercase tracking-[0.3em]">No comments yet</span>
                </div>
              )}
            </div>

            {/* Sticky Input Area */}
            <div className="p-6 pt-4 bg-[#0a0a0a] border-t border-white/5 pb-10">
              {!hasCommented ? (
                <form onSubmit={submit} className="relative flex items-center gap-3">
                  <input
                    autoFocus
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 h-12 bg-white/5 border border-white/10 rounded-2xl px-5 text-[14px] text-white font-normal placeholder:text-white/20 focus:outline-none focus:border-white/20 transition-all"
                  />
                  <button
                    type="submit"
                    disabled={!text.trim() || submitting}
                    className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center disabled:bg-white/10 disabled:text-white/10 transition-all hover:scale-105 active:scale-95"
                  >
                    {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                  </button>
                </form>
              ) : (
                <div className="h-12 flex items-center justify-center gap-2 rounded-2xl bg-white/5 border border-white/5 text-[12px] font-semibold text-white/20 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500/30" />
                  Your comment is live
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ── Poll Card ─────────────────────────────────────────
const PollCard = ({ post, onUpdate, showAlert }: { post: FeedPost; onUpdate: (p: FeedPost) => void, showAlert: (msg: string) => void }) => {
  const voterId = getVoterId();
  const hasVoted = post.pollOptions?.some(o => o.voters?.includes(voterId));
  const totalVotes = (post.pollOptions || []).reduce((a, o) => a + (o.votes || 0), 0);
  const expired = post.pollEndsAt ? new Date(post.pollEndsAt) < new Date() : false;

  const vote = async (optionId: string) => {
    if (hasVoted || expired) return;
    try {
      const updated = await feedAPI.votePoll(post.id, optionId, voterId);
      if (updated) onUpdate(updated);
    } catch (err: any) {
      if (err.response?.data?.error) showAlert(err.response.data.error);
    }
  };

  return (
    <div className="space-y-4 font-['Inter']">
      <h3 className="text-white text-[16px] font-bold leading-snug">{post.pollQuestion}</h3>
      
      <div className="space-y-2.5">
        {(post.pollOptions || []).map((opt, idx) => {
          const optId = opt.id || (opt as any)._id || `opt-${idx}`;
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={optId}
              onClick={() => vote(optId)}
              disabled={hasVoted || expired}
              className="w-full text-left relative h-11 rounded-[10px] overflow-hidden bg-white/[0.04] border border-white/5 transition-all hover:bg-white/[0.08]"
            >
              {(hasVoted || expired) && (
                <div 
                  className="absolute inset-y-0 left-0 bg-[#ff3b30]/20 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]" 
                  style={{ width: `${pct}%` }} 
                />
              )}
              <div className="relative h-full flex items-center justify-between px-4">
                <span className={`text-[14px] font-semibold ${hasVoted || expired ? 'text-white' : 'text-white/70'}`}>{opt.label}</span>
                {(hasVoted || expired) && (
                  <span className="text-[13px] font-bold text-white/50">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="flex items-center gap-2 text-[11px] font-bold text-[#8e8e93] uppercase tracking-wider">
        <span>{totalVotes.toLocaleString()} votes</span>
        <span>•</span>
        <span>{expired ? "Closed" : "Active"}</span>
      </div>
    </div>
  );
};


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
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imgExpandedIndex, setImgExpandedIndex] = useState<number | null>(null);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
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

  const imagesList = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const mediaItems = [
    ...imagesList.map(url => ({ type: 'image' as const, url })),
    ...(post.videoUrl ? [{ type: 'video' as const, url: post.videoUrl }] : [])
  ];

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

            if (videoRef.current && (post.type === "video" || post.type === "reel")) {
              videoRef.current.play().catch(() => {});
            }
            if (post.musicVideoId) {
              setMusicData({
                id: post.id,
                videoId: post.musicVideoId,
                startTime: post.musicStartTime || 0,
                endTime: post.musicEndTime || undefined
              });
            }
          } else {
            if (videoRef.current && (post.type === "video" || post.type === "reel")) {
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
  }, [post.type, post.musicVideoId, post.id, playingMusicId]);

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return num.toString();
  };

  const handleGoogleLogin = () => {
    localStorage.setItem("auth_return", window.location.pathname);
    window.location.href = `${API_BASE}/auth/google`;
  };

  const openFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    if (type === "like") {
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
      if (updated) setPost(updated);
    } catch (err: any) {
      if (err.response?.data?.error) showAlert(err.response.data.error);
    }
  };

  const handleShare = async () => {
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
            {post.content && (
              <div className={`px-5 pb-5 text-white/90 text-[15px] leading-[1.6] font-['Inter'] ${post.textLayout === 'quote' ? 'italic font-medium text-[18px]' : ''}`}>
                <SmartText text={post.content} />
              </div>
            )}

        {/* Video / Reel - Only show if not in carousel or if standalone */}
        {mediaItems.length === 1 && mediaItems[0].type === "video" && (
          <div className="relative mx-4 mb-5 overflow-hidden rounded-[16px] bg-black cursor-pointer shadow-lg border border-white/5" onClick={openFullscreen}>
            <video ref={videoRef} src={post.videoUrl} loop playsInline muted autoPlay className="w-full object-cover bg-black" style={{maxHeight:'55vh'}} />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/10">
               <div className="w-14 h-14 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center">
                  <Play size={24} fill="white" className="text-white translate-x-0.5" />
               </div>
            </div>
          </div>
        )}

        {/* Fullscreen Video Player */}
        {videoFullscreen && post.videoUrl && createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center"
            onClick={e => { if (e.target === e.currentTarget) setVideoFullscreen(false); }}
          >
            {/* Video */}
            <video
              ref={fsVideoRef}
              src={post.videoUrl}
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
          </div>,
          document.body
        )}


        {/* Media Carousel (Images & Videos) */}
        {mediaItems.length > 0 && (mediaItems.length > 1 || mediaItems[0].type === "image") && (
          <div className="w-full relative group px-4 mb-5">
            <div className="relative overflow-hidden rounded-[16px] border border-white/5 bg-[#0a0a0a]">
              <div 
                className="flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
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
                      <div className="w-full relative cursor-pointer" onClick={openFullscreen}>
                         <video 
                           src={item.url} 
                           loop 
                           playsInline 
                           muted 
                           autoPlay={i === activeIndex}
                           className="w-full object-cover bg-black" 
                           style={{maxHeight:'55vh', minHeight:'30vh'}} 
                         />
                         <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10">
                            <PlayCircle size={16} />
                         </div>
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
                <Heart size={22} strokeWidth={1.5} className={post.reactions?.like ? "fill-[#ff3b30] text-[#ff3b30] animate-in zoom-in-125 duration-300" : ""} />
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
    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isIOSDevice);
    setGlobalMute(isIOSDevice);

    feedAPI.getPosts().then(data => { 
      setPosts(data); 
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
      <div className="absolute opacity-0 pointer-events-none z-0">
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
             // 1=playing, 2=paused, 3=buffering
             if (e.data === 1 || e.data === 2 || e.data === 3) {
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
  );
};

export default Feed;


