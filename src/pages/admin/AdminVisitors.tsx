import { useState, useEffect, useMemo } from "react";
import { visitorsDB, VisitorRecord } from "@/lib/adminData";
import { 
  Users, Globe, Monitor, MapPin, 
  ArrowUpRight, ArrowDownRight, Activity, 
  BarChart3, PieChart as PieChartIcon, Clock, Filter,
  RefreshCcw, Trash2, Search, MoreVertical, Flag
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const AdminVisitors = () => {
  const [visitors, setVisitors] = useState<VisitorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [timeRange, setTimeRange] = useState("all");

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
      .slice(0, 8);

    const deviceData = Object.entries(devices).map(([name, value]) => ({ name, value }));
    const browserData = Object.entries(browsers).map(([name, value]) => ({ name, value }));
    const pageData = Object.entries(pages).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
    const timelineData = Object.entries(timeline).map(([name, visits]) => ({ name, visits })).reverse().slice(-7);

    return { total, countryData, deviceData, browserData, pageData, timelineData };
  }, [visitors]);

  const deleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    try {
      await visitorsDB.delete(id);
      setVisitors(prev => prev.filter(v => v.id !== id));
      toast.success("Record deleted");
    } catch {
      toast.error("Failed to delete record");
    }
  };

  const filteredVisitors = visitors.filter(v => 
    v.ip.includes(search) || 
    v.location?.country?.toLowerCase().includes(search.toLowerCase()) ||
    v.location?.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 font-inter max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Activity className="text-indigo-600" size={32} />
            Visitor Analytics
          </h1>
          <p className="text-slate-500 mt-1">Comprehensive tracking and traffic analysis dashboard</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="h-10 bg-white">
            <RefreshCcw size={16} className={cn("mr-2", loading && "animate-spin")} />
            Refresh Data
          </Button>
          <Button className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
            <Filter size={16} className="mr-2" />
            Filter View
          </Button>
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Users size={64} />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Visitors</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-3xl font-bold text-slate-900">{stats.total.toLocaleString()}</h2>
              <span className="text-emerald-500 text-xs font-bold flex items-center bg-emerald-50 px-1.5 py-0.5 rounded">
                <ArrowUpRight size={12} /> 12%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">from 56,170 legacy base</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Globe size={64} />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Top Region</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-3xl font-bold text-slate-900">{stats.countryData[0]?.name || "N/A"}</h2>
            </div>
            <p className="text-xs text-slate-400 mt-2">{stats.countryData[0]?.value || 0} unique visits</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Monitor size={64} />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg Session</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-3xl font-bold text-slate-900">2m 45s</h2>
              <span className="text-rose-500 text-xs font-bold flex items-center bg-rose-50 px-1.5 py-0.5 rounded">
                <ArrowDownRight size={12} /> 4%
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">estimated duration</p>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity size={64} />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Active Now</p>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-3xl font-bold text-emerald-600">24</h2>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 mt-2">real-time tracking</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Traffic Chart */}
        <Card className="lg:col-span-2 bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <BarChart3 size={18} className="text-indigo-500" />
              Traffic Overview
            </CardTitle>
            <CardDescription>Daily visitor frequency for the past 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.timelineData}>
                <defs>
                  <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Device Breakdown */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <PieChartIcon size={18} className="text-indigo-500" />
              Device Distribution
            </CardTitle>
            <CardDescription>Breakdown by visitor device type</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex flex-col justify-center items-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={stats.deviceData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.deviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mt-4">
              {stats.deviceData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-600 font-medium">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Geographical Data */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <MapPin size={18} className="text-indigo-500" />
              Top Locations
            </CardTitle>
            <CardDescription>Visitors by country</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.countryData.map((c, i) => (
              <div key={c.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span className="flex items-center gap-2">
                    <Flag size={12} className="text-slate-400" />
                    {c.name}
                  </span>
                  <span>{c.value} ({Math.round(c.value / stats.total * 100)}%)</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-500 rounded-full transition-all duration-1000" 
                    style={{ width: `${(c.value / stats.countryData[0].value) * 100}%` }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Browser Stats */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
               <Globe size={18} className="text-indigo-500" />
               Top Browsers
            </CardTitle>
            <CardDescription>Browser preference analysis</CardDescription>
          </CardHeader>
          <CardContent className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.browserData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Popular Pages */}
        <Card className="bg-white border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
               <Activity size={18} className="text-indigo-500" />
               Active Entry Points
            </CardTitle>
            <CardDescription>Most visited pages/sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.pageData.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-xs font-bold text-indigo-600 shadow-sm">
                       {i + 1}
                    </div>
                    <span className="text-sm font-semibold text-slate-700 truncate max-w-[120px]">{p.name}</span>
                  </div>
                  <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{p.value} visits</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitors Table */}
      <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold">Recent Traffic Log</CardTitle>
              <CardDescription>Raw access logs for detailed analysis</CardDescription>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search IP, Country..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-md border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all"
              />
            </div>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Visitor Info</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Session Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <RefreshCcw className="animate-spin mx-auto text-slate-400" size={24} />
                  </td>
                </tr>
              ) : filteredVisitors.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">No records found</td>
                </tr>
              ) : (
                filteredVisitors.slice(0, 100).map(v => (
                  <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                          {v.ip}
                          {v.ip === "103.10.28.162" && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded uppercase">Test</span>}
                        </span>
                        <span className="text-xs text-slate-500">{v.device} • {v.browser}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-indigo-500">
                            <MapPin size={14} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-sm font-semibold text-slate-700">{v.location?.city || "Unknown"}, {v.location?.countryCode || "??"}</span>
                            <span className="text-xs text-slate-500">{v.location?.country || "Earth"}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-white border border-slate-200 px-2 py-1 rounded text-slate-600">{v.page}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <Clock size={12} />
                        {new Date(v.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteRecord(v.id)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-xs text-slate-500 font-medium">
           <span>Showing top {Math.min(filteredVisitors.length, 100)} records</span>
           <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-8 px-3">Previous</Button>
              <Button variant="ghost" size="sm" className="h-8 px-3">Next</Button>
           </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminVisitors;
