import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE, YT_KEYS } from "@/config";
import { Plus, Image as ImageIcon, Music, Loader2, ArrowLeft, Search, X, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { storiesDB, StoryItem, StoryLayer } from "@/lib/adminData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import YouTube from "react-youtube";
import { AIRefineButton } from "@/components/admin/AIRefineButton";

const AdminStoryEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [item, setItem] = useState<Partial<StoryItem>>({
    active: true, allowComments: true, layers: [], title: "", duration: 5000, filter: "none", views: 0
  });

  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dragInfo, setDragInfo] = useState<{ id: string; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    storiesDB.getAll()
      .then(all => {
        const found = all.find(s => s.id === id);
        if (found) setItem({ ...found, layers: found.layers || [], allowComments: found.allowComments ?? true });
        else { toast.error("Story not found"); navigate("/admin/story"); }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const captureTime = (target: "start" | "end") => {
    if (!playerRef.current) return;
    const time = Math.floor(playerRef.current.getCurrentTime());
    setItem(prev => prev ? { ...prev, [target === "start" ? "musicStartTime" : "musicEndTime"]: time } : null);
    toast.success(`${target === "start" ? "Start" : "End"} time captured`);
  };

  const handleSave = async () => {
    if (!item) return;
    const finalItem = { ...item, createdAt: item.createdAt || new Date().toISOString(), layers: item.layers || [] } as StoryItem;
    try {
      if (finalItem.id) await storiesDB.update(finalItem.id, finalItem);
      else await storiesDB.create(finalItem);
      toast.success(isEdit ? "Story updated" : "Story created");
      navigate("/admin/story");
    } catch { toast.error("Failed to save"); }
  };

  const handleUploadBg = async (e: any) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload`, fd);
      setItem(prev => prev ? { ...prev, image: res.data.url } : null);
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  };

  const addTextLayer = () => {
    const newLayer: StoryLayer = {
      id: Date.now().toString(), type: "text", content: "New Text",
      top: 50, left: 50, scale: 1, rotation: 0, color: "#ffffff", fontSize: 24, fontFamily: "Inter, sans-serif"
    };
    setItem(prev => prev ? { ...prev, layers: [...(prev.layers || []), newLayer] } : null);
    setActiveLayer(newLayer.id);
  };

  const updateLayer = (layerId: string, updates: Partial<StoryLayer>) => {
    setItem(prev => {
      if (!prev) return null;
      return { ...prev, layers: (prev.layers || []).map(l => l.id === layerId ? { ...l, ...updates } : l) };
    });
  };

  const searchYT = async () => {
    if (!ytQuery) return;
    setIsSearching(true); setYtResults([]);
    const keys = YT_KEYS;
    for (const key of keys) {
      try {
        const res = await axios.get(`https://www.googleapis.com/youtube/v3/search`, { params: { part: "snippet", q: ytQuery, type: "video", maxResults: 5, key } });
        if (res.data.items) { setYtResults(res.data.items); break; }
      } catch { /* next */ }
    }
    setIsSearching(false);
  };

  const handlePointerDown = (e: React.PointerEvent, layer: StoryLayer) => {
    setActiveLayer(layer.id);
    setDragInfo({ id: layer.id, startX: e.clientX, startY: e.clientY, initialLeft: layer.left, initialTop: layer.top });
    (e.target as any).setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragInfo) return;
    const dx = ((e.clientX - dragInfo.startX) / 380) * 100;
    const dy = ((e.clientY - dragInfo.startY) / 675) * 100;
    updateLayer(dragInfo.id, { left: dragInfo.initialLeft + dx, top: dragInfo.initialTop + dy });
  };
  const handlePointerUp = () => setDragInfo(null);

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  const actLayer = item.layers?.find(l => l.id === activeLayer);

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col overflow-hidden font-inter admin-panel">
      {/* ── Editor Header ── */}
      <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/admin/story")}
            className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-all active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm sm:text-base font-bold text-slate-900 truncate max-w-[120px] sm:max-w-none">
            {isEdit ? "Edit Story" : "New Story"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-slate-500 text-sm hidden md:flex h-9 px-4" 
            onClick={() => navigate("/admin/story")}
          >
            Cancel
          </Button>
          <Button 
            size="sm" 
            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg px-4 h-9 text-sm shadow-sm active:scale-95 transition-all" 
            onClick={handleSave}
          >
            Save Story
          </Button>
        </div>
      </header>

      {/* ── Mobile Tab Bar (sticky below header) ── */}
      <div className="md:hidden flex h-12 border-b border-slate-200 bg-white shrink-0 shadow-sm">
        <button
          onClick={() => setMobileTab("canvas")}
          className={cn(
            "flex-1 flex items-center justify-center text-[13px] font-bold transition-all relative",
            mobileTab === "canvas" ? "text-slate-900" : "text-slate-400"
          )}
        >
          Canvas
          {mobileTab === "canvas" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-slate-900 rounded-full" />}
        </button>
        <button
          onClick={() => setMobileTab("settings")}
          className={cn(
            "flex-1 flex items-center justify-center text-[13px] font-bold transition-all relative",
            mobileTab === "settings" ? "text-slate-900" : "text-slate-400"
          )}
        >
          Settings
          {mobileTab === "settings" && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-slate-900 rounded-full" />}
        </button>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* ── Visual Canvas ── */}
        <main className={cn(
          "flex-1 bg-slate-100 flex flex-col items-center justify-start sm:justify-center relative overflow-y-auto pt-8 pb-12 scroll-smooth overscroll-contain",
          mobileTab === "canvas" ? "flex" : "hidden md:flex"
        )}>
          <div
            onPointerMove={handlePointerMove}
            className="bg-black rounded-[2.5rem] border-[8px] border-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.2)] relative overflow-hidden shrink-0"
            style={{ 
              filter: item.filter !== "none" ? item.filter : "none",
              width: "min(320px, calc(100vw - 3rem))",
              height: "min(568px, calc((100vw - 3rem) * 1.775))"
            }}
          >
            {item.image
              ? <img src={item.image} className="w-full h-full object-cover absolute inset-0 pointer-events-none" />
              : <div className="absolute inset-0 flex flex-col items-center justify-center border border-dashed border-white/10 m-8 rounded-2xl gap-3">
                  <ImageIcon size={40} className="text-white/10" />
                  <p className="text-[10px] text-white/20 font-medium uppercase tracking-widest">No Content</p>
                </div>
            }
            {item.layers?.map(l => (
              <div
                key={l.id}
                onPointerDown={e => handlePointerDown(e, l)}
                onPointerUp={handlePointerUp}
                className={cn("absolute cursor-move select-none touch-none px-4 py-2", activeLayer === l.id && "ring-2 ring-blue-500 rounded-lg bg-blue-500/10")}
                style={{ top: `${l.top}%`, left: `${l.left}%`, transform: `translate(-50%, -50%) scale(${l.scale}) rotate(${l.rotation}deg)`, color: l.color, fontFamily: l.fontFamily, fontSize: `${l.fontSize}px`, textShadow: "0px 2px 10px rgba(0,0,0,0.5)" }}
              >{l.type === "text" ? l.content : null}</div>
            ))}
          </div>
          
          {/* Quick Tools (Below Canvas on Mobile) */}
          <div className="mt-8 flex items-center gap-3 md:hidden">
            <div className="relative flex items-center gap-2 h-10 px-4 bg-white rounded-full border border-slate-200 shadow-sm active:scale-95 transition-all text-xs font-bold text-slate-700">
              <ImageIcon size={14} className="text-slate-400"/>
              <span>{item.image ? 'Change' : 'Upload'} Image</span>
              <input type="file" onChange={handleUploadBg} className="absolute inset-0 opacity-0 cursor-pointer" />
              {uploading && <Loader2 size={14} className="animate-spin text-slate-400"/>}
            </div>
            <button onClick={addTextLayer} className="h-10 px-4 bg-slate-900 rounded-full text-xs font-bold text-white flex items-center gap-2 shadow-lg active:scale-95 transition-all">
              <Plus size={14}/> Add Text
            </button>
          </div>
        </main>

        {/* ── Controls Aside ── */}
        <aside className={cn(
          "w-full md:w-[360px] lg:w-[400px] bg-white md:border-l border-slate-200 overflow-y-auto scroll-smooth overscroll-contain",
          mobileTab === "settings" ? "flex flex-col flex-1" : "hidden md:flex md:flex-col"
        )}>
          <div className="p-6 space-y-8">
          {/* Content (Title only on mobile since upload is in canvas) */}
          <section className="space-y-4">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Story Details</p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Title</Label>
                <Input value={item.title || ""} onChange={e => setItem({ ...item, title: e.target.value })} className="h-10 rounded-md border-slate-200 text-sm" placeholder="Story title..." />
              </div>
              <div className="hidden md:block relative flex items-center gap-2 h-10 px-3 bg-slate-50 rounded-md border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                <ImageIcon size={15} className="text-slate-400 shrink-0" />
                <span className="text-sm text-slate-600">{item.image ? "Change Background" : "Upload Background"}</span>
                <input type="file" onChange={handleUploadBg} className="absolute inset-0 opacity-0 cursor-pointer" />
                {uploading && <Loader2 size={15} className="ml-auto animate-spin text-slate-400" />}
              </div>
            </div>
          </section>

          {/* Layers */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Layers</p>
              <button onClick={addTextLayer} className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
                <Plus size={13} /> Add Text
              </button>
            </div>
            {actLayer && (
              <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-3 animate-in zoom-in-95">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Text Content</Label>
                    <AIRefineButton 
                      value={actLayer.content} 
                      onRefine={(v) => updateLayer(actLayer.id, { content: v })}
                      context="Story text layer content"
                    />
                  </div>
                  <Input value={actLayer.content} onChange={e => updateLayer(actLayer.id, { content: e.target.value })} className="h-9 rounded-md bg-white border-slate-200 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Font Size</Label>
                    <Input type="number" value={actLayer.fontSize} onChange={e => updateLayer(actLayer.id, { fontSize: Number(e.target.value) })} className="h-9 rounded-md bg-white border-slate-200 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Color</Label>
                    <Input type="color" value={actLayer.color} onChange={e => updateLayer(actLayer.id, { color: e.target.value })} className="h-9 rounded-md bg-white border-slate-200 p-1" />
                  </div>
                </div>
                <button
                  onClick={() => setItem(p => p ? { ...p, layers: p.layers?.filter(l => l.id !== actLayer.id) } : null)}
                  className="w-full h-8 text-xs font-medium text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-100"
                >
                  Remove Layer
                </button>
              </div>
            )}
          </section>

          {/* Music */}
          <section className="space-y-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Music</p>
            <div className="p-4 bg-slate-50 rounded-md border border-slate-200 space-y-4">
              {item.musicVideoId && (
                <div className="aspect-video rounded-md overflow-hidden bg-black">
                  <YouTube videoId={item.musicVideoId} opts={{ width: "100%", height: "100%", playerVars: { start: item.musicStartTime || 0, end: (item.musicEndTime || 0) > 0 ? item.musicEndTime : undefined } }} onReady={e => playerRef.current = e.target} className="w-full h-full" />
                </div>
              )}
              <div className="flex items-center justify-between">
                <div className="overflow-hidden">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.musicTitle || "No Music"}</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">{item.musicArtist || "Select a track"}</p>
                </div>
                <button onClick={() => setYtOpen(true)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors">
                  <Search size={15} />
                </button>
              </div>
              {item.musicVideoId && (
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">Start (s)</Label>
                      <button type="button" onClick={() => captureTime("start")} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Scissors size={10} /> Now</button>
                    </div>
                    <Input type="number" value={item.musicStartTime} onChange={e => setItem({ ...item, musicStartTime: Number(e.target.value) })} className="h-9 rounded-md bg-white border-slate-200 text-sm" />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">End (s)</Label>
                      <button type="button" onClick={() => captureTime("end")} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Scissors size={10} /> Now</button>
                    </div>
                    <Input type="number" value={item.musicEndTime} onChange={e => setItem({ ...item, musicEndTime: Number(e.target.value) })} className="h-9 rounded-md bg-white border-slate-200 text-sm" />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Visibility */}
          <section className="space-y-3 pb-6 border-t border-slate-100 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Display Story</p>
                <p className="text-xs text-slate-500 mt-0.5">Show on public site</p>
              </div>
              <Switch checked={item.active} onCheckedChange={v => setItem({ ...item, active: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-800">Allow Replies</p>
                <p className="text-xs text-slate-500 mt-0.5">Let viewers send messages</p>
              </div>
              <Switch checked={item.allowComments} onCheckedChange={v => setItem({ ...item, allowComments: v })} />
            </div>
          </section>
        </div>
      </aside>

      {/* YouTube Modal */}
      {ytOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-semibold text-slate-900">Search Music</h3>
              <button onClick={() => setYtOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="flex gap-2">
                <input value={ytQuery} onChange={e => setYtQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchYT()} className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="Song title..." />
                <Button onClick={searchYT} disabled={isSearching} className="h-10 px-4 bg-slate-900 hover:bg-slate-800 rounded-md">
                  {isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </Button>
              </div>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {ytResults.map(vid => (
                  <button key={vid.id.videoId} onClick={() => { setItem(p => p ? { ...p, musicVideoId: vid.id.videoId, musicTitle: vid.snippet.title, musicArtist: vid.snippet.channelTitle } : null); setYtOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md transition-colors text-left">
                    <img src={vid.snippet.thumbnails.default.url} className="w-12 h-9 rounded-md object-cover" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-800 truncate">{vid.snippet.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{vid.snippet.channelTitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default AdminStoryEditor;
