import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE, YT_KEYS } from "@/config";
import { 
  Plus, Image as ImageIcon, Music, Loader2, ArrowLeft, Search, X, 
  Scissors, Settings, Volume2, VolumeX, LayoutGrid, Palette, 
  ChevronDown, Type, MoreHorizontal, MousePointer2, Trash2,
  ListFilter, Sparkles, CheckCircle2, MessageSquare, Lock, Link as LinkIcon, BarChart as PollIcon,
  Type as TypeIcon, AlignLeft, AlignCenter, AlignRight, Layers, GripVertical,
  Minus, Plus as PlusIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { storiesDB, StoryItem, StoryLayer } from "@/lib/adminData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import YouTube from "react-youtube";
import { AIRefineButton } from "@/components/admin/AIRefineButton";
import { 
  Slider 
} from "@/components/ui/slider";

const PRESETS: Record<string, string> = {
  None: "none",
  Clarendon: "contrast(1.2) saturate(1.35)",
  Gingham: "brightness(1.05) hue-rotate(-10deg)",
  Moon: "grayscale(1) contrast(1.1) brightness(1.1)",
  Lark: "brightness(1.08) contrast(1.1) saturate(1.3)",
  Reyes: "sepia(0.22) brightness(1.1) contrast(0.85) saturate(0.75)",
  Juno: "contrast(1.2) saturate(1.4) sepia(0.22) hue-rotate(-10deg)",
  Slumber: "brightness(1.05) saturate(0.6) contrast(1)",
  Crema: "saturate(0.9) brightness(1.1)",
  Ludwig: "brightness(1.05) contrast(1.05) saturate(1.2) sepia(0.05)",
  Aden: "hue-rotate(-20deg) contrast(0.9) saturate(0.85) brightness(1.1)"
};

const FONT_OPTIONS = [
  { name: "Modern", value: "story-font-modern" },
  { name: "Classic", value: "story-font-classic" },
  { name: "Mono", value: "story-font-mono" },
  { name: "Bold", value: "story-font-bold" },
  { name: "Script", value: "story-font-script" },
  { name: "Outfit", value: "story-font-outfit" },
];

const PRESET_COLORS = [
  "#ffffff", "#000000", "#ff3b30", "#ff9500", "#ffcc00", "#4cd964", "#5ac8fa", "#007aff", "#5856d6", "#ff2d55", 
  "#a2845e", "#cfd8dc", "#ffcdd2", "#f8bbd0", "#e1bee7", "#d1c4e9", "#c5cae9", "#bbdefb", "#b3e5fc", "#b2ebf2"
];

const AdminStoryEditor = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [item, setItem] = useState<Partial<StoryItem>>({
    active: true, isMembersOnly: false, allowComments: true, layers: [], title: "", duration: 5000, filter: "none", views: 0
  });

  const [activeLayer, setActiveLayer] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [ytQuery, setYtQuery] = useState("");
  const [ytResults, setYtResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [dragInfo, setDragInfo] = useState<{ id: string; startX: number; startY: number; initialLeft: number; initialTop: number } | null>(null);
  const [isOverDelete, setIsOverDelete] = useState(false);
  const [activeDrawer, setActiveDrawer] = useState<"layers" | "filters" | "music" | "settings" | null>(null);
  const [showLayouts, setShowLayouts] = useState(false);
  const [isTrimmingMusic, setIsTrimmingMusic] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const [textEditingId, setTextEditingId] = useState<string | null>(null);

  const playerRef = useRef<any>(null);
  const lastTapRef = useRef<number>(0);
  const [lastPinchDist, setLastPinchDist] = useState<number | null>(null);
  const [lastPinchAngle, setLastPinchAngle] = useState<number | null>(null);

  useEffect(() => {
    if (playerRef.current) {
      if (isMuted) playerRef.current.mute();
      else playerRef.current.unMute();
    }
  }, [isMuted]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    storiesDB.getAll()
      .then(all => {
        const found = all.find(s => s.id === id);
        if (found) setItem({ ...found, layers: found.layers || [], allowComments: found.allowComments ?? true, isMembersOnly: found.isMembersOnly ?? false });
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
    let type: "image" | "video" | "gif" = "image";
    if (file.type.startsWith("video/")) type = "video";
    else if (file.type === "image/gif") type = "gif";

    const fd = new FormData(); fd.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload`, fd);
      setItem(prev => prev ? { ...prev, image: res.data.url, type } : null);
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  };

  const addTextLayer = () => {
    const newLayer: StoryLayer = {
      id: Date.now().toString(), type: "text", content: "New Text",
      top: 50, left: 50, scale: 1, rotation: 0, color: "#ffffff", fontSize: 24, fontFamily: "story-font-outfit"
    };
    setItem(prev => prev ? { ...prev, layers: [...(prev.layers || []), newLayer] } : null);
    setActiveLayer(newLayer.id);
  };

  const addLinkLayer = () => {
    const newLayer: StoryLayer = {
      id: Date.now().toString(), type: "link", content: "Link",
      top: 50, left: 50, scale: 1, rotation: 0, linkUrl: "https://", linkLabel: "Learn More"
    };
    setItem(prev => prev ? { ...prev, layers: [...(prev.layers || []), newLayer] } : null);
    setActiveLayer(newLayer.id);
  };

  const addPollLayer = () => {
    const newLayer: StoryLayer = {
      id: Date.now().toString(), type: "poll", content: "Poll",
      top: 50, left: 50, scale: 1, rotation: 0,
      pollQuestion: "What do you think?",
      pollOptions: [
        { id: "1", label: "Yes", votes: 0, voters: [] },
        { id: "2", label: "No", votes: 0, voters: [] }
      ]
    };
    setItem(prev => prev ? { ...prev, layers: [...(prev.layers || []), newLayer] } : null);
    setActiveLayer(newLayer.id);
  };

  const addImageLayer = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const fd = new FormData(); fd.append("file", file);
      setUploading(true);
      try {
        const res = await axios.post(`${API_BASE}/upload`, fd);
        const newLayer: StoryLayer = { id: Date.now().toString(), type: "image", content: res.data.url, top: 50, left: 50, scale: 0.5, rotation: 0 };
        setItem(prev => prev ? { ...prev, layers: [...(prev.layers || []), newLayer] } : null);
        setActiveLayer(newLayer.id);
      } catch { toast.error("Upload failed"); }
      setUploading(false);
    };
    input.click();
  };

  const applyGridLayout = (type: "1-full" | "2-vert" | "2-horiz" | "4-grid" | "3-left" | "3-horiz" | "6-grid") => {
    const existingImages = item.layers?.filter(l => l.type === "image" && l.content) || [];
    const nonImageLayers = item.layers?.filter(l => l.type !== "image") || [];
    let newLayers: StoryLayer[] = [];

    if (type === "1-full") {
      newLayers = [
        { id: "g1", type: "image", content: "", top: 0, left: 0, width: 100, height: 100, scale: 1, rotation: 0 }
      ];
    } else if (type === "2-vert") {
      newLayers = [
        { id: "g1", type: "image", content: "", top: 0, left: 0, width: 50, height: 100, scale: 1, rotation: 0 },
        { id: "g2", type: "image", content: "", top: 0, left: 50, width: 50, height: 100, scale: 1, rotation: 0 }
      ];
    } else if (type === "2-horiz") {
      newLayers = [
        { id: "g1", type: "image", content: "", top: 0, left: 0, width: 100, height: 50, scale: 1, rotation: 0 },
        { id: "g2", type: "image", content: "", top: 50, left: 0, width: 100, height: 50, scale: 1, rotation: 0 }
      ];
    } else if (type === "4-grid") {
      newLayers = [
        { id: "g1", type: "image", content: "", top: 0, left: 0, width: 50, height: 50, scale: 1, rotation: 0 },
        { id: "g2", type: "image", content: "", top: 0, left: 50, width: 50, height: 50, scale: 1, rotation: 0 },
        { id: "g3", type: "image", content: "", top: 50, left: 0, width: 50, height: 50, scale: 1, rotation: 0 },
        { id: "g4", type: "image", content: "", top: 50, left: 50, width: 50, height: 50, scale: 1, rotation: 0 }
      ];
    } else if (type === "3-left") {
      newLayers = [
        { id: "g1", type: "image", content: "", top: 0, left: 0, width: 50, height: 100, scale: 1, rotation: 0 },
        { id: "g2", type: "image", content: "", top: 0, left: 50, width: 50, height: 50, scale: 1, rotation: 0 },
        { id: "g3", type: "image", content: "", top: 50, left: 50, width: 50, height: 50, scale: 1, rotation: 0 }
      ];
    } else if (type === "3-horiz") {
      newLayers = [
        { id: "g1", type: "image", content: "", top: 0, left: 0, width: 100, height: 33.33, scale: 1, rotation: 0 },
        { id: "g2", type: "image", content: "", top: 33.33, left: 0, width: 100, height: 33.33, scale: 1, rotation: 0 },
        { id: "g3", type: "image", content: "", top: 66.66, left: 0, width: 100, height: 33.34, scale: 1, rotation: 0 }
      ];
    } else if (type === "6-grid") {
      newLayers = [
        { id: "g1", type: "image", content: "", top: 0, left: 0, width: 50, height: 33.33, scale: 1, rotation: 0 },
        { id: "g2", type: "image", content: "", top: 0, left: 50, width: 50, height: 33.33, scale: 1, rotation: 0 },
        { id: "g3", type: "image", content: "", top: 33.33, left: 0, width: 50, height: 33.33, scale: 1, rotation: 0 },
        { id: "g4", type: "image", content: "", top: 33.33, left: 50, width: 50, height: 33.33, scale: 1, rotation: 0 },
        { id: "g5", type: "image", content: "", top: 66.66, left: 0, width: 50, height: 33.34, scale: 1, rotation: 0 },
        { id: "g6", type: "image", content: "", top: 66.66, left: 50, width: 50, height: 33.34, scale: 1, rotation: 0 }
      ];
    }

    // Populate new grid slots with existing images
    newLayers = newLayers.map((l, i) => ({
      ...l,
      content: existingImages[i]?.content || "",
      scale: existingImages[i]?.scale || 1,
      rotation: existingImages[i]?.rotation || 0,
      contentX: existingImages[i]?.contentX || 0,
      contentY: existingImages[i]?.contentY || 0,
    }));

    setItem(prev => ({ ...prev, layers: [...nonImageLayers, ...newLayers] }));
    setActiveLayer(newLayers[0].id);
    setShowLayouts(false);
    toast.success("Grid applied. Tap sections to upload.");
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
    for (const key of YT_KEYS) {
      try {
        const res = await axios.get(`https://www.googleapis.com/youtube/v3/search`, { params: { part: "snippet", q: ytQuery, type: "video", maxResults: 5, key } });
        if (res.data.items) { setYtResults(res.data.items); break; }
      } catch { /* next */ }
    }
    setIsSearching(false);
  };

  const [pointers, setPointers] = useState<Map<number, { x: number, y: number }>>(new Map());

  const handlePointerDown = (e: React.PointerEvent, id: string, initialLeft: number, initialTop: number) => {
    const now = Date.now();
    const isDoubleTap = now - lastTapRef.current < 300;
    lastTapRef.current = now;

    if (id !== "music-sticker") {
      setActiveLayer(id);
      if (isDoubleTap && item.layers?.find(l => l.id === id)?.type === "text") {
        setTextEditingId(id);
      }
    }
    setDraggingLayerId(id);
    const newPointers = new Map(pointers);
    newPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setPointers(newPointers);

    if (newPointers.size === 1) {
      setDragInfo({ id, startX: e.clientX, startY: e.clientY, initialLeft, initialTop });
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const newPointers = new Map(pointers);
    newPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setPointers(newPointers);

    if (!dragInfo?.id) return;
    
    if (newPointers.size === 1) {
      const dx = e.clientX - dragInfo.startX;
      const dy = e.clientY - dragInfo.startY;
      const dxRel = (dx / 380) * 100;
      const dyRel = (dy / 675) * 100;

      if (dragInfo.id === "music-sticker") {
        setItem(prev => prev ? { ...prev, musicX: dragInfo.initialLeft + dxRel, musicY: dragInfo.initialTop + dyRel } : null);
      } else {
        const layer = item.layers?.find(l => l.id === dragInfo.id);
        if (layer?.width) {
          // Grid image: Drag inside slot
          const currentX = layer.contentX || 0;
          const currentY = layer.contentY || 0;
          updateLayer(dragInfo.id, { 
            contentX: currentX + (dx / 3.8), 
            contentY: currentY + (dy / 6.75) 
          });
          setDragInfo({ ...dragInfo, startX: e.clientX, startY: e.clientY });
        } else {
          updateLayer(dragInfo.id, { left: dragInfo.initialLeft + dxRel, top: dragInfo.initialTop + dyRel });
        }
      }

      // Delete detection (Bottom center zone)
      const newY = dragInfo.id === "music-sticker" ? (item.musicY ?? 75) : (item.layers?.find(l => l.id === dragInfo.id)?.top ?? 0);
      const newX = dragInfo.id === "music-sticker" ? (item.musicX ?? 50) : (item.layers?.find(l => l.id === dragInfo.id)?.left ?? 0);
      if (newY > 80 && newX > 35 && newX < 65) {
        setIsOverDelete(true);
      } else {
        setIsOverDelete(false);
      }
    } else if (newPointers.size === 2 && dragInfo.id !== "music-sticker") {
      const pts = Array.from(newPointers.values());
      const p1 = pts[0];
      const p2 = pts[1];
      const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);

      if (lastPinchDist !== null && lastPinchAngle !== null) {
        const scaleChange = dist / lastPinchDist;
        const angleChange = angle - lastPinchAngle;
        const layer = item.layers?.find(l => l.id === dragInfo.id);
        if (layer) {
          updateLayer(dragInfo.id, { 
            scale: Math.max(0.1, Math.min(5, layer.scale * scaleChange)),
            rotation: layer.rotation + angleChange
          });
        }
      }
      setLastPinchDist(dist);
      setLastPinchAngle(angle);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isOverDelete && dragInfo?.id) {
      if (dragInfo.id === "music-sticker") {
        setItem(p => p ? { ...p, musicVideoId: undefined, musicTitle: undefined } : null);
      } else {
        const layer = item.layers?.find(l => l.id === dragInfo.id);
        if (layer?.width) {
          // Clear grid slot content instead of deleting layer
          updateLayer(dragInfo.id, { content: "" });
        } else {
          setItem(p => p ? { ...p, layers: p.layers?.filter(l => l.id !== dragInfo.id) } : null);
        }
      }
    }
    const newPointers = new Map(pointers);
    newPointers.delete(e.pointerId);
    setPointers(newPointers);
    if (newPointers.size < 2) {
      setLastPinchDist(null);
      setLastPinchAngle(null);
    }
    if (newPointers.size === 0) {
      setDragInfo(null);
      setDraggingLayerId(null);
      setIsOverDelete(false);
    }
  };

  if (loading || !item) return (
    <div className="flex h-screen bg-black items-center justify-center">
      <Loader2 size={32} className="animate-spin text-white/20" />
    </div>
  );

  const activeTextLayer = item.layers?.find(l => l.id === activeLayer && l.type === "text");
  const actLayer = item.layers?.find(l => l.id === activeLayer);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden font-inter select-none touch-none"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Dancing+Script:wght@700&family=Outfit:wght@400;700;900&family=Playfair+Display:wght@700;900&family=Roboto+Mono:wght@400;700&display=swap');
        .story-font-modern { font-family: 'Inter', sans-serif !important; }
        .story-font-classic { font-family: 'Playfair Display', serif !important; }
        .story-font-mono { font-family: 'Roboto Mono', monospace !important; }
        .story-font-bold { font-family: 'Bebas Neue', sans-serif !important; }
        .story-font-script { font-family: 'Dancing Script', cursive !important; }
        .story-font-outfit { font-family: 'Outfit', sans-serif !important; }
        
        /* Custom Cute Slider Thumb (Horizontal Bar) */
        [role="slider"] {
          width: 20px !important;
          height: 4px !important;
          border-radius: 9999px !important;
          border: none !important;
          background-color: white !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
          margin-left: -6px !important;
        }
      `}} />
      
      {/* ── Top Header (Instagram Style) ── */}
      <div className="absolute top-0 left-0 right-0 h-16 sm:h-20 px-3 sm:px-6 flex items-center justify-between z-[120] bg-gradient-to-b from-black/60 to-transparent">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/admin/story")} className="p-2 text-white/90 hover:scale-110 transition-all">
            <ArrowLeft size={24}/>
          </button>
        </div>

        {/* Tools in Header */}
        <div className="flex items-center gap-0.5 sm:gap-1.5">
          <button onClick={addTextLayer} className="p-1.5 sm:p-2.5 text-white hover:bg-white/10 rounded-full transition-all"><Type size={20} className="sm:w-[22px] sm:h-[22px]" /></button>
          <button 
            onClick={() => { setShowLayouts(!showLayouts); setActiveDrawer(null); }} 
            className={cn("p-1.5 sm:p-2.5 transition-all rounded-full relative", showLayouts ? "bg-white text-black" : "text-white hover:bg-white/10")}
          >
            <LayoutGrid size={20} className="sm:w-[22px] sm:h-[22px]" />
            {showLayouts && (
              <div className="absolute top-14 right-0 bg-[#1a1a1a] backdrop-blur-3xl p-4 rounded-[28px] border border-white/10 shadow-2xl grid grid-cols-2 gap-3 animate-in zoom-in-95 slide-in-from-top-4 duration-300 w-[130px] z-[210]">
                {[
                  { id: "1-full", icon: <div className="w-full h-full border border-current rounded-sm"/> },
                  { id: "4-grid", icon: <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-[2px] border border-current rounded-sm"><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/></div> },
                  { id: "2-horiz", icon: <div className="flex flex-col w-full h-full gap-[2px] border border-current rounded-sm"><div className="flex-1 border border-current rounded-[1px]"/><div className="flex-1 border border-current rounded-[1px]"/></div> },
                  { id: "3-horiz", icon: <div className="flex flex-col w-full h-full gap-[2px] border border-current rounded-sm"><div className="flex-1 border border-current rounded-[1px]"/><div className="flex-1 border border-current rounded-[1px]"/><div className="flex-1 border border-current rounded-[1px]"/></div> },
                  { id: "2-vert", icon: <div className="flex w-full h-full gap-[2px] border border-current rounded-sm"><div className="flex-1 border border-current rounded-[1px]"/><div className="flex-1 border border-current rounded-[1px]"/></div> },
                  { id: "6-grid", icon: <div className="grid grid-cols-2 grid-rows-3 w-full h-full gap-[2px] border border-current rounded-sm"><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/></div> },
                  { id: "3-left", icon: <div className="flex w-full h-full gap-[2px] border border-current rounded-sm"><div className="flex-1 border border-current rounded-[1px]"/><div className="flex-1 flex flex-col gap-[2px]"><div className="border border-current rounded-[1px]"/><div className="border border-current rounded-[1px]"/></div></div> }
                ].map(lt => (
                  <button key={lt.id} onClick={(e) => { e.stopPropagation(); applyGridLayout(lt.id as any); }} className="w-11 h-14 flex items-center justify-center transition-all active:scale-90 rounded-xl text-white/60 hover:text-white hover:bg-white/5">
                    <div className="w-8 h-10">{lt.icon}</div>
                  </button>
                ))}
              </div>
            )}
          </button>
          <button onClick={() => setActiveDrawer("music")} className="p-1.5 sm:p-2.5 text-white hover:bg-white/10 rounded-full transition-all"><Music size={20} className="sm:w-[22px] sm:h-[22px]" /></button>
          <button onClick={() => setActiveDrawer("layers")} className="p-1.5 sm:p-2.5 text-white hover:bg-white/10 rounded-full transition-all relative"><Layers size={20} className="sm:w-[22px] sm:h-[22px]" />{item.layers?.length ? <div className="absolute top-1.5 right-1.5 sm:top-2.5 sm:right-2.5 w-1.5 h-1.5 bg-blue-500 rounded-full" /> : null}</button>
          <button onClick={() => setActiveDrawer("settings")} className="p-1.5 sm:p-2.5 text-white hover:bg-white/10 rounded-full transition-all"><Settings size={20} className="sm:w-[22px] sm:h-[22px]" /></button>
          
          <button onClick={handleSave} className="ml-1 sm:ml-2 px-3 py-1.5 sm:px-5 sm:py-2 bg-white text-black text-[10px] sm:text-[11px] font-bold uppercase tracking-wider rounded-full hover:scale-105 active:scale-95 transition-all">Done</button>
        </div>
      </div>


      {/* ── Main Canvas ── */}
      <div 
        className="relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden bg-[#111] transition-transform duration-500"
        onClick={(e) => {
          // Tapping blank canvas deselects everything
          if (e.target === e.currentTarget) {
            setActiveLayer(null);
            setTextEditingId(null);
          }
        }}
        style={{ 
          filter: item.filter !== "none" ? item.filter : "none",
          width: "min(380px, calc(100vw - 1rem), calc((100vh - 180px) * 0.5625))",
          height: "min(675px, calc((100vw - 1rem) * 1.777), calc(100vh - 180px))",
          borderRadius: "min(44px, 8vw)"
        }}
      >
        {item.image
          ? (item.type === "video" || item.image.match(/\.(mp4|webm|mov|ogg)$/)
              ? <video src={item.image} autoPlay loop muted={isMuted} playsInline className="w-full h-full object-cover absolute inset-0 pointer-events-none" />
              : <img src={item.image} className="w-full h-full object-cover absolute inset-0 pointer-events-none" />
            )
          : null
        }

        {/* ── On-Canvas Sound Toggle ── */}
        {item.musicVideoId && (
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
            className="absolute top-6 right-6 z-[310] w-10 h-10 rounded-full bg-black/20 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:bg-black/40 transition-all hover:scale-110 active:scale-95"
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        )}

        {item.layers?.map(l => (
          <div key={l.id} 
            onPointerDown={e => {
              e.stopPropagation();
              // If already in text edit mode for this layer, let pointer through for cursor
              if (textEditingId === l.id) return;
              handlePointerDown(e, l.id, l.left, l.top);
            }}
            onPointerUp={handlePointerUp}
            className={cn(
              "absolute group",
              textEditingId === l.id ? "cursor-text z-[60]" : "cursor-grab active:cursor-grabbing select-none touch-none",
              draggingLayerId === l.id ? "z-[60]" : activeLayer === l.id ? "z-50" : "z-10",
              draggingLayerId !== l.id && "transition-all duration-300 ease-out"
            )}
            style={{ 
              top: `${l.top}%`, 
              left: `${l.left}%`, 
              width: l.width ? `${l.width}%` : undefined, 
              height: l.height ? `${l.height}%` : undefined,
              transform: l.width ? undefined : `translate(-50%, -50%) scale(${l.scale * (draggingLayerId === l.id ? 1.05 : 1)}) rotate(${l.rotation}deg)` 
            }}>
            
            {l.type === "text" && (
               <div className="relative">
                  <div 
                    contentEditable={textEditingId === l.id}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      updateLayer(l.id, { content: e.currentTarget.textContent || "" });
                      setTextEditingId(null);
                    }}
                    style={{ 
                      color: l.color, 
                      fontSize: `${l.fontSize}px`, 
                      textShadow: "0px 8px 30px rgba(0,0,0,0.5)",
                      outline: 'none',
                      caretColor: 'white',
                      lineHeight: 1.1,
                      whiteSpace: 'pre-wrap'
                    }} 
                    className={cn(
                      "px-8 py-4 tracking-tight text-center transition-all",
                      l.fontFamily,
                      activeLayer === l.id && textEditingId !== l.id && "ring-2 ring-white/30 rounded-3xl bg-white/5 backdrop-blur-sm",
                      textEditingId === l.id && "cursor-text ring-2 ring-white/60 rounded-3xl bg-white/10 backdrop-blur-sm"
                    )}
                  >
                    {l.content}
                  </div>
                  {activeLayer === l.id && textEditingId !== l.id && (
                    <div className="absolute inset-0 border-2 border-white/40 rounded-2xl -m-1 animate-[pulse_2s_infinite] pointer-events-none" />
                  )}
                  {activeLayer === l.id && textEditingId !== l.id && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xl whitespace-nowrap pointer-events-none backdrop-blur-md">
                      Double Tap to Edit
                    </div>
                  )}
                  {textEditingId === l.id && (
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-white text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-xl whitespace-nowrap pointer-events-none">
                      Tap outside to finish
                    </div>
                  )}
               </div>
            )}
            {l.type === "link" && (
              <div className="bg-white/90 backdrop-blur-xl rounded-full px-8 py-3 shadow-2xl flex items-center gap-3">
                <LinkIcon size={18} className="text-blue-600" />
                <span className="text-sm font-black text-black uppercase tracking-tight">{l.linkLabel}</span>
              </div>
            )}
            {l.type === "poll" && (
               <div className="bg-black/60 backdrop-blur-3xl rounded-[28px] p-6 shadow-2xl border border-white/10 min-w-[240px]">
                  <p className="text-[15px] font-black text-white mb-5 text-center drop-shadow-lg">{l.pollQuestion}</p>
                  <div className="space-y-3">
                    {l.pollOptions?.map(opt => (
                       <div key={opt.id} className="h-12 border border-white/10 rounded-2xl flex items-center justify-center text-xs font-black text-white uppercase tracking-widest bg-white/5">{opt.label}</div>
                    ))}
                  </div>
               </div>
            )}
            {l.type === "image" && (
               <div className={cn("relative overflow-hidden transition-all h-full w-full", activeLayer === l.id ? "ring-4 ring-inset ring-white z-10 shadow-2xl" : "border border-white/10")} 
                    style={{ borderRadius: l.width ? "0px" : "20px" }}>
                 {l.content ? (
                   <img 
                    src={l.content} 
                    className="w-full h-full object-cover pointer-events-none" 
                    style={{ 
                      transform: l.width ? `translate(${l.contentX || 0}px, ${l.contentY || 0}px) scale(${l.scale || 1}) rotate(${l.rotation || 0}deg)` : undefined 
                    }}
                  />
                 ) : (
                   <div className="w-full h-full bg-white/[0.03] flex items-center justify-center flex-col gap-2 border border-white/5 group-hover:bg-white/[0.06] transition-all">
                    <Plus size={20} className="text-white/10 group-hover:text-white/30 transition-colors" />
                    <span className="text-[8px] font-black text-white/5 uppercase tracking-[0.2em]">Slot</span>
                   </div>
                 )}
                 {/* Click overlay for grid slots */}
                 {l.width && <div className="absolute inset-0 cursor-pointer" onClick={(e) => { e.stopPropagation(); setActiveLayer(l.id); if(!l.content) setActiveDrawer("layers"); }} />}
               </div>
            )}
          </div>
        ))}

        {/* ── On-Canvas Music Sticker (Draggable & Stylable) ── */}
        {item.musicVideoId && (
          <div 
            className={cn(
              "absolute z-[70] cursor-move group select-none touch-none",
              draggingLayerId !== "music-sticker" && "transition-all duration-300 ease-out"
            )}
            style={{ 
              left: `${item.musicX ?? 50}%`, 
              top: `${item.musicY ?? 75}%`, 
              transform: `translate(-50%, -50%) scale(${draggingLayerId === "music-sticker" ? 1.1 : 1})` 
            }}
            onPointerDown={(e) => {
              e.stopPropagation();
              handlePointerDown(e, "music-sticker", item.musicX ?? 50, item.musicY ?? 75);
            }}
            onClick={(e) => {
              e.stopPropagation();
              // Cycle through 4 styles
              setItem(p => p ? { ...p, musicStyle: ((p.musicStyle || 0) + 1) % 4 } : null);
            }}
          >
             {/* Style 0: Pill (Default) */}
             {(item.musicStyle === 0 || !item.musicStyle) && (
               <div className="w-[180px] bg-white rounded-xl p-2 shadow-2xl flex items-center gap-2.5 border border-slate-100 animate-in zoom-in-95 duration-300">
                  <img src={`https://img.youtube.com/vi/${item.musicVideoId}/mqdefault.jpg`} className="w-8 h-8 rounded-lg object-cover" />
                  <div className="flex-1 overflow-hidden">
                     <p className="text-[10px] font-bold text-slate-900 truncate tracking-tight leading-tight">{item.musicTitle}</p>
                     <p className="text-[7px] font-medium text-slate-400 truncate mt-0.5">{item.musicArtist}</p>
                  </div>
                  <Music size={10} className="text-slate-300" />
               </div>
             )}

             {/* Style 1: Square / Large Pill */}
             {item.musicStyle === 1 && (
               <div className="bg-black/80 backdrop-blur-xl rounded-2xl p-4 flex flex-col items-center gap-3 border border-white/10 shadow-2xl animate-in zoom-in-95 duration-300 w-[140px]">
                  <img src={`https://img.youtube.com/vi/${item.musicVideoId}/mqdefault.jpg`} className="w-20 h-20 rounded-xl object-cover shadow-lg" />
                  <div className="text-center overflow-hidden w-full">
                     <p className="text-[11px] font-bold text-white truncate">{item.musicTitle}</p>
                     <p className="text-[8px] font-medium text-white/40 truncate mt-0.5">{item.musicArtist}</p>
                  </div>
               </div>
             )}

             {/* Style 2: Minimalist Capsule */}
             {item.musicStyle === 2 && (
               <div className="bg-white/95 backdrop-blur-xl rounded-full px-5 py-2.5 flex items-center gap-3 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-300">
                  <Music size={14} className="text-slate-900" />
                  <div className="overflow-hidden max-w-[120px]">
                     <p className="text-[11px] font-bold text-slate-900 truncate tracking-tight">{item.musicTitle}</p>
                  </div>
               </div>
             )}

             {/* Style 3: Nothing (Music Only / Ghost Icon) */}
             {item.musicStyle === 3 && (
               <div className="w-12 h-12 rounded-full bg-black/20 backdrop-blur-sm flex items-center justify-center border border-white/10 text-white shadow-xl animate-in zoom-in-95 duration-300 hover:bg-black/40 transition-colors">
                  <Music size={20} className="opacity-60" />
               </div>
             )}
          </div>
        )}

        {/* ── Drag-to-Delete Zone ── */}
        {dragInfo && (
          <div className={cn(
            "absolute bottom-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-3 transition-all duration-300 pointer-events-none",
            isOverDelete ? "scale-150" : "scale-100"
          )}>
            <div className={cn(
              "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300",
              isOverDelete ? "bg-red-500 border-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.8)]" : "border-white/40 bg-black/40 backdrop-blur-xl text-white/60"
            )}>
              <Trash2 size={isOverDelete ? 32 : 24} className={cn(isOverDelete && "animate-pulse")} />
            </div>
            {isOverDelete && <span className="text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">Release to Remove</span>}
          </div>
        )}

        {/* Floating Contextual Sidebar (Slim & Cute Vertical Slider) */}
        {activeTextLayer && (
          <div className="absolute right-6 top-1/2 -translate-y-1/2 h-56 w-10 bg-black/40 backdrop-blur-3xl rounded-full border border-white/10 flex flex-col items-center justify-between py-4 z-[140] animate-in slide-in-from-right-8 duration-500 shadow-2xl group">
            <button 
              onPointerDown={(e) => { e.stopPropagation(); updateLayer(activeTextLayer.id, { fontSize: Math.min(200, (activeTextLayer.fontSize || 24) + 2) }) }}
              className="p-1.5 text-white/40 hover:text-white transition-colors"
            >
              <PlusIcon size={14} />
            </button>

            <div className="flex-1 w-full flex flex-col items-center py-2 relative">
               <Slider 
                 orientation="vertical" 
                 value={[activeTextLayer.fontSize || 24]} 
                 onValueChange={v => updateLayer(activeTextLayer.id, { fontSize: v[0] })} 
                 min={8} 
                 max={200} 
                 step={1} 
                 className="h-full z-10" 
               />
            </div>

            <button 
              onPointerDown={(e) => { e.stopPropagation(); updateLayer(activeTextLayer.id, { fontSize: Math.max(8, (activeTextLayer.fontSize || 24) - 2) }) }}
              className="p-1.5 text-white/40 hover:text-white transition-colors"
            >
              <Minus size={14} />
            </button>
            
            <div className="absolute -left-10 top-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-xl px-2 py-1 rounded-lg border border-white/10 text-[9px] font-black text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
              {activeTextLayer.fontSize}
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom Bar ── */}
      {/* ── Floating Upload Button (Relocated to prevent overlap) ── */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[110]">
        <div className="relative group">
           <button className="w-14 h-14 rounded-full border-2 border-white/20 overflow-hidden flex items-center justify-center bg-black/40 backdrop-blur-3xl group-hover:border-white transition-all shadow-xl">
             {item.image ? <img src={item.image} className="w-full h-full object-cover opacity-60" /> : <ImageIcon size={22} className="text-white/60" />}
             <input type="file" accept="image/*,video/*" onChange={handleUploadBg} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
           </button>
           {uploading && <div className="absolute -top-1 -right-1"><Loader2 size={16} className="animate-spin text-blue-500" /></div>}
        </div>
      </div>

      {/* ── Bottom Filter Bar (Anchored to Bottom) ── */}
      <div className="absolute bottom-4 inset-x-0 z-[120] pointer-events-auto overflow-hidden flex flex-col gap-4">
        {/* Contextual Color Strip (Above Filters) */}
        {activeTextLayer && (
          <div className="flex flex-nowrap gap-2.5 px-6 py-2 overflow-x-auto scrollbar-none animate-in fade-in slide-in-from-bottom-4 duration-500">
            {PRESET_COLORS.map(c => (
              <button 
                key={c} 
                onClick={(e) => { e.stopPropagation(); updateLayer(activeTextLayer.id, { color: c }); }}
                className={cn(
                  "w-7 h-7 rounded-full border border-white/20 transition-all shrink-0 shadow-lg",
                  activeTextLayer.color === c ? "scale-125 border-white ring-4 ring-white/10" : "hover:scale-110"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        <div className="flex gap-4 overflow-x-auto w-full px-[calc(50%-28px)] py-4 scrollbar-none snap-x snap-mandatory scroll-smooth" style={{ WebkitOverflowScrolling: 'touch' }}>
          {Object.keys(PRESETS).map(name => (
            <button key={name} onClick={(e) => { e.stopPropagation(); setItem(prev => prev ? { ...prev, filter: PRESETS[name] } : null); }} className="flex flex-col items-center gap-2 snap-center shrink-0 group">
              <div className={cn("w-14 h-14 rounded-full overflow-hidden border-2 transition-all shadow-2xl bg-slate-900/40 backdrop-blur-xl relative", item.filter === PRESETS[name] ? "border-white scale-110 ring-4 ring-white/10" : "border-white/20 opacity-60 group-hover:opacity-100")}>
                <div className="w-full h-full" style={{ filter: PRESETS[name] }}>
                  {item.image ? <img src={item.image} className="w-full h-full object-cover" alt={name} /> : <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900" />}
                </div>
              </div>
              <span className={cn("text-[8px] font-black uppercase tracking-[0.2em]", item.filter === PRESETS[name] ? "text-white" : "text-white/30")}>{name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Music Trimmer Overlay (Directly on Canvas) ── */}
      {isTrimmingMusic && item.musicVideoId && (
        <div className="fixed inset-0 z-[250] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 flex flex-col items-center justify-center">
          <div className="absolute top-4 sm:top-8 left-0 right-0 px-4 sm:px-8 flex items-center justify-between">
             <button onClick={() => setIsTrimmingMusic(false)} className="p-2 text-white/40 hover:text-white transition-colors"><X size={24}/></button>
             <button onClick={() => setIsTrimmingMusic(false)} className="px-6 py-2 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-full">Done</button>
          </div>

          <div className="flex-1" /> {/* Spacer */}

          {/* Music Sticker Mockup */}
          <div className="w-[90%] max-w-[280px] bg-white rounded-xl p-3 shadow-2xl animate-in zoom-in-95 duration-500 flex items-center gap-3">
             <img src={`https://img.youtube.com/vi/${item.musicVideoId}/mqdefault.jpg`} className="w-12 h-12 rounded-lg object-cover" />
             <div className="flex-1 overflow-hidden">
                <p className="text-[13px] font-bold text-slate-900 truncate tracking-tight leading-tight">{item.musicTitle}</p>
                <p className="text-[10px] font-medium text-slate-400 truncate mt-0.5">{item.musicArtist}</p>
             </div>
             <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center text-slate-300">
               <Music size={12} />
             </div>
          </div>

          <div className="flex-1" /> {/* Spacer */}

          {/* YouTube Player (Hidden) - Moved out to be persistent */}
          <div className="hidden">
            <YouTube 
              videoId={item.musicVideoId} 
              opts={{ playerVars: { start: item.musicStartTime || 0, end: (item.musicEndTime || 0) > 0 ? item.musicEndTime : undefined, autoplay: 1, controls: 0, loop: 1, playlist: item.musicVideoId } }} 
              onReady={e => playerRef.current = e.target} 
            />
          </div>

          {/* Bottom Trimmer Bar */}
          <div className="absolute bottom-8 sm:bottom-16 inset-x-0 px-4 sm:px-8 animate-in slide-in-from-bottom-8 duration-500">
              <div className="relative h-16 flex items-center justify-center w-full max-w-sm mx-auto">
                <div className="absolute inset-0 flex items-center justify-between px-2 overflow-hidden">
                  {Array.from({ length: 40 }).map((_, i) => {
                    return <div key={i} className="w-[2px] sm:w-[3px] bg-white/10 h-5 rounded-full shrink-0 mx-[2px] sm:mx-1" />;
                  })}
                </div>
                
                {/* Visual Window with Gradient Background */}
                <div 
                  className="absolute inset-y-0 z-10 flex items-center justify-center shadow-2xl"
                  style={{ 
                    left: `${((item.musicStartTime || 0) / 180) * 100}%`,
                    width: `${(((item.musicEndTime || 15) - (item.musicStartTime || 0)) / 180) * 100}%`,
                  }}
                >
                   <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-orange-500 to-purple-600 rounded-xl opacity-90" />
                   <div className="absolute inset-[2.5px] bg-white rounded-lg flex items-center justify-between px-2 sm:px-3 overflow-hidden shadow-inner">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="w-[2px] bg-slate-100 h-6 rounded-full shrink-0 mx-0.5 sm:mx-1" />
                      ))}
                   </div>
                </div>

                <Slider 
                  value={[item.musicStartTime || 0, item.musicEndTime || 15]} 
                  onValueChange={v => {
                    const [s, e] = v;
                    setItem(p => ({ ...p, musicStartTime: s, musicEndTime: e }));
                    if (playerRef.current) playerRef.current.seekTo(s);
                  }} 
                  min={0} 
                  max={180} 
                  step={1} 
                  minStepsBetweenThumbs={1}
                  className="absolute inset-0 z-20"
                />
             </div>
          </div>
        </div>
      )}

      {/* Global Background Music Player (Persistent) */}
      {!isTrimmingMusic && item.musicVideoId && (
        <div className="hidden">
          <YouTube 
            videoId={item.musicVideoId} 
            opts={{ playerVars: { start: item.musicStartTime || 0, end: (item.musicEndTime || 0) > 0 ? item.musicEndTime : undefined, autoplay: 1, controls: 0, loop: 1, playlist: item.musicVideoId } }} 
            onReady={e => playerRef.current = e.target} 
          />
        </div>
      )}

      {/* ── Settings Drawer ── */}
      {activeDrawer && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveDrawer(null)} />
          <div className={cn(
            "relative w-full sm:max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-10",
            activeDrawer === "music" ? "bg-black/60 backdrop-blur-3xl rounded-t-[40px] sm:rounded-[40px] border border-white/10" : "bg-white rounded-t-[32px] sm:rounded-[32px] shadow-[0_0_100px_rgba(0,0,0,0.5)]"
          )}>
            <div className={cn(
              "h-16 flex items-center justify-between px-8 shrink-0",
              activeDrawer === "music" ? "text-white" : "text-slate-900 border-b border-slate-100"
            )}>
               <h3 className="text-sm font-black uppercase tracking-widest">{activeDrawer.toUpperCase()}</h3>
               <button onClick={() => setActiveDrawer(null)} className="p-2 transition-colors hover:scale-110"><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none">
              {activeDrawer === "settings" && (
                <div className="space-y-8">
                  <div className="space-y-2.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Story Title</Label>
                    <Input value={item.title || ""} onChange={e => setItem({ ...item, title: e.target.value })} className="h-12 rounded-2xl bg-slate-50 border-none text-sm font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-[24px] flex flex-col gap-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock size={12}/> Members Only</Label>
                      <Switch checked={item.isMembersOnly} onCheckedChange={v => setItem({ ...item, isMembersOnly: v })} />
                    </div>
                    <div className="p-4 bg-slate-50 rounded-[24px] flex flex-col gap-3">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><MessageSquare size={12}/> Comments</Label>
                      <Switch checked={item.allowComments} onCheckedChange={v => setItem({ ...item, allowComments: v })} />
                    </div>
                  </div>
                </div>
              )}
              {activeDrawer === "layers" && (
                <div className="space-y-8">
                  {actLayer ? (
                    <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-6 animate-in zoom-in-95">
                       <div className="flex items-center justify-between mb-4">
                          <span className="text-xs font-black text-slate-900 uppercase">Edit {actLayer.type}</span>
                          <button onClick={() => setItem(p => p ? { ...p, layers: p.layers?.filter(l => l.id !== actLayer.id) } : null)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><Trash2 size={18}/></button>
                       </div>
                       {actLayer.type === "text" && (
                         <div className="space-y-6">
                            <div className="flex items-center justify-between"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Content</Label><AIRefineButton value={actLayer.content} onRefine={(v) => updateLayer(actLayer.id, { content: v })} context="Story text" /></div>
                            <Input value={actLayer.content} onChange={e => updateLayer(actLayer.id, { content: e.target.value })} className="h-12 rounded-2xl border-none bg-white text-sm font-bold shadow-sm" />
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">Size</Label><Input type="number" value={actLayer.fontSize} onChange={e => updateLayer(actLayer.id, { fontSize: Number(e.target.value) })} className="h-10 rounded-xl" /></div>
                               <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">Color</Label><Input type="color" value={actLayer.color} onChange={e => updateLayer(actLayer.id, { color: e.target.value })} className="h-10 w-full p-1 rounded-xl" /></div>
                            </div>
                         </div>
                       )}
                       {actLayer.type === "link" && (
                         <div className="space-y-6">
                            <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">Label</Label><Input value={actLayer.linkLabel} onChange={e => updateLayer(actLayer.id, { linkLabel: e.target.value })} className="h-12 rounded-2xl" /></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">URL/Path</Label><Input value={actLayer.linkUrl} onChange={e => updateLayer(actLayer.id, { linkUrl: e.target.value })} className="h-12 rounded-2xl" /></div>
                         </div>
                       )}
                       {actLayer.type === "poll" && (
                          <div className="space-y-6">
                             <div className="space-y-2"><Label className="text-[10px] font-black text-slate-400 uppercase">Question</Label><Input value={actLayer.pollQuestion} onChange={e => updateLayer(actLayer.id, { pollQuestion: e.target.value })} className="h-12 rounded-2xl" /></div>
                             {actLayer.pollOptions?.map((opt, idx) => (
                                <Input key={opt.id} value={opt.label} onChange={e => {
                                  const o = [...(actLayer.pollOptions || [])]; o[idx].label = e.target.value; updateLayer(actLayer.id, { pollOptions: o });
                                }} className="h-10 rounded-xl" />
                             ))}
                          </div>
                       )}
                       {actLayer.type === "image" && (
                         <div className="relative group overflow-hidden rounded-2xl h-32 border-2 border-dashed border-slate-200 hover:border-blue-400 transition-all flex items-center justify-center">
                            <ImageIcon size={20} className="text-slate-400 mr-2" />
                            <span className="text-[10px] font-black text-slate-400 uppercase">Change Image</span>
                            <input type="file" accept="image/*" onChange={async (e) => {
                              const f = e.target.files?.[0]; if (!f) return;
                              setUploading(true); const fd = new FormData(); fd.append("file", f);
                              try { const res = await axios.post(`${API_BASE}/upload`, fd); updateLayer(actLayer.id, { content: res.data.url }); } catch { toast.error("Fail"); }
                              setUploading(false);
                            }} className="absolute inset-0 opacity-0 cursor-pointer" />
                         </div>
                       )}
                       <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-4 border-t border-slate-200">
                          <div className="space-y-4"><Label className="text-[9px] font-black text-slate-400 uppercase">Scale</Label><Slider value={[actLayer.scale * 100]} onValueChange={v => updateLayer(actLayer.id, { scale: v[0] / 100 })} min={10} max={400} step={1} /></div>
                          <div className="space-y-4"><Label className="text-[9px] font-black text-slate-400 uppercase">Rotation</Label><Slider value={[actLayer.rotation]} onValueChange={v => updateLayer(actLayer.id, { rotation: v[0] })} min={0} max={360} step={1} /></div>
                       </div>
                    </div>
                  ) : (
                    <div className="p-12 flex flex-col items-center justify-center bg-slate-50 rounded-[32px] border-2 border-dashed border-slate-100 opacity-60">
                       <MousePointer2 size={32} className="text-slate-300 mb-4" />
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select a layer to edit</p>
                    </div>
                  )}
                </div>
              )}

              {activeDrawer === "music" && (
                <div className="flex flex-col h-full -mx-8 -my-8 overflow-hidden">
                  {/* Transparent Search Header */}
                  <div className="p-6 sticky top-0 z-20">
                    <div className="relative group">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                      <Input 
                        value={ytQuery} 
                        onChange={e => setYtQuery(e.target.value)} 
                        onKeyDown={e => e.key === "Enter" && searchYT()} 
                        className="h-11 pl-11 pr-11 rounded-xl bg-white/10 border-none text-[13px] font-medium text-white placeholder:text-white/30 focus:ring-2 ring-white/10 transition-all" 
                        placeholder="Search music..." 
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 scrollbar-none">
                    <div className="space-y-1">
                      {ytResults.map(vid => (
                        <button 
                          key={vid.id.videoId} 
                          onClick={() => { 
                            setItem(p => p ? { 
                              ...p, 
                              musicVideoId: vid.id.videoId, 
                              musicTitle: vid.snippet.title, 
                              musicArtist: vid.snippet.channelTitle, 
                              musicStartTime: 0, 
                              musicEndTime: 15,
                              musicX: 50,
                              musicY: 75,
                              musicStyle: 0
                            } : null); 
                            setIsTrimmingMusic(true);
                            setActiveDrawer(null);
                          }} 
                          className="w-full flex items-center gap-5 p-3 hover:bg-white/5 rounded-[20px] transition-all text-left group"
                        >
                          <div className="relative shrink-0">
                            <img src={vid.snippet.thumbnails.default.url} className="w-14 h-14 rounded-[14px] object-cover shadow-sm" />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-[14px]" />
                          </div>
                          <div className="overflow-hidden flex-1 py-1">
                            <p className="text-[14px] font-semibold text-white truncate tracking-tight leading-tight">{vid.snippet.title}</p>
                            <p className="text-[11px] text-white/50 font-medium mt-1 truncate">{vid.snippet.channelTitle}</p>
                          </div>
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
                            <div className="w-0 h-0 border-t-[5px] border-t-transparent border-l-[8px] border-l-white border-b-[5px] border-b-transparent ml-1" />
                          </div>
                        </button>
                      ))}
                      
                      {!ytResults.length && !isSearching && (
                        <div className="py-24 flex flex-col items-center justify-center text-white/10">
                          <Music size={40} className="mb-4" />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Find your soundtrack</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStoryEditor;
