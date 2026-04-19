import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Pencil, Search, Upload, Loader2, Image as ImageIcon, Sparkles, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import axios from "axios";
import { API_BASE } from "@/config";
import { toast } from "sonner";
import { AIRefineButton } from "./AIRefineButton";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "url" | "toggle" | "select" | "date" | "number";
  options?: string[];
  required?: boolean;
  hideInTable?: boolean;
  placeholder?: string;
  group?: string;
}

// ─── CrudTable (List View) ────────────────────────────────────────────────────
interface CrudTableProps {
  title: string;
  fields: FieldConfig[];
  data: any[];
  basePath: string; // e.g. "/admin/education"
  onAdd: (item: any) => Promise<void>;
  onUpdate: (id: string, item: any) => Promise<void>;
  onRefresh: () => void;
  extraHeaderActions?: React.ReactNode;
  onRefineItem?: (item: any) => Promise<void>;
}

export const CrudTable = ({ title, fields, data, basePath, onAdd, onUpdate, onDelete, onRefresh, extraHeaderActions, onRefineItem }: CrudTableProps) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredData = data.filter(item =>
    Object.values(item).some(val =>
      String(val).toLowerCase().includes(search.toLowerCase())
    )
  );

  const handleDelete = async (id: string) => {
    if (!confirm(`Delete this ${title} entry?`)) return;
    try {
      await onDelete(id);
      onRefresh();
      toast.success(`${title} deleted`);
    } catch {
      toast.error(`Failed to delete ${title}`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 font-inter pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage {title.toLowerCase()} entries</p>
        </div>
        <div className="flex items-center gap-2">
          {extraHeaderActions}
          <Button
            onClick={() => navigate(`${basePath}/add`)}
            className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 transition-all text-sm"
          >
            <Plus size={16} className="mr-1.5" /> Add {title}
          </Button>
        </div>
      </div>

      <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <span className="text-sm text-slate-500">
            {filteredData.length} {filteredData.length === 1 ? "entry" : "entries"}
          </span>
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-md py-2 pl-9 pr-4 text-sm text-slate-700 focus:bg-white focus:border-slate-300 transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60">
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Image</TableHead>
                {fields.filter(f => !f.hideInTable && f.type !== "toggle" && f.key !== "image").map(field => (
                  <TableHead key={field.key} className="px-6 h-11 text-xs font-medium text-slate-500">{field.label}</TableHead>
                ))}
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Status</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Created</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, idx) => (
                <TableRow key={item.id || idx} className="border-slate-100 hover:bg-slate-50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-md overflow-hidden border border-slate-200 flex items-center justify-center">
                      {item.image ? (
                        <img src={item.image} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={14} className="text-slate-300" />
                      )}
                    </div>
                  </TableCell>
                  {fields.filter(f => !f.hideInTable && f.type !== "toggle" && f.key !== "image").map(field => (
                    <TableCell key={field.key} className="px-6 py-4">
                      <span className="text-sm text-slate-700 line-clamp-2 max-w-[200px]">
                        {item[field.key] || "—"}
                      </span>
                    </TableCell>
                  ))}
                  <TableCell className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      (item.status === true || item.active === true)
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      {(item.status === true || item.active === true) ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="text-xs text-slate-500">
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }) : "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onRefineItem && (
                         <div className="relative group/refine">
                            <button
                               onClick={async () => {
                                  try {
                                     await onRefineItem(item);
                                  } catch (err) {
                                     console.error(err);
                                  }
                               }}
                               className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-all active:scale-95"
                               title="Refine with AI"
                            >
                               <Sparkles size={14} />
                            </button>
                         </div>
                      )}
                      <button
                        onClick={() => navigate(`${basePath}/edit/${item.id}`)}
                        className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={fields.length + 4} className="py-16 text-center text-sm text-slate-400">
                    No entries found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

// ─── CrudForm (Add / Edit View) ───────────────────────────────────────────────
interface CrudFormProps {
  title: string;
  fields: FieldConfig[];
  initialData?: any; // undefined = new, object = edit
  basePath: string;
  onSave: (item: any) => Promise<void>;
}

