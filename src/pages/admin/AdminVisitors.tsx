import { useState, useEffect } from "react";
import { visitorsDB, VisitorRecord } from "@/lib/adminData";
import {
  Users, Globe, Monitor, Activity, Clock, RefreshCcw,
  Trash2, Search, Laptop, Smartphone, Link,
  LayoutDashboard, Globe2, MousePointer, ChevronDown,
  Timer, MousePointerClick, DoorOpen, DoorClosed, LineChart
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ["#6366f1","#8b5cf6","#ec4899","#f43f5e","#f59e0b","#10b981","#06b6d4","#3b82f6"];

const deviceIcon = (d = "") => {
  if (d === "mobile") return <Smartphone size={13} />;
  if (d === "tablet") return <Monitor size={13} />;
  return <Laptop size={13} />;
};

const getDeviceBadgeColor = (d = "") => {
  if (d === "mobile") return "bg-rose-50 text-rose-600";
  if (d === "tablet") return "bg-amber-50 text-amber-600";
  return "bg-indigo-50 text-indigo-600";
};

const formatTime = (seconds: number) => {
  if (!seconds) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const AdminVisitors = () => {
  const [logs, setLogs] = useState<VisitorRecord[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insightsData, rawLogs] = await Promise.all([
        visitorsDB.getInsights(period),
        visitorsDB.getAll()
      ]);
      setInsights(insightsData);
      setLogs(rawLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch { 
      toast.error("Failed to load visitor data"); 
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [period]);

  const deleteRecord = async (id: string) => {
    if (!confirm("Delete this record?")) return;
    try {
      await visitorsDB.delete(id);
      setLogs(p => p.filter(v => v.id !== id));
      toast.success("Deleted");
    } catch { toast.error("Failed"); }
  };

  const filteredLogs = logs.filter(v =>
    (v.ip || "").includes(search) ||
    (v.location?.country || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.location?.city || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.referrer || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.utm?.source || "").toLowerCase().includes(search.toLowerCase()) ||
    (v.page || "").toLowerCase().includes(search.toLowerCase())
  );

  const kpis = insights ? [
    { title: "Total Visits", value: insights.summary.totalVisits.toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Unique Sessions", value: insights.summary.uniqueSessions.toLocaleString(), icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Avg Time on Site", value: formatTime(insights.summary.avgTimeSpent), icon: Timer, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Bounce Rate", value: `${insights.summary.bounceRate}%`, icon: MousePointerClick, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Pages / Session", value: insights.summary.pageViewsPerSession, icon: LineChart, color: "text-blue-600", bg: "bg-blue-50" },
  ] : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-7xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Advanced Analytics</h1>
          <p className="text-sm text-slate-500">Comprehensive visitor insights and session tracking</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select 
            value={period} 
            onChange={e => setPeriod(e.target.value)}
            className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none cursor-pointer"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="365d">Last Year</option>
            <option value="all">All Time</option>
          </select>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9 bg-white border-slate-200 text-slate-700">
            <RefreshCcw size={13} className={cn("mr-1.5", loading && "animate-spin")} /> Sync
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      {insights && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {kpis.map((s, i) => (
            <Card key={i} className="border-slate-200 shadow-none">
              <CardContent className="p-4 flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shrink-0", s.bg, s.color)}><s.icon size={18} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{s.title}</p>
                  <p className="text-lg font-semibold text-slate-900 truncate">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-transparent h-auto p-0 gap-6 border-b border-slate-200 w-full justify-start rounded-none mb-4 overflow-x-auto flex-nowrap">
          {[
            { value: "overview", label: "Overview", icon: LayoutDashboard },
            { value: "audience", label: "Audience & Geo", icon: Globe2 },
            { value: "behavior", label: "Behavior", icon: Activity },
            { value: "sources",  label: "Sources", icon: Link },
            { value: "logs",     label: "Raw Logs", icon: Clock },
          ].map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-sm text-slate-500 data-[state=active]:text-slate-900 transition-all gap-1.5 whitespace-nowrap"
            >
              <t.icon size={13} /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {insights && (
          <>
            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-5 mt-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 border-slate-200 shadow-none">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Traffic Trend</CardTitle></CardHeader>
                  <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={insights.dailyTrend}>
                        <defs>
                          <linearGradient id="tGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgb(0 0 0/.1)" }} />
                        <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={2.5} fill="url(#tGrad)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Pages</CardTitle></CardHeader>
                  <CardContent className="p-0 overflow-auto max-h-[280px]">
                    {insights.topPages.map((p: any, i: number) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2.5 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-sm text-slate-700 font-medium truncate">{p.page}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-indigo-600 font-semibold">{p.visits} views</p>
                          <p className="text-[10px] text-slate-400">{formatTime(p.avgTime)}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">New vs Returning</CardTitle></CardHeader>
                  <CardContent className="h-[200px] flex flex-col items-center justify-center">
                     <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={[
                            { name: "New", value: insights.returnVsNew.new },
                            { name: "Returning", value: insights.returnVsNew.returning }
                          ]} innerRadius={40} outerRadius={60} dataKey="value">
                             <Cell fill="#3b82f6" />
                             <Cell fill="#10b981" />
                          </Pie>
                          <RechartsTooltip />
                        </PieChart>
                     </ResponsiveContainer>
                     <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full"/> <span className="text-xs text-slate-500">New: {insights.returnVsNew.new}</span></div>
                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"/> <span className="text-xs text-slate-500">Returning: {insights.returnVsNew.returning}</span></div>
                     </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Hourly Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.hourlyDistribution}>
                        <XAxis dataKey="hour" hide />
                        <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                        <Bar dataKey="visits" fill="#f59e0b" radius={[2,2,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Devices</CardTitle></CardHeader>
                  <CardContent className="h-[200px] flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={insights.deviceBreakdown} innerRadius={40} outerRadius={60} dataKey="visits">
                          {insights.deviceBreakdown.map((_:any, i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                      {insights.deviceBreakdown.map((d:any, i:number) => (
                        <div key={i} className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}/><span className="text-[10px] text-slate-500 capitalize">{d.name}</span></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* ── Audience ── */}
            <TabsContent value="audience" className="space-y-5 mt-0">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Countries</CardTitle></CardHeader>
                   <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                     {insights.topCountries.map((c:any, i:number) => (
                       <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                         <span className="text-sm text-slate-700">{c.country} {c.code && `(${c.code})`}</span>
                         <span className="text-xs font-semibold text-slate-600">{c.visits}</span>
                       </div>
                     ))}
                   </CardContent>
                 </Card>
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Top Cities</CardTitle></CardHeader>
                   <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                     {insights.topCities.map((c:any, i:number) => (
                       <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                         <span className="text-sm text-slate-700">{c.city}, {c.country}</span>
                         <span className="text-xs font-semibold text-slate-600">{c.visits}</span>
                       </div>
                     ))}
                   </CardContent>
                 </Card>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Browsers</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     {insights.browserBreakdown.map((b:any, i:number) => (
                       <div key={i} className="flex justify-between px-4 py-2 border-b border-slate-50 text-sm text-slate-600"><span>{b.name}</span><span>{b.visits}</span></div>
                     ))}
                   </CardContent>
                 </Card>
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">OS</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     {insights.osBreakdown.map((o:any, i:number) => (
                       <div key={i} className="flex justify-between px-4 py-2 border-b border-slate-50 text-sm text-slate-600"><span>{o.name}</span><span>{o.visits}</span></div>
                     ))}
                   </CardContent>
                 </Card>
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Network</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     {insights.connectionTypes.map((c:any, i:number) => (
                       <div key={i} className="flex justify-between px-4 py-2 border-b border-slate-50 text-sm text-slate-600"><span className="uppercase">{c.name}</span><span>{c.visits}</span></div>
                     ))}
                   </CardContent>
                 </Card>
               </div>
            </TabsContent>

            {/* ── Behavior ── */}
            <TabsContent value="behavior" className="space-y-5 mt-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><DoorOpen size={16}/> Entry Pages</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     {insights.entryPages.map((p:any, i:number) => (
                       <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-50 text-sm text-slate-700"><span>{p.page}</span><span className="font-semibold text-emerald-600">{p.count}</span></div>
                     ))}
                   </CardContent>
                 </Card>
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold flex items-center gap-2"><DoorClosed size={16}/> Exit Pages</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     {insights.exitPages.map((p:any, i:number) => (
                       <div key={i} className="flex justify-between px-5 py-3 border-b border-slate-50 text-sm text-slate-700"><span>{p.page}</span><span className="font-semibold text-rose-600">{p.count}</span></div>
                     ))}
                   </CardContent>
                 </Card>
                 <Card className="border-slate-200 shadow-none md:col-span-2">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Average Scroll Depth by Page</CardTitle></CardHeader>
                   <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                     {insights.scrollDepthAvg.map((p:any, i:number) => (
                       <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                         <span className="text-sm text-slate-700">{p.page}</span>
                         <div className="flex items-center gap-3">
                           <div className="w-32 h-2 bg-slate-100 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${p.avgScroll}%` }} />
                           </div>
                           <span className="text-xs font-semibold text-slate-600 w-8 text-right">{p.avgScroll}%</span>
                         </div>
                       </div>
                     ))}
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
                       <BarChart data={insights.trafficSources} layout="vertical">
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={120} tickLine={false} axisLine={false} />
                         <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} />
                         <Bar dataKey="visits" fill="#10b981" radius={[0,4,4,0]} barSize={16} />
                       </BarChart>
                     </ResponsiveContainer>
                   </CardContent>
                 </Card>
                 <Card className="border-slate-200 shadow-none">
                   <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">UTM Campaigns</CardTitle></CardHeader>
                   <CardContent className="p-0">
                     {insights.utmCampaigns.length === 0 ? (
                        <div className="p-8 text-center text-sm text-slate-400">No UTM campaign data found.</div>
                     ) : insights.utmCampaigns.map((u:any, i:number) => (
                       <div key={i} className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
                         <div>
                           <p className="text-sm font-medium text-slate-700">{u.campaign}</p>
                           <p className="text-[10px] text-slate-400">{u.source} / {u.medium}</p>
                         </div>
                         <span className="text-xs font-semibold text-slate-600">{u.visits} visits</span>
                       </div>
                     ))}
                   </CardContent>
                 </Card>
               </div>
            </TabsContent>
          </>
        )}

        {/* ── Raw Logs ── */}
        <TabsContent value="logs" className="mt-0">
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-white text-sm w-full outline-none focus:border-indigo-300"
              />
            </div>
          </div>
          <Card className="border-slate-200 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3">Client</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Page & Time</th>
                    <th className="px-4 py-3">Source</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center"><RefreshCcw className="animate-spin mx-auto text-slate-400" size={20} /></td></tr>
                  ) : filteredLogs.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">No logs found</td></tr>
                  ) : filteredLogs.slice(0, 100).map(v => (
                    <React.Fragment key={v.id}>
                      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === v.id ? null : v.id)}>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{v.ip}</p>
                          <p className="text-[10px] text-slate-500">{v.browser} · {v.os} · {deviceIcon(v.device)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{v.location?.city ? `${v.location.city}, ${v.location.countryCode}` : v.location?.country || "Unknown"}</p>
                          <p className="text-[10px] text-slate-500">{v.location?.isp || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-slate-600 bg-slate-100 inline-block px-1.5 py-0.5 rounded">{v.page}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(v.timestamp).toLocaleString()} ({formatTime(v.timeSpent || 0)})
                          </p>
                        </td>
                        <td className="px-4 py-3 max-w-[150px] truncate">
                          {v.utm?.source ? (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded">{v.utm.source}</span>
                          ) : (
                            <span className="text-slate-500 text-xs">{v.referrer === "direct" || !v.referrer ? "direct" : v.referrer}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={(e) => { e.stopPropagation(); deleteRecord(v.id); }} className="text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                            <ChevronDown size={14} className={cn("text-slate-400 transition-transform", expanded === v.id && "rotate-180")} />
                          </div>
                        </td>
                      </tr>
                      {expanded === v.id && (
                        <tr className="bg-slate-50">
                          <td colSpan={5} className="px-4 py-4 border-t border-slate-100">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="font-semibold text-slate-400 uppercase mb-1 text-[10px]">Session Data</p>
                                <p>Time Spent: {formatTime(v.timeSpent || 0)}</p>
                                <p>Scroll Depth: {v.scrollDepth || 0}%</p>
                                <p>Clicks: {v.clickCount || 0}</p>
                                <p>Bounced: {v.bounced ? "Yes" : "No"}</p>
                                <p>Type: {v.isReturning ? "Returning" : "New"}</p>
                              </div>
                              <div>
                                <p className="font-semibold text-slate-400 uppercase mb-1 text-[10px]">Client Tech</p>
                                <p>Resolution: {v.screenResolution}</p>
                                <p>Viewport: {v.viewport}</p>
                                <p>Connection: {v.connectionType || "—"}</p>
                                <p>Timezone: {v.timezone || "—"}</p>
                              </div>
                              <div className="md:col-span-2">
                                <p className="font-semibold text-slate-400 uppercase mb-1 text-[10px]">Raw Location & User Agent</p>
                                <p className="text-slate-600 mb-1">GPS Accuracy: {v.location?.accuracy ? `±${Math.round(v.location.accuracy)}m` : "N/A"}</p>
                                <p className="text-slate-600 break-all">{v.userAgent}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVisitors;
