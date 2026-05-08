import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { blogPostsDB, BlogPost, blogCategoriesDB, BlogCategory } from "@/lib/adminData";
import { BookOpen, Calendar, Clock, ChevronRight, Search, Tag, Loader2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import SEO from "@/components/SEO";

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [p, c] = await Promise.all([
          blogPostsDB.getAll(),
          blogCategoriesDB.getAll()
        ]);
        // Only show published posts
        setPosts(p.filter(post => post.status === "Published").sort((a, b) => new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()));
        setCategories(c);
      } catch (err) {
        console.error("Failed to load blog data", err);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const filteredPosts = posts.filter(p => {
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    const matchesSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.excerpt && p.excerpt.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const featuredPost = filteredPosts[0];
  const regularPosts = filteredPosts.slice(1);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <SEO 
        title="Psychological Narratives & Research | Sujan Gautam"
        description="Explore deep-dive psychological insights, research papers, and narrative storytelling by Sujan Gautam."
      />

      {/* Header Section */}
      <header className="bg-white border-b border-slate-200 pt-32 pb-16 px-6">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="bg-indigo-50 text-indigo-600 border-none mb-4 hover:bg-indigo-100 transition-colors uppercase tracking-widest text-[10px] font-bold py-1 px-4">The Narrative Journal</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6">
            Psychological <span className="text-indigo-600">Narratives.</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            A deep-dive into the human psyche, research-backed insights, and philosophical explorations of modern existence.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none w-full md:w-auto">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                !selectedCategory ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 hover:bg-slate-100"
              )}
            >
              All Topics
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold transition-all whitespace-nowrap",
                  selectedCategory === cat.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-white text-slate-500 hover:bg-slate-100"
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search narratives..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-full py-2.5 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 transition-all outline-none"
            />
          </div>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="text-center py-32">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No narratives found</h3>
            <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {/* Featured Post */}
            {!selectedCategory && !search && featuredPost && (
              <Link to={`/blog/${featuredPost.slug}`} className="block group">
                <Card className="overflow-hidden border-none shadow-2xl shadow-indigo-500/5 bg-white rounded-[32px] grid md:grid-cols-2 gap-0">
                  <div className="h-[400px] md:h-full overflow-hidden">
                    <img 
                      src={featuredPost.featuredImage || "https://images.unsplash.com/photo-1518118014377-ce94f3e8848d?q=80&w=2070&auto=format&fit=crop"} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                      alt={featuredPost.title}
                    />
                  </div>
                  <div className="p-8 md:p-12 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-bold uppercase tracking-wider">Featured Narrative</span>
                      <span className="text-slate-400 text-xs flex items-center gap-1"><Clock size={12} /> {featuredPost.readTime} min read</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">
                      {featuredPost.title}
                    </h2>
                    <p className="text-slate-500 text-lg mb-8 line-clamp-3 leading-relaxed">
                      {featuredPost.excerpt || "Dive into this insightful exploration of the human mind and society."}
                    </p>
                    <div className="flex items-center justify-between mt-auto pt-6 border-t border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
                           <img src="/favicon.ico" alt="Author" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-900">Sujan Gautam</span>
                          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Thought Architect</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm">
                        Read Story <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            )}

            {/* Grid Posts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {(selectedCategory || search ? filteredPosts : regularPosts).map(post => (
                <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                  <Card className="h-full flex flex-col border-none shadow-xl shadow-indigo-500/5 bg-white rounded-2xl overflow-hidden hover:-translate-y-1 transition-all duration-300">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img 
                        src={post.featuredImage || "https://images.unsplash.com/photo-1518118014377-ce94f3e8848d?q=80&w=2070&auto=format&fit=crop"} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        alt={post.title}
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-sm text-slate-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {categories.find(c => c.id === post.category)?.name || "Article"}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock size={12} /> {post.readTime} min read</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-6 line-clamp-2 leading-relaxed">
                        {post.excerpt || "Explore the psychological depths of this narrative."}
                      </p>
                      <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                        <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                          Continue Reading <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                        </span>
                        {post.emotionalTone && post.emotionalTone !== "None" && (
                          <span className="text-[10px] text-slate-300 font-medium italic">{post.emotionalTone}</span>
                        )}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Newsletter / CTA */}
      <section className="bg-slate-900 py-24 px-6 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-600 opacity-5 -translate-y-1/2 blur-[100px] rounded-full" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6">Stay informed, stay <span className="text-indigo-400">curious.</span></h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join 50,000+ readers who receive my weekly digest on psychology, technology, and the philosophy of mind.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full bg-white/5 border border-white/10 rounded-full py-3.5 px-6 text-white text-sm focus:bg-white/10 focus:border-indigo-400 transition-all outline-none"
            />
            <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-full px-8 py-3.5 shadow-xl shadow-indigo-600/20">
              Subscribe
            </Button>
          </div>
          <p className="text-[10px] text-slate-500 mt-6 uppercase tracking-widest font-bold">No spam. Only deep thoughts. Ever.</p>
        </div>
      </section>
    </div>
  );
};

export default Blog;
