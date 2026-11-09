import React from "react";
import { feedAPI, FeedPost } from "@/lib/adminData";
import { getVoterId } from "@/lib/feedUtils";

export const PollCard = ({ post, onUpdate, showAlert }: { post: FeedPost; onUpdate: (p: FeedPost) => void, showAlert: (msg: string) => void }) => {
  const voterId = getVoterId();
  const hasVoted = post.pollOptions?.some(o => o.voters?.includes(voterId));
  const totalVotes = (post.pollOptions || []).reduce((a, o) => a + (o.votes || 0), 0);
  const expired = post.pollEndsAt ? new Date(post.pollEndsAt) < new Date() : false;

  const vote = async (optionId: string) => {
    if (hasVoted || expired) return;
    try {
      const updated = await feedAPI.votePoll(post.id, optionId, voterId);
      if (updated) {
        onUpdate(updated);
        const opt = post.pollOptions?.find(o => (o.id || (o as any)._id) === optionId);
        (window as any).reportActivity?.('poll_vote', `Voted on post poll: ${post.pollQuestion || 'Feed Poll'}`, `Option: ${opt?.label || optionId}`);
      }
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
                  className="absolute inset-y-0 left-0 bg-[#ff3b30]/20 transition-all duration-1000 ease-expo" 
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
