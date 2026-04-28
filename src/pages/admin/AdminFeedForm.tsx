import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { feedAPI, FeedPost } from "@/lib/adminData";
import {
  Plus, Trash2, Loader2, Upload, X,
  Send, Music, Search, Video, Scissors, ArrowLeft, Heart, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import YouTube from "react-youtube";
import { AIRefineButton } from "@/components/admin/AIRefineButton";

import { API_BASE, YT_KEYS } from "@/config";

const AdminFeedForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loadingPost, setLoadingPost] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [type, setType] = useState<"text" | "image" | "poll" | "video">("text");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageCaptions, setImageCaptions] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [pinned, setPinned] = useState(false);
  const [published, setPublished] = useState(true);
  const [membersOnly, setMembersOnly] = useState(false);
  const [textLayout, setTextLayout] = useState<"default" | "quote">("default");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<{label: string, votes: number}[]>([{label: "", votes: 0}, {label: "", votes: 0}]);
  const [linkPreview, setLinkPreview] = useState({ url: "", title: "", description: "", image: "", domain: "" });
  const [likeCount, setLikeCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);

  // Music
  const [musicVideoId, setMusicVideoId] = useState("");
  const [musicTitle, setMusicTitle] = useState("");
  const [musicArtist, setMusicArtist] = useState("");
  const [musicStartTime, setMusicStartTime] = useState(0);
  const [musicEndTime, setMusicEndTime] = useState(0);
  const [ytOpen, setYtOpen] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const playerRef = useRef<any>(null);

  // Load existing post when editing
  useEffect(() => {
    if (!id) return;
    setLoadingPost(true);
    axios.get(`${API_BASE}/collection/feed`)
      .then(r => {
        const post: FeedPost = r.data.find((p: FeedPost) => p.id === id);
        if (!post) { toast.error("Post not found"); navigate("/admin/feed"); return; }
        setType(post.type as any);
        setContent(post.content || "");
        setImages(post.images || []);
        setImageCaptions(post.imageCaptions || (post.images?.map(() => "") || []));
        setVideoUrl(post.videoUrl || "");
        setPinned(post.pinned || false);
        setPublished(post.published !== false);
        setMembersOnly(post.membersOnly || false);
        setTextLayout(post.textLayout || "default");
        setPollQuestion(post.pollQuestion || "");
        setPollOptions(post.pollOptions?.map((o: any) => ({ label: o.label, votes: o.votes || 0 })) || [{label: "", votes: 0}, {label: "", votes: 0}]);
        setMusicVideoId(post.musicVideoId || "");
        setMusicTitle(post.musicTitle || "");
        setMusicArtist(post.musicArtist || "");
        setMusicStartTime(post.musicStartTime || 0);
        setMusicEndTime(post.musicEndTime || 0);
        setLinkPreview(post.linkPreview || { url: "", title: "", description: "", image: "", domain: "" });
        setLikeCount(post.reactions?.like || 0);
        setShareCount(post.shares || 0);
      })
      .catch(() => toast.error("Failed to load post"))
      .finally(() => setLoadingPost(false));
  }, [id]);

  const fetchLinkMetadata = async (url: string) => {
    if (!url || !url.startsWith("http")) return;
    try {
      const { data } = await axios.get(`${API_BASE}/utils/link-preview?url=${encodeURIComponent(url)}`);
      if (data) setLinkPreview(data);
    } catch { /* silence */ }
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await axios.post(`${API_BASE}/upload`, fd);
      const url = r.data.url;
      setImages(p => [...p, url]);
      setImageCaptions(p => [...p, ""]);
      
      // Also set videoUrl if it's the first video and it's a video type
      if (file.type.startsWith("video/") && !videoUrl) {
        setVideoUrl(url);
      }
      
      toast.success("Upload successful");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  };

  const isVideo = (url: string) => {
    return url.match(/\.(mp4|webm|ogg|mov|m4v)$|^https?:\/\/(www\.)?(youtube\.com|youtu\.be)/i);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData("index", index.toString());
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    const fromIndex = parseInt(e.dataTransfer.getData("index"));
    if (isNaN(fromIndex)) return;
    
    const newImages = [...images];
    const newCaptions = [...imageCaptions];
    
    const [movedImage] = newImages.splice(fromIndex, 1);
    const [movedCaption] = newCaptions.splice(fromIndex, 1);
    
    newImages.splice(index, 0, movedImage);
    newCaptions.splice(index, 0, movedCaption);
    
    setImages(newImages);
    setImageCaptions(newCaptions);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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

  const captureTime = (target: "start" | "end") => {
    if (!playerRef.current) return;
    const time = Math.floor(playerRef.current.getCurrentTime());
    if (target === "start") setMusicStartTime(time);
    else setMusicEndTime(time);
    toast.success(`${target === "start" ? "Start" : "End"} time captured: ${time}s`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Partial<FeedPost> = {
        type, pinned, published, membersOnly, content, images, imageCaptions, videoUrl,
        textLayout, musicVideoId, musicTitle, musicArtist,
        musicStartTime, musicEndTime, pollQuestion, linkPreview,
        pollOptions: pollOptions.filter(o => o.label).map(o => ({ label: o.label, votes: o.votes || 0, voters: [] } as any)),
        reactions: { like: likeCount } as any,
        shares: shareCount
      };
      if (id) await feedAPI.updatePost(id, payload);
      else await feedAPI.createPost(payload);
      toast.success(id ? "Post updated" : "Post created");
      navigate("/admin/feed");
    } catch { toast.error("Save failed"); }
    setSaving(false);
  };

  if (loadingPost) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/feed")}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Post" : "New Post"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{isEdit ? "Update post details" : "Create a new feed post"}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate("/admin/feed")} className="text-slate-500 text-sm h-9 hidden sm:flex">
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
              <CardHeader className="px-4 sm:px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Details</CardTitle>
                <div className="flex bg-slate-100 p-1 rounded-md">
                  <button type="button" onClick={() => setTextLayout("default")} className={cn("px-3 py-1 text-xs font-medium rounded", textLayout === "default" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Standard</button>
                  <button type="button" onClick={() => setTextLayout("quote")} className={cn("px-3 py-1 text-xs font-medium rounded", textLayout === "quote" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Quote</button>
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-slate-700">Description</Label>
                    <AIRefineButton 
                      value={content} 
                      onRefine={(v) => setContent(v)} 
                      context="Social media feed post content" 
                    />
                  </div>
                  <textarea
                    className={cn(
                      "w-full p-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-slate-100 focus:border-slate-400 outline-none transition-all text-sm leading-relaxed text-slate-800 resize-none",
                      textLayout === "quote" ? "italic border-l-4 border-l-slate-800 bg-slate-50 py-6" : "h-36"
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
                    <Input value={linkPreview.url} onChange={e => { setLinkPreview({ ...linkPreview, url: e.target.value }); fetchLinkMetadata(e.target.value); }} className="h-10 rounded-md border-slate-200" placeholder="https://..." />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Media */}
            {type !== "text" && (
              <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden animate-in fade-in slide-in-from-top-2">
                <CardHeader className="px-6 py-4 border-b border-slate-100">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {type === "image" ? "Image Gallery" : type === "video" ? "Video Player" : "User Poll"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  {type === "image" && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {images.map((img, i) => (
                        <div 
                          key={i} 
                          className="space-y-2 group relative"
                          draggable
                          onDragStart={(e) => handleDragStart(e, i)}
                          onDrop={(e) => handleDrop(e, i)}
                          onDragOver={handleDragOver}
                        >
                          <div className="aspect-square relative rounded-md overflow-hidden border border-slate-200 bg-slate-50 cursor-move group-hover:border-slate-400 transition-all">
                            {isVideo(img) ? (
                              <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                <Video className="text-white/50" size={32} />
                                <video src={img} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                              </div>
                            ) : (
                              <img src={img} className="w-full h-full object-cover" />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                               <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="bg-white/90 p-1.5 rounded-md text-red-500 shadow-sm"><Trash2 size={13} /></button>
                            </div>
                            <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded uppercase font-bold">
                              {i + 1}
                            </div>
                          </div>
                          <Input value={imageCaptions[i]} onChange={e => { const n = [...imageCaptions]; n[i] = e.target.value; setImageCaptions(n); }} placeholder="Caption..." className="h-8 text-xs" />
                        </div>
                      ))}
                      <label className="aspect-square bg-slate-50 rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors text-slate-400 gap-2">
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <><Upload size={20} /><span className="text-xs">Add Media</span></>}
                        <input type="file" multiple className="hidden" onChange={e => e.target.files && Array.from(e.target.files).forEach(uploadFile)} />
                      </label>
                    </div>
                  )}
                  {type === "video" && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <label className="flex flex-col items-center justify-center gap-2 h-32 bg-slate-50 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-100 transition-colors text-slate-500">
                          {uploading ? <Loader2 size={20} className="animate-spin" /> : <Video size={20} />}
                          <span className="text-sm font-medium">Upload Video</span>
                          <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                        </label>
                        <div className="space-y-2">
                          <Label className="text-xs font-medium text-slate-500">Video URL (YouTube/Direct)</Label>
                          <Input value={videoUrl} onChange={e => { setVideoUrl(e.target.value); if (e.target.value && !images.includes(e.target.value)) setImages(p => [...p, e.target.value]); }} placeholder="https://..." className="h-10 rounded-md" />
                          <p className="text-[10px] text-slate-400">Directly adding to gallery</p>
                        </div>
                      </div>
                      
                      {images.length > 0 && (
                        <div className="pt-4 border-t border-slate-100">
                           <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3 block">Media Order (Drag to reorder)</Label>
                           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                              {images.map((img, i) => (
                                <div 
                                  key={i} 
                                  className="aspect-square relative rounded-md overflow-hidden border border-slate-200 bg-slate-50 cursor-move group hover:border-slate-400 transition-all"
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, i)}
                                  onDrop={(e) => handleDrop(e, i)}
                                  onDragOver={handleDragOver}
                                >
                                  {isVideo(img) ? (
                                    <div className="w-full h-full flex items-center justify-center bg-slate-900">
                                       <Video className="text-white/30" size={20} />
                                       <video src={img} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                    </div>
                                  ) : (
                                    <img src={img} className="w-full h-full object-cover" />
                                  )}
                                  <button type="button" onClick={() => setImages(p => p.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 bg-white/90 p-1 rounded text-red-500 shadow-sm transition-opacity"><X size={10} /></button>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-[9px] py-0.5 text-center font-bold">
                                    {i + 1}
                                  </div>
                                </div>
                              ))}
                           </div>
                        </div>
                      )}
                    </div>
                  )}
                  {type === 'poll' && (
                    <div className="space-y-4">
                       <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-slate-700">Question</Label>
                          <Input value={pollQuestion} onChange={e=>setPollQuestion(e.target.value)} placeholder="Poll question..." className="h-10 rounded-md" />
                       </div>
                       <div className="space-y-3">
                          <Label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Options & Votes</Label>
                          {pollOptions.map((opt, i) => (
                             <div key={i} className="flex gap-3 items-center">
                                <div className="flex-1">
                                   <Input value={opt.label} onChange={e=>{const n=[...pollOptions]; n[i].label=e.target.value; setPollOptions(n);}} className="h-10 bg-white border-slate-200 rounded-md text-sm" placeholder={`Option ${i+1}`} />
                                </div>
                                <div className="w-24">
                                   <Input type="number" value={opt.votes} onChange={e=>{const n=[...pollOptions]; n[i].votes=Number(e.target.value); setPollOptions(n);}} className="h-10 bg-slate-50 border-slate-200 rounded-md text-sm font-medium" placeholder="Votes" />
                                </div>
                                {i>=2 && (
                                   <button type="button" onClick={()=>setPollOptions(p=>p.filter((_,idx)=>idx!==i))} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all">
                                      <X size={16}/>
                                   </button>
                                )}
                             </div>
                          ))}
                          <Button type="button" variant="outline" className="w-full h-10 text-sm text-slate-600 border-dashed border-slate-300 hover:bg-slate-50 hover:border-slate-400 mt-2" onClick={()=>setPollOptions(p=>[...p, {label: "", votes: 0}])}>
                             <Plus size={14} className="mr-2" /> Add Option
                          </Button>
                       </div>
                    </div>
                 )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Music */}
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Music</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4">
                {musicVideoId && (
                  <div className="aspect-video rounded-md overflow-hidden bg-slate-900 mb-4">
                    <YouTube videoId={musicVideoId} opts={{ width: "100%", height: "100%", playerVars: { start: musicStartTime, end: musicEndTime > 0 ? musicEndTime : undefined } }} className="w-full h-full" onReady={e => playerRef.current = e.target} />
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
                  <button type="button" onClick={() => setYtOpen(true)} className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-white rounded-md transition-colors"><Search size={14} /></button>
                </div>
                {musicVideoId && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-500">Start (sec)</Label>
                        <button type="button" onClick={() => captureTime("start")} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Scissors size={10} /> Now</button>
                      </div>
                      <Input type="number" value={musicStartTime} onChange={e => setMusicStartTime(Number(e.target.value))} className="h-9 text-sm rounded-md" />
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-slate-500">End (sec)</Label>
                        <button type="button" onClick={() => captureTime("end")} className="text-xs text-slate-500 hover:text-slate-900 flex items-center gap-1"><Scissors size={10} /> Now</button>
                      </div>
                      <Input type="number" value={musicEndTime} onChange={e => setMusicEndTime(Number(e.target.value))} className="h-9 text-sm rounded-md" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Engagement Boost */}
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
               <CardHeader className="px-6 py-4 border-b border-slate-100">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Engagement Boost</CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-4">
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <Heart size={12} className="text-red-500" /> Like Count
                     </Label>
                     <Input type="number" value={likeCount} onChange={e=>setLikeCount(Number(e.target.value))} className="h-10 rounded-md" />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                        <Send size={12} className="text-blue-500" /> Share Count
                     </Label>
                     <Input type="number" value={shareCount} onChange={e=>setShareCount(Number(e.target.value))} className="h-10 rounded-md" />
                  </div>
               </CardContent>
            </Card>

            {/* Settings */}
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
              <CardHeader className="px-4 sm:px-6 py-4 border-b border-slate-100">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-5">
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-800 flex items-center gap-2">
                       Members Only <Lock size={12} className="text-slate-400" />
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">Require login to view content</p>
                  </div>
                  <Switch checked={membersOnly} onCheckedChange={setMembersOnly} />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button type="submit" onClick={handleSubmit} disabled={saving} className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-sm">
                {saving ? <Loader2 size={15} className="animate-spin mr-2" /> : <Send size={15} className="mr-2" />}
                {isEdit ? "Save Changes" : "Publish Post"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => navigate("/admin/feed")} className="w-full h-9 text-slate-500 text-sm">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* YouTube Modal */}
      {ytOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in">
          <div className="bg-white w-full sm:max-w-lg rounded-t-2xl sm:rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-slate-100 shrink-0">
              <h3 className="text-sm font-semibold text-slate-900">Search Music</h3>
              <button onClick={() => setYtOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              <div className="flex gap-2">
                <input value={ytQuery} onChange={e => setYtQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && searchYT()} className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-md text-sm outline-none focus:border-slate-400 focus:bg-white transition-all" placeholder="Track name..." />
                <Button onClick={searchYT} disabled={isSearching} className="h-10 px-4 bg-slate-900 hover:bg-slate-800 rounded-md">
                  {isSearching ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                </Button>
              </div>
              <div className="space-y-1 max-h-[350px] overflow-y-auto">
                {ytResults.map(vid => (
                  <button key={vid.id.videoId} type="button" onClick={() => { setMusicVideoId(vid.id.videoId); setMusicTitle(vid.snippet.title); setMusicArtist(vid.snippet.channelTitle); setYtOpen(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 rounded-md transition-colors text-left">
                    <img src={vid.snippet.thumbnails.default.url} className="w-12 h-9 rounded-md object-cover" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-medium text-slate-800 truncate">{vid.snippet.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{vid.snippet.channelTitle}</p>
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

export default AdminFeedForm;
