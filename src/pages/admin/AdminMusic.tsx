import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Plus, Trash2, Edit2, Music, Search, Loader2, X, Clock, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { musicDB, MusicItem } from "@/lib/adminData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import YouTube from "react-youtube";

const AdminMusic = () => {
  const [data, setData] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [item, setItem] = useState<Partial<MusicItem>>({ active: true, title: "", artist: "", url: "", videoId: "", startTime: 0, endTime: 0 });
  const [editId, setEditId] = useState<string | null>(null);

  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const playerRef = useRef<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = () => {
    setLoading(true);
    musicDB.getAll().then(res => {
      setData(res);
      setLoading(false);
    });
  };

  const captureTime = (target: 'start' | 'end') => {
    if (!playerRef.current) {
      toast.error("Play the video first");
      return;
    }
    const time = Math.floor(playerRef.current.getCurrentTime());
    setItem(prev => ({ ...prev, [target === 'start' ? 'startTime' : 'endTime']: time }));
    toast.success(`${target === 'start' ? 'Start' : 'End'} time synced`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const finalItem = {
        ...item,
        url: item.url || (item.videoId ? `https://youtube.com/watch?v=${item.videoId}` : "")
      } as MusicItem;

      if (editId) await musicDB.update(editId, finalItem);
      else await musicDB.create(finalItem);

      toast.success("Music saved");
      setShowForm(false);
      setEditId(null);
      setItem({ active: true, title: "", artist: "", url: "", videoId: "", startTime: 0, endTime: 0 });
      loadData();
    } catch { toast.error("Failed to save music"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await musicDB.delete(id);
    toast.success("Track removed");
    loadData();
  };

  const searchYT = async () => {
    if (!ytQuery) return;
    setIsSearching(true);
    setYtResults([]);
    const keys = ["AIzaSyBs-cR4cHQNTf2ktkaNq5nyKAOwI2NLmMI", "AIzaSyBJZWKGnbhYGBB1VoPuchgFKbBKHhYLluc"];
    let success = false;
    for (const key of keys) {
      try {
        const res = await axios.get(`https://www.googleapis.com/youtube/v3/search`, { params: { part: "snippet", q: ytQuery, type: "video", maxResults: 5, key } });
        if (res.data.items) { setYtResults(res.data.items); success = true; break; }
      } catch { /* next */ }
    }
    if (!success) toast.error("Search failed");
    setIsSearching(false);
  };

  if (showForm) {
    return (
      <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 font-inter max-w-5xl mx-auto pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{editId ? 'Edit Track' : 'New Track'}</h1>
            <p className="text-sm text-slate-500 mt-0.5">Configure background audio</p>
          </div>
          <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-500 text-sm w-full sm:w-auto">Cancel</Button>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Track Details</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Title</Label>
                    <Input value={item.title} onChange={e => setItem({...item, title: e.target.value})} className="h-10 rounded-md border-slate-200 text-sm" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-slate-700">Artist</Label>
                    <Input value={item.artist} onChange={e => setItem({...item, artist: e.target.value})} className="h-10 rounded-md border-slate-200 text-sm" required />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-slate-700">Direct URL (optional)</Label>
                  <Input value={item.url} onChange={e => setItem({...item, url: e.target.value})} className="h-10 rounded-md border-slate-200 text-sm font-mono" placeholder="Direct mp3 or YouTube URL" />
                </div>
              </CardContent>
            </Card>

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
                    <YouTube videoId={item.videoId} opts={{ width:'100%', height:'100%', playerVars: { start: item.startTime || 0, end: (item.endTime || 0) > 0 ? item.endTime : undefined } }} onReady={(e) => playerRef.current = e.target} className="w-full h-full" />
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

          <div className="space-y-6">
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Timing</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Start (sec)</Label>
                    <button type="button" onClick={() => captureTime('start')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                      <Scissors size={11} /> Now
                    </button>
                  </div>
                  <Input type="number" value={item.startTime} onChange={e => setItem({...item, startTime: Number(e.target.value)})} className="h-10 rounded-md border-slate-200 text-sm text-center" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">End (sec)</Label>
                    <button type="button" onClick={() => captureTime('end')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1 transition-colors">
                      <Scissors size={11} /> Now
                    </button>
                  </div>
                  <Input type="number" value={item.endTime} onChange={e => setItem({...item, endTime: Number(e.target.value)})} className="h-10 rounded-md border-slate-200 text-sm text-center" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Active</p>
                    <p className="text-xs text-slate-500 mt-0.5">Show on public site</p>
                  </div>
                  <Switch checked={item.active} onCheckedChange={v => setItem({...item, active: v})} />
                </div>
                <Button type="submit" className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-sm">
                  Save Track
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>

        {ytOpen && (
          <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col">
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
                    <button key={vid.id.videoId} onClick={() => { setItem(p => ({...p, videoId: vid.id.videoId, title: vid.snippet.title, artist: vid.snippet.channelTitle})); setYtOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md transition-colors text-left">
                      <div className="w-14 h-10 rounded-md bg-slate-100 overflow-hidden shrink-0">
                        <img src={vid.snippet.thumbnails.default.url} className="w-full h-full object-cover"/>
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
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Music</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage background audio tracks</p>
        </div>
        <Button onClick={() => { setEditId(null); setItem({ active: true, title: "", artist: "", url: "", videoId: "", startTime: 0, endTime: 0 }); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 text-sm transition-all w-full sm:w-auto">
          <Plus size={16} className="mr-1.5" /> Add Track
        </Button>
      </div>

      <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60">
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Track</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Timing</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Status</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : data.map(m => (
                <TableRow key={m.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                        <Music size={16}/>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 leading-none">{m.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{m.artist}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={12} className="text-slate-400"/>
                      <span className="text-xs font-mono">{m.startTime}s — {m.endTime || '∞'}s</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      m.active
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", m.active ? "bg-emerald-500" : "bg-slate-300")} />
                      {m.active ? 'Active' : 'Hidden'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setItem(m); setEditId(m.id); setShowForm(true); }} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                        <Edit2 size={14}/>
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center text-sm text-slate-400">
                    No tracks added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminMusic;
