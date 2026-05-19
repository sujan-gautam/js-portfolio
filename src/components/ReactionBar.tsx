import React, { useState } from "react";
import { Heart } from "lucide-react";
import { FeedPost } from "@/lib/adminData";

export const REACTIONS: Record<string, { emoji: string; label: string; color: string }> = {
  heart: { emoji: "❤️", label: "Love", color: "text-red-500" },
  fire:  { emoji: "🔥", label: "Fire", color: "text-orange-500" },
  like:  { emoji: "❤️", label: "Like", color: "text-red-500" },
  wow:   { emoji: "😮", label: "Wow",  color: "text-yellow-400" },
  sad:   { emoji: "😢", label: "Sad",  color: "text-indigo-400" },
};

export const ReactionBar = ({ post, onReact }: { post: FeedPost; onReact: (type: string) => void }) => {
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
