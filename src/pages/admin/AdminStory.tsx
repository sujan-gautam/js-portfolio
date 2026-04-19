import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE, YT_KEYS } from "@/config";
import { Plus, Trash2, Pencil, Image as ImageIcon, Music, Loader2, ArrowLeft, Eye, BarChart3, MessageSquare, Smartphone, Search, X, Sparkles, UserCheck, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { storiesDB, StoryItem, StoryLayer } from "@/lib/adminData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import YouTube from "react-youtube";

const AdminStory = () => {
  const [data, setData] = useState<StoryItem[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [item, setItem] = useState<Partial<StoryItem> | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [dragInfo, setDragInfo] = useState<{ id: string, startX: number, startY: number, initialLeft: number, initialTop: number } | null>(null);
  const [analyticsStory, setAnalyticsStory] = useState<StoryItem | null>(null);

  const playerRef = useRef<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setLoading(true);
    storiesDB.getAll().then(res => {
      setData(res.sort((a, b) => new Date(b.createdAt||'').getTime() - new Date(a.createdAt||'').getTime()));
      setLoading(false);
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this story?")) return;
    await storiesDB.delete(id);
    toast.success("Story deleted");
    loadData();
  };

  const openEditor = (story?: StoryItem) => {
    if (story) setItem({ ...story, layers: story.layers || [], allowComments: story.allowComments ?? true });
    else setItem({ active: true, allowComments: true, layers: [], title: "", duration: 5000, filter: "none", views: 0 });
    setEditorOpen(true);
    setActiveLayer(null);
  };

  const captureTime = (target: 'start' | 'end') => {
    if (!playerRef.current) return;
    const time = Math.floor(playerRef.current.getCurrentTime());
    setItem(prev => prev ? { ...prev, [target === 'start' ? 'musicStartTime' : 'musicEndTime']: time } : null);
    toast.success(`${target === 'start' ? 'Start' : 'End'} time captured`);
  };

  const handleSave = async () => {
    if (!item) return;
    const finalItem = { ...item, createdAt: item.createdAt || new Date().toISOString(), layers: item.layers || [] } as StoryItem;
    try {
      if (finalItem.id) await storiesDB.update(finalItem.id, finalItem);
      else await storiesDB.create(finalItem);
      toast.success("Story saved");
      setEditorOpen(false);
      loadData();
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

  const updateLayer = (id: string, updates: Partial<StoryLayer>) => {
    setItem(prev => {
      if (!prev) return null;
      return { ...prev, layers: (prev.layers || []).map(l => l.id === id ? { ...l, ...updates } : l) };
    });
  };

  const searchYT = async () => {
    if (!ytQuery) return;
    setIsSearching(true); setYtResults([]);
    const keys = YT_KEYS;
    let success = false;
    for (const key of keys) {
      try {
        const res = await axios.get(`https://www.googleapis.com/youtube/v3/search`, { params: { part: "snippet", q: ytQuery, type: "video", maxResults: 5, key } });
        if (res.data.items) { setYtResults(res.data.items); success = true; break; }
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

  if (editorOpen && item) {
    const actLayer = item.layers?.find(l => l.id === activeLayer);
    return (
      <div className="fixed inset-0 z-[100] bg-[#fafafa] flex flex-col md:flex-row overflow-hidden animate-in fade-in duration-200 font-inter">
        {/* Editor Header */}
        <header className="h-14 border-b border-slate-200 absolute top-0 left-0 right-0 bg-white z-[110] flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setEditorOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
              <ArrowLeft size={18}/>
            </button>
            <span className="text-sm font-medium text-slate-900">{item.id ? 'Edit Story' : 'New Story'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-slate-500 text-sm h-8" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-8 text-sm" onClick={handleSave}>Save Story</Button>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 bg-slate-100 flex items-center justify-center relative pt-14">
          <div
            onPointerMove={handlePointerMove}
            className="w-[340px] h-[600px] bg-black rounded-2xl border-[6px] border-slate-800 shadow-2xl relative overflow-hidden"
            style={{ filter: item.filter !== "none" ? item.filter : "none" }}
          >
            {item.image
              ? <img src={item.image} className="w-full h-full object-cover absolute inset-0 pointer-events-none" />
              : <div className="absolute inset-0 flex items-center justify-center border border-dashed border-white/10 m-6 rounded-xl">
                  <ImageIcon size={36} className="text-white/20"/>
                </div>
            }
            {item.layers?.map(l => (
              <div
                key={l.id}
                onPointerDown={(e) => handlePointerDown(e, l)}
                onPointerUp={handlePointerUp}
                className={cn("absolute cursor-move select-none touch-none px-4 py-2", activeLayer === l.id && "ring-2 ring-blue-500 rounded-lg bg-blue-500/10")}
                style={{ top: `${l.top}%`, left: `${l.left}%`, transform: `translate(-50%, -50%) scale(${l.scale}) rotate(${l.rotation}deg)`, color: l.color, fontFamily: l.fontFamily, fontSize: `${l.fontSize}px`, textShadow: '0px 2px 10px rgba(0,0,0,0.5)' }}
              >{l.type === "text" ? l.content : null}</div>
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <aside className="w-[380px] bg-white border-l border-slate-200 pt-14 overflow-y-auto scrollbar-none">
          <div className="p-6 space-y-6">
            {/* Content */}
            <section className="space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Content</p>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Title</Label>
                  <Input value={item.title || ""} onChange={e => setItem({...item, title: e.target.value})} className="h-10 rounded-md border-slate-200 text-sm" placeholder="Story title..." />
                </div>
                <div className="relative flex items-center gap-2 h-10 px-3 bg-slate-50 rounded-md border border-slate-200 hover:border-slate-300 cursor-pointer transition-colors">
                  <ImageIcon size={15} className="text-slate-400 shrink-0"/>
                  <span className="text-sm text-slate-600">{item.image ? 'Change Background' : 'Upload Background'}</span>
                  <input type="file" onChange={handleUploadBg} className="absolute inset-0 opacity-0 cursor-pointer" />
                  {uploading && <Loader2 size={15} className="ml-auto animate-spin text-slate-400"/>}
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
                    <Label className="text-xs font-medium text-slate-700">Text Content</Label>
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
                    onClick={() => setItem(p => p ? {...p, layers: p.layers?.filter(l => l.id !== actLayer.id)} : null)}
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
                    <YouTube videoId={item.musicVideoId} opts={{ width:'100%', height:'100%', playerVars:{ start: item.musicStartTime || 0, end: (item.musicEndTime || 0) > 0 ? item.musicEndTime : undefined } }} onReady={(e) => playerRef.current = e.target} className="w-full h-full" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="overflow-hidden">
                    <p className="text-sm font-medium text-slate-800 truncate">{item.musicTitle || "No Music"}</p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{item.musicArtist || "Select a track"}</p>
                  </div>
                  <button onClick={() => setYtOpen(true)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors">
                    <Search size={15}/>
                  </button>
                </div>
                {item.musicVideoId && (
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700">Start (s)</Label>
                        <button type="button" onClick={() => captureTime('start')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
                          <Scissors size={10}/> Now
                        </button>
                      </div>
                      <Input type="number" value={item.musicStartTime} onChange={e => setItem({...item, musicStartTime: Number(e.target.value)})} className="h-9 rounded-md bg-white border-slate-200 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700">End (s)</Label>
                        <button type="button" onClick={() => captureTime('end')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1">
                          <Scissors size={10}/> Now
                        </button>
                      </div>
                      <Input type="number" value={item.musicEndTime} onChange={e => setItem({...item, musicEndTime: Number(e.target.value)})} className="h-9 rounded-md bg-white border-slate-200 text-sm" />
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
                <Switch checked={item.active} onCheckedChange={v => setItem({...item, active: v})} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Allow Replies</p>
                  <p className="text-xs text-slate-500 mt-0.5">Let viewers send messages</p>
                </div>
                <Switch checked={item.allowComments} onCheckedChange={v => setItem({...item, allowComments: v})} />
              </div>
            </section>
          </div>
        </aside>

        {/* YouTube Modal */}
        {ytOpen && (
          <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden flex flex-col">
              <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900">Search Music</h3>
                <button onClick={() => setYtOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"><X size={16}/></button>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-2">
                  <input value={ytQuery} onChange={e => setYtQuery(e.target.value)} onKeyDown={e => e.key==='Enter' && searchYT()} className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="Song title..." />
                  <Button onClick={searchYT} disabled={isSearching} className="h-10 px-4 bg-slate-900 hover:bg-slate-800 rounded-md">
                    {isSearching ? <Loader2 size={15} className="animate-spin"/> : <Search size={15}/>}
                  </Button>
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {ytResults.map(vid => (
                    <button key={vid.id.videoId} onClick={() => { setItem(p => p ? {...p, musicVideoId: vid.id.videoId, musicTitle: vid.snippet.title, musicArtist: vid.snippet.channelTitle} : null); setYtOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md transition-colors text-left">
                      <img src={vid.snippet.thumbnails.default.url} className="w-12 h-9 rounded-md object-cover"/>
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
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Stories</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your featured story updates</p>
        </div>
        <Button onClick={() => openEditor()} className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 text-sm transition-all">
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
          <Button variant="ghost" onClick={() => openEditor()} className="text-sm text-slate-600 hover:text-slate-900">Create your first story</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {data.map(story => (
            <div key={story.id} className="group bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
              <div className="aspect-[10/14] overflow-hidden relative bg-slate-100">
                {story.image
                  ? <img src={story.image} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={28} className="text-slate-300"/></div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                {/* Action buttons */}
                <div className="absolute top-3 right-3 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => setAnalyticsStory(story)} className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors">
                    <BarChart3 size={14}/>
                  </button>
                  <button onClick={() => openEditor(story)} className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-slate-900 shadow-sm transition-colors">
                    <Pencil size={14}/>
                  </button>
                  <button onClick={() => handleDelete(story.id)} className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-slate-500 hover:text-red-600 shadow-sm transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>

                {/* Story info */}
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-medium text-white truncate mb-1">{story.title || "Untitled"}</p>
                  <div className="flex items-center gap-3 text-xs text-white/70">
                    <span className="flex items-center gap-1"><Eye size={11}/> {story.views || 0}</span>
                    <span className="flex items-center gap-1"><MessageSquare size={11}/> {story.comments?.length || 0}</span>
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
                <X size={16}/>
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Performance</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <Eye size={12}/>
                        <span className="text-xs font-medium">Views</span>
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">{analyticsStory.views || 0}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-2 text-slate-500 mb-1">
                        <MessageSquare size={12}/>
                        <span className="text-xs font-medium">Replies</span>
                      </div>
                      <p className="text-2xl font-semibold text-slate-900">{analyticsStory.comments?.length || 0}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Reactions</p>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(analyticsStory.reacts || { heart: 0, fire: 0, laugh: 0 }).map(([type, count]) => (
                      <div key={type} className="flex flex-col items-center p-3 bg-white border border-slate-200 rounded-lg">
                        <span className="text-lg mb-1">{type === 'heart' ? '❤️' : type === 'fire' ? '🔥' : '😂'}</span>
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
                              <UserCheck size={12} className="text-slate-500"/>
                            </div>
                            <span className="text-xs font-medium text-slate-700">Anonymous</span>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-8">{c.text || c.content}</p>
                        <div className="flex items-center gap-2 pl-8">
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Smartphone size={10}/> {c.device?.split(' ')[0] || 'Mobile'}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                      <Sparkles size={24} className="opacity-40"/>
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

export default AdminStory;
