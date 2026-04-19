import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { feedAPI, FeedPost } from "@/lib/adminData";
import {
  Plus, Trash2, Loader2, Upload, X,
  Send, Music, Search, Video, Scissors, ArrowLeft
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
  const [textLayout, setTextLayout] = useState<"default" | "quote">("default");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [linkPreview, setLinkPreview] = useState({ url: "", title: "", description: "", image: "", domain: "" });

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
        setTextLayout(post.textLayout || "default");
        setPollQuestion(post.pollQuestion || "");
        setPollOptions(post.pollOptions?.map((o: any) => o.label) || ["", ""]);
        setMusicVideoId(post.musicVideoId || "");
        setMusicTitle(post.musicTitle || "");
        setMusicArtist(post.musicArtist || "");
        setMusicStartTime(post.musicStartTime || 0);
        setMusicEndTime(post.musicEndTime || 0);
        setLinkPreview(post.linkPreview || { url: "", title: "", description: "", image: "", domain: "" });
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
      if (file.type.startsWith("video/")) setVideoUrl(r.data.url);
      else { setImages(p => [...p, r.data.url]); setImageCaptions(p => [...p, ""]); }
      toast.success("Upload successful");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
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
        type, pinned, published, content, images, imageCaptions, videoUrl,
        textLayout, musicVideoId, musicTitle, musicArtist,
        musicStartTime, musicEndTime, pollQuestion, linkPreview,
        pollOptions: pollOptions.filter(Boolean).map(label => ({ label, votes: 0, voters: [] } as any))
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin/feed")}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{isEdit ? "Edit Post" : "New Post"}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{isEdit ? "Update post details" : "Create a new feed post"}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate("/admin/feed")} className="text-slate-500 text-sm h-9">
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
              <CardHeader className="px-6 py-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Post Details</CardTitle>
                <div className="flex bg-slate-100 p-1 rounded-md">
                  <button type="button" onClick={() => setTextLayout("default")} className={cn("px-3 py-1 text-xs font-medium rounded", textLayout === "default" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Standard</button>
                  <button type="button" onClick={() => setTextLayout("quote")} className={cn("px-3 py-1 text-xs font-medium rounded", textLayout === "quote" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500")}>Quote</button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
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
                <CardContent className="p-6">
                  {type === "image" && (
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((img, i) => (
                        <div key={i} className="space-y-2">
                          <div className="aspect-video relative rounded-md overflow-hidden border border-slate-200">
                            <img src={img} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-md text-red-500 shadow-sm"><X size={13} /></button>
                          </div>
                          <Input value={imageCaptions[i]} onChange={e => { const n = [...imageCaptions]; n[i] = e.target.value; setImageCaptions(n); }} placeholder="Caption..." className="h-8 text-xs" />
                        </div>
                      ))}
                      <label className="aspect-video bg-slate-50 rounded-md border border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors text-slate-400 gap-2">
                        {uploading ? <Loader2 size={20} className="animate-spin" /> : <><Upload size={20} /><span className="text-xs">Add Image</span></>}
                        <input type="file" multiple className="hidden" onChange={e => e.target.files && Array.from(e.target.files).forEach(uploadFile)} />
                      </label>
                    </div>
                  )}
                  {type === "video" && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center justify-center gap-2 h-10 bg-slate-50 border border-dashed border-slate-300 rounded-md cursor-pointer hover:bg-slate-100 transition-colors text-slate-500 text-sm">
                          {uploading ? <Loader2 size={15} className="animate-spin" /> : <Video size={15} />} Upload Video
                          <input type="file" accept="video/*" className="hidden" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
                        </label>
                        <Input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="YouTube URL..." className="h-10 rounded-md" />
                      </div>
                    </div>
                  )}
                  {type === "poll" && (
                    <div className="space-y-3">
                      <Input value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} placeholder="Poll question..." className="h-10 rounded-md" />
                      <div className="space-y-2">
                        {pollOptions.map((opt, i) => (
                          <div key={i} className="flex gap-2">
                            <input value={opt} onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} className="flex-1 h-9 px-3 bg-white border border-slate-200 rounded-md text-sm outline-none" placeholder={`Option ${i + 1}`} />
                            {i >= 2 && <button onClick={() => setPollOptions(p => p.filter((_, idx) => idx !== i))} className="p-1.5 text-red-400 hover:text-red-600"><X size={15} /></button>}
                          </div>
                        ))}
                        <Button type="button" variant="ghost" className="h-8 text-sm text-slate-600 px-3" onClick={() => setPollOptions(p => [...p, ""])}>+ Add Option</Button>
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
              <CardContent className="p-6 space-y-4">
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

            {/* Settings */}
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
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden flex flex-col">
            <div className="h-14 flex items-center justify-between px-5 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Search Music</h3>
              <button onClick={() => setYtOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
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
