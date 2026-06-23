# SEO Implementation Guide — sujan1919.com.np
**Target:** Every page, post, image, and dynamically loaded content ranks individually on Google.

---

## 1. Global Meta Tags (All Pages)

Add to your backend's HTML template or layout component — applied site-wide:

```html
<!-- Primary Meta -->
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="author" content="Sujan Gautam" />
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<meta name="theme-color" content="#000000" />
<link rel="canonical" href="https://sujan1919.com.np/[CURRENT_PAGE_PATH]" />

<!-- Open Graph -->
<meta property="og:site_name" content="Sujan Gautam — Full-Stack Software Engineer" />
<meta property="og:locale" content="en_US" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:creator" content="@webwithfreelancer" />
```

---

## 2. Page-by-Page SEO

### 2.1 Home Page — `https://sujan1919.com.np/`

```html
<title>Sujan Gautam — Full-Stack Software Engineer | Hattiesburg, MS</title>
<meta name="description" content="Sujan Gautam is a full-stack software engineer and web developer based in Hattiesburg, MS. Building responsive websites and digital solutions for clients worldwide. Available for freelance." />
<meta name="keywords" content="Sujan Gautam, full stack developer, web developer Hattiesburg MS, freelance web developer, React developer, Node.js developer, software engineer" />

<meta property="og:title" content="Sujan Gautam — Full-Stack Software Engineer" />
<meta property="og:description" content="Full-stack web developer and software engineer available for freelance. Building high-quality responsive websites and applications." />
<meta property="og:url" content="https://sujan1919.com.np/" />
<meta property="og:image" content="https://sujan1919.com.np/og-home.jpg" />

<meta name="twitter:title" content="Sujan Gautam — Full-Stack Software Engineer" />
<meta name="twitter:description" content="Full-stack web developer and software engineer available for freelance." />
<meta name="twitter:image" content="https://sujan1919.com.np/og-home.jpg" />
```

**Structured Data — Person + WebSite:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": "https://sujan1919.com.np/#person",
      "name": "Sujan Gautam",
      "url": "https://sujan1919.com.np/",
      "image": "https://sujan1919.com.np/og-home.jpg",
      "jobTitle": "Full-Stack Software Engineer",
      "description": "Full-stack web developer and software engineer based in Hattiesburg, MS. Available for freelance projects.",
      "email": "gautamsujan1919@gmail.com",
      "telephone": "+18179707616",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Hattiesburg",
        "addressRegion": "MS",
        "addressCountry": "US"
      },
      "sameAs": [
        "https://www.instagram.com/webwithfreelancer"
      ],
      "knowsLanguage": ["en", "ne", "hi"],
      "nationality": "Nepalese",
      "alumniOf": [
        {
          "@type": "EducationalOrganization",
          "name": "University of Southern Mississippi"
        }
      ]
    },
    {
      "@type": "WebSite",
      "@id": "https://sujan1919.com.np/#website",
      "url": "https://sujan1919.com.np/",
      "name": "Sujan Gautam Portfolio",
      "description": "Portfolio and personal site of Sujan Gautam, full-stack software engineer.",
      "publisher": { "@id": "https://sujan1919.com.np/#person" },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://sujan1919.com.np/feed/?search={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
}
</script>
```

---

## 2.2 About Page — `https://sujan1919.com.np/about/`

```html
<title>About Sujan Gautam — Full-Stack Developer | USM Computer Science, 4.0 GPA</title>
<meta name="description" content="Learn about Sujan Gautam — a 20-year-old full-stack developer at the University of Southern Mississippi (4.0 GPA). Fluent in HTML, CSS, JavaScript, React, Node.js, and Python. 1.5+ years experience, 12+ clients, 35+ projects." />
<meta name="keywords" content="Sujan Gautam about, USM computer science student, full stack developer skills, React Node.js developer portfolio, Nepali developer USA, software engineer student" />

<meta property="og:title" content="About Sujan Gautam — Developer, Student, Builder" />
<meta property="og:description" content="20-year-old full-stack developer studying Computer Science at USM. 4.0 GPA, 35+ projects completed, 12+ happy clients." />
<meta property="og:url" content="https://sujan1919.com.np/about/" />
<meta property="og:image" content="https://sujan1919.com.np/og-about.jpg" />
```

