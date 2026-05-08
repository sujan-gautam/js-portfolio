import { useState, useEffect } from "react";
import { blogCategoriesDB, BlogCategory, generateId } from "@/lib/adminData";
import { 
  Plus, Trash2, Edit2, Search, Layout, 
  Tag, ChevronRight, Hash, Folder, 
  Save, X, Loader2, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminBlogCategories = () => {
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCat, setEditingCat] = useState<Partial<BlogCategory> | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await blogCategoriesDB.getAll();
      setCategories(data);
    } catch { setCategories([]); }
    setLoading(false);
  };

  useEffect(() => { loadCategories(); }, []);

  const saveCategory = async () => {
    if (!editingCat?.name) return;
    try {
      const slug = editingCat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      if (editingCat.id) {
        await blogCategoriesDB.update(editingCat.id, { ...editingCat, slug });
        toast.success("Category updated");
      } else {
        const newCat = {
          ...editingCat,
          id: generateId(),
          slug,
          createdAt: new Date().toISOString()
        } as BlogCategory;
        await blogCategoriesDB.create(newCat);
        toast.success("Category created");
      }
      setEditingCat(null);
      loadCategories();
    } catch { toast.error("Failed to save category"); }
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Are you sure? This will not delete posts in this category.")) return;
    await blogCategoriesDB.delete(id);
    toast.success("Category removed");
    loadCategories();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter max-w-5xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Content Categories</h1>
          <p className="text-sm text-slate-500 mt-1">Organize your psychological research and narratives</p>
        </div>
        <Button
          onClick={() => setEditingCat({ name: "", description: "" })}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg h-10 shadow-sm"
        >
          <Plus size={18} className="mr-1.5" /> New Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-7">
          <Card className="bg-white border-slate-200 shadow-none overflow-hidden rounded-xl">
             <div className="divide-y divide-slate-100">
                {loading ? (
                  <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-500" /></div>
                ) : categories.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-sm italic">No categories created yet</div>
                ) : categories.map(cat => (
                  <div key={cat.id} className="p-5 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                        <Folder size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">/category/{cat.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingCat(cat)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => deleteCategory(cat.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100 transition-all">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
             </div>
          </Card>
        </div>

        <div className="md:col-span-5">
           {editingCat ? (
             <Card className="p-6 border-slate-200 rounded-xl shadow-sm bg-white sticky top-24">
                <h3 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                  <Layout size={16} className="text-indigo-600" /> {editingCat.id ? "Edit Category" : "New Category"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Category Name</Label>
                    <Input 
                      value={editingCat.name} 
                      onChange={e => setEditingCat({...editingCat, name: e.target.value})}
                      placeholder="e.g. Human Behavior"
                      className="border-slate-200 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5 block">Description</Label>
                    <textarea 
                      value={editingCat.description}
                      onChange={e => setEditingCat({...editingCat, description: e.target.value})}
                      placeholder="What kind of content goes here?"
                      className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 outline-none focus:bg-white focus:border-indigo-500 transition-all resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    <Button variant="ghost" onClick={() => setEditingCat(null)} className="flex-1 text-slate-500 font-bold uppercase text-[10px]">Cancel</Button>
                    <Button onClick={saveCategory} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-100">
                      <Save size={16} className="mr-2" /> Save
                    </Button>
                  </div>
                </div>
             </Card>
           ) : (
             <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-8 text-center sticky top-24">
                <BarChart3 size={32} className="mx-auto text-slate-300 mb-3" />
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select to Manage</h3>
                <p className="text-[11px] text-slate-400 mt-2">Manage your blog taxonomy to keep your psychological insights organized.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default AdminBlogCategories;
