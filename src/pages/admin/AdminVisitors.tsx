import { useState, useEffect, useMemo } from "react";
import { visitorsDB, VisitorRecord } from "@/lib/adminData";
import {
  Users, Globe, Monitor, MapPin,
  Activity, BarChart3, Clock, RefreshCcw,
  Trash2, Search, Flag, Laptop, Globe2,
  LayoutDashboard, Smartphone, Chrome, ArrowUpRight,
  MousePointer, Link, Tag, ChevronDown
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#06b6d4","#3b82f6"];

/* ---------- helpers ---------- */
const deviceIcon = (d = "") => {
  if (d === "mobile") return <Smartphone size={13} />;
  if (d === "tablet") return <Monitor size={13} />;
  return <Laptop size={13} />;
};

const getBadge = (value: string, colorClass: string) => (
  <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium", colorClass)}>
    {value}
  </span>
);

const getDeviceBadgeColor = (d = "") => {
  if (d === "mobile") return "bg-rose-50 text-rose-600";
  if (d === "tablet") return "bg-amber-50 text-amber-600";
  return "bg-indigo-50 text-indigo-600";
};

/* ============================== */
const AdminVisitors = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await visitorsDB.getAll();
      setVisitors(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch { toast.error("Failed to load visitor data"); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  /* ---- computed stats ---- */
  const stats = useMemo(() => {
    const total = visitors.length;
    const countries: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const pages: Record<string, number> = {};
    const sources: Record<string, number> = {};
    const timeline: Record<string, number> = {};

    visitors.forEach(v => {
      const country = v.location?.country || "Unknown";
      countries[country] = (countries[country] || 0) + 1;

      const device = v.device || "desktop";
      devices[device] = (devices[device] || 0) + 1;

      const browser = v.browser || "Other";
      browsers[browser] = (browsers[browser] || 0) + 1;

      const page = v.page || "/";
      pages[page] = (pages[page] || 0) + 1;

      const src = v.utm?.source || (v.referrer && v.referrer !== "direct" ? new URL(v.referrer).hostname : "direct");
      sources[src] = (sources[src] || 0) + 1;

      const date = new Date(v.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      timeline[date] = (timeline[date] || 0) + 1;
    });

    return {
      total,
      countryData: Object.entries(countries).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value).slice(0, 10),
      deviceData: Object.entries(devices).map(([n, v]) => ({ name: n, value: v })),
      browserData: Object.entries(browsers).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value).slice(0, 8),
      pageData: Object.entries(pages).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value).slice(0, 10),
      sourceData: Object.entries(sources).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value).slice(0, 8),
      timelineData: Object.entries(timeline).map(([n, v]) => ({ name: n, visits: v })).slice(-7),
    };
  }, [visitors]);

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try {
      await visitorsDB.delete(id);
      setVisitors(p => p.filter(v => v.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const filtered = visitors.filter(v =>
    (v.ip || "").includes(search) ||
    (v.location?.country || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.location?.city || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.referrer || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.utm?.source || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.page || "").toLowerCase().includes(search.toLowerCase())
  );

  const quickStats = [
    { title: "Total Hits",   value: stats.total.toLocaleString(), sub: "all time",       icon: Users,         color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Top Country",  value: stats.countryData[0]?.name || "—", sub: `${stats.countryData[0]?.value || 0} visits`, icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Top Page",     value: stats.pageData[0]?.name || "—",    sub: `${stats.pageData[0]?.value || 0} visits`,   icon: MousePointer, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Top Source",   value: stats.sourceData[0]?.name || "—",  sub: `${stats.sourceData[0]?.value || 0} refs`,   icon: Link, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-20 px-4">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Visitor Intelligence</h1>
          <p className="text-sm text-slate-500">Cloudflare-style tracking — IP · Location · UTM · Device · Referrer</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9 bg-white border-slate-200 text-slate-700">
            <RefreshCcw size={13} className={cn("mr-1.5", loading && "animate-spin")} /> Sync
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={13} />
            <input
              type="text"
              placeholder="Search IP, country, page, source…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="h-9 pl-9 pr-4 rounded-md border border-slate-200 bg-white text-sm w-56 sm:w-72 focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((s, i) => (
          <Card key={i} className="border-slate-200 shadow-none hover:shadow-sm transition-shadow">
            <CardContent className="p-5 flex items-center gap-3">
              <div className={cn("p-2.5 rounded-lg shrink-0", s.bg, s.color)}><s.icon size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{s.title}</p>
                <p className="text-lg font-semibold text-slate-900 truncate">{s.value}</p>
                <p className="text-[10px] text-slate-400">{s.sub}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="logs">
        <TabsList className="bg-transparent h-auto p-0 gap-6 border-b border-slate-200 w-full justify-start rounded-none mb-4">
          {[
            { value: "overview",   label: "Overview",   icon: LayoutDashboard },
            { value: "audience",   label: "Audience",   icon: Globe2 },
            { value: "technology", label: "Technology", icon: Laptop },
            { value: "sources",    label: "Sources",    icon: Link },
            { value: "logs",       label: "Access Logs",icon: Clock },
          ].map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-sm text-slate-500 data-[state=active]:text-slate-900 transition-all gap-1.5"
            >
              <t.icon size={13} /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2 border-slate-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Traffic Trend (last 7 days)</CardTitle>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.timelineData}>
                    <defs>
                      <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgb(0 0 0/.1)" }} />
                    <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={2.5} fill="url(#tGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top Pages</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {stats.pageData.map((p, i) => (
                  <div key={i} className="flex justify-between items-center px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] text-slate-400 w-4 shrink-0">#{i+1}</span>
                      <span className="text-sm text-slate-700 font-medium truncate">{p.name}</span>
                    </div>
                    <span className="text-xs text-indigo-600 font-semibold shrink-0">{p.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Audience ── */}
        <TabsContent value="audience" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Countries</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.countryData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={110} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(99,102,241,.05)" }} />
                    <Bar dataKey="value" fill="#6366f1" radius={[0,4,4,0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Country Breakdown</CardTitle></CardHeader>
              <CardContent className="p-0">
                {stats.countryData.map((c, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <Flag size={12} className="text-slate-400" />
                      <span className="text-sm text-slate-700">{c.name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.value / (stats.countryData[0]?.value || 1)) * 100}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600 w-8 text-right">{c.value}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Technology ── */}
        <TabsContent value="technology" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Device Types</CardTitle></CardHeader>
              <CardContent className="h-[220px] flex items-center justify-center flex-col gap-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={stats.deviceData} innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                      {stats.deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex gap-4">
                  {stats.deviceData.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-[10px] text-slate-500 capitalize">{d.name}: {d.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 border-slate-200 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Browsers</CardTitle></CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.browserData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(99,102,241,.05)" }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[4,4,0,0]} barSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Sources ── */}
        <TabsContent value="sources" className="space-y-5 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Traffic Sources</CardTitle></CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.sourceData} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: "rgba(99,102,241,.05)" }} />
                    <Bar dataKey="value" fill="#10b981" radius={[0,4,4,0]} barSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-none">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">UTM Campaign Hits</CardTitle></CardHeader>
              <CardContent className="p-0">
                {visitors.filter(v => v.utm?.campaign).slice(0, 10).length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-slate-400">No UTM campaign data yet.<br/>Add <code>?utm_source=…</code> to your links.</div>
                ) : visitors.filter(v => v.utm?.campaign).slice(0, 10).map((v, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <div>
                      <p className="text-xs font-medium text-slate-700">{v.utm?.campaign}</p>
                      <p className="text-[10px] text-slate-400">{v.utm?.source} / {v.utm?.medium}</p>
                    </div>
                    <span className="text-[10px] text-slate-400">{v.page}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Access Logs ── */}
        <TabsContent value="logs" className="mt-0">
          <Card className="border-slate-200 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-5 py-3">IP / Client</th>
                    <th className="px-5 py-3">Location / ISP</th>
                    <th className="px-5 py-3">Page</th>
                    <th className="px-5 py-3">Device</th>
                    <th className="px-5 py-3">Source / UTM</th>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {loading ? (
                    <tr><td colSpan={7} className="py-12 text-center"><RefreshCcw className="animate-spin mx-auto text-slate-400" size={20} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-sm text-slate-400">No matching records</td></tr>
                  ) : filtered.slice(0, 100).map(v => (
                    <>
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => setExpanded(expanded === v.id ? null : v.id)}
                      >
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-slate-800">{v.ip}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{v.browser} · {v.os}</p>
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-sm text-slate-700">
                            {v.location?.city ? `${v.location.city}, ${v.location.countryCode}` : v.location?.country || "Unknown"}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[160px]">
                            {v.location?.isp || v.location?.country || "—"}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">{v.page}</span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1.5">
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium", getDeviceBadgeColor(v.device))}>
                              {deviceIcon(v.device)} {v.device || "desktop"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          {v.utm?.source ? (
                            <div>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{v.utm.source}</span>
                              {v.utm.medium && <span className="ml-1 text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{v.utm.medium}</span>}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">{v.referrer === "direct" || !v.referrer ? "direct" : (v.referrer || "").replace(/https?:\/\//, "").slice(0, 25)}</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <p className="text-xs text-slate-500">{new Date(v.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                          <p className="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleDateString()}</p>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={e => { e.stopPropagation(); deleteRecord(v.id); }} className="p-1.5 text-slate-300 hover:text-rose-500 transition-colors rounded hover:bg-rose-50">
                              <Trash2 size={13} />
                            </button>
                            <ChevronDown size={13} className={cn("text-slate-400 transition-transform", expanded === v.id && "rotate-180")} />
                          </div>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expanded === v.id && (
                        <tr key={v.id + "-exp"} className="bg-slate-50/80">
                          <td colSpan={7} className="px-5 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">User Agent</p>
                                <p className="text-slate-600 break-all leading-relaxed">{v.userAgent || "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Referrer</p>
                                <p className="text-slate-600 break-all">{v.referrer || "direct"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">UTM</p>
                                <p className="text-slate-600">src: {v.utm?.source || "—"}</p>
                                <p className="text-slate-600">med: {v.utm?.medium || "—"}</p>
                                <p className="text-slate-600">cmp: {v.utm?.campaign || "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Screen / Lang</p>
                                <p className="text-slate-600">{v.screenResolution || "—"}</p>
                                <p className="text-slate-600">{v.language || "—"}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase mb-1">Geo</p>
                                <p className="text-slate-600">{v.location?.city}, {v.location?.region}</p>
                                <p className="text-slate-600">{v.location?.country} ({v.location?.countryCode})</p>
                                {v.location?.lat && <p className="text-slate-500 text-[10px]">{v.location.lat.toFixed(2)}, {v.location.lon?.toFixed(2)}</p>}
                                <p className="text-slate-500 text-[10px] mt-1">{v.location?.isp}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 text-xs text-slate-400">
              Showing {Math.min(filtered.length, 100)} of {filtered.length} records · Click any row to expand full details
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVisitors;
