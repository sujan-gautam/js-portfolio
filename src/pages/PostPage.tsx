import articleStyles from "./article-v2.module.css";
import { contentTracking } from "@/lib/contentTracking";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "@/config";
import { ArrowLeft, Calendar, Eye, Heart, Share2, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CommentSection } from "@/components/CommentSection";
import { ReactionBar } from "@/components/ReactionBar";
import { RestrictedPostPrompt } from "@/components/RestrictedPostPrompt";
import { blogPostsDB, feedAPI } from "@/lib/adminData";
import { toast } from "sonner";

const SITE = "https://www.sujan1919.com.np";
const isVideoFile = (source: string) => /\.(mp4|webm|mov|m4v|ogv|ogg)(?:[?#]|$)/i.test(source);
const playableSource = (source: string) =>
  /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/.*\.mov(?:[?#]|$)/i.test(source)
    ? source.replace("/video/upload/", "/video/upload/f_mp4/").replace(/\.mov(?=[?#]|$)/i, ".mp4")
    : source;

import SEO from "@/components/SEO";

/* ─── Feed Post Page ─────────────────────────────── */
export const FeedPostPage = () => {
  const { user, loading: authLoading } = useAuth();
  const { id, slug } = useParams<{ id: string; slug: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [settings, setSettings] = useState<any>(null);
  const [sliders, setSliders] = useState<any[]>([]);

  const handleReact = async (type: string) => {
    if (!post) return;
    if (post.locked || (post.membersOnly && !user)) {
      toast.error("Sign in to react to this post");
      return;
    }
    try {
      const updated = await feedAPI.react(post.id || post._id, type);
      if (updated) setPost((current: any) => ({ ...current, reactions: updated.reactions }));
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
    if (authLoading) return;
    const controller = new AbortController();
    const config = { signal: controller.signal };

    const loadPost = async () => {
      setLoading(true);
      setPost(null);
      try {
        if (slug) {
          const articles = await blogPostsDB.getAll();
          const article = Array.isArray(articles) ? articles.find((item) => item.slug === slug && item.status === "Published") : undefined;
          if (article && !controller.signal.aborted) {
            setPost({ ...article, type: "article", articleTitle: article.title, articleCover: article.featuredImage, articleContent: article.content });
            if (!article.locked && (!article.membersOnly || user)) void feedAPI.trackView(article.id).catch(() => {});
          }
          return;
        }
        const { data } = await axios.get(`${API_BASE}/collection/feed/${id}`, config);
        if (!controller.signal.aborted) setPost(data);
      } catch {
        if (controller.signal.aborted || slug) return;
        try {
          const { data } = await axios.get(`${API_BASE}/collection/blog_posts/${id}`, config);
          if (!controller.signal.aborted && data) {
            setPost({
              ...data,
              type: "article",
              articleTitle: data.title,
              articleCover: data.featuredImage,
              articleContent: data.content,
            });
          }
        } catch {
          // Show the not-found state when neither collection contains the post.
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    loadPost();
    return () => controller.abort();
  }, [authLoading, id, slug, user?.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><div className="w-8 h-8 border-2 border-[#CB2729] border-t-transparent rounded-full animate-spin" /></div>;
  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-black text-white"><p className="text-white/40">{slug ? "Article not found" : "Post not found"}</p><Link to={slug ? "/blog" : "/feed/"} className="text-[#CB2729] underline">{slug ? "Back to articles" : "Back to feed"}</Link></div>;

  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);
  const isArticle = post.type === "article";
  const locked = post.locked || (post.membersOnly && !user);

  const siteName = settings?.siteName || "Sujan Gautam | Sujan1919";
  const profession = settings?.authorTitle || "Software Developer & UI Architect";
  const authorName = settings?.authorName || "Sujan Gautam";
  const title = post.seoTitle || (post.articleTitle ? `${post.articleTitle} | ${siteName}` : post.caption ? `${post.caption.slice(0, 60)} | ${siteName}` : `Post by ${siteName} | ${profession}`);
  const desc = post.seoDescription || (isArticle ? (post.articleContent?.replace(/<[^>]+>/g, '').slice(0, 160) || `Article by ${authorName}`) : `${post.content || post.caption || "Creative post"} - Published by ${authorName}, a professional ${profession}.`.slice(0, 160));
  const image = post.articleCover || images.find((source: string) => !isVideoFile(source));
  const url = slug ? `${SITE}/blog/${encodeURIComponent(slug)}` : `${SITE}/post/${post._id || post.id}`;

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

  const youtubeId = post.videoUrl?.match(/(?:youtube\.com\/(?:embed\/|shorts\/|live\/|.*[?&]v=)|youtu\.be\/)([\w-]{11})(?![\w-])/)?.[1];
  const embedUrl = youtubeId ? `https://www.youtube-nocookie.com/embed/${youtubeId}` : undefined;
  const cloudinaryPoster = typeof post.videoUrl === "string" && /^https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\//.test(post.videoUrl)
    ? post.videoUrl.split(/[?#]/, 1)[0].replace("/video/upload/", "/video/upload/so_0/").replace(/\.[^/.]+$/, "") + ".jpg"
    : undefined;
  const thumbnail = youtubeId ? `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` : post.videoThumbnail || image || cloudinaryPoster;
  const videoSchema = post.videoUrl && thumbnail && (post.publishedAt || post.createdAt) ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": post.articleTitle || post.caption || `Video by ${authorName}`,
    "description": desc,
    "thumbnailUrl": thumbnail,
    "uploadDate": post.publishedAt || post.createdAt,
    ...(embedUrl ? { embedUrl } : { contentUrl: post.videoUrl }),
  } : null;
  const videoPlayer = post.videoUrl ? (
    embedUrl ? (
      <iframe src={embedUrl} title={post.articleTitle || post.caption || "Post video"} className="aspect-video w-full rounded-lg border border-border" allow="fullscreen; picture-in-picture" allowFullScreen />
    ) : (
      <video src={playableSource(post.videoUrl)} poster={thumbnail} controls playsInline preload="metadata" className="w-full rounded-lg border border-border bg-black" />
    )
  ) : null;

  const published = new Date(post.publishedAt || post.createdAt);
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
        title={locked ? "Log in to view" : title}
        description={locked ? "Sign in to view this post." : desc}
        type="article" 
        image={locked ? undefined : thumbnail || image}
        video={locked ? undefined : post.videoUrl}
        url={url} 
        publishedTime={post.createdAt} 
        structuredData={locked ? undefined : structuredData}
      />
    <div className="min-h-screen bg-black font-inter text-white selection:bg-primary/30 selection:text-white">
      <div className={`mx-auto px-5 pb-28 pt-8 sm:px-8 sm:pt-12 ${isArticle ? "max-w-2xl" : "max-w-3xl"}`}>
        <Link to={slug ? "/blog" : "/feed/"} className="group mb-6 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" /> {slug ? "Back to articles" : "Back to feed"}
        </Link>

        <article {...(!locked ? contentTracking(isArticle ? "article" : "post", post.id || post._id, post.articleTitle, post.publishedAt || post.createdAt) : {})} className={isArticle ? undefined : "animate-in fade-in slide-in-from-bottom-4 duration-700"}>
          {isArticle ? (
            <div className="space-y-6">
              <header className="border-b border-border pb-5">
                <p className="text-sm font-medium text-red-500">{post.categoryName || (!slug && post.category) || "Article"}</p>
                <h1 className="mt-2 break-words font-poppins text-[clamp(1.75rem,5vw,2.75rem)] font-semibold leading-tight tracking-tight text-foreground">
                  {locked ? "Log in to view" : post.articleTitle}
                </h1>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <Link to="/about/" rel="author" className="font-medium text-foreground hover:underline">{authorName}</Link>
                  {hasPublishedDate && <time dateTime={published.toISOString()}>{dateLabel}</time>}
                  {!!post.readTime && <span>{post.readTime} min read</span>}
                </div>
              </header>

              {locked ? (
                <RestrictedPostPrompt />
              ) : (
                <>
                  {videoPlayer}
                  {post.articleCover && (
                    <img
                      src={post.articleCover}
                      alt={post.articleTitle}
                      className="max-h-[55dvh] w-full rounded-lg border border-border bg-card object-contain"
                    />
                  )}

                  <div
                    className={`${articleStyles.copy} prose prose-invert max-w-none break-words prose-a:text-red-500 prose-img:rounded-md`}
                    dangerouslySetInnerHTML={{ __html: post.articleContent || post.content || "" }} 
                  />
                </>
              )}
            </div>
          ) : (
            <>
              {!locked && (videoPlayer || images.length > 0) && (
                <div className="mb-6 space-y-4">
                  {videoPlayer}
                  {images.map((source: string, index: number) => source === post.videoUrl ? null : isVideoFile(source) ? (
                    <video key={`${source}-${index}`} src={playableSource(source)} controls playsInline preload="metadata" className="w-full rounded-lg border border-border bg-black" />
                  ) : (
                    <img key={`${source}-${index}`} src={source} alt={post.imageCaptions?.[index] || post.caption || "Post image"} className="w-full rounded-lg border border-border object-contain" loading={index === 0 ? "eager" : "lazy"} />
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="space-y-4">
                {!locked && post.caption && <h1 className="text-2xl font-bold text-white leading-snug">{post.caption}</h1>}
                
                {locked ? (
                  <RestrictedPostPrompt />
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

          {!locked && (
            <CommentSection
              post={{ ...post, id: post.id || post._id || id }}
              onCommentsChange={(comments) => setPost((current: any) => ({ ...current, comments }))}
            />
          )}

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
