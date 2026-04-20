import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { feedAPI, FeedPost } from "@/lib/adminData";
import { Plus, Trash2, Edit2, Search, AlignLeft, Video, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { API_BASE } from "@/config";

const AdminFeedList = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadPosts = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API_BASE}/collection/feed`);
      setPosts(r.data.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch { setPosts([]); }
    setLoading(false);
  };

  useEffect(() => { loadPosts(); }, []);

  const deletePost = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await feedAPI.deletePost(id);
    toast.success("Post deleted");
    loadPosts();
  };

  const filteredPosts = posts.filter(p => !search || p.content?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Feed</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage public posts and media</p>
        </div>
        <Button
          onClick={() => navigate("/admin/feed/add")}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 transition-all text-sm w-full sm:w-auto"
        >
          <Plus size={16} className="mr-1.5" /> New Post
        </Button>
      </div>

      <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between px-4 sm:px-6 py-4 border-b border-slate-100">
          <span className="text-sm text-slate-500">
            {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
          </span>
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search posts..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 pl-9 pr-4 text-sm text-slate-700 focus:bg-white focus:border-slate-300 transition-all outline-none"
            />
          </div>
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60">
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Asset</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Content</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Type</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Status</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Date</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-20 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : filteredPosts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-16 text-center text-sm text-slate-400">
                    No posts found
                  </TableCell>
                </TableRow>
              ) : (
                filteredPosts.map(post => (
                  <TableRow key={post.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center">
                        {post.type === "image" && post.images?.[0] ? (
                          <img src={post.images[0]} className="w-full h-full object-cover" />
                        ) : post.type === "video" ? (
                          <Video size={14} className="text-slate-400" />
                        ) : (
                          <AlignLeft size={14} className="text-slate-300" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-sm text-slate-700 line-clamp-2 max-w-[300px]">
                        {post.content || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-xs font-medium text-slate-500 capitalize">{post.type}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                        post.published !== false
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-slate-100 text-slate-500 border-slate-200"
                      )}>
                        {post.published !== false ? "Live" : "Draft"}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-xs text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/feed/edit/${post.id}`)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => deletePost(post.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">No posts found</div>
          ) : filteredPosts.map(post => (
            <div key={post.id} className="flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors">
              <div className="w-12 h-12 bg-slate-100 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center shrink-0">
                {post.type === "image" && post.images?.[0] ? (
                  <img src={post.images[0]} className="w-full h-full object-cover" />
                ) : post.type === "video" ? (
                  <Video size={16} className="text-slate-400" />
                ) : (
                  <AlignLeft size={16} className="text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-700 line-clamp-2">{post.content || "—"}</p>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className="text-xs font-medium text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-full">{post.type}</span>
                  <span className={cn(
                    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
                    post.published !== false
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-100 text-slate-500 border-slate-200"
                  )}>
                    {post.published !== false ? "Live" : "Draft"}
                  </span>
                  <span className="text-xs text-slate-400">{new Date(post.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => navigate(`/admin/feed/edit/${post.id}`)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => deletePost(post.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default AdminFeedList;
