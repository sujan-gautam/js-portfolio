import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { 
  blogPostsDB, BlogPost, 
  blogCategoriesDB, BlogCategory, 
  blogTagsDB, BlogTag,
  generateId 
} from "@/lib/adminData";
import { 
  Save, X, Image as ImageIcon, Globe, Lock, Clock, 
  Search, Plus, Wand2, Type, Tag, Layout, 
  ChevronDown, MessageSquare, Info, BarChart3,
  RefreshCw, Eye, History, FileText, Sparkles, Loader2, Trash, Heart
} from "lucide-react";
import TiptapEditor from "@/components/admin/TiptapEditor";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import axios from "axios";
import { API_BASE } from "@/config";


const AdminBlogForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [allTags, setAllTags] = useState<BlogTag[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<BlogPost>>({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    featuredImage: "",
    status: "Draft",
    emotionalTone: "Reflective",
    perspectiveType: "First-person",
    category: "",
    tags: [],
    images: [],
    attachments: [],
    seo: {
      title: "",
      description: "",
      keywords: "",
      ogImage: "",
      canonicalUrl: ""
    },
    comments: [],
    readTime: 0,
    wordCount: 0,
    pinned: false,
    views: 0,
    reactions: { heart: 0, fire: 0, like: 0, insightful: 0 }
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, tags] = await Promise.all([
          blogCategoriesDB.getAll(),
          blogTagsDB.getAll()
        ]);
        setCategories(cats);
        setAllTags(tags);

        if (isEdit && id) {
          const post = await blogPostsDB.getById(id);
          if (post) {
            setFormData({
              ...post,
              images: post.images || [],
              attachments: post.attachments || []
            });
          }
        }
      } catch (err) {
        toast.error("Failed to load data");
      }
      setLoading(false);
    };
    loadData();
  }, [isEdit, id]);

  // Automatic Server-Side Draft Creation
  useEffect(() => {
    if (isEdit || id) return;

    const createInitialDraft = async () => {
      try {
        setLoading(true);
        // Create a minimal draft record
        const draftPayload: Partial<BlogPost> = {
          title: "(Draft) New Narrative",
          slug: `draft-${Date.now()}`,
          status: "Draft",
          content: "",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        const res = await axios.post(`${API_BASE}/collection/blog_posts`, draftPayload);
        const newPost = res.data;
        
        if (newPost && (newPost.id || newPost._id)) {
          const finalId = newPost.id || newPost._id;
          navigate(`/admin/blog/edit/${finalId}`, { replace: true });
          toast.info("New draft initialized");
        }
      } catch (err) {
        console.error("Failed to create draft:", err);
        toast.error("Failed to initialize draft");
      } finally {
        setLoading(false);
      }
    };

    createInitialDraft();
  }, [isEdit, id, navigate]);

  const updateSlug = (title: string) => {
    if (isEdit) return; // Don't auto-update slug on edit
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setFormData(prev => ({ ...prev, title }));
    updateSlug(title);
  };

  const handleContentChange = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    const readTime = Math.ceil(wordCount / 200); // Average 200 wpm
    setFormData(prev => ({ ...prev, content, wordCount, readTime }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isFeatured: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);
    
    try {
      const uploadedAssets = [];
      for (let i = 0; i < files.length; i++) {
        const uploadData = new FormData();
        uploadData.append("file", files[i]);
        const res = await axios.post(`${API_BASE}/upload`, uploadData);
        uploadedAssets.push(res.data.url);
      }

      if (isFeatured) {
        setFormData(prev => ({ ...prev, featuredImage: uploadedAssets[0] }));
      } else {
        const newImages = uploadedAssets.map(url => ({ 
          url, 
          alt: formData.title || "Blog Image", 
          caption: "" 
        }));
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), ...newImages] }));
      }
      toast.success("Upload successful", { id: toastId });
    } catch {
      toast.error("Upload failed", { id: toastId });
    }
  };

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const toastId = toast.loading(`Attaching ${files.length} resource(s)...`);
    
    try {
      const newAttachments = [];
      for (let i = 0; i < files.length; i++) {
        const uploadData = new FormData();
        uploadData.append("file", files[i]);
        const res = await axios.post(`${API_BASE}/upload`, uploadData);
        newAttachments.push({
          name: files[i].name,
          url: res.data.url,
          size: files[i].size,
          fileType: files[i].type
        });
      }
      setFormData(prev => ({ ...prev, attachments: [...(prev.attachments || []), ...newAttachments] }));
      toast.success("Attachments added", { id: toastId });
    } catch {
      toast.error("Attachment upload failed", { id: toastId });
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const updateImageMetadata = (index: number, field: 'alt' | 'caption', value: string) => {
    const newImages = [...(formData.images || [])];
    newImages[index] = { ...newImages[index], [field]: value };
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments?.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!formData.title || !formData.slug) {
      toast.error("Title and Slug are required");
      return;
    }

    setSaving(true);
    try {
      // Clean up category: if it's empty string, set it to null to avoid Mongoose validation error
      const cleanedData = {
        ...formData,
        category: formData.category === "" ? null : formData.category
      };

      if (isEdit && id) {
        await blogPostsDB.update(id, cleanedData);
        toast.success("Article updated");
      } else {
        const newPost = {
          ...cleanedData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as BlogPost;
        await blogPostsDB.create(newPost);
        toast.success("Article created");
      }
      navigate("/admin/blog");
    } catch (err: any) {
      console.error("Save Error:", err.response?.data || err.message);
      toast.error(err.response?.data?.error || err.message || "Save failed");
    }
    setSaving(false);
  };

  const refineWithAI = async (field: string) => {
    const text = (formData as any)[field];
    if (!text) return;

    setAiLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/utils/refine-content`, {
        text,
        context: `Refining a ${field} for a blog post with a ${formData.emotionalTone} tone and ${formData.perspectiveType} perspective.`
      });
      setFormData(prev => ({ ...prev, [field]: res.data.refined }));
      toast.success(`${field} refined with AI`);
    } catch {
      toast.error("AI refinement failed");
    }
    setAiLoading(false);
  };

  const generateAITitle = async () => {
    if (!formData.content) return;
    setAiLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/ai/ask`, {
        prompt: `Based on this blog post content, generate a compelling, high-fidelity title. Tone: ${formData.emotionalTone}. Content: ${formData.content.substring(0, 1000)}`
      });
      setFormData(prev => ({ ...prev, title: res.data.answer.replace(/[""]/g, "").trim() }));
      toast.success("Title generated");
    } catch { toast.error("AI generation failed"); }
    setAiLoading(false);
  };


  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
        <p className="text-sm text-slate-500 font-medium animate-pulse">Loading Article...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-24 font-inter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/admin/blog")}
            className="rounded-full hover:bg-slate-100"
          >
            <X size={20} className="text-slate-500" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {isEdit ? "Edit Article" : "Create New Article"}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <FileText size={12} /> {isEdit ? "Modifying existing content" : "Starting a new narrative"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
            className="border-slate-200 text-slate-600 font-medium"
          >
            {showPreview ? <Type size={16} className="mr-2" /> : <Eye size={16} className="mr-2" />}
            {showPreview ? "Editor" : "Preview"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 shadow-sm shadow-indigo-100"
          >
            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save size={16} className="mr-2" />}
            {isEdit ? "Update Article" : "Publish Narrative"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6">
          {showPreview ? (
            <Card className="bg-white border-slate-200 p-8 min-h-[600px] rounded-xl shadow-sm overflow-hidden prose prose-indigo max-w-none">
              <h1 className="text-4xl font-extrabold text-slate-900 mb-4">{formData.title || "Untitled Article"}</h1>
              {formData.featuredImage && (
                <img src={formData.featuredImage} className="w-full h-auto rounded-xl mb-8 object-cover max-h-[400px]" alt="" />
              )}
              <div dangerouslySetInnerHTML={{ __html: formData.content?.replace(/\n/g, '<br />') || "" }} />
            </Card>
          ) : (
            <div className="space-y-6">
              <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
                <div className="space-y-4">
                  <div className="relative group">
                    <Label htmlFor="title" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Article Title</Label>
                    <div className="relative">
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={handleTitleChange}
                        placeholder="Enter a compelling title..."
                        className="text-xl font-bold h-14 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 rounded-xl transition-all"
                      />
                      <button 
                        onClick={generateAITitle}
                        disabled={aiLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Generate with AI"
                      >
                        {aiLoading ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={18} />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <Label htmlFor="slug" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">URL Slug</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">/post/</span>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={e => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                          className="pl-14 border-slate-200 font-mono text-sm h-11 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="w-full sm:w-48">
                      <Label htmlFor="status" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Status</Label>
                      <select
                        id="status"
                        value={formData.status}
                        onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full h-11 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none"
                      >
                        <option value="Draft">Draft</option>
                        <option value="Published">Published</option>
                        <option value="Scheduled">Scheduled</option>
                      </select>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-slate-400" />
                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Editor</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
                    <span>{formData.wordCount} words</span>
                    <span>{formData.readTime} min read</span>
                  </div>
                </div>
                <div className="relative min-h-[500px]">
                  <TiptapEditor
                    content={formData.content || ""}
                    onChange={(newContent) => {
                      const text = newContent.replace(/<[^>]*>/g, '');
                      const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
                      const readTime = Math.ceil(wordCount / 200);
                      setFormData(prev => ({ ...prev, content: newContent, wordCount, readTime }));
                    }}
                  />
                  <div className="absolute right-4 bottom-4 z-10">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => refineWithAI('content')}
                      disabled={aiLoading}
                      className="bg-white/80 backdrop-blur-sm border-slate-200 text-indigo-600 hover:text-indigo-700 shadow-lg"
                    >
                      {aiLoading ? <Loader2 className="animate-spin mr-2" size={14} /> : <Wand2 size={14} className="mr-2" />}
                      Refine Content
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
                <Label htmlFor="excerpt" className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Excerpt / Summary</Label>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  placeholder="A short summary for social sharing and feed cards..."
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all outline-none resize-none"
                />
              </Card>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Layout size={16} className="text-indigo-500" /> Narrative Settings
            </h3>
            
            <div className="space-y-6">
              <div>
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 block">Emotional Tone</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Reflective", "Analytical", "Storytelling", "Philosophical"].map(tone => (
                    <button
                      key={tone}
                      onClick={() => setFormData(prev => ({ ...prev, emotionalTone: tone as any }))}
                      className={cn(
                        "py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center",
                        formData.emotionalTone === tone 
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-4 ring-indigo-500/5" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 block">Perspective</Label>
                <div className="flex gap-2">
                  {["First-person", "Third-person", "Mixed"].map(p => (
                    <button
                      key={p}
                      onClick={() => setFormData(prev => ({ ...prev, perspectiveType: p as any }))}
                      className={cn(
                        "flex-1 py-2 text-xs font-semibold rounded-lg border transition-all text-center",
                        formData.perspectiveType === p 
                          ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200" 
                          : "bg-white border-slate-100 text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {p.split('-')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2.5 block">Category</Label>
                <select
                  value={formData.category}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 text-sm font-medium transition-all outline-none focus:border-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </Card>


          <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <ImageIcon size={16} className="text-indigo-500" /> Featured Media
            </h3>
            <div className="space-y-4">
              <div 
                className="relative aspect-video rounded-xl border-2 border-dashed border-slate-100 bg-slate-50/50 flex flex-col items-center justify-center overflow-hidden hover:bg-slate-50 transition-all cursor-pointer group"
                onClick={() => document.getElementById('featured-image')?.click()}
              >
                {formData.featuredImage ? (
                  <>
                    <img src={formData.featuredImage} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" alt="" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <RefreshCw size={24} className="text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Plus size={24} className="mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add Cover Image</span>
                  </div>
                )}
                <input id="featured-image" type="file" className="hidden" onChange={(e) => handleImageUpload(e, true)} accept="image/*" />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Layout size={16} className="text-indigo-500" /> Gallery & SEO
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                type="button"
                className="h-8 text-indigo-600 text-[11px] font-bold uppercase"
                onClick={() => document.getElementById('gallery-upload')?.click()}
              >
                <Plus size={14} className="mr-1" /> Add Images
              </Button>
              <input id="gallery-upload" type="file" multiple className="hidden" onChange={(e) => handleImageUpload(e)} accept="image/*" />
            </div>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-thin">
              {formData.images?.map((img, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-3 relative group">
                  <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 relative">
                    <img src={img.url} className="w-full h-full object-cover" alt="" />
                    <button 
                      type="button"
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Alt Text (SEO)</Label>
                      <input 
                        value={img.alt}
                        onChange={(e) => updateImageMetadata(idx, 'alt', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-500"
                        placeholder="Describe the image for Google..."
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Caption</Label>
                      <input 
                        value={img.caption}
                        onChange={(e) => updateImageMetadata(idx, 'caption', e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-600 outline-none focus:border-indigo-500"
                        placeholder="Visible caption below image..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              {(!formData.images || formData.images.length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-xl">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Gallery Images</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-indigo-500" /> Research Resources
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                type="button"
                className="h-8 text-indigo-600 text-[11px] font-bold uppercase"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Plus size={14} className="mr-1" /> Attach
              </Button>
              <input id="file-upload" type="file" multiple className="hidden" onChange={handleAttachmentUpload} />
            </div>

            <div className="space-y-2">
              {formData.attachments?.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                      <FileText size={14} />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[11px] font-bold text-slate-700 truncate">{file.name}</span>
                      <span className="text-[9px] text-slate-400 font-medium uppercase">{(file.size / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeAttachment(idx)}
                    className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              ))}
              {(!formData.attachments || formData.attachments.length === 0) && (
                <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-lg">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No Attachments</p>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-500" /> Engagement Boost
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Eye size={12} className="text-blue-500" /> Views
                </Label>
                <Input 
                  type="number" 
                  value={formData.views || 0} 
                  onChange={e => setFormData(p => ({ ...p, views: Number(e.target.value) }))} 
                  className="h-9 text-xs" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Heart size={12} className="text-red-500" /> Like Count
                </Label>
                <Input 
                  type="number" 
                  value={formData.reactions?.like || 0} 
                  onChange={e => setFormData(p => ({ 
                    ...p, 
                    reactions: { ...(p.reactions || { heart: 0, fire: 0, like: 0, insightful: 0 }), like: Number(e.target.value) } 
                  }))} 
                  className="h-9 text-xs" 
                />
              </div>
            </div>
          </Card>

          <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Globe size={16} className="text-indigo-500" /> Visibility & Pinning
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Pin to Top</p>
                  <p className="text-[10px] text-slate-400 font-medium">Show at top of feed</p>
                </div>
                <Switch 
                  checked={formData.pinned || false} 
                  onCheckedChange={(val) => setFormData(p => ({ ...p, pinned: val }))} 
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-tight">Published</p>
                  <p className="text-[10px] text-slate-400 font-medium">Publicly visible</p>
                </div>
                <Switch 
                  checked={formData.status === "Published"} 
                  onCheckedChange={(val) => setFormData(p => ({ ...p, status: val ? "Published" : "Draft" }))} 
                />
              </div>
            </div>
          </Card>
          <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white">
            <h3 className="text-sm font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Globe size={16} className="text-indigo-500" /> SEO & Indexing
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 block">Meta Title</Label>
                <Input
                  value={formData.seo?.title}
                  onChange={e => setFormData(prev => ({ ...prev, seo: { ...prev.seo!, title: e.target.value } }))}
                  className="text-xs h-9"
                  placeholder="Custom browser title..."
                />
              </div>
              <div>
                <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1 block">Meta Description</Label>
                <textarea
                  value={formData.seo?.description}
                  onChange={e => setFormData(prev => ({ ...prev, seo: { ...prev.seo!, description: e.target.value } }))}
                  className="w-full h-20 p-2 border border-slate-200 rounded-lg text-xs text-slate-600 outline-none focus:border-indigo-500 resize-none"
                  placeholder="Brief summary for Google..."
                />
              </div>
              <div className="pt-2">
                <Button variant="ghost" size="sm" className="w-full text-indigo-600 text-[11px] hover:bg-indigo-50" onClick={() => refineWithAI('seo')}>
                  <Sparkles size={12} className="mr-2" /> Optimize SEO with AI
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminBlogForm;