**Structured Data — ProfilePage:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://sujan1919.com.np/#person",
    "name": "Sujan Gautam",
    "givenName": "Sujan",
    "familyName": "Gautam",
    "birthDate": "2004",
    "gender": "Male",
    "nationality": "Nepalese",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hattiesburg",
      "addressRegion": "Mississippi",
      "addressCountry": "US"
    },
    "email": "gautamsujan1919@gmail.com",
    "telephone": "+18179707616",
    "knowsAbout": ["HTML", "CSS", "JavaScript", "React", "Node.js", "Python", "Full-Stack Development", "Web Design"],
    "hasCredential": [
      {
        "@type": "EducationalOccupationalCredential",
        "credentialCategory": "degree",
        "educationalLevel": "Bachelor's",
        "recognizedBy": {
          "@type": "EducationalOrganization",
          "name": "University of Southern Mississippi",
          "address": { "addressLocality": "Hattiesburg", "addressRegion": "MS" }
        }
      }
    ]
  }
}
</script>
```

---

## 2.3 Portfolio Page — `https://sujan1919.com.np/portfolio/`

```html
<title>Portfolio — Sujan Gautam | Web Apps, POS Systems & Full-Stack Projects</title>
<meta name="description" content="Browse Sujan Gautam's completed projects: Golden Deals (full-stack Node.js/React), Techy POS (inventory management platform), Mitas Himalayan Kitchen (restaurant website), Trace Time-Travel Debugger. 35+ projects completed." />
<meta name="keywords" content="Sujan Gautam portfolio, web app projects, POS system developer, React Node.js projects, full stack portfolio, Techy POS, Golden Deals app, Trace debugger" />

<meta property="og:title" content="Portfolio — Sujan Gautam's Projects" />
<meta property="og:description" content="35+ completed projects: full-stack web apps, POS systems, restaurant sites, and developer tools. Built with React, Node.js, and more." />
<meta property="og:url" content="https://sujan1919.com.np/portfolio/" />
<meta property="og:image" content="https://sujan1919.com.np/og-portfolio.jpg" />
```

**Structured Data — CollectionPage + ItemList (render from backend dynamically):**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  "name": "Sujan Gautam — Project Portfolio",
  "url": "https://sujan1919.com.np/portfolio/",
  "description": "A showcase of full-stack web apps, POS systems, and software tools built by Sujan Gautam.",
  "creator": { "@id": "https://sujan1919.com.np/#person" },
  "hasPart": [
    {
      "@type": "SoftwareApplication",
      "name": "Golden Deals",
      "description": "A full-stack project built with Node.js backend and React-based frontend.",
      "applicationCategory": "WebApplication",
      "url": "[LIVE_URL]",
      "author": { "@id": "https://sujan1919.com.np/#person" }
    },
    {
      "@type": "SoftwareApplication",
      "name": "Techy POS",
      "description": "A custom POS and inventory management platform developed for a specialized electronics franchise.",
      "applicationCategory": "BusinessApplication",
      "url": "[LIVE_URL]",
      "author": { "@id": "https://sujan1919.com.np/#person" }
    },
    {
      "@type": "WebSite",
      "name": "Mitas Himalayan Kitchen",
      "description": "Fully functional restaurant website designed and developed for Mitas Himalayan Kitchen.",
      "url": "[LIVE_URL]",
      "author": { "@id": "https://sujan1919.com.np/#person" }
    },
    {
      "@type": "SoftwareApplication",
      "name": "Trace — Time-Travel Debugger",
      "description": "An advanced interactive tool designed to help developers debug, visualize, and trace code execution.",
      "applicationCategory": "DeveloperApplication",
      "url": "[LIVE_URL]",
      "author": { "@id": "https://sujan1919.com.np/#person" }
    }
  ]
}
</script>
```

> **Backend instruction:** Loop through portfolio items from DB and render each project as a `SoftwareApplication` or `WebSite` schema block dynamically. Replace `[LIVE_URL]` with actual live URLs.

---

## 2.4 Feed Page — `https://sujan1919.com.np/feed/`

