import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "@/config";
import { ArrowLeft, Calendar, Eye, Heart, Share2 } from "lucide-react";

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
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Fetch individual post by ID for better performance and SEO
    axios.get(`${API_BASE}/collection/feed/${id}`).then(r => {
      setPost(r.data);
      setLoading(false);
    }).catch((err) => {
      console.error("Failed to fetch post:", err);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    if (!post) return;
    const siteName = "Sujan Gautam | Sujan1919";
    const profession = "Software Developer & UI Architect";
    const title = post.caption ? `${post.caption.slice(0, 60)} | ${siteName}` : `Post by ${siteName} | ${profession}`;
    const desc = `${post.content || post.caption || "Creative post"} - Published by Sujan Gautam (sujan1919), a professional Software Developer specializing in premium web experiences.`.slice(0, 160);
    const image = post.images?.[0] || post.image || post.videoUrl || "";
    const url = `${SITE}/feed/post/${post._id || post.id}`;

    document.title = title;
    setMeta("description", desc);
    setMeta("keywords", `Sujan Gautam, Sujan1919, Sujan, Software Developer, Web Developer, Portfolio, Post, ${post.caption || ""}`);
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

    // canonical
    let canonical = document.querySelector("link[rel='canonical']") as HTMLLinkElement;
    if (!canonical) { canonical = document.createElement("link"); canonical.rel = "canonical"; document.head.appendChild(canonical); }
    canonical.href = url;

    // JSON-LD Article structured data
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": post.caption || post.content || "Post by Sujan Gautam",
      "description": desc,
      "image": image ? [image] : [`${SITE}/favicon.ico`],
      "datePublished": post.createdAt,
      "dateModified": post.updatedAt || post.createdAt,
      "author": { 
        "@type": "Person", 
        "name": "Sujan Gautam", 
        "alternateName": "sujan1919",
        "url": SITE,
        "jobTitle": "Software Developer",
        "sameAs": [
          "https://github.com/sujan1919",
          "https://linkedin.com/in/sujan1919"
        ]
      },
      "publisher": { 
        "@type": "Organization", 
        "name": "Sujan Gautam Portfolio", 
        "logo": { "@type": "ImageObject", url: `${SITE}/favicon.ico` } 
      },
      "url": url,
      "mainEntityOfPage": { "@type": "WebPage", "@id": url },
      "keywords": `Sujan Gautam, Sujan1919, Software Developer, ${post.caption || ""}`
    };

    // JSON-LD VideoObject if video exists
    let videoSchema: any = null;
    const youtubeId = post.videoUrl?.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    
    if (youtubeId || post.videoUrl?.match(/\.(mp4|webm|mov)$/i)) {
      videoSchema = {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": post.caption || "Video by Sujan Gautam",
        "description": desc,
        "thumbnailUrl": youtubeId ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg` : image,
        "uploadDate": post.createdAt,
        "contentUrl": post.videoUrl,
        "embedUrl": youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : post.videoUrl,
        "author": { "@type": "Person", "name": "Sujan Gautam" }
      };
    }

    injectJsonLd("ld-feed-post", videoSchema ? [articleSchema, videoSchema] : articleSchema);

    return () => removeJsonLd("ld-feed-post");
  }, [post]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!post) return <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p className="text-slate-500">Post not found</p><Link to="/feed/" className="text-indigo-600 underline">Back to Feed</Link></div>;

  const images = post.images?.length ? post.images : (post.image ? [post.image] : []);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 min-h-screen">
      <Link to="/feed/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 mb-8 transition-colors">
        <ArrowLeft size={16} /> Back to Feed
      </Link>

      <article>
        {/* Media */}
        {images[0] && <img src={images[0]} alt={post.caption || "Post image"} className="w-full rounded-2xl object-cover mb-6 max-h-[60vh]" loading="eager" />}
        {!images[0] && post.videoUrl && (
          post.videoUrl.includes("youtube.com") || post.videoUrl.includes("youtu.be") ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 bg-black">
              <iframe 
                src={`https://www.youtube.com/embed/${post.videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1]}`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <video src={post.videoUrl} controls className="w-full rounded-2xl mb-6 max-h-[60vh] bg-black" />
          )
        )}

        {/* Content */}
        <div className="space-y-4">
          {post.caption && <h1 className="text-2xl font-semibold text-slate-900 leading-snug">{post.caption}</h1>}
          {post.content && <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>}

          <div className="flex items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1"><Calendar size={12} />{new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
            {post.views > 0 && <span className="flex items-center gap-1"><Eye size={12} />{post.views} views</span>}
            {(post.reactions?.like || 0) > 0 && <span className="flex items-center gap-1"><Heart size={12} />{post.reactions.like}</span>}
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => { navigator.share?.({ title: post.caption, url: window.location.href }).catch(() => navigator.clipboard.writeText(window.location.href)); }} className="inline-flex items-center gap-2 text-sm bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-full transition-colors">
              <Share2 size={14} /> Share
            </button>
            <Link to="/feed/" className="inline-flex items-center gap-2 text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-full transition-colors">More Posts</Link>
          </div>
        </div>
      </article>

      {/* Author schema breadcrumb */}
      <div className="mt-12 p-5 bg-slate-50 rounded-2xl flex items-center gap-4 border border-slate-100">
        <img src={`${SITE}/favicon.ico`} className="w-12 h-12 rounded-full object-cover bg-slate-200" alt="Sujan Gautam" />
        <div>
          <p className="font-semibold text-slate-900">Sujan Gautam</p>
          <p className="text-sm text-slate-500">Graphic Designer · Creative Director</p>
          <Link to="/about/" className="text-xs text-indigo-600 hover:underline">View Profile</Link>
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
          <p className="text-sm text-slate-500">Graphic Designer · Creative Director</p>
          <Link to="/about/" className="text-xs text-indigo-600 hover:underline">View Profile</Link>
        </div>
      </div>
    </div>
  );
};
