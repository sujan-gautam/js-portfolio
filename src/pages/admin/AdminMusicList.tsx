import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2, Edit2, Music, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { musicDB, MusicItem } from "@/lib/adminData";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminMusicList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<MusicItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    musicDB.getAll().then(res => { setData(res); setLoading(false); });
  };

  useEffect(() => { loadData(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    await musicDB.delete(id);
    toast.success("Track removed");
    loadData();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Music</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage background audio tracks</p>
        </div>
        <Button
          onClick={() => navigate("/admin/music/add")}
          className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 text-sm transition-all w-full sm:w-auto"
        >
          <Plus size={16} className="mr-1.5" /> Add Track
        </Button>
      </div>

      <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 bg-slate-50/60">
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Track</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Timing</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500">Status</TableHead>
                <TableHead className="px-6 h-11 text-xs font-medium text-slate-500 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <Loader2 size={24} className="animate-spin mx-auto text-slate-400" />
                  </TableCell>
                </TableRow>
              ) : data.map(m => (
                <TableRow key={m.id} className="border-slate-100 hover:bg-slate-50 transition-colors">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center text-slate-500">
                        <Music size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900 leading-none">{m.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{m.artist}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Clock size={12} className="text-slate-400" />
                      <span className="text-xs font-mono">{m.startTime}s — {m.endTime || "∞"}s</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border",
                      m.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      <span className={cn("w-1.5 h-1.5 rounded-full", m.active ? "bg-emerald-500" : "bg-slate-300")} />
                      {m.active ? "Active" : "Hidden"}
                    </span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => navigate(`/admin/music/edit/${m.id}`)} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={4} className="py-16 text-center text-sm text-slate-400">
                    No tracks added yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile card list */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="py-16 flex justify-center"><Loader2 size={24} className="animate-spin text-slate-400" /></div>
          ) : data.length === 0 ? (
            <div className="py-16 text-center text-sm text-slate-400">No tracks added yet</div>
          ) : data.map(m => (
            <div key={m.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
              <div className="w-10 h-10 rounded-md bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                <Music size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{m.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{m.artist} &bull; {m.startTime}s–{m.endTime || '∞'}s</p>
              </div>
              <span className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border shrink-0",
                m.active ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", m.active ? "bg-emerald-500" : "bg-slate-300")} />
                {m.active ? "Active" : "Hidden"}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => navigate(`/admin/music/edit/${m.id}`)} className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(m.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors">
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

export default AdminMusicList;
