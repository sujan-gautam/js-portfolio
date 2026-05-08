import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { blogPostsDB, BlogPost, blogCategoriesDB, BlogCategory } from "@/lib/adminData";
import { Plus, Trash2, Edit2, Search, FileText, Loader2, Eye, MessageSquare, Tag, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminBlogList = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        blogPostsDB.getAll(),
        blogCategoriesDB.getAll()
      ]);
      setPosts(p.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setCategories(c);
    } catch { 
      setPosts([]); 
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await blogPostsDB.delete(id);
      toast.success("Blog post deleted successfully");
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete post");
    }
  };

  const filteredPosts = posts.filter(p => 
    !search || 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    (p.content && p.content.toLowerCase().includes(search.toLowerCase()))
  );

  const getCategoryName = (id?: string) => {
    if (!id) return "Uncategorized";
    return categories.find(c => c.id === id)?.name || "Uncategorized";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Scheduled": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Draft": return "bg-slate-100 text-slate-500 border-slate-200";
      default: return "bg-slate-100 text-slate-500 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Blog Posts</h1>
          <p className="text-sm text-slate-500 mt-1">Write and manage your psychological narratives</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/blog/categories")}
            className="border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-lg h-10 transition-all text-sm"
          >
            <Layout size={16} className="mr-1.5" /> Categories
          </Button>
          <Button
            onClick={() => navigate("/admin/blog/add")}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 h-10 shadow-sm shadow-indigo-200 transition-all text-sm"
          >
            <Plus size={18} className="mr-1.5" /> Create Post
          </Button>
        </div>
      </div>

      <Card className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between px-6 py-5 border-b border-slate-100 bg-slate-50/30">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-900">
              {filteredPosts.length} <span className="text-slate-500 font-normal">{filteredPosts.length === 1 ? "Article" : "Articles"}</span>
            </span>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by title or content..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/50">
                <TableHead className="px-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Post</TableHead>
                <TableHead className="px-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</TableHead>
                <TableHead className="px-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Stats</TableHead>
                <TableHead className="px-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
                <TableHead className="px-6 h-12 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-24 text-center">
                    <Loader2 size={32} className="animate-spin mx-auto text-indigo-500 opacity-20" />
                    <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest font-medium">Gathering thoughts...</p>
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center max-w-xs mx-auto">
                      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                        <FileText size={24} className="text-slate-300" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900">No blog posts found</h3>
                      <p className="text-xs text-slate-500 mt-1">Start by creating your first article to share your insights with the world.</p>
                      <Button 
                        variant="link" 
                        className="text-indigo-600 mt-2 text-xs"
                        onClick={() => navigate("/admin/blog/add")}
                      >
                        Create your first post
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map(post => (
                  <TableRow key={post.id} className="border-slate-100 hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shrink-0 group-hover:border-indigo-200 transition-colors">
                          {post.featuredImage ? (
                            <img src={post.featuredImage} className="w-full h-full object-cover" alt={post.title} />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <FileText size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-bold text-slate-900 truncate max-w-[240px] group-hover:text-indigo-600 transition-colors">
                            {post.title}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1">
                            /{post.slug}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className="text-slate-400" />
                        <span className="text-xs font-medium text-slate-600">{getCategoryName(post.category)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center justify-center gap-4">
                        <div className="flex flex-col items-center">
                          <span className="text-xs font-bold text-slate-900">{(post.views || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-semibold">Views</span>
                        </div>
                        <div className="flex flex-col items-center border-l border-slate-100 pl-4">
                          <span className="text-xs font-bold text-slate-900">{(post.comments?.length || 0)}</span>
                          <span className="text-[10px] text-slate-400 uppercase tracking-tighter font-semibold">Comments</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
                        getStatusColor(post.status)
                      )}>
                        {post.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-700">
                          {new Date(post.createdAt).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">
                          {post.readTime || 0} min read
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => window.open(`/post/${post.id}`, '_blank')}
                          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                          title="View Live"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => navigate(`/admin/blog/edit/${post.id}`)}
                          className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default AdminBlogList;
