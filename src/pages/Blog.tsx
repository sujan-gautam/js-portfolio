import { useEffect, useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import SEO from "@/components/SEO";
import { useAuth } from "@/context/AuthContext";
import { blogPostsDB, type BlogPost } from "@/lib/adminData";
import { contentTracking } from "@/lib/contentTracking";

export default function Blog() {
  const { user, loading } = useAuth();
  const [posts, setPosts] = useState<BlogPost[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (loading) return;
    let active = true;
    setPosts(null);
    blogPostsDB.getAll().then((items) => {
      if (!active) return;
      setPosts(Array.isArray(items) ? items.filter((item) => item.status === "Published")
        .sort((a, b) => Date.parse(b.publishedAt || b.createdAt) - Date.parse(a.publishedAt || a.createdAt)) : []);
    });
    return () => { active = false; };
  }, [loading, user?.id]);

  const query = search.trim().toLowerCase();
  const filtered = posts?.filter((post) => !query || (post.title || "").toLowerCase().includes(query) || post.excerpt?.toLowerCase().includes(query));

  return (
    <main className="mx-auto min-h-screen max-w-[56rem] px-5 pb-28 pt-9 font-inter text-foreground sm:px-8 sm:pt-14">
      <SEO title="Articles | Sujan Gautam" description="Published articles by Sujan Gautam." url="https://sujan1919.com.np/blog" />
      <header className="border-b border-border pb-5">
        <h1 className="font-poppins text-[clamp(1.75rem,5vw,2.75rem)] font-semibold tracking-tight">Articles</h1>
      </header>
      {!!posts?.length && (
        <label className="mt-5 block max-w-sm text-sm font-medium">
          Search articles
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="mt-2 block min-h-11 w-full rounded-md border border-border bg-card px-3 text-base" />
        </label>
      )}
      {posts === null ? <p role="status" className="mt-6 text-sm text-muted-foreground">Loading articles…</p> : !filtered?.length ? (
        <p className="mt-6 text-sm text-muted-foreground">{query ? "No articles match your search." : "No published articles yet."}</p>
      ) : (
        <ul className="mt-6 divide-y divide-border border-y border-border">
          {filtered.map((post) => {
            const locked = post.locked || (post.membersOnly && !user);
            const date = new Date(post.publishedAt || post.createdAt);
            return (
              <li key={post.id} {...(!locked ? contentTracking("article", post.id, post.title, post.publishedAt || post.createdAt) : {})}>
                <Link to={`/blog/${encodeURIComponent(post.slug)}`} className="group flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <h2 className="break-words font-poppins text-lg font-medium group-hover:underline group-hover:underline-offset-4">{locked ? "Log in to view" : post.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                      {Number.isFinite(date.getTime()) && <time dateTime={date.toISOString()}>{date.toLocaleDateString()}</time>}
                      {!!post.readTime && <span>{post.readTime} min read</span>}
                    </div>
                    {!locked && post.excerpt && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>}
                  </div>
                  {locked ? <Lock size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" /> : <ArrowRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
