import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Plus, Trash2, Pencil, Image as ImageIcon, Eye, MessageSquare, 
  BarChart3, Loader2, X, Sparkles, UserCheck, Smartphone, 
  Search, Lock, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { storiesDB, StoryItem } from "@/lib/adminData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminStoryList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<StoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyticsStory, setAnalyticsStory] = useState<StoryItem | null>(null);

  const loadData = () => {
    setLoading(true);
    storiesDB.getAll().then(res => {
      setData(res.sort((a, b) => new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime()));
      setLoading(false);
    });
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    await storiesDB.delete(id);
    toast.success("Story deleted");
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-inter max-w-7xl mx-auto pb-24 px-4 sm:px-6">
      
      {/* ── Top Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Stories</h1>
          <p className="text-base text-slate-500 font-medium">Create and manage your interactive story updates.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input type="text" placeholder="Search stories..." className="h-11 pl-10 pr-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-slate-900 transition-all outline-none w-64 shadow-sm" />
          </div>
          <Button
            onClick={() => navigate("/admin/story/add")}
            className="bg-slate-900 hover:bg-black text-white font-bold rounded-xl px-6 h-11 text-sm transition-all shadow-lg shadow-slate-200 active:scale-95 flex items-center gap-2"
          >
            <Plus size={18} strokeWidth={3} /> New Story
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-slate-200" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">Synchronizing Library</p>
          </div>
        </div>
      ) : data.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center gap-4 bg-white border-2 border-dashed border-slate-100 rounded-[32px]">
          <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center text-slate-200">
             <ImageIcon size={32} />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-slate-900">Your story library is empty</p>
            <p className="text-sm text-slate-400 mt-1">Start by creating a visual experience for your visitors.</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/admin/story/add")} className="mt-4 rounded-xl border-slate-200 font-bold hover:bg-slate-50">
            Get Started
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
          {data.map(story => (
            <div key={story.id} className="group relative flex flex-col">
              {/* Card Container */}
              <div className="aspect-[9/16] rounded-[28px] overflow-hidden border border-slate-100 shadow-xl shadow-slate-200/50 bg-slate-50 relative isolate transition-all duration-500 hover:-translate-y-2">
                
                {/* Background Image / Placeholder */}
                {story.image ? (
                   <img src={story.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                ) : (
                   <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300">
                      <ImageIcon size={32} strokeWidth={1.5} />
                   </div>
                )}

                {/* Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity" />
                
                {/* Top Status & Quick Stats */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-auto">
                   <div className="flex gap-2">
                     {story.isMembersOnly && (
                        <div className="h-6 px-2.5 rounded-full bg-blue-500/90 backdrop-blur-md text-[9px] font-black text-white flex items-center gap-1 shadow-lg">
                           <Lock size={10} strokeWidth={3} /> MEMBERS
                        </div>
                     )}
                     {!story.active && (
                         <div className="h-6 px-2.5 rounded-full bg-slate-900/90 backdrop-blur-md text-[9px] font-black text-white flex items-center shadow-lg">
                            DRAFT
                         </div>
                     )}
                   </div>
                   <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/story/edit/${story.id}`); }} className="w-8 h-8 rounded-xl bg-white shadow-xl flex items-center justify-center text-slate-900 transition-transform active:scale-90 hover:bg-slate-50">
                        <Pencil size={14} strokeWidth={2.5} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(story.id); }} className="w-8 h-8 rounded-xl bg-white shadow-xl flex items-center justify-center text-red-500 transition-transform active:scale-90 hover:bg-red-50">
                        <Trash2 size={14} strokeWidth={2.5} />
                      </button>
                   </div>
                </div>

                {/* Bottom Story Info */}
                <div className="absolute bottom-6 left-6 right-6 z-10 pointer-events-auto">
                   <p className="text-sm font-black text-white leading-tight truncate mb-3 drop-shadow-md">{story.title || "Untitled Moment"}</p>
                   <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Views</span>
                            <span className="text-xs font-black text-white">{story.views || 0}</span>
                         </div>
                         <div className="w-px h-6 bg-white/10" />
                         <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Replies</span>
                            <span className="text-xs font-black text-white">{story.comments?.length || 0}</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => setAnalyticsStory(story)}
                        className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white hover:text-black transition-all"
                      >
                         <BarChart3 size={16} />
                      </button>
                   </div>
                </div>

                {/* Mobile Tap Target */}
                <div className="absolute inset-0 z-0 sm:hidden" onClick={() => navigate(`/admin/story/edit/${story.id}`)} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── High-End Analytics Modal ── */}
      {analyticsStory && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setAnalyticsStory(null)} />
          <div className="relative bg-white w-full sm:max-w-4xl rounded-t-[40px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-10">
            
            {/* Modal Header */}
            <div className="h-20 border-b border-slate-100 flex items-center justify-between px-8 sm:px-10 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-[18px] bg-white border border-slate-200 overflow-hidden shadow-sm">
                   {analyticsStory.image ? <img src={analyticsStory.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-100" />}
                 </div>
                 <div>
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">{analyticsStory.title || "Story Insights"}</h3>
                   <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Performance Dashboard</span>
                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                      <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                        <Sparkles size={10} /> Live Data
                      </span>
                   </div>
                 </div>
              </div>
              <button onClick={() => setAnalyticsStory(null)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-black rounded-2xl transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-10 space-y-10 scrollbar-none">
              
              {/* Top Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                 {[
                   { label: "Total Views", val: analyticsStory.views || 0, icon: <Eye size={18}/>, color: "bg-blue-50 text-blue-600" },
                   { label: "Active Replies", val: analyticsStory.comments?.length || 0, icon: <MessageSquare size={18}/>, color: "bg-purple-50 text-purple-600" },
                   { label: "Reactions", val: Object.values(analyticsStory.reacts || {}).reduce((a:any,b:any)=>a+b,0), icon: <Sparkles size={18}/>, color: "bg-orange-50 text-orange-600" },
                   { label: "Channel", val: "Mobile", icon: <Smartphone size={18}/>, color: "bg-slate-50 text-slate-600" }
                 ].map((stat, i) => (
                    <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] flex flex-col gap-3">
                       <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shadow-sm", stat.color)}>
                          {stat.icon}
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                          <p className="text-2xl font-black text-slate-900 mt-0.5">{stat.val}</p>
                       </div>
                    </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                
                {/* Reactions Breakdown */}
                <div className="lg:col-span-1 space-y-6">
                  <p className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full" />
                    Emotional Resonance
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {Object.entries(analyticsStory.reacts || { heart: 0, fire: 0, laugh: 0 }).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-3">
                           <span className="text-2xl">{type === "heart" ? "❤️" : type === "fire" ? "🔥" : "😂"}</span>
                           <span className="text-sm font-bold text-slate-700 capitalize">{type}</span>
                        </div>
                        <span className="text-lg font-black text-slate-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Replies Feed */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                     <p className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                        Engagement Feed
                     </p>
                     <span className="text-[10px] font-bold text-slate-400">Chronological</span>
                  </div>
                  <div className="space-y-4">
                    {analyticsStory.comments && analyticsStory.comments.length > 0 ? (
                      analyticsStory.comments.map((c: any, i: number) => (
                        <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[28px] relative overflow-hidden group hover:bg-white transition-colors border-l-4 border-l-purple-400 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-300 shadow-sm">
                                <UserCheck size={18} />
                              </div>
                              <div>
                                <span className="text-sm font-black text-slate-900">Verified Interaction</span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Identity Hidden for Privacy</p>
                              </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-slate-900">{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(c.createdAt).toLocaleDateString()}</p>
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 font-medium leading-relaxed pl-1">{c.text || c.content}</p>
                          <div className="mt-4 flex items-center gap-3">
                            <div className="h-6 px-2.5 rounded-full bg-white border border-slate-100 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase shadow-sm">
                               <Smartphone size={10} /> {c.device?.split(" ")[0] || "MOBILE"}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-24 flex flex-col items-center justify-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
                        <Sparkles size={32} className="text-slate-200 mb-4 animate-pulse" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Silence is golden</p>
                        <p className="text-xs text-slate-400 mt-1">No replies recorded for this story yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStoryList;
