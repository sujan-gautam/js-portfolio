import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { blogPostsDB, BlogPost, blogCategoriesDB, BlogCategory } from "@/lib/adminData";
import { 
  Calendar, Clock, ChevronLeft, Share2, 
  Heart, MessageSquare, Tag, Bookmark,
  Facebook, Twitter, Linkedin, Link as LinkIcon,
  Loader2, ArrowRight, MessageCircle, Sparkles,
  User, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/config";
import { Lock } from "lucide-react";

const BlogPostPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [category, setCategory] = useState<BlogCategory | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isLiked, setIsLiked] = useState(false);

  const handleGoogleLogin = () => {
    localStorage.setItem("auth_return", window.location.pathname);
    window.location.href = `${API_BASE}/auth/google`;
  };

  useEffect(() => {
    const loadPost = async () => {
      setLoading(true);
      try {
        const allPosts = await blogPostsDB.getAll();
        const found = allPosts.find(p => p.slug === slug && p.status === "Published");
        
        if (found) {
          setPost(found);
          // Load category
          if (found.category) {
            const cat = await blogCategoriesDB.getById(found.category);
            if (cat) setCategory(cat);
          }
          // Load related
          const related = allPosts
            .filter(p => p.id !== found.id && p.status === "Published" && p.category === found.category)
            .slice(0, 3);
          setRelatedPosts(related);
          
          // Track view (simple increment)
          await blogPostsDB.update(found.id, { views: (found.views || 0) + 1 });
        } else {
          toast.error("Narrative not found");
          navigate("/blog");
        }
      } catch (err) {
        console.error("Failed to load post", err);
      }
      setLoading(false);
    };
    loadPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const handleLike = async () => {
    if (!post) return;
    const newCount = (post.reactions?.heart || 0) + (isLiked ? -1 : 1);
    setIsLiked(!isLiked);
    setPost({ ...post, reactions: { ...post.reactions, heart: newCount } });
    await blogPostsDB.update(post.id, { reactions: { ...post.reactions, heart: newCount } });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="min-h-screen bg-white font-inter">
      <SEO 
        title={`${post.title} | Psychological Narratives`}
        description={post.excerpt || post.seo?.description}
        image={post.featuredImage}
      />

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-1 bg-slate-100 z-50">
        <div className="h-full bg-indigo-600 w-1/3 transition-all duration-300" id="read-progress" />
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24">
        {/* Navigation */}
        <div className="mb-12 flex items-center justify-between">
          <Link to="/blog" className="text-slate-400 hover:text-slate-900 flex items-center gap-2 text-sm font-bold transition-colors group">
            <ChevronLeft size={18} className="transition-transform group-hover:-translate-x-1" /> Back to Library
          </Link>
          <div className="flex items-center gap-4">
             <button onClick={handleShare} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
               <Share2 size={18} />
             </button>
             <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all">
               <Bookmark size={18} />
             </button>
          </div>
        </div>

        {/* Hero Meta */}
        <div className="space-y-8 mb-12">
          <div className="flex items-center gap-3">
            <Badge className="bg-indigo-50 text-indigo-600 border-none hover:bg-indigo-100 transition-colors uppercase tracking-widest text-[10px] font-bold py-1 px-4">
              {category?.name || "Uncategorized"}
            </Badge>
            {post.emotionalTone && post.emotionalTone !== "None" && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={12} className="text-amber-400" /> {post.emotionalTone} Tone
              </span>
            )}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            {post.title}
          </h1>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 py-8 border-y border-slate-100">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-md overflow-hidden shrink-0">
                <img src="/favicon.ico" className="w-full h-full object-cover" alt="Sujan Gautam" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-900">Sujan Gautam</span>
                <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Thought Architect & Developer</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <div className="flex items-center gap-2"><Calendar size={14} className="text-slate-300" /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              <div className="flex items-center gap-2"><Clock size={14} className="text-slate-300" /> {post.readTime} min read</div>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-16 -mx-6 md:mx-0">
            <img 
              src={post.featuredImage} 
              className="w-full h-auto md:rounded-[32px] object-cover shadow-2xl shadow-indigo-500/10" 
              alt={post.title}
            />
            {post.excerpt && <p className="mt-6 text-center text-slate-400 text-sm italic italic leading-relaxed px-6">"{post.excerpt}"</p>}
          </div>
        )}

        {/* Article Body */}
        {post.membersOnly && !user ? (
          <div className="relative overflow-hidden rounded-[32px] bg-slate-50 flex flex-col items-center justify-center py-24 px-8 text-center border border-slate-100 shadow-2xl shadow-indigo-500/5">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-3xl z-0" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-8 shadow-xl">
                <Lock size={32} className="text-indigo-600" />
              </div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-4 tracking-tight">Exclusive Content</h3>
              <p className="text-slate-500 text-sm mb-10 max-w-[320px] leading-relaxed">
                This narrative is reserved for the community. Please sign in to read the full insight and join the discussion.
              </p>
              <Button 
                onClick={handleGoogleLogin}
                className="h-14 px-8 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-2xl transition-all shadow-xl flex items-center gap-4 hover:scale-105 active:scale-95"
              >
                <img src="https://www.google.com/favicon.ico" className="w-5 h-5 bg-white rounded-full p-0.5" alt="google" />
                Continue with Google
              </Button>
            </div>
          </div>
        ) : (
          <article className="prose prose-indigo prose-lg md:prose-xl max-w-none prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-strong:text-slate-900 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-50/30 prose-blockquote:p-6 prose-blockquote:rounded-r-xl prose-img:rounded-3xl mb-20">
            <div dangerouslySetInnerHTML={{ __html: post.content.replace(/\n/g, '<br />') }} />
          </article>
        )}

        {/* Post Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8 py-10 border-t border-slate-100 mb-20">
          <div className="flex items-center gap-4">
             <button 
              onClick={handleLike}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full font-bold text-sm transition-all shadow-lg",
                isLiked ? "bg-red-50 text-red-600 shadow-red-500/10" : "bg-slate-50 text-slate-600 hover:bg-slate-100 shadow-slate-500/5"
              )}
             >
               <Heart size={20} className={isLiked ? "fill-red-600" : ""} /> {(post.reactions?.heart || 0) + (isLiked ? 1 : 0)} Hearts
             </button>
             <div className="flex items-center gap-2 px-6 py-3 rounded-full bg-slate-50 text-slate-600 font-bold text-sm shadow-lg shadow-slate-500/5">
               <MessageSquare size={20} /> {post.comments?.length || 0} Responses
             </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spread the insight</span>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-slate-50 text-slate-400 hover:text-[#1877F2] hover:bg-[#1877F2]/5 rounded-full transition-all"><Facebook size={18} /></button>
              <button className="p-2 bg-slate-50 text-slate-400 hover:text-[#1DA1F2] hover:bg-[#1DA1F2]/5 rounded-full transition-all"><Twitter size={18} /></button>
              <button className="p-2 bg-slate-50 text-slate-400 hover:text-[#0A66C2] hover:bg-[#0A66C2]/5 rounded-full transition-all"><Linkedin size={18} /></button>
              <button onClick={handleShare} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all"><LinkIcon size={18} /></button>
            </div>
          </div>
        </div>

        {/* Responses Section */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              Responses <span className="text-slate-300 text-lg">({post.comments?.length || 0})</span>
            </h2>
          </div>
          
          <div className="space-y-8">
            {/* Comment Form */}
            <div className="flex gap-4 items-start bg-slate-50 p-6 rounded-[24px]">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shrink-0">
                <User size={20} className="text-slate-400" />
              </div>
              <div className="flex-1 space-y-4">
                <textarea 
                  placeholder="Share your thoughts on this narrative..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-4 text-sm text-slate-700 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all resize-none min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6">
                    Post Response <Send size={16} className="ml-2" />
                  </Button>
                </div>
              </div>
            </div>

            {(!post.comments || post.comments.length === 0) && (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[24px]">
                <MessageCircle size={32} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-medium">Be the first to share your reflection.</p>
              </div>
            )}
          </div>
        </section>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-10">Deepen your exploration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {relatedPosts.map(rp => (
                <Link key={rp.id} to={`/blog/${rp.slug}`} className="group">
                  <Card className="flex items-center gap-4 p-4 border-none shadow-xl shadow-indigo-500/5 bg-white rounded-2xl overflow-hidden group-hover:-translate-y-1 transition-all">
                    <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0">
                      <img src={rp.featuredImage} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">{rp.title}</h4>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{rp.readTime} min read</span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default BlogPostPage;
