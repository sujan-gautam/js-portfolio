import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "@/config";
import { ArrowLeft, Calendar, Eye, Heart, Share2, Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CommentSection } from "@/components/CommentSection";
import { ReactionBar } from "@/components/ReactionBar";
import { feedAPI } from "@/lib/adminData";
import { toast } from "sonner";

const SITE = "https://sujan1919.com.np";

import SEO from "@/components/SEO";

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

  const handleReact = async (type: string) => {
    if (!post) return;
    if (post.membersOnly && !user) {
      toast.error("Sign in to react to this post");
      return;
    }
    try {
      const updated = await feedAPI.react(post.id || post._id, type);
      if (updated) setPost(updated);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to react";
      toast.error(msg);
      console.error("Reaction error:", err);
    }
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


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-[#CB2729] border-t-transparent rounded-full animate-spin" /></div>;
  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black text-white"><p className="text-white/40">Post not found</p><Link to="/feed/" className="text-[#CB2729] underline">Back to Feed</Link></div>;

  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const isArticle = post.type === "article";

  const siteName = settings?.siteName || "Sujan Gautam | Sujan1919";
  const profession = settings?.authorTitle || "Software Developer & UI Architect";
  const authorName = settings?.authorName || "Sujan Gautam";
  const title = post.seoTitle || (post.articleTitle ? `${post.articleTitle} | ${siteName}` : post.caption ? `${post.caption.slice(0, 60)} | ${siteName}` : `Post by ${siteName} | ${profession}`);
  const desc = post.seoDescription || (isArticle ? (post.articleContent?.replace(/<[^>]+>/g, '').slice(0, 160) || `Article by ${authorName}`) : `${post.content || post.caption || "Creative post"} - Published by ${authorName}, a professional ${profession}.`.slice(0, 160));
  const image = post.articleCover || images[0] || post.videoUrl || undefined;
  const url = `${SITE}/post/${post._id || post.id}`;

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
      "alternateName": "sujan-gautam",
      "url": SITE,
      "jobTitle": profession
    },
    "publisher": { 
      "@type": "Organization", 
      "name": `${authorName} Portfolio`, 
      "logo": { "@type": "ImageObject", url: `${SITE}/favicon.ico` } 
    },
    "url": url,
    "mainEntityOfPage": { "@type": "WebPage", "@id": url }
  };

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

  const published = new Date(post.createdAt);
  const hasPublishedDate = Number.isFinite(published.getTime());
  const dateLabel = hasPublishedDate
    ? published.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "";

  const shareArticle = async () => {
    const shareUrl = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: post.articleTitle, url: shareUrl });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied");
      }
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        toast.error("Couldn’t share the article");
      }
    }
  };

  const structuredData = videoSchema ? [articleSchema, videoSchema] : articleSchema;

  return (
    <>
      <SEO 
        title={title} 
        description={desc} 
        type="article" 
        image={image} 
        video={post.videoUrl} 
        url={url} 
        publishedTime={post.createdAt} 
        structuredData={structuredData} 
      />
    <div className="min-h-screen bg-black font-inter text-white selection:bg-primary/30 selection:text-white">
      <div className={`mx-auto px-5 pb-28 pt-8 sm:px-8 sm:pt-12 ${isArticle ? "max-w-2xl" : "max-w-3xl"}`}>
        <Link to="/feed/" className="group mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> Back to feed
        </Link>

        <article className={isArticle ? undefined : "animate-in fade-in slide-in-from-bottom-4 duration-700"}>
          {isArticle ? (
            <div className="space-y-6">
              <header className="border-b border-border pb-5">
                <p className="text-sm font-medium text-red-500">{post.category || post.categoryName || "Article"}</p>
                <h1 className="mt-2 break-words font-poppins text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                  {post.articleTitle}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <Link to="/about/" rel="author" className="font-medium text-foreground hover:underline">{authorName}</Link>
                  {hasPublishedDate && <time dateTime={published.toISOString()}>{dateLabel}</time>}
                  {!!post.readTime && <span>{post.readTime} min read</span>}
                </div>
              </header>

              {post.membersOnly && !user ? (
                <section className="rounded-lg border border-border bg-card p-5 sm:p-6" aria-labelledby="members-heading">
                  <h2 id="members-heading" className="flex items-center gap-2 font-semibold">
                    <Lock size={16} aria-hidden="true" /> Members only
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">Sign in to read this article.</p>
                  <button
                    onClick={handleGoogleLogin}
                    className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-medium text-background hover:bg-foreground/90"
                  >
                    <img src="https://www.google.com/favicon.ico" className="size-4" alt="" />
                    Continue with Google
                  </button>
                </section>
              ) : (
                <>
                  {post.articleCover && (
                    <img
                      src={post.articleCover}
                      alt={post.articleTitle}
                      className="max-h-[55dvh] w-full rounded-lg border border-border bg-card object-contain"
                    />
                  )}

                  <div
                    className="prose prose-invert max-w-none break-words prose-headings:font-poppins prose-p:leading-relaxed prose-a:text-red-500 prose-img:rounded-md sm:prose-lg"
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

          <div className={isArticle
            ? "mt-8 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-3"
            : "mt-12 flex items-center justify-between border-t border-white/5 pt-8"}>
            {isArticle ? (
              <div className="flex flex-wrap items-center gap-x-4 text-sm text-muted-foreground">
                <button
                  type="button"
                  onClick={shareArticle}
                  className="inline-flex min-h-11 items-center gap-2 font-medium transition-colors hover:text-foreground"
                >
                  <Share2 size={16} aria-hidden="true" /> Share article
                </button>
                {post.views > 0 && <span>{post.views} views</span>}
              </div>
            ) : (
              <div className="flex items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-white/30">
                <span className="flex items-center gap-1.5"><Calendar size={13} />{dateLabel}</span>
                {post.views > 0 && <span className="flex items-center gap-1.5"><Eye size={13} />{post.views} views</span>}
              </div>
            )}
            <ReactionBar post={post} onReact={handleReact} />
          </div>

          <div className="mt-8">
            <CommentSection 
              post={post} 
              onUpdate={setPost} 
              showAlert={(msg) => toast.error(msg)} 
            />
          </div>

          {!isArticle && <div className="flex gap-4 pt-12">
              <button onClick={() => { navigator.share?.({ title: post.caption || post.articleTitle, url: window.location.href }).catch(() => navigator.clipboard.writeText(window.location.href)); toast.success("Link copied to clipboard"); }} className="inline-flex items-center gap-2 text-[12px] font-bold bg-white/5 hover:bg-white/10 text-white px-6 py-2.5 rounded-full transition-all border border-white/5">
                <Share2 size={14} /> SHARE INSIGHT
              </button>
              <Link to="/feed/" className="inline-flex items-center gap-2 text-[12px] font-bold bg-[#CB2729] text-white hover:bg-[#CB2729]/90 px-6 py-2.5 rounded-full transition-all shadow-lg shadow-[#CB2729]/20">
                DISCOVER MORE
              </Link>
            </div>}
        </article>

        {!isArticle && <div className="mt-16 py-8 px-6 md:px-10 bg-white/[0.03] border border-white/5 rounded-[24px] relative overflow-hidden group">
          <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-10 relative z-10">
            
            {/* Minimalist Author Image */}
            <div className="shrink-0 relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-[20px] overflow-hidden border border-white/10 bg-white/5 relative shadow-xl">
                {sliders.length > 0 ? (
                  <div className="w-full h-full relative">
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
              <h4 className="text-xl md:text-2xl font-bold text-white tracking-tight">{settings?.authorName || "Sujan Gautam"}</h4>
              <p className="text-[10px] text-[#CB2729] font-bold uppercase tracking-[0.2em] mt-1.5">
                {settings?.authorTitle || "Software Developer & UI Architect"}
              </p>
              
              {settings?.authorBio && (
                <p className="text-white/40 text-[13px] leading-relaxed mt-3 max-w-lg mx-auto sm:mx-0">
                  {settings.authorBio}
                </p>
              )}
              
              <div className="mt-5 flex flex-wrap justify-center sm:justify-start gap-5">
                <Link to="/about/" className="text-[9px] font-black text-white/30 hover:text-[#CB2729] transition-colors uppercase tracking-[0.2em] border-b border-white/5 pb-1">
                  Profile
                </Link>
                <Link to="/portfolio/" className="text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-[0.2em]">
                  Projects
                </Link>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
    </>
  );
};

/* ─── Story Page ─────────────────────────────────── */
/**
 * StoryPage — /story/:id
 *
 * SEO behaviour  : The backend SSR handler injects story-specific <title>,
 *                  <meta>, OG tags, and JSON-LD at this URL so Google can
 *                  crawl and index each story independently.
 *
 * User behaviour : As soon as the React app boots, we immediately redirect
 *                  the browser to /?story=:id  so the user lands on the
 *                  homepage with the immersive story modal auto-opened.
 */
export const StoryPage = () => {
  const { id } = useParams<{ id: string }>();

  // Instantly redirect to the homepage with the story modal param.
  // The StoriesSection component will detect ?story=<id> and auto-open it.
  return <Navigate to={`/?story=${id}`} replace />;
};
