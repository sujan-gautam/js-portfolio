import { useState, useEffect } from "react";
import { blogIdeasDB, BlogIdea, generateId } from "@/lib/adminData";
import { 
  Plus, Trash2, Edit2, Search, Lightbulb, 
  ExternalLink, FileText, Lock, Globe, 
  MoreVertical, CheckCircle2, Circle, Clock,
  PlusCircle, BookOpen, MessageSquare, Tag,
  Layout, Save, X, Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminBlogIdeaBoard = () => {
  const [ideas, setIdeas] = useState<BlogIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [editingIdea, setEditingIdea] = useState<Partial<BlogIdea> | null>(null);

  const loadIdeas = async () => {
    setLoading(true);
    try {
      const data = await blogIdeasDB.getAll();
      setIdeas(data.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
    } catch { setIdeas([]); }
    setLoading(false);
  };

  useEffect(() => { loadIdeas(); }, []);

  const saveIdea = async () => {
    if (!editingIdea?.title) return;
    try {
      if (editingIdea.id) {
        await blogIdeasDB.update(editingIdea.id, { ...editingIdea, updatedAt: new Date().toISOString() });
        toast.success("Idea updated");
      } else {
        const newIdea = {
          ...editingIdea,
          id: generateId(),
          status: editingIdea.status || "Idea",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          references: editingIdea.references || [],
          emotions: editingIdea.emotions || [],
          isPrivate: editingIdea.isPrivate ?? true
        } as BlogIdea;
        await blogIdeasDB.create(newIdea);
        toast.success("Idea captured");
      }
      setEditingIdea(null);
      loadIdeas();
    } catch { toast.error("Failed to save idea"); }
  };

  const deleteIdea = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await blogIdeasDB.delete(id);
    toast.success("Idea discarded");
    loadIdeas();
  };

  const filteredIdeas = ideas.filter(i => 
    !search || 
    i.title.toLowerCase().includes(search.toLowerCase()) || 
    i.notes?.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Idea": return <Lightbulb size={14} className="text-amber-500" />;
      case "Researching": return <Search size={14} className="text-blue-500" />;
      case "Writing": return <Edit2 size={14} className="text-indigo-500" />;
      case "Published": return <CheckCircle2 size={14} className="text-emerald-500" />;
      default: return <Circle size={14} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Idea": return "bg-amber-50 text-amber-700 border-amber-200";
      case "Researching": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Writing": return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "Published": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Idea & Research Board</h1>
          <p className="text-sm text-slate-500 mt-1">Capture raw thoughts and build your research foundation</p>
        </div>
        <Button
          onClick={() => setEditingIdea({ title: "", notes: "", status: "Idea", emotions: [], references: [] })}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg h-10 transition-all text-sm"
        >
          <Plus size={18} className="mr-1.5" /> New Idea
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Main Ideas List */}
        <div className="md:col-span-8 space-y-4">
          <Card className="bg-white border-slate-200 shadow-none overflow-hidden rounded-xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{filteredIdeas.length} Active Thoughts</span>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  placeholder="Filter ideas..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-700 focus:border-indigo-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredIdeas.map(idea => (
                <div key={idea.id} className="p-6 hover:bg-slate-50/50 transition-all group relative">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5",
                          getStatusColor(idea.status)
                        )}>
                          {getStatusIcon(idea.status)} {idea.status}
                        </span>
                        {idea.isPrivate ? <Lock size={12} className="text-slate-300" /> : <Globe size={12} className="text-emerald-400" />}
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                        {idea.title}
                      </h3>
                      {idea.notes && <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">{idea.notes}</p>}
                      
                      <div className="flex items-center gap-4 pt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <BookOpen size={14} />
                          <span>{idea.references?.length || 0} references</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                          <Clock size={14} />
                          <span>Last updated {new Date(idea.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setEditingIdea(idea)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => deleteIdea(idea.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Idea Editor (Sidebar/Modal-ish) */}
        <div className="md:col-span-4">
          {editingIdea ? (
            <Card className="bg-white border-indigo-200 shadow-lg shadow-indigo-500/5 p-6 rounded-xl space-y-6 sticky top-24 border-2">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                  <PlusCircle size={16} /> {editingIdea.id ? "Evolve Idea" : "Capture Idea"}
                </h2>
                <button onClick={() => setEditingIdea(null)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Title</Label>
                  <Input 
                    value={editingIdea.title} 
                    onChange={e => setEditingIdea({...editingIdea, title: e.target.value})}
                    placeholder="The core concept..."
                    className="border-slate-200 focus:border-indigo-500 h-10 font-bold"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Raw Notes</Label>
                  <textarea 
                    value={editingIdea.notes}
                    onChange={e => setEditingIdea({...editingIdea, notes: e.target.value})}
                    placeholder="Free-flow thoughts, key points..."
                    className="w-full h-32 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div>
                  <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Phase</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["Idea", "Researching", "Writing", "Published"].map(status => (
                      <button
                        key={status}
                        onClick={() => setEditingIdea({...editingIdea, status: status as any})}
                        className={cn(
                          "py-2 px-1 text-[10px] font-bold uppercase rounded-lg border transition-all",
                          editingIdea.status === status ? "bg-indigo-600 border-indigo-600 text-white" : "bg-white border-slate-100 text-slate-500"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                   <div className="flex items-center justify-between mb-3">
                      <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">References</Label>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 text-[10px] font-bold text-indigo-600 uppercase"
                        onClick={() => setEditingIdea({...editingIdea, references: [...(editingIdea.references || []), { title: "", url: "", type: "link" }]})}
                      >
                        Add Link
                      </Button>
                   </div>
                   <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {editingIdea.references?.map((ref, idx) => (
                        <div key={idx} className="flex flex-col gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 relative group/ref">
                          <input 
                            placeholder="Title"
                            value={ref.title}
                            onChange={e => {
                              const newRefs = [...editingIdea.references!];
                              newRefs[idx].title = e.target.value;
                              setEditingIdea({...editingIdea, references: newRefs});
                            }}
                            className="bg-transparent border-none text-[11px] font-bold text-slate-700 outline-none p-0"
                          />
                          <input 
                            placeholder="URL (optional)"
                            value={ref.url}
                            onChange={e => {
                              const newRefs = [...editingIdea.references!];
                              newRefs[idx].url = e.target.value;
                              setEditingIdea({...editingIdea, references: newRefs});
                            }}
                            className="bg-transparent border-none text-[10px] text-indigo-500 outline-none p-0"
                          />
                          <button 
                            className="absolute right-2 top-2 opacity-0 group-hover/ref:opacity-100 text-slate-400 hover:text-red-500"
                            onClick={() => {
                              const newRefs = [...editingIdea.references!];
                              newRefs.splice(idx, 1);
                              setEditingIdea({...editingIdea, references: newRefs});
                            }}
                          >
                            <Trash size={12} />
                          </button>
                        </div>
                      ))}
                      {(!editingIdea.references || editingIdea.references.length === 0) && (
                        <div className="text-center py-4 border-2 border-dashed border-slate-100 rounded-lg">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">No References Yet</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                  <button 
                    onClick={() => setEditingIdea({...editingIdea, isPrivate: !editingIdea.isPrivate})}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border text-[10px] font-bold uppercase transition-all",
                      editingIdea.isPrivate ? "bg-slate-50 border-slate-200 text-slate-500" : "bg-emerald-50 border-emerald-200 text-emerald-600"
                    )}
                  >
                    {editingIdea.isPrivate ? <Lock size={12} /> : <Globe size={12} />}
                    {editingIdea.isPrivate ? "Private" : "Public"}
                  </button>
                  <Button onClick={saveIdea} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-lg shadow-indigo-100">
                    <Save size={16} className="mr-2" /> Save Thought
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <Card className="bg-slate-50 border-dashed border-2 border-slate-200 p-8 rounded-xl flex flex-col items-center justify-center text-center space-y-4 sticky top-24">
              <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Lightbulb size={24} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Thought Reservoir</h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">Select an idea to evolve it, or capture a new spark to begin your next narrative journey.</p>
              </div>
              <Button 
                onClick={() => setEditingIdea({ title: "", notes: "", status: "Idea", emotions: [], references: [] })}
                variant="outline" 
                className="bg-white border-slate-200 text-slate-600 font-bold"
              >
                Spark New Idea
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogIdeaBoard;
