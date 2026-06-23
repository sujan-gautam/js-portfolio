import React, { useState, useEffect, useMemo } from "react";
import { visitorsDB, VisitorRecord } from "@/lib/adminData";
import VisitorMap from "@/components/admin/VisitorMap";
import {
  Users, Globe, Monitor, Activity, Clock, RefreshCcw,
  Trash2, Search, Laptop, Smartphone, Link,
  LayoutDashboard, Globe2, ChevronDown,
  Timer, MousePointerClick, DoorOpen, DoorClosed, LineChart, MessageSquare,
  MapPin, Wifi, Building2, Navigation, Music, MousePointer2, Eye, Play,
  Star, Send, X, ThumbsUp, BarChart2, Zap, TrendingUp, CheckCircle2
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

const formatTime = (seconds: number) => {
  if (!seconds || isNaN(seconds)) return "0s";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

// Activity type → visual config
const ACTIVITY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  visit:             { icon: <Globe size={11}/>,          color: "text-blue-600",    bg: "bg-blue-100",    label: "Page Visit" },
  click:             { icon: <MousePointer2 size={11}/>,  color: "text-slate-600",   bg: "bg-slate-100",   label: "Click" },
  section_view:      { icon: <Eye size={11}/>,            color: "text-indigo-600",  bg: "bg-indigo-100",  label: "Section Viewed" },
  modal_open:        { icon: <Play size={11}/>,           color: "text-emerald-600", bg: "bg-emerald-100", label: "Opened" },
  modal_close:       { icon: <X size={11}/>,              color: "text-rose-500",    bg: "bg-rose-100",    label: "Closed" },
  play_music:        { icon: <Music size={11}/>,          color: "text-purple-600",  bg: "bg-purple-100",  label: "Played Music" },
  music_pause:       { icon: <Music size={11}/>,          color: "text-slate-500",   bg: "bg-slate-100",   label: "Paused Music" },
  react_story:       { icon: <ThumbsUp size={11}/>,       color: "text-pink-600",    bg: "bg-pink-100",    label: "Reacted" },
  comment_story:     { icon: <MessageSquare size={11}/>,  color: "text-sky-600",     bg: "bg-sky-100",     label: "Commented" },
  poll_vote:         { icon: <BarChart2 size={11}/>,       color: "text-amber-600",   bg: "bg-amber-100",   label: "Voted on Poll" },
  story_nav:         { icon: <ChevronDown size={11} className="rotate-[-90deg]"/>, color: "text-slate-500", bg: "bg-slate-100", label: "Story Nav" },
  form_submit_start: { icon: <Send size={11}/>,           color: "text-blue-500",    bg: "bg-blue-50",     label: "Form Started" },
  form_submit_success:{ icon: <CheckCircle2 size={11}/>,  color: "text-emerald-600", bg: "bg-emerald-100", label: "Form Sent ✓" },
  form_submit_error: { icon: <X size={11}/>,              color: "text-red-600",     bg: "bg-red-100",     label: "Form Failed" },
};

const getActivityConfig = (type: string) =>
  ACTIVITY_CONFIG[type] || { icon: <Zap size={11}/>, color: "text-slate-500", bg: "bg-slate-100", label: type };

// Group raw logs into sessions
const groupIntoSessions = (logs: VisitorRecord[]) => {
  const sessions: Record<string, any> = {};

  logs.forEach((log: any) => {
    const sid = log.sessionID || log.ip;
    if (!sessions[sid]) {
      sessions[sid] = {
        id: sid,
        ip: log.ip,
        device: log.device,
        browser: log.browser,
        os: log.os,
        location: log.location,
        referrer: log.referrer,
        utm: log.utm,
        isReturning: log.isReturning,
        timestamp: log.timestamp,
        connectionType: log.connectionType,
        screenResolution: log.screenResolution,
        viewport: log.viewport,
        timezone: log.timezone,
        totalTimeSpent: 0,
        totalClicks: 0,
        maxScroll: 0,
        pages: [],
        activities: []
      };
    }

    // Ensure we don't duplicate the exact same page view timestamp
    const exists = sessions[sid].pages.find((p: any) => p.page === log.page && Math.abs(new Date(p.timestamp).getTime() - new Date(log.timestamp).getTime()) < 1000);

    if (!exists) {
      sessions[sid].pages.push({
        id: log.id,
        page: log.page,
        timeSpent: log.timeSpent || 0,
        scrollDepth: log.scrollDepth || 0,
        clickCount: log.clickCount || 0,
        timestamp: log.timestamp
      });
      sessions[sid].totalTimeSpent += (log.timeSpent || 0);
      sessions[sid].totalClicks += (log.clickCount || 0);
      sessions[sid].maxScroll = Math.max(sessions[sid].maxScroll, log.scrollDepth || 0);
    }

    // Merge activities from all page-view records into one flat session list
    if (log.activities && Array.isArray(log.activities)) {
      sessions[sid].activities.push(...log.activities);
    }
  });

  return Object.values(sessions).map(s => {
    s.pages.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    // Sort merged activities by timestamp chronologically
    s.activities.sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    s.entryPage = s.pages[0]?.page || "/";
    s.exitPage = s.pages[s.pages.length - 1]?.page || "/";
    s.timestamp = s.pages[0]?.timestamp || s.timestamp;

    // Compute highest engaged section from section_view activities
    const sectionTimes: Record<string, number> = {};
    s.activities.forEach((a: any) => {
      if (a.type === 'section_view' && a.target) {
        const match = (a.details || '').match(/(\d+)s/);
        const dur = match ? parseInt(match[1]) : 1;
        sectionTimes[a.target] = (sectionTimes[a.target] || 0) + dur;
      }
    });
    const topSection = Object.entries(sectionTimes).sort((a: any, b: any) => b[1] - a[1])[0];
    s.highestEngagedSection = topSection ? { name: topSection[0], seconds: topSection[1] } : null;

    // Summarise special actions
    s.specialActions = [
      s.activities.some((a: any) => a.type === 'form_submit_success') && '✉️ Contacted',
      s.activities.some((a: any) => a.type === 'play_music')           && '🎵 Played Music',
      s.activities.some((a: any) => a.type === 'modal_open')           && '👁️ Opened Story',
      s.activities.some((a: any) => a.type === 'comment_story')        && '💬 Commented',
      s.activities.some((a: any) => a.type === 'react_story')          && '❤️ Reacted',
      s.activities.some((a: any) => a.type === 'poll_vote')            && '📊 Voted on Poll',
    ].filter(Boolean);

    return s;
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

const AdminVisitors = () => {
  const [logs, setLogs] = useState<VisitorRecord[]>([]);
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  // AI Prompt & Filter State
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [filterCountry, setFilterCountry] = useState("all");
  const [filterDevice, setFilterDevice] = useState("all");
  const [filterPage, setFilterPage] = useState("all");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insightsData, rawLogs] = await Promise.all([
        visitorsDB.getInsights(period),
        visitorsDB.getAll()
      ]);
      setInsights(insightsData);
      setLogs(rawLogs);
    } catch { 
      toast.error("Failed to load visitor data"); 
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [period]);

  const deleteSession = async (session: any) => {
    if (!confirm("Delete all records for this session?")) return;
    try {
      // Delete all logs for this session
      for (const p of session.pages) {
        await visitorsDB.delete(p.id);
      }
      setLogs(p => p.filter(v => v.sessionID !== session.id && v.ip !== session.ip));
      toast.success("Session Deleted");
    } catch { toast.error("Failed"); }
  };

  const sessions = useMemo(() => groupIntoSessions(logs), [logs]);

  const filteredSessions = sessions.filter(s => {
    const matchesSearch = (s.ip || "").includes(search) ||
      (s.location?.country || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.location?.city || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.referrer || "").toLowerCase().includes(search.toLowerCase()) ||
      s.pages.some((p: any) => p.page.toLowerCase().includes(search.toLowerCase()));

    const matchesCountry = filterCountry === "all" || s.location?.country === filterCountry;
    const matchesDevice = filterDevice === "all" || s.device === filterDevice;
    const matchesPage = filterPage === "all" || s.pages.some((p: any) => p.page === filterPage);

    return matchesSearch && matchesCountry && matchesDevice && matchesPage;
  });

  const uniqueCountries = Array.from(new Set(sessions.map(s => s.location?.country).filter(Boolean)));
  const uniqueDevices = Array.from(new Set(sessions.map(s => s.device).filter(Boolean)));
  const uniquePages = Array.from(new Set(sessions.flatMap(s => s.pages.map((p:any) => p.page)).filter(Boolean)));

  const cleanDeviceBreakdown = useMemo(() => {
    if (!insights) return [];
    const counts = { desktop: 0, mobile: 0, tablet: 0, other: 0 };
    insights.deviceBreakdown.forEach((d: any) => {
        const n = (d.name || "").toLowerCase();
        if (n.includes("mobile") || n.includes("iphone") || n.includes("android") || n.includes("ios")) counts.mobile += d.visits;
        else if (n.includes("tablet") || n.includes("ipad")) counts.tablet += d.visits;
        else if (n.includes("desktop") || n.includes("windows") || n.includes("mac") || n.includes("x11") || n.includes("linux") || n.includes("cros")) counts.desktop += d.visits;
        else counts.other += d.visits;
    });
    return Object.entries(counts).filter(([_, v]) => v > 0).map(([name, visits]) => ({ name, visits }));
  }, [insights]);

  const kpis = insights ? [
    { title: "Total Visits", value: insights.summary.totalVisits.toLocaleString(), icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Unique Sessions", value: insights.summary.uniqueSessions.toLocaleString(), icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Avg Time on Site", value: formatTime(insights.summary.avgTimeSpent), icon: Timer, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Bounce Rate", value: `${insights.summary.bounceRate}%`, icon: MousePointerClick, color: "text-rose-600", bg: "bg-rose-50" },
    { title: "Pages / Session", value: insights.summary.pageViewsPerSession, icon: LineChart, color: "text-blue-600", bg: "bg-blue-50" },
  ] : [];


  const PREBUILT_QUERIES = [
    { id: "", label: "Select an insight to generate..." },
    { id: "best_page", label: "Which page retains users the longest?" },
    { id: "top_country", label: "Which countries bring the most traffic?" },
    { id: "bounce_rate", label: "What is my overall bounce rate?" },
    { id: "devices", label: "What devices do my visitors use?" }
  ];

  const handleAiQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery) return;
    setIsAiLoading(true);
    
    setTimeout(() => {
      let res = "";
      if (aiQuery === "best_page") {
        res = `Your most visited page is ${insights?.topPages[0]?.page || "/"} with ${insights?.topPages[0]?.visits || 0} visits. Users spend an average of ${formatTime(insights?.topPages[0]?.avgTime)} there.`;
      } else if (aiQuery === "top_country") {
        res = `Most of your traffic comes from ${insights?.topCountries[0]?.country || "Unknown"} with ${insights?.topCountries[0]?.visits || 0} visits.`;
      } else if (aiQuery === "bounce_rate") {
        res = `Your overall bounce rate is ${insights?.summary.bounceRate}%, meaning that percentage of visitors left after viewing only one page.`;
      } else if (aiQuery === "devices") {
        res = `Your visitors primarily use ${insights?.deviceBreakdown[0]?.name || "desktop"} devices.`;
      }
      setAiResponse(res);
      setIsAiLoading(false);
    }, 600);
  };

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

      {/* Smart Insight Generator */}
      <Card className="border-indigo-100 shadow-sm bg-gradient-to-r from-indigo-50/50 to-white overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row items-stretch">
            <div className="p-5 flex-1 border-b md:border-b-0 md:border-r border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-indigo-100 rounded-md text-indigo-600"><Activity size={16}/></div>
                <h3 className="font-medium text-sm text-indigo-900">Smart Insights Generator</h3>
              </div>
              <p className="text-xs text-slate-500 mb-3">Select a pre-built query to instantly extract deep insights from your visitor data.</p>
              <form onSubmit={handleAiQuery} className="flex gap-2">
                <select 
                  value={aiQuery}
                  onChange={e => { setAiQuery(e.target.value); setAiResponse(null); }}
                  className="flex-1 text-sm h-9 px-3 border border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500/20 outline-none cursor-pointer bg-white"
                >
                  {PREBUILT_QUERIES.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
                </select>
                <Button type="submit" size="sm" disabled={isAiLoading || !aiQuery} className="h-9 bg-indigo-600 hover:bg-indigo-700">
                  {isAiLoading ? <RefreshCcw size={14} className="animate-spin" /> : "Generate"}
                </Button>
              </form>
            </div>
            <div className="p-5 flex-1 bg-white flex items-center justify-center min-h-[100px]">
              {aiResponse ? (
                <div className="flex items-start gap-3 w-full animate-in fade-in slide-in-from-bottom-2">
                  <div className="p-1.5 bg-indigo-100 rounded-full text-indigo-600 shrink-0 mt-0.5"><MessageSquare size={14}/></div>
                  <p className="text-sm text-slate-700 leading-relaxed">{aiResponse}</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic text-center">Select a query and hit Generate...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="sessions">
        <TabsList className="bg-transparent h-auto p-0 gap-6 border-b border-slate-200 w-full justify-start rounded-none mb-4 overflow-x-auto flex-nowrap scrollbar-hide">
          {[
            { value: "overview", label: "Overview", icon: LayoutDashboard },
            { value: "audience", label: "Audience & Geo", icon: Globe2 },
            { value: "behavior", label: "Behavior", icon: Activity },
            { value: "sources",  label: "Sources", icon: Link },
            { value: "sessions", label: "Visitor Sessions", icon: Clock },
          ].map(t => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-sm text-slate-500 data-[state=active]:text-slate-900 transition-all gap-1.5 whitespace-nowrap min-w-max"
            >
              <t.icon size={13} /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {insights && (
          <>
            {/* ── Overview ── */}
            <TabsContent value="overview" className="space-y-5 mt-0 w-full min-w-0 overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 min-w-0">
                <Card className="lg:col-span-2 border-slate-200 shadow-none overflow-hidden min-w-0">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Traffic Trend</CardTitle></CardHeader>
                  <CardContent className="h-[280px] p-0 md:p-6 md:pt-0">
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
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} width={40} />
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
                      <div key={i} className="flex justify-between items-center px-4 py-3 border-b border-slate-50 last:border-0 hover:bg-slate-50">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 min-w-0">
                <Card className="border-slate-200 shadow-none overflow-hidden min-w-0">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Devices</CardTitle></CardHeader>
                  <CardContent className="h-[200px] flex flex-col items-center justify-center p-2">
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie data={cleanDeviceBreakdown} innerRadius={40} outerRadius={60} dataKey="visits">
                          {cleanDeviceBreakdown.map((_:any, i:number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                      {cleanDeviceBreakdown.map((d:any, i:number) => (
                        <div key={i} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }}/><span className="text-[10px] font-medium text-slate-600 capitalize truncate max-w-[80px]">{d.name}</span></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-none md:col-span-2 overflow-hidden min-w-0">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Hourly Distribution</CardTitle></CardHeader>
                  <CardContent className="h-[200px] p-0 md:p-6 md:pt-0 w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={insights.hourlyDistribution}>
                        <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis hide />
                        <RechartsTooltip cursor={{ fill: "rgba(0,0,0,0.05)" }} contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 16px rgb(0 0 0/.1)" }} />
                        <Bar dataKey="visits" fill="#8b5cf6" radius={[4,4,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
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
               </div>
            </TabsContent>
          </>
        )}

        {/* ── Grouped Sessions ── */}
        <TabsContent value="sessions" className="mt-0">
          <div className="mb-4 flex flex-col md:flex-row gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Search sessions..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-10 pl-9 pr-4 rounded-lg border border-slate-200 bg-white text-sm w-full outline-none focus:border-indigo-300"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select value={filterCountry} onChange={e => setFilterCountry(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none cursor-pointer min-w-[120px]">
                <option value="all">All Countries</option>
                {uniqueCountries.map((c: any) => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterDevice} onChange={e => setFilterDevice(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none cursor-pointer min-w-[120px]">
                <option value="all">All Devices</option>
                {uniqueDevices.map((d: any) => <option key={d} value={d} className="capitalize">{d}</option>)}
              </select>
              <select value={filterPage} onChange={e => setFilterPage(e.target.value)} className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm outline-none cursor-pointer min-w-[120px]">
                <option value="all">All Pages</option>
                {uniquePages.map((p: any) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <Card className="border-slate-200 shadow-none overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-3 w-[25%] min-w-[150px]">User & Tech</th>
                    <th className="px-4 py-3 w-[20%] min-w-[150px]">Location</th>
                    <th className="px-4 py-3 w-[20%] min-w-[120px]">Session Stats</th>
                    <th className="px-4 py-3 w-[25%] min-w-[150px]">Journey</th>
                    <th className="px-4 py-3 w-[10%] min-w-[80px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-sm">
                  {loading ? (
                    <tr><td colSpan={5} className="py-8 text-center"><RefreshCcw className="animate-spin mx-auto text-slate-400" size={20} /></td></tr>
                  ) : filteredSessions.length === 0 ? (
                    <tr><td colSpan={5} className="py-8 text-center text-slate-400">No sessions found</td></tr>
                  ) : filteredSessions.slice(0, 100).map(s => (
                    <React.Fragment key={s.id}>
                      <tr className="hover:bg-slate-50 cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-2 mb-1">
                            {s.isReturning ? <span className="w-2 h-2 bg-emerald-500 rounded-full" title="Returning Visitor" /> : <span className="w-2 h-2 bg-blue-500 rounded-full" title="New Visitor" />}
                            <p className="font-semibold text-slate-800">{s.ip}</p>
                            <span className="text-[9px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">{new Date(s.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1">{deviceIcon(s.device)} {s.browser} · {s.os}</p>
                          <p className="text-[9px] text-slate-400 mt-1">Res: {s.screenResolution || "?"} · Net: {s.connectionType || "?"}</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-start gap-1">
                            <MapPin size={11} className="text-rose-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="text-slate-800 font-medium text-xs leading-snug">
                                {[s.location?.city, s.location?.district].filter(Boolean).join(" · ") || "Unknown City"}
                              </p>
                              <p className="text-[10px] text-slate-500 leading-snug">
                                {[s.location?.region, s.location?.countryCode].filter(Boolean).join(", ")}
                              </p>
                              {s.location?.postcode && <p className="text-[10px] text-slate-400">📮 {s.location.postcode}</p>}
                              {s.location?.source === "gps" && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded px-1 mt-0.5">
                                  <Navigation size={8}/> GPS {s.location.accuracy ? `±${Math.round(s.location.accuracy)}m` : ""}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1 max-w-[170px] truncate" title={s.location?.isp}>
                            {s.location?.isp || s.location?.org || "—"}
                          </p>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex items-center gap-3 mb-1.5">
                            <div>
                              <p className="text-xs font-medium text-slate-700">{formatTime(s.totalTimeSpent)}</p>
                              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Dur</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-700">{s.pages.length}</p>
                              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Pg</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-slate-700">{s.totalClicks || 0}</p>
                              <p className="text-[9px] text-slate-400 uppercase tracking-wider">Clk</p>
                            </div>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                            <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: `${s.maxScroll || 0}%` }} />
                          </div>
                          <p className="text-[9px] text-slate-400 mt-0.5">Scroll: {s.maxScroll || 0}%</p>
                        </td>
                        <td className="px-4 py-3 align-top">
                           <div className="flex flex-col gap-1 max-w-[200px]">
                              <p className="text-xs text-emerald-600 truncate"><span className="text-slate-400">In:</span> {s.entryPage}</p>
                              {s.pages.length > 1 && <p className="text-xs text-rose-600 truncate"><span className="text-slate-400">Out:</span> {s.exitPage}</p>}
                              <p className="text-[10px] text-slate-500 truncate mt-0.5" title={s.referrer}><span className="text-slate-400">Ref:</span> {s.referrer === "direct" || !s.referrer ? "Direct" : s.referrer}</p>
                           </div>
                        </td>
                        <td className="px-4 py-3 text-right align-top">
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <button onClick={(e) => { e.stopPropagation(); deleteSession(s); }} className="text-slate-400 hover:text-rose-500"><Trash2 size={14}/></button>
                            <ChevronDown size={14} className={cn("text-slate-400 transition-transform", expanded === s.id && "rotate-180")} />
                          </div>
                        </td>
                      </tr>
                      {expanded === s.id && (
                        <tr className="bg-slate-50/80">
                          <td colSpan={5} className="px-0 py-0 border-t border-slate-100">
                            <div className="p-4 md:p-6 bg-white/50 border-l-4 border-indigo-500 m-2 rounded-xl shadow-sm space-y-5">

                              {/* ── ENGAGEMENT SUMMARY ── */}
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                                  <TrendingUp size={12} className="text-indigo-500"/> Session Summary
                                </h4>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                  <div className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                                    <p className="text-lg font-bold text-indigo-600">{formatTime(s.totalTimeSpent)}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Time</p>
                                  </div>
                                  <div className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                                    <p className="text-lg font-bold text-emerald-600">{s.pages.length}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Pages Visited</p>
                                  </div>
                                  <div className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                                    <p className="text-lg font-bold text-amber-600">{s.totalClicks || 0}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Total Clicks</p>
                                  </div>
                                  <div className="bg-white rounded-xl border border-slate-100 p-3 text-center shadow-sm">
                                    <p className="text-lg font-bold text-purple-600">{s.activities?.length || 0}</p>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Events Logged</p>
                                  </div>
                                </div>

                                {/* Highest Engaged Section + Special Actions */}
                                <div className="mt-3 flex flex-wrap gap-2">
                                  {s.highestEngagedSection && (
                                    <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full px-3 py-1 text-[10px] font-semibold">
                                      <Eye size={9}/> Most Viewed: {s.highestEngagedSection.name} ({s.highestEngagedSection.seconds}s)
                                    </span>
                                  )}
                                  {s.specialActions?.map((action: string, i: number) => (
                                    <span key={i} className="inline-flex items-center bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-[10px] font-semibold text-slate-700">
                                      {action}
                                    </span>
                                  ))}
                                  <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-full px-3 py-1 text-[10px] font-semibold">
                                    <MousePointerClick size={9}/> Scroll: {s.maxScroll || 0}%
                                  </span>
                                </div>
                              </div>

                              {/* ── INTERACTIVE MAP ── */}
                              {s.location?.lat && s.location?.lon ? (
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider flex items-center gap-1">
                                      <MapPin size={11} className="text-rose-500"/> Live Location Map
                                    </h4>
                                    <div className="flex items-center gap-2">
                                      {s.location?.source === "gps" ? (
                                        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5 font-semibold">
                                          <Navigation size={8}/> GPS Precise {s.location.accuracy ? `±${Math.round(s.location.accuracy)}m` : ""}
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center gap-1 text-[9px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5 font-semibold">
                                          <Globe size={8}/> IP-based location
                                        </span>
                                      )}
                                      <a href={`https://www.google.com/maps?q=${s.location.lat},${s.location.lon}`} target="_blank" rel="noopener noreferrer"
                                        className="text-[10px] text-indigo-600 hover:underline font-medium flex items-center gap-0.5">
                                        Open in Google Maps ↗
                                      </a>
                                    </div>
                                  </div>
                                  <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                                    <VisitorMap lat={s.location.lat} lon={s.location.lon}
                                      label={[s.location?.city, s.location?.region, s.location?.country].filter(Boolean).join(", ")}
                                      isGps={s.location?.source === "gps"} accuracy={s.location?.accuracy} />
                                  </div>
                                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                                    📍 {s.location.lat.toFixed(5)}, {s.location.lon.toFixed(5)}
                                    {s.location?.postcode && ` · Postal: ${s.location.postcode}`}
                                  </p>
                                </div>
                              ) : (
                                <div className="h-20 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center">
                                  <p className="text-xs text-slate-400">📍 No coordinates available for this visitor</p>
                                </div>
                              )}

                              {/* ── FULL ACTIVITY TIMELINE ── */}
                              <div>
                                <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3 flex items-center gap-1.5">
                                  <Activity size={12} className="text-indigo-500"/> Full Activity Timeline
                                  <span className="ml-1 text-[9px] bg-indigo-100 text-indigo-600 rounded-full px-2 py-0.5 font-bold">{s.activities?.length || 0} events</span>
                                </h4>
                                {s.activities && s.activities.length > 0 ? (
                                  <div className="relative pl-6 space-y-1 max-h-[480px] overflow-y-auto pr-1">
                                    {/* Vertical line */}
                                    <div className="absolute left-[9px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 via-slate-200 to-transparent" />
                                    {s.activities.map((act: any, idx: number) => {
                                      const cfg = getActivityConfig(act.type);
                                      return (
                                        <div key={idx} className="relative flex items-start gap-2.5 py-1 group">
                                          {/* Dot on the line */}
                                          <div className={cn("absolute -left-[17px] w-4 h-4 rounded-full flex items-center justify-center shrink-0 border-2 border-white shadow-sm z-10", cfg.bg, cfg.color)}>
                                            {cfg.icon}
                                          </div>
                                          {/* Event card */}
                                          <div className="flex-1 bg-white rounded-lg border border-slate-100 px-3 py-2 shadow-sm group-hover:border-indigo-200 transition-colors">
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="min-w-0">
                                                <span className={cn("text-[9px] font-bold uppercase tracking-wider mr-1.5", cfg.color)}>{cfg.label}</span>
                                                <span className="text-[11px] text-slate-700 font-medium leading-snug">{act.target}</span>
                                                {act.details && (
                                                  <p className="text-[10px] text-slate-400 mt-0.5 truncate" title={act.details}>{act.details}</p>
                                                )}
                                              </div>
                                              <div className="shrink-0 text-right">
                                                <p className="text-[9px] text-slate-400 whitespace-nowrap">
                                                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </p>
                                                {act.path && act.path !== s.entryPage && (
                                                  <p className="text-[8px] text-indigo-400 font-mono mt-0.5 truncate max-w-[100px]">{act.path}</p>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6 text-center">
                                    <Activity size={20} className="mx-auto text-slate-300 mb-2"/>
                                    <p className="text-xs text-slate-400">No detailed activities recorded yet for this session.</p>
                                    <p className="text-[10px] text-slate-300 mt-1">New visitor sessions will log activities automatically.</p>
                                  </div>
                                )}
                              </div>

                              {/* ── 2-COLUMN: LOCATION + DEVICE ── */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Location Details */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2 flex items-center gap-1"><MapPin size={11}/> Location Details</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white p-2 rounded border border-slate-100 col-span-2">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Full Address</p>
                                      <p className="font-medium text-slate-700">
                                        {s.location?.displayName || [s.location?.district, s.location?.city, s.location?.region, s.location?.country].filter(Boolean).join(", ") || "Unknown"}
                                      </p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">City / District</p>
                                      <p className="font-medium text-slate-700">{[s.location?.city, s.location?.district].filter(Boolean).join(" · ") || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Region / State</p>
                                      <p className="font-medium text-slate-700">{s.location?.region || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Country</p>
                                      <p className="font-medium text-slate-700">{s.location?.country || "—"} {s.location?.countryCode && `(${s.location.countryCode})`}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Postal Code</p>
                                      <p className="font-medium text-slate-700">{s.location?.postcode || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-0.5"><Wifi size={9}/> ISP</p>
                                      <p className="font-medium text-slate-700 truncate" title={s.location?.isp}>{s.location?.isp || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5 flex items-center gap-0.5"><Building2 size={9}/> Org / AS</p>
                                      <p className="font-medium text-slate-700 truncate">{s.location?.org || s.location?.as || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">IP Address</p>
                                      <p className="font-mono text-xs text-slate-700">{s.ip || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Timezone</p>
                                      <p className="font-medium text-slate-700">{s.location?.timezone || s.timezone || "—"}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Device & Session Details */}
                                <div>
                                  <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-2">Device & Session</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Start Time</p>
                                      <p className="font-medium text-slate-700">{new Date(s.timestamp).toLocaleString()}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Referrer</p>
                                      <p className="font-medium text-slate-700 truncate">{s.referrer === "direct" || !s.referrer ? "Direct" : s.referrer}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Device / Browser</p>
                                      <p className="font-medium text-slate-700 capitalize">{s.device} / {s.browser}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">OS / Screen</p>
                                      <p className="font-medium text-slate-700">{s.os} / {s.screenResolution || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Max Scroll</p>
                                      <p className="font-medium text-slate-700">{s.maxScroll}%</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Total Clicks</p>
                                      <p className="font-medium text-slate-700">{s.totalClicks}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Network</p>
                                      <p className="font-medium text-slate-700">{s.connectionType || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Language</p>
                                      <p className="font-medium text-slate-700">{s.language || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Viewport</p>
                                      <p className="font-medium text-slate-700">{s.viewport || "—"}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-slate-100">
                                      <p className="text-[10px] text-slate-400 mb-0.5">Visitor Type</p>
                                      <p className="font-medium text-slate-700">{s.isReturning ? "Returning" : "New"}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>

                            </div>{/* end outer wrapper */}
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
