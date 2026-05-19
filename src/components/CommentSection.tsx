import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, MessageCircle, Send, Loader2 } from "lucide-react";
import { feedAPI, FeedPost } from "@/lib/adminData";

import { timeAgo, getVoterId } from "@/lib/feedUtils";

export const CommentSection = ({ post, onUpdate, showAlert, openOverride, setOpenOverride }: { post: FeedPost; onUpdate: (p: FeedPost) => void, showAlert: (msg: string) => void, openOverride?: boolean, setOpenOverride?: (v: boolean) => void }) => {
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
            className="w-full max-w-[500px] h-[80vh] bg-[#0a0a0a] rounded-t-[32px] border-t border-x border-white/10 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom duration-500 ease-expo"
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
