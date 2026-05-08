import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "@/config";
import { ArrowLeft, Calendar, Eye, Heart, Share2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const SITE = "https://sujan1919.com.np";

function setMeta(key: string, value: string, isProp = false) {
  if (!value) return;
  const attr = isProp ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", value);
}

function injectJsonLd(id: string, data: object) {
  let el = document.getElementById(id);
  if (!el) { el = document.createElement("script"); el.id = id; (el as HTMLScriptElement).type = "application/ld+json"; document.head.appendChild(el); }
  el.textContent = JSON.stringify(data);
}

function removeJsonLd(id: string) {
  document.getElementById(id)?.remove();
}

/* ─── Feed Post Page ─────────────────────────────── */
export const FeedPostPage = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);
  const [sliders, setSliders] = useState<any[]>([]);

  const handleGoogleLogin = () => {
    localStorage.setItem("auth_return", window.location.pathname);
    window.location.href = `${API_BASE}/auth/google`;
  };

  useEffect(() => {
    // Fetch Settings
    axios.get(`${API_BASE}/singleton/settings`).then(r => setSettings(r.data)).catch(() => {});
    // Fetch Slider images for the bottom gallery
    axios.get(`${API_BASE}/collection/sliders`).then(r => setSliders(r.data.filter((s: any) => s.active))).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    // Try fetching from Feed collection first
    axios.get(`${API_BASE}/collection/feed/${id}`).then(r => {
      setPost(r.data);
      setLoading(false);
    }).catch(() => {
      // If not found in Feed, try BlogPosts collection
      axios.get(`${API_BASE}/collection/blog_posts/${id}`).then(r => {
        // Map BlogPost fields to FeedPost format for rendering
        const b = r.data;
        if (b) {
          setPost({
            ...b,
            type: "article",
            articleTitle: b.title,
            articleCover: b.featuredImage,
            articleContent: b.content
          });
        }
        setLoading(false);
      }).catch((err) => {
        console.error("Failed to fetch post from any collection:", err);
        setLoading(false);
      });
    });
  }, [id]);

  useEffect(() => {
    if (!post) return;
    const siteName = settings?.siteName || "Sujan Gautam | Sujan1919";
    const profession = settings?.authorTitle || "Software Developer & UI Architect";
    const authorName = settings?.authorName || "Sujan Gautam";
    
    const title = post.seoTitle || (post.articleTitle ? `${post.articleTitle} | ${siteName}` : post.caption ? `${post.caption.slice(0, 60)} | ${siteName}` : `Post by ${siteName} | ${profession}`);
    const desc = post.seoDescription || (post.type === "article" ? (post.articleContent?.replace(/<[^>]+>/g, '').slice(0, 160) || `Article by ${authorName}`) : `${post.content || post.caption || "Creative post"} - Published by ${authorName}, a professional ${profession}.`.slice(0, 160));
    const image = post.articleCover || post.images?.[0] || post.image || post.videoUrl || "";
    const url = `${SITE}/post/${post._id || post.id}`;

    document.title = title;
    setMeta("description", desc);
    setMeta("keywords", `Sujan Gautam, Sujan1919, Sujan, Software Developer, Web Developer, Portfolio, Post, ${post.caption || ""}`);
    setMeta("author", authorName);
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:image", image, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "article", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", image);

    // canonical
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;

    // JSON-LD Article structured data
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.seoTitle || post.articleTitle || post.caption || post.content || `Post by ${authorName}`,
      "description": desc,
      "image": image ? [image] : [`${SITE}/favicon.ico`],
      "datePublished": post.createdAt,
      "dateModified": post.updatedAt || post.createdAt,
      "author": { 
        "@type": "Person", 
        "name": authorName, 
        "alternateName": "sujan1919",
        "url": SITE,
        "jobTitle": profession,
        "sameAs": [
          "https://github.com/sujan1919",
          "https://linkedin.com/in/sujan1919"
        ]
      },
      "publisher": { 
        "@type": "Organization", 
        "name": `${authorName} Portfolio`, 
        "logo": { "@type": "ImageObject", url: `${SITE}/favicon.ico` } 
      },
      "url": url,
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "keywords": `${authorName}, Sujan1919, Software Developer, ${post.category || "Post"}, ${post.articleTitle || post.caption || ""}`
    };

    // JSON-LD VideoObject if video exists
    let videoSchema: any = null;
    const youtubeId = post.videoUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    
    if (youtubeId || post.videoUrl?.match(/\.(mp4|webm|mov)$/i)) {
      videoSchema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": post.caption || `Video by ${authorName}`,
        "description": desc,
        "thumbnailUrl": youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : image,
        "uploadDate": post.createdAt,
        "contentUrl": post.videoUrl,
        "embedUrl": youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : post.videoUrl,
        "author": { "@type": "Person", "name": authorName }
      };
    }

    injectJsonLd("ld-feed-post", videoSchema ? [articleSchema, videoSchema] : articleSchema);

    return () => removeJsonLd("ld-feed-post");
  }, [post, settings]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-[#CB2729] border-t-transparent rounded-full animate-spin" /></div>;
  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black text-white"><p className="text-white/40">Post not found</p><Link to="/feed/" className="text-[#CB2729] underline">Back to Feed</Link></div>;

  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const isArticle = post.type === "article";

  return (
    <div className="min-h-screen bg-black text-white font-['Inter'] selection:bg-[#CB2729]/30 selection:text-white">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20">
        <Link to="/feed/" className="inline-flex items-center gap-2 text-[13px] font-bold text-white/40 hover:text-white mb-12 transition-all group">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to Feed
        </Link>

        <article className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isArticle ? (
            <div className="space-y-10">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-[10px] font-bold text-[#CB2729] uppercase tracking-[0.3em] bg-[#CB2729]/10 px-4 py-1.5 rounded-full border border-[#CB2729]/20">
                  {post.category || 'NARRATIVE'}
                </span>
                {post.readTime && (
                  <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.2em]">
                    {post.readTime} MIN READ
                  </span>
                )}
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
                {post.articleTitle}
              </h1>
              
              {post.membersOnly && !user ? (
                <div className="relative overflow-hidden rounded-[32px] bg-white/5 flex flex-col items-center justify-center py-24 px-8 text-center border border-white/10 shadow-2xl">
                  <div className="absolute inset-0 bg-[#CB2729]/5 blur-3xl opacity-20 z-0" />
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-8 shadow-xl">
                      <Lock size={32} className="text-[#CB2729]" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4 tracking-tight">Members Only Insight</h3>
                    <p className="text-white/40 text-sm mb-10 max-w-[320px] leading-relaxed">
                      This research article is exclusive to members. Sign in to unlock the full depth of this narrative.
                    </p>
                    <button 
                      onClick={handleGoogleLogin}
                      className="h-14 px-8 bg-white text-black font-bold text-sm rounded-2xl transition-all shadow-xl flex items-center gap-4 hover:scale-105 active:scale-95"
                    >
                      <img src="https://www.google.com/favicon.ico" className="w-5 h-5 bg-white rounded-full p-0.5" alt="google" />
                      Continue with Google
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {post.articleCover && (
                    <div className="relative group">
                      <div className="absolute inset-0 bg-[#CB2729]/10 rounded-[32px] blur-3xl opacity-50" />
                      <img src={post.articleCover} alt={post.articleTitle} className="relative w-full rounded-[32px] object-cover shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 max-h-[65vh]" loading="eager" />
                    </div>
                  )}
                  
                  <div 
                    className="prose prose-lg md:prose-xl prose-invert max-w-none prose-headings:text-white prose-p:text-white/70 prose-p:leading-[1.8] prose-p:font-normal prose-a:text-[#CB2729] prose-a:no-underline hover:prose-a:underline prose-strong:text-white prose-blockquote:border-l-4 prose-blockquote:border-[#CB2729] prose-blockquote:bg-white/5 prose-blockquote:py-2 prose-blockquote:px-8 prose-blockquote:rounded-r-2xl prose-img:rounded-[24px]" 
                    dangerouslySetInnerHTML={{ __html: post.articleContent || post.content || "" }} 
                  />
                </>
              )}
            </div>
          ) : (
            <>
              {/* Media */}
              {images[0] && <img src={images[0]} alt={post.caption || "Post image"} className="w-full rounded-2xl object-cover mb-6 max-h-[60vh] border border-white/5" loading="eager" />}
              {!images[0] && post.videoUrl && (
                post.videoUrl.includes("youtube.com") || post.videoUrl.includes("youtu.be") ? (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 bg-black border border-white/5">
                    <iframe 
                      src={`https://www.youtube.com/embed/${post.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]}`}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <video src={post.videoUrl} controls className="w-full rounded-2xl mb-6 max-h-[60vh] bg-black border border-white/5" />
                )
              )}

              {/* Content */}
              <div className="space-y-4">
                {post.caption && <h1 className="text-2xl font-bold text-white leading-snug">{post.caption}</h1>}
                
                {post.membersOnly && !user ? (
                  <div className="p-10 bg-white/5 rounded-2xl border border-white/10 text-center">
                    <Lock className="mx-auto mb-4 text-[#CB2729]" size={32} />
                    <p className="text-white font-bold mb-2">Members Only</p>
                    <p className="text-white/40 text-sm mb-6">Login to view this private post</p>
                    <button onClick={handleGoogleLogin} className="px-6 py-2 bg-white text-black font-bold rounded-full text-xs">Sign In</button>
                  </div>
                ) : (
                  post.content && <p className="text-white/70 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                )}
              </div>
            </>
          )}

          <div className="flex items-center gap-4 text-[11px] font-bold text-white/30 uppercase tracking-widest mt-12 pt-8 border-t border-white/5">
            <span className="flex items-center gap-1.5"><Calendar size={13} />{new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            {post.views > 0 && <span className="flex items-center gap-1.5"><Eye size={13} />{post.views} views</span>}
            {(post.reactions?.like || 0) > 0 && <span className="flex items-center gap-1.5"><Heart size={13} />{post.reactions.like}</span>}
          </div>

          <div className="flex gap-4 pt-8">
              <button onClick={() => { navigator.share?.({ title: post.caption || post.articleTitle, url: window.location.href }).catch(() => navigator.clipboard.writeText(window.location.href)); }} className="inline-flex items-center gap-2 text-[12px] font-bold bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full transition-all border border-white/5">
                <Share2 size={14} /> SHARE INSIGHT
              </button>
              <Link to="/feed/" className="inline-flex items-center gap-2 text-[12px] font-bold bg-[#CB2729] text-white hover:bg-[#CB2729]/90 px-6 py-2.5 rounded-full transition-all shadow-lg shadow-[#CB2729]/20">
                DISCOVER MORE
              </Link>
            </div>
        </article>

        {/* Author Bio Section - Small & Compact */}
        <div className="mt-20 p-6 md:p-8 bg-[#0a0a0a] border border-white/10 rounded-[24px] relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
            
            {/* Author Image Carousel - Slower & Smaller */}
            <div className="shrink-0 relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[20px] overflow-hidden border border-white/10 shadow-xl bg-white/5 relative">
                {sliders.length > 0 ? (
                  <div className="w-full h-full relative">
                    {/* CSS-only slow fade */}
                    <style>{`
                      @keyframes authorFade {
                        0%, 20% { opacity: 1; }
                        25%, 100% { opacity: 0; }
                      }
                      .author-carousel-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; animation: authorFade ${sliders.length * 8}s infinite; }
                      ${sliders.map((_, i) => `.author-carousel-img:nth-child(${i + 1}) { animation-delay: ${i * 8}s; }`).join('\n')}
                    `}</style>
                    {sliders.map((s, i) => (
                      <img key={`anim-${i}`} src={s.image} className="author-carousel-img" alt="" />
                    ))}
                  </div>
                ) : (
                  <img src={settings?.authorImage || `${SITE}/favicon.ico`} className="w-full h-full object-cover" alt="" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#CB2729] rounded-full border-[3px] border-[#0a0a0a] flex items-center justify-center shadow-lg">
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 text-center sm:text-left">
              <p className="text-xl md:text-2xl font-bold text-white tracking-tight">{settings?.authorName || "Sujan Gautam"}</p>
              <p className="text-[11px] text-[#CB2729] font-bold uppercase tracking-[0.2em] mt-1.5">
                {settings?.authorTitle || "Software Developer & UI Architect"}
              </p>
              
              {settings?.authorBio && (
                <p className="text-white/50 text-[14px] leading-relaxed mt-4 max-w-lg">
                  {settings.authorBio}
                </p>
              )}
              
              <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-6">
                <Link to="/about/" className="text-[10px] font-bold text-white hover:text-[#CB2729] transition-colors uppercase tracking-[0.2em] border-b border-white/10 pb-1">
                  View Full Profile
                </Link>
                <Link to="/portfolio/" className="text-[10px] font-bold text-white/40 hover:text-white transition-colors uppercase tracking-[0.2em]">
                  Latest Projects
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Story Page ─────────────────────────────────── */
export const StoryPage = () => {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch individual story by ID
    axios.get(`${API_BASE}/collection/stories/${id}`).then(r => {
      setStory(r.data);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to fetch story:", err);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!story) return;
    const siteName = "Sujan Gautam | Sujan1919";
    const profession = "Software Developer & UI Architect";
    const title = story.title ? `${story.title} | ${siteName}` : `Story by ${siteName} | ${profession}`;
    const desc = `${story.description || story.caption || "Exclusive Story"} - Featured by Sujan Gautam (sujan1919), a leading Software Developer.`.slice(0, 160);
    const image = story.mediaUrl || story.imageUrl || story.thumbnailUrl || "";
    const url = `${SITE}/story/${story._id || story.id}`;

    document.title = title;
    setMeta("description", desc);
    setMeta("keywords", `Sujan Gautam, Sujan1919, Sujan, Software Developer, Web Developer, Portfolio, Story, ${story.title || ""}`);
    setMeta("author", "Sujan Gautam");
    setMeta("og:title", title, true);
    setMeta("og:description", desc, true);
    setMeta("og:image", image, true);
    setMeta("og:url", url, true);
    setMeta("og:type", "article", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", desc);
    setMeta("twitter:image", image);

    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;

    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": story.title || "Story by Sujan Gautam",
      "description": desc,
      "image": image ? [image] : [`${SITE}/favicon.ico`],
      "datePublished": story.createdAt,
      "author": { 
        "@type": "Person", 
        "name": "Sujan Gautam", 
        "alternateName": "sujan1919",
        "url": SITE,
        "jobTitle": "Software Developer"
      },
      "publisher": { "@type": "Organization", "name": "Sujan Gautam" },
      "url": url,
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "keywords": `Sujan Gautam, Sujan1919, Software Developer, ${story.title || ""}`
    };

    let videoSchema: any = null;
    if (story.mediaUrl?.match(/\.(mp4|webm|mov)$/i)) {
      videoSchema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": story.title || "Story Video by Sujan Gautam",
        "description": desc,
        "thumbnailUrl": image,
        "uploadDate": story.createdAt,
        "contentUrl": story.mediaUrl,
        "author": { "@type": "Person", "name": "Sujan Gautam" }
      };
    }

    injectJsonLd("ld-story", videoSchema ? [articleSchema, videoSchema] : articleSchema);

    return () => removeJsonLd("ld-story");
  }, [story]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!story) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-slate-500">Story not found</p><Link to="/" className="text-indigo-600 underline">Go Home</Link></div>;

  const isVid = story.mediaUrl?.match(/\.(mp4|webm|mov)$/i);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 min-h-screen">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft size={16} /> Back to Home
      </Link>

      <article>
        {story.mediaUrl && (
          isVid
            ? <video src={story.mediaUrl} controls autoPlay muted playsInline className="w-full rounded-2xl mb-6 max-h-[70vh] bg-black object-cover" />
            : <img src={story.mediaUrl} alt={story.title || "Story"} className="w-full rounded-2xl object-cover mb-6 max-h-[70vh]" loading="eager" />
        )}

        <h1 className="text-2xl font-semibold text-slate-900 mb-3">{story.title || "Story"}</h1>
        {story.description && <p className="text-slate-600 leading-relaxed whitespace-pre-wrap mb-4">{story.description}</p>}
        {story.caption && <p className="text-slate-500 text-sm italic">{story.caption}</p>}

        <div className="flex items-center gap-4 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-100">
          <span className="flex items-center gap-1"><Calendar size={12} />{new Date(story.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
          {story.views > 0 && <span className="flex items-center gap-1"><Eye size={12} />{story.views} views</span>}
        </div>
      </article>

      <div className="mt-12 p-5 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100">
        <img src={`${SITE}/favicon.ico`} className="w-12 h-12 rounded-full bg-slate-200" alt="Sujan Gautam" />
        <div>
          <p className="font-semibold text-slate-900">Sujan Gautam</p>
          <p className="text-sm text-slate-500">Software Developer & UI Architect</p>
          <Link to="/about/" className="text-xs text-indigo-600 hover:underline">View Profile</Link>
        </div>
      </div>
    </div>
  );
};