export const CrudForm = ({ title, fields, initialData, basePath, onSave }: CrudFormProps) => {
  const navigate = useNavigate();
  const isEdit = Boolean(initialData?.id);
  const [currentItem, setCurrentItem] = useState<any>(initialData || {});
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const groups = Array.from(new Set(fields.map(f => f.group || "Settings")));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(currentItem);
      toast.success(`${title} saved successfully`);
      navigate(basePath);
    } catch {
      toast.error(`Failed to save ${title}`);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await axios.post(`${API_BASE}/upload`, fd);
      setCurrentItem({ ...currentItem, image: res.data.url });
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed");
    }
    setImageUploading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(basePath)}
            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">{isEdit ? `Edit ${title}` : `New ${title}`}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{isEdit ? "Update record details" : "Create a new record"}</p>
          </div>
        </div>
        <Button variant="ghost" onClick={() => navigate(basePath)} className="text-slate-500 text-sm h-9">
          Cancel
        </Button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Main fields */}
          <div className="lg:col-span-2 space-y-6">
            {groups.filter(g => g !== "Status" && g !== "Image").map(group => (
              <Card key={group} className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{group}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                   {fields.filter(f => (f.group || "Settings") === group && f.type !== "toggle" && f.key !== "image").map(field => (
                     <div key={field.key} className="space-y-1.5">
                       <div className="flex items-center justify-between">
                         <Label className="text-xs font-medium text-slate-700">{field.label}</Label>
                         {(field.type === "textarea" || field.type === "text") && (
                           <AIRefineButton 
                             value={currentItem[field.key] || ""} 
                             onRefine={(v) => setCurrentItem({ ...currentItem, [field.key]: v })} 
                             context={`${title} ${field.label}`}
                           />
                         )}
                       </div>
                       {field.type === "textarea" ? (
                        <textarea
                          className="w-full h-28 p-3 rounded-md border border-slate-200 bg-white focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all outline-none text-sm text-slate-800 resize-none"
                          value={currentItem[field.key] || ""}
                          onChange={e => setCurrentItem({ ...currentItem, [field.key]: e.target.value })}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                        />
                      ) : field.type === "select" ? (
                        <select
                          className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white focus:border-slate-400 outline-none text-sm text-slate-800"
                          value={currentItem[field.key] || ""}
                          onChange={e => setCurrentItem({ ...currentItem, [field.key]: e.target.value })}
                        >
                          <option value="">Select…</option>
                          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <Input
                          className="h-10 rounded-md border-slate-200 focus:border-slate-400 text-sm text-slate-800"
                          value={currentItem[field.key] || ""}
                          onChange={e => setCurrentItem({ ...currentItem, [field.key]: e.target.value })}
                          placeholder={field.placeholder || `Enter ${field.label}`}
                          type={field.type === "number" ? "number" : "text"}
                          required={field.required}
                        />
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Toggles */}
            {fields.some(f => f.type === "toggle") && (
              <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {fields.filter(f => f.type === "toggle").map(field => (
                    <div key={field.key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{field.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Show this item publicly</p>
                      </div>
                      <Switch
                        checked={Boolean(currentItem[field.key])}
                        onCheckedChange={v => setCurrentItem({ ...currentItem, [field.key]: v })}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Image upload */}
            {fields.some(f => f.key === "image") && (
              <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
                <CardHeader className="px-6 py-4 border-b border-slate-100">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Image</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="w-full aspect-square bg-slate-50 rounded-md flex items-center justify-center border border-dashed border-slate-200 overflow-hidden relative">
                    {currentItem.image ? (
                      <img src={currentItem.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center gap-2">
                        <ImageIcon size={32} className="opacity-40" />
                        <span className="text-xs text-slate-400">No image</span>
                      </div>
                    )}
                    {imageUploading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <Loader2 className="animate-spin text-slate-600" />
                      </div>
                    )}
                  </div>
                   <div className="space-y-3">
                    <label className="w-full cursor-pointer block">
                      <input type="file" className="hidden" onChange={handleImageUpload} />
                      <div className="w-full h-9 flex items-center justify-center gap-2 border border-slate-200 rounded-md text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors">
                        <Upload size={14} /> Upload Image
                      </div>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <LinkIcon size={12} className="text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Or paste direct image URL..." 
                        value={currentItem.image || ""}
                        onChange={e => setCurrentItem({ ...currentItem, image: e.target.value })}
                        className="w-full h-9 pl-8 pr-3 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 transition-all text-slate-600 italic"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <Button disabled={loading} type="submit" className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md text-sm transition-all">
                {loading ? <Loader2 size={15} className="animate-spin mr-2" /> : null}
                {isEdit ? "Save Changes" : `Create ${title}`}
              </Button>
              <Button type="button" variant="ghost" className="w-full h-9 text-slate-500 hover:text-slate-900 text-sm" onClick={() => navigate(basePath)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
