export const timeAgo = (dateStr: string) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
};

const VOTER_ID_KEY = "feed_voter_id";
export const getVoterId = () => {
  if (typeof window === 'undefined') return "";
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) { id = Math.random().toString(36).slice(2); localStorage.setItem(VOTER_ID_KEY, id); }
  return id;
};