```html
<title>Feed — Sujan Gautam | Posts, Updates & Blog</title>
<meta name="description" content="Sujan Gautam's personal feed — posts, updates, photos, and blog entries. Follow along for insights into his development journey and daily life." />
<meta name="keywords" content="Sujan Gautam feed, sujan1919 blog, developer posts, sujan gautam updates" />

<meta property="og:title" content="Feed — Sujan Gautam" />
<meta property="og:description" content="Posts, updates, and blog entries from Sujan Gautam." />
<meta property="og:url" content="https://sujan1919.com.np/feed/" />
<meta property="og:image" content="https://sujan1919.com.np/og-feed.jpg" />
```

**Structured Data — Blog:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Blog",
  "name": "Sujan Gautam's Feed",
  "url": "https://sujan1919.com.np/feed/",
  "description": "Personal posts, updates and blog entries by Sujan Gautam.",
  "author": { "@id": "https://sujan1919.com.np/#person" }
}
</script>
```

---

## 2.5 Individual Feed Post Pages — `https://sujan1919.com.np/feed/?post=[ID]`

> **CRITICAL:** Each post URL must have its own unique meta tags generated server-side from the post's DB record. This is what makes individual posts rank on Google.

**Backend template (render per post):**
```html
<title>[POST_TITLE or first 60 chars of caption] — Sujan Gautam</title>
<meta name="description" content="[POST_CAPTION truncated to 155 chars] — Posted by Sujan Gautam on [POST_DATE]." />
<meta name="robots" content="[index, follow for public posts | noindex for members-only posts]" />

<link rel="canonical" href="https://sujan1919.com.np/feed/?post=[POST_ID]" />

<meta property="og:type" content="article" />
<meta property="og:title" content="[POST_TITLE]" />
<meta property="og:description" content="[POST_CAPTION, first 155 chars]" />
<meta property="og:url" content="https://sujan1919.com.np/feed/?post=[POST_ID]" />
<meta property="og:image" content="[POST_IMAGE_URL]" />
<meta property="article:author" content="Sujan Gautam" />
<meta property="article:published_time" content="[POST_DATE_ISO8601]" />
```

**Structured Data per post:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": "[POST_TITLE or first 110 chars of caption]",
  "description": "[POST_CAPTION first 155 chars]",
  "url": "https://sujan1919.com.np/feed/?post=[POST_ID]",
  "datePublished": "[POST_DATE_ISO8601]",
  "dateModified": "[POST_UPDATED_DATE_ISO8601]",
  "author": { "@id": "https://sujan1919.com.np/#person" },
  "publisher": { "@id": "https://sujan1919.com.np/#person" },
  "image": {
    "@type": "ImageObject",
    "url": "[POST_IMAGE_URL]",
    "width": 1200,
    "height": 630
  },
  "interactionStatistic": [
    {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/LikeAction",
      "userInteractionCount": [LIKE_COUNT]
    },
    {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/CommentAction",
      "userInteractionCount": [COMMENT_COUNT]
    }
  ]
}
</script>
```

> **Members-only posts:** Add `<meta name="robots" content="noindex, nofollow" />` so Google doesn't index gated content it can't see, which would hurt rankings.

---

## 2.6 Contact Page — `https://sujan1919.com.np/contact/`

```html
<title>Contact Sujan Gautam — Hire a Full-Stack Developer | Hattiesburg, MS</title>
<meta name="description" content="Get in touch with Sujan Gautam for freelance web development, collaborations, or project inquiries. Available via email, phone, or social media. Based in Hattiesburg, MS." />
<meta name="keywords" content="hire Sujan Gautam, contact web developer, freelance developer contact, Sujan Gautam email, full stack developer for hire" />

<meta property="og:title" content="Contact Sujan Gautam — Let's Work Together" />
<meta property="og:description" content="Reach out for freelance projects, collabs, or just to say hi. Email, phone, or social — I'm available." />
<meta property="og:url" content="https://sujan1919.com.np/contact/" />
<meta property="og:image" content="https://sujan1919.com.np/og-contact.jpg" />
```

