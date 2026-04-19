import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, Image as ImageIcon, Eye, MessageSquare, BarChart3, Loader2, X, Sparkles, UserCheck, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { storiesDB, StoryItem } from "@/lib/adminData";
import { toast } from "sonner";

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
    <div className="space-y-5 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Stories</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your featured story updates</p>
        </div>
        <Button
          onClick={() => navigate("/admin/story/add")}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 text-sm transition-all"
        >
          <Plus size={16} className="mr-1.5" /> New Story
        </Button>
      </div>

      {loading ? (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : data.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 bg-white border border-dashed border-slate-200 rounded-lg">
          <ImageIcon size={32} className="text-slate-300" />
          <p className="text-sm text-slate-400">No stories found</p>
          <Button variant="ghost" onClick={() => navigate("/admin/story/add")} className="text-sm text-slate-600 hover:text-slate-900">
            Create your first story
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.map(story => (
            <div key={story.id} className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="aspect-[10/14] overflow-hidden relative bg-slate-100">
                {story.image
                  ? <img src={story.image} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={28} className="text-slate-300" /></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Actions */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setAnalyticsStory(story)}
                    className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
                  >
                    <BarChart3 size={14} />
                  </button>
                  <button
                    onClick={() => navigate(`/admin/story/edit/${story.id}`)}
                    className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(story.id)}
                    className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-red-600 shadow-sm transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Info */}
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-medium text-white truncate mb-1">{story.title || "Untitled"}</p>
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="flex items-center gap-1"><Eye size={11} /> {story.views || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={11} /> {story.comments?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analytics Modal */}
      {analyticsStory && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="h-14 border-b border-slate-100 flex items-center justify-between px-6">
              <div>
                <p className="text-sm font-semibold text-slate-900">Story Insights</p>
                <p className="text-xs text-slate-500 mt-0.5">{analyticsStory.title}</p>
              </div>
              <button onClick={() => setAnalyticsStory(null)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Performance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-500 mb-1"><Eye size={12} /><span className="text-xs font-medium">Views</span></div>
                      <p className="text-2xl font-semibold text-slate-900">{analyticsStory.views || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-500 mb-1"><MessageSquare size={12} /><span className="text-xs font-medium">Replies</span></div>
                      <p className="text-2xl font-semibold text-slate-900">{analyticsStory.comments?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Reactions</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(analyticsStory.reacts || { heart: 0, fire: 0, laugh: 0 }).map(([type, count]) => (
                      <div key={type} className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-lg mb-1">{type === "heart" ? "❤️" : type === "fire" ? "🔥" : "😂"}</span>
                        <span className="text-sm font-semibold text-slate-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Recent Replies</p>
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">Live</span>
                </div>
                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {analyticsStory.comments && analyticsStory.comments.length > 0 ? (
                    analyticsStory.comments.map((c: any, i) => (
                      <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                              <UserCheck size={12} className="text-slate-500" />
                            </div>
                            <span className="text-xs font-medium text-slate-700">Anonymous</span>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-8">{c.text || c.content}</p>
                        <div className="flex items-center gap-2 pl-8">
                          <span className="flex items-center gap-1 text-xs text-slate-400"><Smartphone size={10} /> {c.device?.split(" ")[0] || "Mobile"}</span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Sparkles size={24} className="opacity-40" />
                      <p className="text-sm">No replies yet</p>
                    </div>
                  )}
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
