import { load } from "cheerio";

export const SITE = "https://www.sujan1919.com.np";
export const INDEX_ROBOTS = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
export const PRIVATE_ROBOTS = "noindex, nofollow";
export const PUBLIC_QUERIES = {
  post: { published: true, membersOnly: { $ne: true } },
  article: { status: "Published", membersOnly: { $ne: true } },
  story: { active: true, isMembersOnly: { $ne: true } },
};

export const escapeMarkup = (value = "") => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

export function plainText(value) {
  if (typeof value !== "string") return "";
  const $ = load(value, null, false);
  $("script, style, template").remove();
  $("br").replaceWith("\n");
  $("p, div, li, blockquote, h1, h2, h3, h4, h5, h6").after("\n");
  return $.root().text().replace(/[\t ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function assetUrl(value) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  try {
    const url = new URL(value, SITE);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined;
  } catch {
    return undefined;
  }
}

function isoDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function canonicalPath(kind, item) {
  if (kind === "article" && item.slug) return `/blog/${encodeURIComponent(item.slug)}`;
  return `${kind === "story" ? "/stories/" : "/post/"}${encodeURIComponent(item.id || String(item._id))}`;
}

function videoAsset(value, poster) {
  const source = assetUrl(value);
  if (!source) return undefined;
  const url = new URL(source);
  const host = url.hostname.replace(/^www\./, "");
  const youtubeId = host === "youtu.be" ? url.pathname.split("/")[1]
    : ["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)
      ? url.searchParams.get("v") || url.pathname.match(/^\/(?:embed|shorts|live)\/([^/]+)/)?.[1] : undefined;
  if (/^[\w-]{11}$/.test(youtubeId || "")) {
    return {
      embedUrl: `https://www.youtube-nocookie.com/embed/${youtubeId}`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }
  if (!/\.(mp4|webm|mov|m4v|ogv|ogg|m3u8)$/i.test(url.pathname) && !url.pathname.includes("/video/upload/")) return undefined;
  if (!poster && host === "res.cloudinary.com" && url.pathname.includes("/video/upload/")) {
    const path = url.pathname.replace("/video/upload/", "/video/upload/so_0/").replace(/\.[^/.]+$/, "");
    poster = url.origin + path + ".jpg";
  }
  return { contentUrl: source, thumbnailUrl: poster };
}

export function describeContent(kind, item) {
  const body = kind === "article" ? item.content : kind === "story" ? item.description || item.caption : item.articleContent || item.content;
  const $ = load(typeof body === "string" ? body : "", null, false);
  $("script, style, template").remove();
  const text = plainText(body);
  const title = plainText(item.articleTitle || item.title || item.pollQuestion || item.caption || item.seoTitle)
    .replace(/\s+/g, " ").slice(0, 100)
    || text.replace(/\s+/g, " ").slice(0, 90)
    || (kind === "story" ? "Story by Sujan Gautam" : "Post by Sujan Gautam");
  const description = plainText(item.seo?.description || item.seoDescription || item.excerpt || text || item.caption || title).replace(/\s+/g, " ").slice(0, 160);
  const storySource = kind === "story" ? item.mediaUrl || item.image : undefined;
  const storyVideo = kind === "story" && (item.type === "video" || /\.(mp4|webm|mov|m4v|ogv|ogg)(?:[?#]|$)/i.test(storySource || ""));
  const candidates = [
    item.articleCover, item.featuredImage, !storyVideo && storySource, !storyVideo && item.image,
    ...(Array.isArray(item.images) ? item.images.map((image) => typeof image === "string" ? image : image?.url) : []),
    ...$("img[src]").map((_, element) => $(element).attr("src")).get(),
  ];
  const images = [...new Set(candidates.map(assetUrl).filter(Boolean))];
  const video = videoAsset(item.videoUrl || (storyVideo ? storySource : undefined)
    || $("video[src], video source[src], iframe[src]").first().attr("src"),
  assetUrl(item.videoThumbnail || item.thumbnail) || images[0]);
  return {
    kind, path: canonicalPath(kind, item), title, text, description, images, video,
    caption: plainText(item.caption),
    published: isoDate(item.publishedAt || item.createdAt),
    modified: isoDate(item.updatedAt),
  };
}

export function contentSchema(entry) {
  const url = SITE + entry.path;
  const graph = [{
    "@type": entry.kind === "story" ? "WebPage" : "BlogPosting",
    "@id": url,
    url,
    headline: entry.title,
    description: entry.description,
    datePublished: entry.published,
    dateModified: entry.modified || entry.published,
    author: { "@type": "Person", name: "Sujan Gautam", url: SITE + "/about/" },
    image: entry.images.length ? entry.images : undefined,
  }];
  if (entry.video?.thumbnailUrl && entry.published) {
    graph.push({
      "@type": "VideoObject", "@id": url + "#video", name: entry.title,
      description: entry.description, uploadDate: entry.published,
      ...entry.video, url,
    });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}

const e = escapeMarkup;
export function renderContent(entry, storyViewerPath) {
  const { title, text, caption, images, video, published } = entry;
  const embed = video?.embedUrl
    ? `<iframe class="aspect-video w-full" src="${e(video.embedUrl)}" title="${e(title)}" allowfullscreen></iframe>`
    : video?.contentUrl
      ? `<video class="w-full" src="${e(video.contentUrl)}"${video.thumbnailUrl ? ` poster="${e(video.thumbnailUrl)}"` : ""} controls playsinline preload="metadata"></video>` : "";
  const photos = images.map((url) => `<img class="w-full rounded-lg" src="${e(url)}" alt="${e(caption || title)}">`).join("");
  const paragraphs = [caption && caption !== title ? caption : "", text === title || text === caption ? "" : text]
    .filter(Boolean).flatMap((part) => part.split(/\n+/)).map((part) => `<p>${e(part)}</p>`).join("");
  return `<main class="mx-auto max-w-2xl space-y-5 px-5 pb-28 pt-9 text-foreground"><a href="/feed/">Back to feed</a><article class="space-y-4"><h1 class="font-poppins text-3xl font-semibold">${e(title)}</h1>${published ? `<time datetime="${e(published)}">${e(published.slice(0, 10))}</time>` : ""}${embed}${photos}${paragraphs}</article>${storyViewerPath ? `<a href="${e(storyViewerPath)}">Open story viewer</a>` : ""}</main>`;
}

export function renderListing(title, entries, introduction = "") {
  return `<main class="mx-auto max-w-2xl space-y-5 px-5 pb-28 pt-9 text-foreground"><nav aria-label="Main navigation"><a href="/">Home</a> · <a href="/about/">About</a> · <a href="/portfolio/">Portfolio</a> · <a href="/feed/">Feed</a> · <a href="/blog">Articles</a> · <a href="/contact/">Contact</a></nav><h1 class="font-poppins text-3xl font-semibold">${e(title)}</h1>${introduction ? `<p>${e(introduction)}</p>` : ""}<ul class="space-y-4">${entries.map((entry) => `<li>${entry.path ? `<h2><a href="${e(entry.path)}">${e(entry.title)}</a></h2>` : `<h2>${e(entry.title)}</h2>`}${entry.images?.[0] ? `<img class="w-full rounded-lg" src="${e(entry.images[0])}" alt="${e(entry.title)}" loading="lazy">` : ""}${entry.description ? `<p>${e(entry.description)}</p>` : ""}</li>`).join("")}</ul></main>`;
}

export function sitemapXml(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${entries.map((entry) => `<url><loc>${e(SITE + entry.path)}</loc>${entry.modified || entry.published ? `<lastmod>${e(entry.modified || entry.published)}</lastmod>` : ""}${(entry.images || []).map((image) => `<image:image><image:loc>${e(image)}</image:loc></image:image>`).join("")}${entry.video?.thumbnailUrl ? `<video:video><video:thumbnail_loc>${e(entry.video.thumbnailUrl)}</video:thumbnail_loc><video:title>${e(entry.title)}</video:title><video:description>${e(entry.description)}</video:description>${entry.video.embedUrl ? `<video:player_loc>${e(entry.video.embedUrl)}</video:player_loc>` : `<video:content_loc>${e(entry.video.contentUrl)}</video:content_loc>`}${entry.published ? `<video:publication_date>${e(entry.published)}</video:publication_date>` : ""}</video:video>` : ""}</url>`).join("\n")}
</urlset>`;
}