**Structured Data — ContactPage:**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "name": "Contact Sujan Gautam",
  "url": "https://sujan1919.com.np/contact/",
  "description": "Contact page for hiring or collaborating with Sujan Gautam, full-stack developer.",
  "mainEntity": {
    "@type": "Person",
    "@id": "https://sujan1919.com.np/#person",
    "name": "Sujan Gautam",
    "email": "gautamsujan1919@gmail.com",
    "telephone": "+18179707616",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Hattiesburg",
      "addressRegion": "MS",
      "addressCountry": "US"
    }
  }
}
</script>
```

---

## 3. Image SEO (All Images, Site-Wide)

Every image on the site — profile photos, portfolio thumbnails, feed post images, project screenshots — must have:

```html
<!-- Always include meaningful alt text -->
<img
  src="[IMAGE_URL]"
  alt="[Descriptive alt — e.g., 'Sujan Gautam full-stack developer headshot']"
  width="[WIDTH]"
  height="[HEIGHT]"
  loading="lazy"
  decoding="async"
/>
```

**Alt text rules by image type:**

| Image | Alt Text Template |
|---|---|
| Profile/headshot | `Sujan Gautam — full-stack software engineer based in Hattiesburg MS` |
| Portfolio project thumbnail | `[Project Name] — web app built by Sujan Gautam using [Tech Stack]` |
| Feed post image | `[Post caption, first 100 chars] — photo by Sujan Gautam` |
| About page skill icons | `[Skill Name] logo — Sujan Gautam's skill` |
| Stories section | `Sujan Gautam stories — [story title or topic]` |

**Add `ImageObject` schema for all important images (OG images, hero images):**
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ImageObject",
  "url": "[IMAGE_FULL_URL]",
  "contentUrl": "[IMAGE_FULL_URL]",
  "name": "[Descriptive name]",
  "description": "[What the image shows]",
  "author": { "@id": "https://sujan1919.com.np/#person" },
  "width": [WIDTH_PX],
  "height": [HEIGHT_PX]
}
</script>
```

---

## 4. Dynamic / Backend-Rendered Content SEO

Because all data is fetched from a backend, Google's crawler must see the final HTML — not a blank JS shell.

### 4.1 Server-Side Rendering (SSR) or Static Generation (SSG) — REQUIRED

If your frontend is React/Next.js or a custom Node.js template engine:

- **Use SSR:** Render meta tags, page content, and structured data server-side before sending HTML to the browser.
- **For every route (`/about/`, `/portfolio/`, `/feed/?post=ID`):** the server must inject the correct `<title>`, `<meta>`, and `<script type="application/ld+json">` into the `<head>` before the response is sent.
- If you're currently using client-side fetch (`useEffect` / `fetch()`), Google may not index that content reliably. Move critical data to SSR.

**Node.js Express example pattern:**
```javascript
app.get('/feed/', async (req, res) => {
  const postId = req.query.post;
  let seoMeta = defaultFeedMeta;

  if (postId) {
    const post = await db.getPost(postId);
    if (post && !post.membersOnly) {
      seoMeta = {
        title: `${post.caption.slice(0, 60)} — Sujan Gautam`,
        description: post.caption.slice(0, 155),
        image: post.imageUrl,
        canonical: `https://sujan1919.com.np/feed/?post=${postId}`,
        schema: buildBlogPostingSchema(post)
      };
    }
  }

  res.render('feed', { seoMeta, ...otherData });
});
```

### 4.2 Stories Section (Home Page)

Even though stories are fetched dynamically, render their titles and thumbnails in SSR HTML so Google can index them:

```html
<!-- Render in initial HTML (not just JS-injected) -->
<section aria-label="Stories">
  <article data-story-id="[ID]">
    <img src="[THUMBNAIL]" alt="Story: [STORY_TITLE] by Sujan Gautam" width="60" height="60" />
    <span>[STORY_TITLE]</span>
  </article>
</section>
```

### 4.3 Feed Pagination

Each paginated feed page should have its own URL and canonical:

```html
<!-- Page 1 -->
<link rel="canonical" href="https://sujan1919.com.np/feed/" />
<link rel="next" href="https://sujan1919.com.np/feed/?page=2" />

<!-- Page 2 -->
<link rel="canonical" href="https://sujan1919.com.np/feed/?page=2" />
<link rel="prev" href="https://sujan1919.com.np/feed/" />
<link rel="next" href="https://sujan1919.com.np/feed/?page=3" />
```

---

## 5. Technical SEO

### 5.1 robots.txt

Create at `https://sujan1919.com.np/robots.txt`:
```
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /members-only/

Sitemap: https://sujan1919.com.np/sitemap.xml
```

### 5.2 XML Sitemap

