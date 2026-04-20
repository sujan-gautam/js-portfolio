import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { feedAPI, FeedPost, FeedComment } from "@/lib/adminData";
import { SmartText } from "@/components/ui/SmartText";
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Send, 
  ChevronLeft, ChevronRight, X, Play, Pause, Music, Volume2, VolumeX,
  PieChart, BarChart2, Eye, MapPin, Pin, Loader2, PlayCircle, Camera, Quote
} from "lucide-react";
import YouTube from "react-youtube";
import { Skeleton } from "@/components/ui/skeleton";

const timelineStyles = `
  @keyframes silk-wave {
    0%, 100% { transform: translateX(-2px); }
    50% { transform: translateX(2px); }
  }
  @keyframes gem-wobble {
    0%, 100% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.1) rotate(5deg); }
    75% { transform: scale(1.1) rotate(-5deg); }
  }
  @keyframes sparkle-drift {
    0% { transform: translateY(0) scale(0); opacity: 0; }
    50% { opacity: 0.5; scale: 1; }
    100% { transform: translateY(-40px) scale(0); opacity: 0; }
  }
  @keyframes float-heart {
    0% { transform: translateY(0) scale(0); opacity: 0; }
    20% { opacity: 1; scale: 1.2; }
    100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
  }
  @keyframes side-sway {
    0%, 100% { margin-left: 0px; }
    50% { margin-left: 15px; }
  }
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
  
  // Inline preview: show up to 2 most recent comments
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
    <div className="px-4 pb-3 space-y-2 w-full">
      {/* Inline Comment Preview */}
      {allComments.length > 0 && (
        <div className="space-y-1.5">
          {allComments.length > 2 && (
            <button onClick={() => setModal(true)} className="text-[11px] text-white/40 hover:text-white/70 transition-colors font-medium tracking-wide">
              View all {allComments.length} comments
            </button>
          )}
          {previewComments.map((c, i) => (
            <div key={c.id || i} className="flex items-start gap-2 max-w-[85%]">
              <div className="flex-1 bg-transparent">
                <p className="text-[12px] text-white/80 leading-snug break-words line-clamp-3">
                  <span className="font-bold text-white mr-2">Anonymous</span>
                  {c.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline Fake Input Trigger */}
      <div 
        onClick={() => setModal(true)} 
        className="flex items-center gap-2 mt-2 cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-[#CB2729]/20 border border-[#CB2729]/30 flex items-center justify-center shrink-0">
          <span className="text-[9px] text-[#CB2729] font-black">Y</span>
        </div>
        <div className="flex-1 h-8 rounded-full bg-white/[0.04] border border-white/[0.05] flex items-center px-3">
          <span className="text-[11px] text-white/30">Add a comment...</span>
        </div>
      </div>

      {/* Fullscreen Modal Portal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 md:p-6" onClick={() => setModal(false)}>
          
          <div className="w-full max-w-[480px] h-[75vh] md:h-[80vh] bg-[#111] md:rounded-[28px] rounded-t-3xl flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 border border-white/10" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.04] shrink-0">
              <div className="w-8" /> {/* spacer */}
              <h3 className="text-white font-bold text-[15px]">Comments</h3>
              <button onClick={() => setModal(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Comments List (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-5" style={{ scrollbarWidth: 'none' }}>
              {allComments.length > 0 ? (
                allComments.map((c, i) => (
                  <div key={c.id || i} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 border border-white/5 shadow-sm">
                      <span className="text-[12px] text-white/50 font-bold">A</span>
                    </div>
                    <div className="bg-white/[0.03] rounded-2xl rounded-tl-sm px-4 py-2 border border-white/[0.04] max-w-[85%]">
                      <p className="text-[12px] font-bold text-white/90 mb-0.5">Anonymous</p>
                      <p className="text-[13px] text-white/70 leading-relaxed word-break">{c.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-white/20 text-[12px] font-medium tracking-widest uppercase">
                  No comments yet
                </div>
              )}
            </div>

            {/* Modal Input (Sticky Bottom) */}
            <div className="shrink-0 px-4 py-4 border-t border-white/[0.04] bg-[#0a0a0a] pb-8 md:pb-4">
              {!hasCommented ? (
                <form onSubmit={submit} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#CB2729]/20 border border-[#CB2729]/30 flex items-center justify-center shrink-0">
                    <span className="text-[10px] text-[#CB2729] font-black">Y</span>
                  </div>
                  <div className="flex-1 relative">
                    <input
                      autoFocus
                      value={text}
                      onChange={e => setText(e.target.value)}
                      placeholder="Write a comment…"
                      className="w-full h-11 px-4 pr-10 rounded-full bg-white/[0.05] border border-white/[0.07] text-[13px] text-white/90 placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors shadow-inner"
                    />
                    <button
                      type="submit"
                      disabled={!text.trim() || submitting}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#CB2729] disabled:opacity-30 disabled:bg-white/10 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                    >
                      {submitting ? <Loader2 size={14} className="animate-spin text-white" /> : <Send size={14} className="text-white" />}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-center shadow-inner">
                  <p className="text-[11px] text-white/30 font-bold tracking-widest uppercase flex items-center justify-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500/50" />
                    Comment Posted
                  </p>
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
    <div className="bg-[#111] border border-white/[0.06] rounded-2xl p-5 mt-3 relative overflow-hidden">
      <div className="flex items-center gap-3 mb-5">
        <BarChart2 size={16} className="text-[#CB2729]" />
        <h3 className="font-semibold text-white text-[15px]">{post.pollQuestion}</h3>
      </div>
      
      <div className="space-y-2.5">
        {(post.pollOptions || []).map(opt => {
          const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              onClick={() => vote(opt.id)}
              disabled={hasVoted || expired}
              className={`w-full text-left relative rounded-xl overflow-hidden border transition-all duration-300 ${
                hasVoted || expired
                  ? "border-white/[0.05] bg-white/[0.02]"
                  : "border-white/[0.1] bg-white/[0.03] hover:border-[#CB2729]/50 hover:bg-[#CB2729]/10"
              }`}
            >
              {(hasVoted || expired) && (
                <div 
                  className="absolute inset-y-0 left-0 bg-[#CB2729]/20 transition-all duration-1000 ease-out" 
                  style={{ width: `${pct}%` }} 
                />
              )}
              <div className="relative flex items-center justify-between px-4 py-3">
                <span className="text-[13px] font-medium text-white/90">{opt.label}</span>
                {(hasVoted || expired) && (
                  <span className="text-[12px] font-bold text-[#CB2729]">{pct}%</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 text-[12px] text-white/30 flex justify-between">
        <span>{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</span>
        {expired ? <span className="text-[#CB2729]">Poll ended</span> : post.pollEndsAt ? <span>Ends {timeAgo(post.pollEndsAt)}</span> : null}
      </div>
    </div>
  );
};

// ── Polaroid Layout ──────────────────────────────────
const PolaroidLayout = ({ images, captions, onExpand }: { images: string[]; captions?: string[]; onExpand: (idx: number) => void }) => {
  return (
    <div className="w-full overflow-x-auto no-scrollbar py-10 flex gap-4 scroll-smooth bg-black/60 border-y border-white/[0.03] scroll-px-10">
      <div className="flex gap-10 px-12 min-w-full">
        {images.map((img, i) => {
          const rotations = [-4, 3, -2, 5, -3];
          const rot = rotations[i % rotations.length];
          return (
            <div 
              key={i} 
              onClick={() => onExpand(i)}
              className="shrink-0 bg-white p-2.5 pb-10 shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all hover:scale-110 hover:rotate-0 hover:z-20 cursor-zoom-in group select-none relative"
              style={{ 
                width: '190px', 
                transform: `rotate(${rot}deg)`,
                height: 'fit-content',
              }}
            >
              <div className="w-full aspect-[4/5] overflow-hidden bg-[#f0f0f0] relative shadow-inner">
                <img src={img} alt="" className="w-full h-full object-cover grayscale-[0.05] group-hover:grayscale-0 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 border-[0.5px] border-black/5 pointer-events-none" />
              </div>
              <div className="mt-5 px-1 flex flex-col items-center">
                 <p className="font-['Caveat'] text-black/80 text-[22px] font-bold text-center leading-none tracking-tight">
                   {captions?.[i] || "..."}
                 </p>
              </div>
              {/* Subtle texture/paper effect */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/paper.png')]" />
            </div>
          );
        })}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
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
  playingMusicId 
}: { 
  post: FeedPost; 
  showAlert: (msg: string) => void; 
  globalMute: boolean; 
  setGlobalMute: (v: boolean) => void;
  setMusicData: (data: MusicData | null) => void;
  playingMusicId: string | null;
}) => {
  const [post, setPost] = useState(initialPost);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [imgExpandedIndex, setImgExpandedIndex] = useState<number | null>(null);
  const [videoFullscreen, setVideoFullscreen] = useState(false);
  const [fsPlaying, setFsPlaying] = useState(true);
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
  const [likeHearts, setLikeHearts] = useState<{id: number, x: number, delay: number, size: number}[]>([]);

  const isMusicActive = playingMusicId === post.id;

  const imagesList = post.images?.length ? post.images : (post.image ? [post.image] : []);

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
    setGlobalMute(!globalMute);
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
       const newHearts = Array.from({ length: 12 }).map((_, i) => ({
         id: Date.now() + i,
         x: Math.random() * 80 - 40, // spread around the button
         delay: Math.random() * 0.4,
         size: 10 + Math.random() * 14
       }));
       setLikeHearts(newHearts);
       setTimeout(() => setLikeHearts([]), 1500);
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

  return (
    <>
      <div ref={postRef} className={`bg-[#111111]/90 md:backdrop-blur-xl shadow-xl border rounded-[24px] transition-transform duration-300 will-change-transform relative ${post.pinned ? "border-[#CB2729]/20" : "border-white/[0.04]"}`}>
        
        {/* Post Header */}
        <div className="flex items-center gap-2.5 px-5 pt-5 pb-3">
          <div className="w-9 h-9 rounded-full bg-[#CB2729]/10 border border-[#CB2729]/20 flex items-center justify-center shrink-0">
             <span className="text-[#CB2729] font-black text-base">S</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-bold text-white tracking-wide">
              Sujan Gautam 
              {post.textLayout === 'quote' && <span className="opacity-40 font-normal"> . thought</span>}
              {post.linkPreview && <span className="opacity-40 font-normal"> . shipped</span>}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-[11px] text-white/40">{timeAgo(post.createdAt)}</p>
              {post.musicVideoId && (
                <>
                  <span className="text-[10px] text-white/30">•</span>
                  <div 
                    className="flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (isMusicActive) setMusicData(null);
                      else setMusicData({ id: post.id, videoId: post.musicVideoId!, startTime: post.musicStartTime || 0, endTime: post.musicEndTime || undefined });
                    }}
                  >
                    <Music size={10} className={isMusicActive ? "text-[#CB2729] animate-pulse" : "text-white/50"} />
                    <p className="text-[10px] text-white/60 truncate max-w-[120px] font-medium">{post.musicTitle || "Original Audio"}</p>
                    {isMusicActive && (
                      <div className="flex items-end gap-[1px] h-2 ml-0.5">
                        {[0.3, 0.7, 1, 0.5].map((h, i) => (
                          <div key={i} className="w-[1.5px] bg-[#CB2729] rounded-t-sm origin-bottom" style={{ height: `${h * 100}%`, animation: `music-bar ${0.3 + (i * 0.1)}s ease-in-out infinite alternate` }} />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
          {post.pinned && (
            <div className="flex items-center gap-1.5 bg-[#CB2729]/10 border border-[#CB2729]/25 rounded-full px-3 py-1">
              <Pin size={10} className="text-[#CB2729]" />
              <span className="text-[10px] text-[#CB2729] font-bold uppercase tracking-wider">Pinned</span>
            </div>
          )}
        </div>

        {/* Content */}
        {post.content && (
          post.textLayout === "quote" ? (
             <div className="px-12 pb-12 pt-6 relative flex flex-col items-center justify-center text-center">
               <div className="absolute top-0 left-10 select-none opacity-[0.14] transform -translate-y-4">
                 <span className="text-[#7c83fd] text-[120px] font-serif leading-none" style={{ fontFamily: 'Georgia, serif' }}>“</span>
               </div>
               <div className="relative z-10">
                 <div className="font-['Caveat'] text-white text-[28px] md:text-[32px] leading-[1.25] font-bold tracking-tight">
                    <SmartText text={post.content} />
                 </div>
               </div>
               <div className="absolute inset-0 bg-gradient-to-br from-[#7c83fd]/[0.05] via-transparent to-transparent pointer-events-none rounded-[32px]" />
            </div>
          ) : (
            (post.linkPreview?.url !== post.content.trim()) && (
              <div className="px-5 pb-3 text-white/80 text-[13px] leading-snug whitespace-pre-wrap">
                <SmartText text={post.content} />
              </div>
            )
          )
        )}

        {/* Link Preview */}
        {post.linkPreview && post.linkPreview.url && (
          <div className="px-5 pb-4">
            <a 
              href={post.linkPreview.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="group/link block bg-white/[0.03] border border-white/[0.08] rounded-2xl overflow-hidden hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 shadow-lg"
            >
              <div className="flex items-center p-3 gap-4">
                {/* Preview Image */}
                <div className="shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-[#CB2729] to-[#6a1516] flex items-center justify-center border border-white/[0.05]">
                  {post.linkPreview.image ? (
                    <img src={post.linkPreview.image} alt="" className="w-full h-full object-cover group-hover/link:scale-110 transition-transform duration-700" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-40 group-hover/link:opacity-60 transition-opacity">
                       {/* Default brand icon or placeholder */}
                       <div className="w-10 h-10 rounded-lg bg-white/10" />
                    </div>
                  )}
                </div>

                {/* Preview Info */}
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1.5 truncate">
                    {post.linkPreview.domain || (post.linkPreview.url ? new URL(post.linkPreview.url).hostname.replace('www.', '').toUpperCase() : "EXTERNAL LINK")}
                  </p>
                  <h3 className="text-[14px] font-bold text-white leading-tight mb-1 group-hover/link:text-[#CB2729] transition-colors line-clamp-2">
                    {post.linkPreview.title || (post.linkPreview.url ? new URL(post.linkPreview.url).pathname.split('/').pop() : "Shared Link")}
                  </h3>
                  <p className="text-[11px] text-white/50 leading-snug line-clamp-2">
                    {post.linkPreview.description || "Click to visit this site and explore more content."}
                  </p>
                </div>
              </div>
            </a>
          </div>
        )}

        {/* Video / Reel — tap to open fullscreen */}
        {(post.type === "video" || post.type === "reel") && post.videoUrl && (
          <div
            className="relative mb-3 overflow-hidden rounded-[20px] bg-black cursor-pointer group/reel"
            onClick={openFullscreen}
          >
            {/* Inline preview (muted, autoplay, no controls) */}
            <video
              ref={videoRef}
              src={post.videoUrl}
              loop
              playsInline
              muted
              autoPlay
              className="w-full object-cover bg-black pointer-events-none"
              style={{maxHeight:'34vh'}}
            />
            {/* Tap-to-expand hint visible on hover only, no play icon */}
            <div className="absolute inset-0 bg-black/0 group-hover/reel:bg-black/10 transition-all duration-200 pointer-events-none" />
            {/* Caption strip */}
            {post.caption && (
              <div className="absolute bottom-0 left-0 right-0 px-4 py-2.5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                <p className="text-white/80 text-[11px] font-medium truncate">{post.caption}</p>
              </div>
            )}
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


        {/* Image / Carousel / Polaroid */}
        {post.type === "image" && imagesList.length > 0 && (
          <div className="w-full relative group">
            {post.imageLayout === "polaroid" ? (
              <PolaroidLayout images={imagesList} captions={post.imageCaptions} onExpand={setImgExpandedIndex} />
            ) : (
              <div className="relative mx-2.5 mb-3 overflow-hidden rounded-[18px] border border-white/[0.04]">
                <div 
                  className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                  {imagesList.map((img, i) => (
                    <div key={i} className="min-w-full flex justify-center bg-[#111]" onClick={() => setImgExpandedIndex(i)}>
                      <img src={img} alt="" className="w-full object-cover cursor-zoom-in" style={{maxHeight:'32vh'}} />
                    </div>
                  ))}
                </div>
                
                {imagesList.length > 1 && (
                   <>
                     <button onClick={(e) => { e.stopPropagation(); setActiveIndex(p => (p - 1 + imagesList.length) % imagesList.length) }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 shadow-lg border border-white/10 z-10">
                       <ChevronLeft size={18} />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); setActiveIndex(p => (p + 1) % imagesList.length) }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 shadow-lg border border-white/10 z-10">
                       <ChevronRight size={18} />
                     </button>
                     <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 p-2 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xl">
                       {imagesList.map((_, i) => (
                         <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
                       ))}
                     </div>
                   </>
                )}
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

        {/* ── Unified Action + Comment Row ── */}
        <div className="px-4 pt-1 pb-3 space-y-3">

          {/* Action pill row */}
          <div className="flex items-center gap-1.5">
            {/* React button */}
            <button
              onClick={() => handleReact("like")}
              className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-[#CB2729]/15 border border-white/[0.05] hover:border-[#CB2729]/30 text-white/50 hover:text-[#CB2729] transition-all text-[11px] font-medium"
            >
              <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-1 pointer-events-none w-0 h-0 overflow-visible z-50">
                {likeHearts.map(h => (
                  <div key={h.id} className="absolute animate-[float-heart_1.2s_ease-out_forwards]" style={{ left:`${h.x}px`, animationDelay:`${h.delay}s`, bottom:'0' }}>
                    <div className="animate-[side-sway_1s_ease-in-out_infinite alternate]">
                      <Heart size={h.size} className="text-[#CB2729] fill-[#CB2729]/80" />
                    </div>
                  </div>
                ))}
              </div>
              <Heart size={11} className={totalReacts > 0 ? "fill-[#CB2729] text-[#CB2729]" : ""} />
              <span>{totalReacts > 0 ? totalReacts : "Like"}</span>
            </button>

            {/* Comment count pill */}
            <div 
              onClick={() => setCommentsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] transition-colors cursor-pointer border border-white/[0.05] text-white/40 hover:text-white/70 text-[11px] font-medium"
            >
              <MessageCircle size={11} />
              <span>{post.comments?.length || 0}</span>
            </div>

            {/* Share */}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.05] text-white/40 hover:text-white/70 transition-all text-[11px] font-medium"
            >
              <Share2 size={11} />
              <span>{post.shares || 0}</span>
            </button>

            {/* Views */}
            <div className="flex items-center gap-1 px-2.5 py-1.5 text-white/20 text-[10px] ml-auto">
              <Eye size={10} /> {post.views || 0}
            </div>

            {/* Music volume control – only when post has music */}
            {post.musicVideoId && (
              <button
                onClick={() => setGlobalMute(!globalMute)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                  globalMute
                    ? 'bg-white/[0.04] border-white/[0.05] text-white/30 hover:text-white/60'
                    : 'bg-[#CB2729]/10 border-[#CB2729]/25 text-[#CB2729]'
                }`}
              >
                {globalMute ? <VolumeX size={11} /> : <Volume2 size={11} />}
              </button>
            )}
          </div>

          {/* Comments */}
          <CommentSection post={post} onUpdate={setPost} showAlert={showAlert} openOverride={commentsOpen} setOpenOverride={setCommentsOpen} />
        </div>
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
  const [globalMute, setGlobalMute] = useState(false);
  const [musicData, setMusicData] = useState<MusicData | null>(null);
  const [ytPlayer, setYtPlayer] = useState<any>(null);

  useEffect(() => {
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
      className="h-screen w-full text-white font-sans overflow-y-auto snap-y snap-mandatory scroll-smooth relative no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      
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
      <div className="max-w-6xl mx-auto w-full pb-36 px-4 pt-16 relative">
        {/* Refined Silky Timeline */}
        <div className="absolute left-[24px] md:left-1/2 top-0 bottom-0 w-12 -translate-x-1/2 z-0 pointer-events-none">
           <svg width="100%" height="100%" className="opacity-10">
             <path 
               d="M 24 0 Q 34 200 14 400 Q 34 600 14 800 Q 34 1000 24 1200" 
               fill="none" 
               stroke="#CB2729" 
               strokeWidth="2" 
               strokeLinecap="round"
             />
           </svg>

           {/* Tiny Drifting Sparkles */}
           {[...Array(5)].map((_, i) => (
             <div 
               key={i}
               className="absolute w-1 h-1 bg-white/40 rounded-full"
               style={{ 
                 left: '50%',
                 top: `${20 * i}%`,
                 animation: `sparkle-drift ${4 + i}s ease-in-out infinite`,
                 animationDelay: `${i}s`
               }}
             />
           ))}
        </div>
        
        {/* Viewport Focus Glow - Simplified for performance */}
        <div className="fixed top-1/2 left-[24px] md:left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-[#CB2729]/5 blur-[40px] rounded-full pointer-events-none z-0 hidden md:block" />

        {loading ? (
          Array(2).fill(0).map((_, i) => (
             <div key={i} className="h-screen flex items-center justify-center snap-start w-full px-4">
                <div className="w-full md:w-[460px] lg:w-[520px] space-y-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-full opacity-20" />
                    <div className="space-y-2">
                       <Skeleton className="h-4 w-32 opacity-20" />
                       <Skeleton className="h-3 w-16 opacity-10" />
                    </div>
                  </div>
                  <Skeleton className="h-64 w-full rounded-3xl opacity-10" />
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full opacity-10" />
                    <Skeleton className="h-4 w-2/3 opacity-10" />
                  </div>
                  <div className="flex gap-4 pt-2">
                    {[1,2,3].map(j => <Skeleton key={j} className="h-6 w-12 rounded-full opacity-10" />)}
                  </div>
                </div>
             </div>
          ))
        ) : posts.length === 0 ? (
          <div className="h-screen w-full flex flex-col items-center justify-center text-white/20 text-xs uppercase tracking-[0.3em] font-medium pt-24 snap-start">No posts here yet</div>
        ) : (
          posts.map((post, idx) => {
            const isEven = idx % 2 === 0;
            return (
              <div id={`post-${post.id}`} key={post.id} className={`relative flex items-center w-full h-[100dvh] snap-start snap-always ${isEven ? 'md:justify-start' : 'md:justify-end'}`}>
                 
                 {/* Glowing Gem Node - Hide on mobile */}
                 <div className="absolute left-[24px] md:left-1/2 top-1/2 -mt-12 -translate-y-1/2 -translate-x-1/2 z-0 hidden md:block">
                    <div className="relative group animate-[gem-wobble_5s_ease-in-out_infinite]">
                       {/* Subtle Glow Radius */}
                       <div className="absolute inset-0 bg-[#CB2729]/10 blur-lg rounded-full scale-150" />
                       
                       {/* The Gem */}
                       <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-[#CB2729] to-[#ff4d4d] border border-white/30 shadow-[0_2px_10px_rgba(203,39,41,0.3)] flex items-center justify-center group-hover:scale-125 transition-all duration-500">
                          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                       </div>

                       {/* Tiny Floating Accessory Icon (Hidden on mobile) */}
                       <div className="absolute -top-3 -right-3 hidden md:block opacity-0 group-hover:opacity-100 transition-opacity">
                          <Heart size={10} className="text-[#CB2729] fill-[#CB2729]" />
                       </div>
                    </div>
                </div>

                {/* Minimalist Curved Connector */}
                <div className={`hidden md:block absolute top-1/2 -mt-12 w-24 lg:w-40 h-8 pointer-events-none opacity-20
                  ${isEven ? 'right-[50%] translate-x-2' : 'left-[50%] -translate-x-2'}
                `}>
                   <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
                      <path 
                        d={isEven ? "M 100 10 Q 70 0 0 10" : "M 0 10 Q 30 0 100 10"} 
                        fill="none" 
                        stroke="#CB2729" 
                        strokeWidth="1.5" 
                      />
                   </svg>
                </div>
                 
                 {/* Lifted card container - Centered on mobile without timeline margin */}
                 <div className={`w-full max-w-[94%] md:max-w-none relative mx-auto ${isEven ? 'md:ml-0 md:mr-16 lg:mr-24' : 'md:mr-0 md:ml-16 lg:ml-24'} md:w-[460px] lg:w-[520px] group`} style={{maxHeight:`calc(100dvh - 90px)`}}>
                    <div className="relative z-10 overflow-y-auto rounded-[24px] will-change-scroll transition-transform duration-500 group-hover:scale-[1.02] group-hover:-translate-y-1" style={{maxHeight:`calc(100dvh - 90px)`, scrollbarWidth:`none`}}>
                       <PostCard 
                         post={post} 
                         showAlert={setAlertMessage} 
                         globalMute={globalMute} 
                         setGlobalMute={setGlobalMute} 
                         setMusicData={setMusicData}
                         playingMusicId={musicData?.id || null}
                       />
                    </div>
                    {/* Shadow Decor */}
                    <div className="absolute -inset-4 bg-white/[0.01] blur-3xl rounded-[40px] -z-10 group-hover:bg-[#CB2729]/[0.03] transition-colors duration-500" />
                 </div>
              </div>
            );
          })
        )}
      </div>


      {/* Global Shared YouTube Player (Fast Audio Switching) */}
      <div className="hidden pointer-events-none overflow-hidden h-0 w-0">
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
          onEnd={() => setMusicData(null)}
          onError={() => setMusicData(null)}
        />
      </div>
    </div>
  );
};

export default Feed;


