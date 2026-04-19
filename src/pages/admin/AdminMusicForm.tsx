import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { Search, Loader2, X, Music, Scissors, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { musicDB, MusicItem } from "@/lib/adminData";
import { toast } from "sonner";
import YouTube from "react-youtube";

const AdminMusicForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loadingTrack, setLoadingTrack] = useState(isEdit);
  const [item, setItem] = useState<Partial<MusicItem>>({
    active: true, title: "", artist: "", url: "", videoId: "", startTime: 0, endTime: 0
  });

  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const playerRef = useRef<any>(null);

  useEffect(() => {
    if (!id) return;
    setLoadingTrack(true);
    musicDB.getAll()
      .then(all => {
        const found = all.find(m => m.id === id);
        if (found) setItem(found);
        else { toast.error("Track not found"); navigate("/admin/music"); }
      })
      .finally(() => setLoadingTrack(false));
  }, [id]);

  const captureTime = (target: "start" | "end") => {
    if (!playerRef.current) { toast.error("Play the video first"); return; }
    const time = Math.floor(playerRef.current.getCurrentTime());
    setItem(prev => ({ ...prev, [target === "start" ? "startTime" : "endTime"]: time }));
    toast.success(`${target === "start" ? "Start" : "End"} time synced`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalItem = {
        ...item,
        url: item.url || (item.videoId ? `https://youtube.com/watch?v=${item.videoId}` : "")
      } as MusicItem;
      if (id) await musicDB.update(id, finalItem);
      else await musicDB.create(finalItem);
      toast.success(isEdit ? "Track updated" : "Track added");
      navigate("/admin/music");
    } catch { toast.error("Failed to save track"); }
  };

  const searchYT = async () => {
    if (!ytQuery) return;
    setIsSearching(true); setYtResults([]);
    const keys = ["AIzaSyBs-cR4cHQNTf2ktkaNq5nyKAOwI2NLmMI", "AIzaSyBJZWKGnbhYGBB1VoPuchgFKbBKHhYLluc"];
    for (const key of keys) {
      try {
        const res = await axios.get(`https://www.googleapis.com/youtube/v3/search`, { params: { part: "snippet", q: ytQuery, type: "video", maxResults: 5, key } });
        if (res.data.items) { setYtResults(res.data.items); break; }
      } catch { /* next */ }
    }
    setIsSearching(false);
  };

  if (loadingTrack) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/admin/music")} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Track" : "New Track"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Configure background audio</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate("/admin/music")} className="text-slate-500 text-sm">Cancel</Button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Track Details */}
          <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Track Details</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Title</Label>
                  <Input value={item.title} onChange={e => setItem({ ...item, title: e.target.value })} className="h-10 rounded-md border-slate-200 text-sm" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Artist</Label>
                  <Input value={item.artist} onChange={e => setItem({ ...item, artist: e.target.value })} className="h-10 rounded-md border-slate-200 text-sm" required />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-slate-700">Direct URL (optional)</Label>
                <Input value={item.url} onChange={e => setItem({ ...item, url: e.target.value })} className="h-10 rounded-md border-slate-200 text-sm font-mono" placeholder="Direct mp3 or YouTube URL" />
              </div>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Music Preview</CardTitle>
              <button type="button" onClick={() => setYtOpen(true)} className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 transition-colors">
                <Search size={13} /> Find Music
              </button>
            </CardHeader>
            <CardContent className="p-6">
              {item.videoId ? (
                <div className="aspect-video rounded-md overflow-hidden bg-black">
                  <YouTube videoId={item.videoId} opts={{ width: "100%", height: "100%", playerVars: { start: item.startTime || 0, end: (item.endTime || 0) > 0 ? item.endTime : undefined } }} onReady={e => playerRef.current = e.target} className="w-full h-full" />
                </div>
              ) : (
                <div className="aspect-video rounded-md bg-slate-50 border border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Music size={28} className="opacity-40" />
                  <span className="text-sm">No source selected</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Timing */}
          <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timing</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">Start (sec)</Label>
                  <button type="button" onClick={() => captureTime("start")} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                    <Scissors size={11} /> Now
                  </button>
                </div>
                <Input type="number" value={item.startTime} onChange={e => setItem({ ...item, startTime: Number(e.target.value) })} className="h-10 rounded-md border-slate-200 text-sm text-center" />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium text-slate-700">End (sec)</Label>
                  <button type="button" onClick={() => captureTime("end")} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                    <Scissors size={11} /> Now
                  </button>
                </div>
                <Input type="number" value={item.endTime} onChange={e => setItem({ ...item, endTime: Number(e.target.value) })} className="h-10 rounded-md border-slate-200 text-sm text-center" />
              </div>
            </CardContent>
          </Card>

          {/* Status + Save */}
          <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Active</p>
                  <p className="text-xs text-slate-500 mt-0.5">Show on public site</p>
                </div>
                <Switch checked={item.active} onCheckedChange={v => setItem({ ...item, active: v })} />
              </div>
              <Button type="submit" className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-sm">
                {isEdit ? "Save Changes" : "Add Track"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/admin/music")} className="w-full h-9 text-slate-500 text-sm">
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>

      {/* YouTube Modal */}
      {ytOpen && (
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Search Music</h3>
              <button onClick={() => setYtOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex gap-2">
                <input value={ytQuery} onChange={e => setYtQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchYT()} className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="Song title..." />
                <Button onClick={searchYT} disabled={isSearching} className="h-10 px-4 bg-slate-900 hover:bg-slate-800 rounded-md">
                  {isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </Button>
              </div>
              <div className="space-y-1 max-h-72 overflow-y-auto">
                {ytResults.map(vid => (
                  <button key={vid.id.videoId} onClick={() => { setItem(p => ({ ...p, videoId: vid.id.videoId, title: vid.snippet.title, artist: vid.snippet.channelTitle })); setYtOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md transition-colors text-left">
                    <div className="w-14 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0">
                      <img src={vid.snippet.thumbnails.default.url} className="w-full h-full object-cover" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-800 truncate">{vid.snippet.title}</p>
                      <p className="text-xs text-slate-500">{vid.snippet.channelTitle}</p>
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
};

export default AdminMusicForm;