Generate dynamically from your backend at `https://sujan1919.com.np/sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <url>
    <loc>https://sujan1919.com.np/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>https://sujan1919.com.np/about/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>https://sujan1919.com.np/portfolio/</loc>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
    <!-- Add image entries per project -->
    <image:image>
      <image:loc>[PROJECT_THUMBNAIL_URL]</image:loc>
      <image:title>Techy POS — POS and inventory management app by Sujan Gautam</image:title>
    </image:image>
  </url>

  <url>
    <loc>https://sujan1919.com.np/feed/</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Dynamically generated per public post -->
  <url>
    <loc>https://sujan1919.com.np/feed/?post=[POST_ID]</loc>
    <lastmod>[POST_DATE_ISO]</lastmod>
    <changefreq>never</changefreq>
    <priority>0.6</priority>
    <image:image>
      <image:loc>[POST_IMAGE_URL]</image:loc>
      <image:title>[POST_CAPTION first 100 chars]</image:title>
    </image:image>
  </url>

  <url>
    <loc>https://sujan1919.com.np/contact/</loc>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>

</urlset>
```

> **Backend instruction:** Query all public posts from DB and loop to add `<url>` entries dynamically.

### 5.3 Canonical URLs

Every page must self-reference its canonical to avoid duplicate content issues:
```html
<link rel="canonical" href="https://sujan1919.com.np/[CURRENT_PATH]" />
```

Ensure `www.sujan1919.com.np` and `sujan1919.com.np` both 301 redirect to one consistent version (recommend non-www, matching your current URL).

### 5.4 Performance (Core Web Vitals — affects ranking)

- Serve images in **WebP** format with correct `width`/`height` attributes to prevent layout shift (CLS).
- Add `loading="lazy"` on all below-fold images.
- Preload hero/above-fold images: `<link rel="preload" as="image" href="[HERO_IMAGE]" />`
- Minify HTML, CSS, JS. Enable gzip/Brotli compression on your server.
- Set long cache headers for static assets (`Cache-Control: max-age=31536000, immutable`).

### 5.5 Favicon & Web App Manifest

```html
<link rel="icon" type="image/png" href="/favicon-32x32.png" sizes="32x32" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
```

`site.webmanifest`:
```json
{
  "name": "Sujan Gautam — Portfolio",
  "short_name": "Sujan Gautam",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 6. OG Image Specs (per page)

Create static OG images (1200×630px) for each page and store at consistent URLs:

| Page | OG Image Path | Content |
|---|---|---|
| Home | `/og-home.jpg` | Photo of Sujan + "Full-Stack Software Engineer" text |
| About | `/og-about.jpg` | Skills icons + stats (1.5yr / 35 projects / 12 clients) |
| Portfolio | `/og-portfolio.jpg` | Collage of project thumbnails |
| Feed | `/og-feed.jpg` | Latest post preview or generic brand |
| Contact | `/og-contact.jpg` | Sujan photo + email/phone overlaid |
| Per post | Pulled from post `imageUrl` | Post image itself |

---

## 7. Google Search Console Setup

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: `https://sujan1919.com.np/`
3. Verify via HTML meta tag (add to `<head>`): `<meta name="google-site-verification" content="[YOUR_CODE]" />`
4. Submit sitemap: paste `https://sujan1919.com.np/sitemap.xml` in the Sitemaps section
5. Use **URL Inspection Tool** to request indexing of each page individually after implementation

---

## 8. Checklist Before Launch

- [ ] All pages return SSR HTML with meta tags — not empty `<div id="root">`
- [ ] Every feed post URL (`?post=[ID]`) has unique title + description from DB
- [ ] Members-only posts have `noindex` meta tag
- [ ] `robots.txt` live at `/robots.txt`
- [ ] Sitemap live at `/sitemap.xml` and includes all public post URLs
- [ ] All images have `alt` text, explicit `width` + `height`, and `loading="lazy"`
- [ ] Canonical tag on every page points to correct URL
- [ ] `www.` redirects to non-`www.` (or vice versa) via 301
- [ ] OG images set for all pages
- [ ] Google Search Console verified + sitemap submitted
- [ ] Core Web Vitals pass (check via [PageSpeed Insights](https://pagespeed.web.dev/))

---

*Generated for sujan1919.com.np — Sujan Gautam Portfolio*
