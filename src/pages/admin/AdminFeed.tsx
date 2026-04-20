import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { feedAPI, FeedPost } from "@/lib/adminData";
import { 
  Plus, Trash2, Pin, Eye, ImageIcon, AlignLeft, Loader2, Upload, X, 
  Edit2, Send, Heart, MessageCircle, BarChart as BarIcon, 
  Link as LinkIcon, MoreHorizontal, ChevronRight, LayoutGrid, 
  Calendar, Video, BarChart2, Music, Search, Quote, Play, Globe,
  Type, FileVideo, CheckSquare, Clock, Scissors
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import YouTube from "react-youtube";

import { API_BASE, YT_KEYS } from "@/config";

const AdminFeed = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  // Form state
  const [type, setType] = useState<"text" | "image" | "poll" | "video">("text");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageCaptions, setImageCaptions] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [pinned, setPinned] = useState(false);
  const [published, setPublished] = useState(true);
  const [imageLayout, setImageLayout] = useState<"default" | "polaroid">("default");
  const [textLayout, setTextLayout] = useState<"default" | "quote">("default");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [linkPreview, setLinkPreview] = useState<{ url: string; title: string; description: string; image: string; domain: string }>({ url: "", title: "", description: "", image: "", domain: "" });
  const [fetchingLink, setFetchingLink] = useState(false);
  
  // Music logic
  const [musicVideoId, setMusicVideoId] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [musicStartTime, setMusicStartTime] = useState(0);
  const [musicEndTime, setMusicEndTime] = useState(0);
  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Player ref for capturing time
  const playerRef = useRef<any>(null);

  const resetForm = () => {
    setType("text"); setContent(""); setImages([]); setImageCaptions([]); setVideoUrl(""); 
    setPinned(false); setPublished(true); setEditId(null);
    setImageLayout("default"); setTextLayout("default");
    setPollQuestion(""); setPollOptions(["", ""]);
    setMusicVideoId(""); setMusicTitle(""); setMusicArtist("");
    setMusicStartTime(0); setMusicEndTime(0);
    setLinkPreview({ url: "", title: "", description: "", image: "", domain: "" });
    playerRef.current = null;
  };

  const loadPosts = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/collection/feed`);
      setPosts(r.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch { setPosts([]); }
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []);

  const fetchLinkMetadata = async (url: string) => {
    if (!url || !url.startsWith("http")) return;
    setFetchingLink(true);
    try {
      const { data } = await axios.get(`${API_BASE}/utils/link-preview?url=${encodeURIComponent(url)}`);
      if (data) setLinkPreview(data);
    } catch { /* silence */ }
    setFetchingLink(false);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await axios.post(`${API_BASE}/upload`, fd);
      if (file.type.startsWith('video/')) setVideoUrl(r.data.url);
      else { setImages(p => [...p, r.data.url]); setImageCaptions(p => [...p, ""]); }
      toast.success("Upload successful");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
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

  const startEdit = (post: FeedPost) => {
    setType(post.type as any); setContent(post.content || "");
    setImages(post.images || []); setImageCaptions(post.imageCaptions || (post.images?.map(()=>"") || []));
    setVideoUrl(post.videoUrl || ""); setPinned(post.pinned || false); setPublished(post.published !== false);
    setImageLayout(post.imageLayout || "default"); setTextLayout(post.textLayout || "default");
    setPollQuestion(post.pollQuestion || ""); setPollOptions(post.pollOptions?.map(o=>o.label) || ["", ""]);
    setMusicVideoId(post.musicVideoId || ""); setMusicTitle(post.musicTitle || ""); setMusicArtist(post.musicArtist || "");
    setMusicStartTime(post.musicStartTime || 0); setMusicEndTime(post.musicEndTime || 0);
    setLinkPreview(post.linkPreview || { url: "", title: "", description: "", image: "", domain: "" });
    setEditId(post.id); setShowForm(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<FeedPost> = { 
        type, pinned, published, content, images, imageCaptions, videoUrl, 
        imageLayout, textLayout, musicVideoId, musicTitle, musicArtist, 
        musicStartTime, musicEndTime,
        pollQuestion, linkPreview,
        pollOptions: pollOptions.filter(Boolean).map(label => ({ label, votes: 0, voters: [] } as any))
      };
      if (editId) await feedAPI.updatePost(editId, payload);
      else await feedAPI.createPost(payload);
      toast.success("Post updated");
      setShowForm(false); resetForm(); loadPosts();
    } catch { toast.error("Processing error"); }
    setSaving(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await feedAPI.deletePost(id); loadPosts();
  };

  const captureTime = (target: 'start' | 'end') => {
    if (!playerRef.current) return;
    const time = Math.floor(playerRef.current.getCurrentTime());
    if (target === 'start') setMusicStartTime(time);
    else setMusicEndTime(time);
    toast.success(`${target === 'start' ? 'Start' : 'End'} time captured: ${time}s`);
  };

  const filteredPosts = posts.filter(p => !search || p.content?.toLowerCase().includes(search.toLowerCase()));

  if (showForm) {
     return (
        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300 font-inter max-w-7xl mx-auto">
           <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-2">
              <h1 className="text-xl font-semibold text-slate-900">{editId ? 'Edit Post' : 'New Post'}</h1>
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-slate-500 text-sm h-9 w-full sm:w-auto">Cancel</Button>
           </div>

           <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                 <div className="lg:col-span-2 space-y-6">
                    {/* Post Content */}
                    <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
                       <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post details</CardTitle>
                          <div className="flex bg-slate-100 p-1 rounded-md">
                             <button type="button" onClick={() => setTextLayout('default')} className={cn("px-3 py-1 text-xs font-medium rounded", textLayout === 'default' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Standard</button>
                             <button type="button" onClick={() => setTextLayout('quote')} className={cn("px-3 py-1 text-xs font-medium rounded", textLayout === 'quote' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Quote</button>
                          </div>
                       </CardHeader>
                       <CardContent className="p-6 space-y-5">
                          <div className="space-y-1.5">
                             <Label className="text-xs font-medium text-slate-700">Description</Label>
                             <textarea 
                               className={cn(
                                 "w-full p-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all text-sm leading-relaxed text-slate-800 resize-none",
                                 textLayout === 'quote' ? "italic border-l-4 border-l-slate-800 bg-slate-50 py-6" : "h-36"
                               )}
                               value={content} onChange={e => setContent(e.target.value)} placeholder="Type here..."
                             />
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                             <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700">Post Type</Label>
                                <select value={type} onChange={e => setType(e.target.value as any)} className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md text-sm text-slate-800 outline-none">
                                   <option value="text">Just Text</option>
                                   <option value="image">Image Gallery</option>
                                   <option value="video">Video Post</option>
                                   <option value="poll">User Poll</option>
                                </select>
                             </div>
                             <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-slate-700">Link URL</Label>
                                <Input value={linkPreview.url} onChange={e=>{setLinkPreview({...linkPreview, url:e.target.value}); fetchLinkMetadata(e.target.value);}} className="h-10 rounded-md border-slate-200" placeholder="https://..." />
                             </div>
                          </div>
                       </CardContent>
                    </Card>

                    {/* Media Specific */}
                    {type !== 'text' && (
                       <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                          <CardHeader className="px-6 py-4 border-b border-slate-100">
                             <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{type === 'image' ? 'Image Gallery' : type === 'video' ? 'Video Player' : 'User Poll'}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-6">
                             {type === 'image' && (
                                <div className="grid grid-cols-2 gap-4">
                                   {images.map((img, i) => (
                                      <div key={i} className="space-y-2">
                                         <div className="aspect-video relative rounded-md overflow-hidden border border-slate-200"><img src={img} className="w-full h-full object-cover"/><button type="button" onClick={()=>setImages(prev=>prev.filter((_,idx)=>idx!==i))} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md text-red-500 shadow-sm"><X size={13}/></button></div>
                                         <Input value={imageCaptions[i]} onChange={e=>{const n=[...imageCaptions]; n[i]=e.target.value; setImageCaptions(n);}} placeholder="Caption..." className="h-8 text-xs" />
                                      </div>
                                   ))}
                                   <label className="aspect-video bg-slate-50 rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors text-slate-400 gap-2">
                                      {uploading ? <Loader2 size={20} className="animate-spin"/> : <><Upload size={20}/><span className="text-xs">Add Image</span></>}
                                      <input type="file" multiple className="hidden" onChange={e => e.target.files && Array.from(e.target.files).forEach(uploadFile)} />
                                   </label>
                                </div>
                             )}
                             {type === 'video' && (
                                <div className="space-y-3">
                                   <div className="grid grid-cols-2 gap-3">
                                      <label className="flex items-center justify-center gap-2 h-10 bg-slate-50 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-100 transition-colors text-slate-500 text-sm">
                                         {uploading ? <Loader2 size={15} className="animate-spin"/> : <Video size={15}/>} Upload Video
                                         <input type="file" accept="video/*" className="hidden" onChange={e=>e.target.files?.[0] && uploadFile(e.target.files[0])}/>
                                      </label>
                                      <Input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="YouTube URL..." className="h-10 rounded-md" />
                                   </div>
                                </div>
                             )}
                             {type === 'poll' && (
                                <div className="space-y-3">
                                   <Input value={pollQuestion} onChange={e=>setPollQuestion(e.target.value)} placeholder="Poll question..." className="h-10 rounded-md" />
                                   <div className="space-y-2">
                                      {pollOptions.map((opt, i) => (
                                         <div key={i} className="flex gap-2">
                                            <input value={opt} onChange={e=>{const n=[...pollOptions]; n[i]=e.target.value; setPollOptions(n);}} className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-md text-sm outline-none" placeholder={`Option ${i+1}`} />
                                            {i>=2 && <button onClick={()=>setPollOptions(p=>p.filter((_,idx)=>idx!==i))} className="p-1.5 text-red-400 hover:text-red-600"><X size={15}/></button>}
                                         </div>
                                      ))}
                                      <Button type="button" variant="ghost" className="h-8 text-sm text-slate-600 px-3" onClick={()=>setPollOptions(p=>[...p, ""])}>+ Add Option</Button>
                                   </div>
                                </div>
                             )}
                          </CardContent>
                       </Card>
                    )}
                 </div>

                 {/* Sidebar */}
                 <div className="space-y-5">
                    <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
                       <CardHeader className="px-6 py-4 border-b border-slate-100">
                          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Music</CardTitle>
                       </CardHeader>
                       <CardContent className="p-6 space-y-4">
                          {musicVideoId && (
                             <div className="aspect-video rounded-md overflow-hidden bg-slate-900 mb-4">
                                <YouTube 
                                  videoId={musicVideoId} 
                                  opts={{ width: '100%', height: '100%', playerVars: { start: musicStartTime, end: musicEndTime > 0 ? musicEndTime : undefined } }} 
                                  className="w-full h-full"
                                  onReady={(e) => playerRef.current = e.target}
                                />
                             </div>
                          )}
                          <div className="p-3 bg-slate-50 rounded-md border border-slate-200 flex items-center justify-between">
                             <div className="flex items-center gap-3 overflow-hidden">
                                <Music size={16} className="text-slate-500 shrink-0" />
                                <div className="overflow-hidden">
                                   <p className="text-xs font-medium text-slate-800 truncate">{musicTitle || "No Music"}</p>
                                   <p className="text-xs text-slate-500 truncate mt-0.5">{musicArtist || "Acoustic Silence"}</p>
                                </div>
                             </div>
                             <button type="button" onClick={()=>setYtOpen(true)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors"><Search size={14}/></button>
                          </div>
                          {musicVideoId && (
                             <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                                <div className="space-y-1.5">
                                   <div className="flex items-center justify-between">
                                      <Label className="text-xs text-slate-500">Start (sec)</Label>
                                      <button type="button" onClick={() => captureTime('start')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Scissors size={10}/> Now</button>
                                   </div>
                                   <Input type="number" value={musicStartTime} onChange={e=>setMusicStartTime(Number(e.target.value))} className="h-9 text-sm rounded-md" />
                                </div>
                                <div className="space-y-1.5">
                                   <div className="flex items-center justify-between">
                                      <Label className="text-xs text-slate-500">End (sec)</Label>
                                      <button type="button" onClick={() => captureTime('end')} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Scissors size={10}/> Now</button>
                                   </div>
                                   <Input type="number" value={musicEndTime} onChange={e=>setMusicEndTime(Number(e.target.value))} className="h-9 text-sm rounded-md" />
                                </div>
                             </div>
                          )}
                       </CardContent>
                    </Card>

                    <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
                       <CardHeader className="px-6 py-4 border-b border-slate-100">
                          <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Settings</CardTitle>
                       </CardHeader>
                       <CardContent className="p-6 space-y-5">
                          <div className="flex items-center justify-between">
                             <div>
                               <p className="text-sm font-medium text-slate-800">Pin to Top</p>
                               <p className="text-xs text-slate-500 mt-0.5">Show at the top of the feed</p>
                             </div>
                             <Switch checked={pinned} onCheckedChange={setPinned} />
                          </div>
                          <div className="flex items-center justify-between">
                             <div>
                               <p className="text-sm font-medium text-slate-800">Display Post</p>
                               <p className="text-xs text-slate-500 mt-0.5">Make this post public</p>
                             </div>
                             <Switch checked={published} onCheckedChange={setPublished} />
                          </div>
                       </CardContent>
                    </Card>

                    <div className="flex flex-col gap-2">
                       <Button onClick={handleSubmit} disabled={saving} className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-sm">
                          {saving ? <Loader2 size={15} className="animate-spin mr-2"/> : <Send size={15} className="mr-2"/>} Save Changes
                       </Button>
                       <Button variant="ghost" onClick={()=>setShowForm(false)} className="w-full h-9 text-slate-500 text-sm">Cancel</Button>
                    </div>
                 </div>
              </div>
           </form>

           {/* Music Sourcing */}
           {ytOpen && (
              <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
                 <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col">
                    <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100">
                       <h3 className="text-sm font-semibold text-slate-900">Search Music</h3>
                       <button onClick={()=>setYtOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"><X size={16}/></button>
                    </div>
                    <div className="p-5 space-y-4">
                       <div className="flex gap-2">
                          <input value={ytQuery} onChange={e=>setYtQuery(e.target.value)} onKeyDown={e=>e.key==='Enter'&&searchYT()} className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="Track name..." />
                          <Button onClick={searchYT} disabled={isSearching} className="h-10 px-4 bg-slate-900 hover:bg-slate-800 rounded-md">{isSearching ? <Loader2 size={15} className="animate-spin"/> : <Search size={15}/>}</Button>
                       </div>
                       <div className="space-y-1 max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-100">
                          {ytResults.map(vid => (
                             <button key={vid.id.videoId} type="button" onClick={()=>{ setMusicVideoId(vid.id.videoId); setMusicTitle(vid.snippet.title); setMusicArtist(vid.snippet.channelTitle); setYtOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md transition-colors text-left">
                               <img src={vid.snippet.thumbnails.default.url} className="w-12 h-9 rounded-md object-cover"/><div className="overflow-hidden"><p className="text-sm font-medium text-slate-800 truncate">{vid.snippet.title}</p><p className="text-xs text-slate-500 mt-0.5">{vid.snippet.channelTitle}</p></div>
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
          <h1 className="text-xl font-semibold text-slate-900">Feed</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage public posts and media</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 transition-all text-sm w-full sm:w-auto">
          <Plus size={16} className="mr-1.5" /> New Post
        </Button>
      </div>

      <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <span className="text-sm text-slate-500">{filteredPosts.length} {filteredPosts.length === 1 ? 'post' : 'posts'}</span>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search posts..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 pl-9 pr-4 text-sm text-slate-700 focus:bg-white focus:border-slate-300 transition-all outline-none" 
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60">
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Asset</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Content</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Type</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Status</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Date</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPosts.map((post) => (
                <TableRow key={post.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center">
                      {post.type === 'image' && post.images?.[0] ? (
                        <img src={post.images[0]} className="w-full h-full object-cover" />
                      ) : post.type === 'video' ? (
                        <Video size={14} className="text-slate-400" />
                      ) : (
                        <AlignLeft size={14} className="text-slate-300" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-sm text-slate-700 line-clamp-2 max-w-[300px]">
                      {post.content || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500 capitalize">{post.type}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      post.published !== false
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500 border border-slate-200"
                    )}>
                      {post.published !== false ? 'Live' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs text-slate-500">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(post)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => deletePost(post.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"><Trash2 size={14} /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminFeed;
