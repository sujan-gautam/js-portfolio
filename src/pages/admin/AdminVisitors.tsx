import { useState, useEffect, useMemo } from "react";
import { visitorsDB, VisitorRecord } from "@/lib/adminData";
import { 
  Users, Globe, Monitor, MapPin, 
  ArrowUpRight, ArrowDownRight, Activity, 
  BarChart3, PieChart as PieChartIcon, Clock, Filter,
  RefreshCcw, Trash2, Search, MoreVertical, Flag,
  ChevronLeft, ChevronRight, LayoutDashboard, Globe2, Laptop
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const AdminVisitors = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  // Carousel state for top cards on mobile
  const [carouselIndex, setCarouselIndex] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await visitorsDB.getAll();
      setVisitors(data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (err) {
      toast.error("Failed to load visitor data");
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const stats = useMemo(() => {
    const total = visitors.length;
    const countries: Record<string, number> = {};
    const devices: Record<string, number> = {};
    const browsers: Record<string, number> = {};
    const pages: Record<string, number> = {};
    const timeline: Record<string, number> = {};

    visitors.forEach(v => {
      // Countries
      const country = v.location?.country || "Unknown";
      countries[country] = (countries[country] || 0) + 1;

      // Devices
      const device = v.device || "Other";
      devices[device] = (devices[device] || 0) + 1;

      // Browsers
      const browser = v.browser || "Other";
      browsers[browser] = (browsers[browser] || 0) + 1;

      // Pages
      const page = v.page || "/";
      pages[page] = (pages[page] || 0) + 1;

      // Timeline (last 7 days)
      const date = new Date(v.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      timeline[date] = (timeline[date] || 0) + 1;
    });

    const countryData = Object.entries(countries)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Limit to 10

    const deviceData = Object.entries(devices).map(([name, value]) => ({ name, value }));
    const browserData = Object.entries(browsers).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value).slice(0, 8);
    const pageData = Object.entries(pages).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10); // Limit to 10
    const timelineData = Object.entries(timeline).map(([name, visits]) => ({ name, visits })).reverse().slice(-7);

    return { total, countryData, deviceData, browserData, pageData, timelineData };
  }, [visitors]);

  const deleteRecord = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await visitorsDB.delete(id);
      setVisitors(prev => prev.filter(v => v.id !== id));
      toast.success("Deleted");
    } catch {
      toast.error("Failed");
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.ip.includes(search) || 
    v.location?.country?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.city?.toLowerCase().includes(search.toLowerCase())
  );

  const quickStats = [
    { title: "Total Traffic", value: stats.total.toLocaleString(), sub: "+12.5%", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
    { title: "Top Region", value: stats.countryData[0]?.name || "N/A", sub: stats.countryData[0]?.value || 0, icon: Globe, color: "text-emerald-600", bg: "bg-emerald-50" },
    { title: "Avg Session", value: "2m 45s", sub: "-4%", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { title: "Active Now", value: "24", sub: "Live", icon: Activity, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter max-w-7xl mx-auto pb-20 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Visitor Insights</h1>
          <p className="text-sm text-slate-500">Monitor your global reach and engagement metrics</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-9 bg-white shadow-sm border-slate-200">
            <RefreshCcw size={14} className={cn("mr-2", loading && "animate-spin")} />
            Sync
          </Button>
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-md border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
            />
          </div>
        </div>
      </div>

      {/* Quick Stats Carousel (Mobile) / Grid (Desktop) */}
      <div className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           {quickStats.map((stat, i) => (
             <Card key={i} className="border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
               <CardContent className="p-5 flex items-center gap-4">
                 <div className={cn("p-3 rounded-xl", stat.bg, stat.color)}>
                   <stat.icon size={20} />
                 </div>
                 <div>
                   <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</p>
                   <div className="flex items-baseline gap-2 mt-0.5">
                     <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
                     <span className={cn("text-[10px] font-bold px-1 py-0.5 rounded", stat.sub.toString().startsWith('-') ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600")}>
                        {stat.sub}
                     </span>
                   </div>
                 </div>
               </CardContent>
             </Card>
           ))}
        </div>
      </div>

      {/* Main Tabs Container */}
      <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
        <div className="flex items-center justify-between mb-4 border-b border-slate-200 overflow-x-auto no-scrollbar">
          <TabsList className="bg-transparent h-auto p-0 gap-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-sm font-semibold transition-all">
              <LayoutDashboard size={14} className="mr-2" /> Overview
            </TabsTrigger>
            <TabsTrigger value="audience" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-sm font-semibold transition-all">
              <Globe2 size={14} className="mr-2" /> Audience
            </TabsTrigger>
            <TabsTrigger value="technology" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-sm font-semibold transition-all">
              <Laptop size={14} className="mr-2" /> Technology
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-indigo-600 rounded-none px-0 py-3 text-sm font-semibold transition-all">
              <Clock size={14} className="mr-2" /> Access Logs
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab Content: Overview */}
        <TabsContent value="overview" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base font-bold">Traffic Trend</CardTitle>
                  <CardDescription className="text-xs">Daily visits over time</CardDescription>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-md">
                   <button className="px-2 py-1 text-[10px] font-bold bg-white rounded shadow-sm text-slate-700">7D</button>
                   <button className="px-2 py-1 text-[10px] font-bold text-slate-500">30D</button>
                </div>
              </CardHeader>
              <CardContent className="h-[280px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.timelineData}>
                    <defs>
                      <linearGradient id="overGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#overGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
               <CardHeader>
                  <CardTitle className="text-base font-bold">Popular Entry Points</CardTitle>
                  <CardDescription className="text-xs">Most frequent landing pages</CardDescription>
               </CardHeader>
               <CardContent className="p-0">
                  <div className="divide-y divide-slate-100">
                    {stats.pageData.map((p, i) => (
                      <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-400">#{i+1}</span>
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[140px]">{p.name}</span>
                        </div>
                        <span className="text-xs font-bold text-indigo-600">{p.value} visits</span>
                      </div>
                    ))}
                  </div>
               </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Content: Audience */}
        <TabsContent value="audience" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold">Global Distribution</CardTitle>
                <CardDescription className="text-xs">Visitor density by country</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.countryData} layout="vertical">
                       <XAxis type="number" hide />
                       <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} tickLine={false} axisLine={false} />
                       <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} />
                       <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={16} />
                    </BarChart>
                 </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base font-bold">Detailed Geo Stats</CardTitle>
                <CardDescription className="text-xs">Top 10 performing regions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                 <div className="divide-y divide-slate-100">
                   {stats.countryData.map((c, i) => (
                      <div key={i} className="flex items-center justify-between p-4 group">
                         <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-xs group-hover:bg-indigo-50 transition-colors">
                               <Flag size={14} className="text-slate-400 group-hover:text-indigo-500" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">{c.name}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <span className="text-xs font-bold text-slate-500">{c.value} visits</span>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${(c.value / stats.countryData[0].value) * 100}%` }} />
                            </div>
                         </div>
                      </div>
                   ))}
                 </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab Content: Technology */}
        <TabsContent value="technology" className="space-y-6 mt-0">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-slate-200 shadow-sm bg-white">
                 <CardHeader>
                    <CardTitle className="text-base font-bold">Device Split</CardTitle>
                    <CardDescription className="text-xs">Mobile vs Desktop usage</CardDescription>
                 </CardHeader>
                 <CardContent className="h-[250px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                          <Pie data={stats.deviceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                             {stats.deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                 </CardContent>
                 <div className="px-6 pb-6 grid grid-cols-2 gap-2">
                    {stats.deviceData.map((d, i) => (
                       <div key={i} className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="text-[10px] font-bold text-slate-500 uppercase">{d.name}: {d.value}</span>
                       </div>
                    ))}
                 </div>
              </Card>

              <Card className="lg:col-span-2 border-slate-200 shadow-sm bg-white">
                 <CardHeader>
                    <CardTitle className="text-base font-bold">Browser Preference</CardTitle>
                    <CardDescription className="text-xs">Software environment metrics</CardDescription>
                 </CardHeader>
                 <CardContent className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={stats.browserData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)'}} />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={32} />
                       </BarChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* Tab Content: Logs */}
        <TabsContent value="logs" className="mt-0">
           <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                       <tr className="bg-slate-50 border-b border-slate-100">
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Visitor</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Page</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Time</th>
                          <th className="px-6 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Delete</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {filteredVisitors.slice(0, 50).map((v) => (
                          <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                             <td className="px-6 py-4">
                                <div className="flex flex-col">
                                   <span className="text-sm font-bold text-slate-900">{v.ip}</span>
                                   <span className="text-[10px] text-slate-400 font-medium">{v.device} • {v.browser}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-xs font-semibold text-slate-700">{v.location?.city || "Unknown"}, {v.location?.countryCode || "??"}</span>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{v.page}</span>
                             </td>
                             <td className="px-6 py-4">
                                <span className="text-xs text-slate-500">{new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                             </td>
                             <td className="px-6 py-4 text-right">
                                <button onClick={() => deleteRecord(v.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                                   <Trash2 size={14} />
                                </button>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-4 bg-slate-50 text-center border-t border-slate-100">
                 <p className="text-xs text-slate-500 font-medium">Viewing last 50 entries. Data refresh synced.</p>
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVisitors;
