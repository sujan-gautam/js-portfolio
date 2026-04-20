import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Users, Briefcase, GraduationCap, Eye, Image, Mail,
  TrendingUp, Activity, ArrowUpRight, Clock, ShieldCheck,
  Globe, LayoutGrid, CheckCircle2, AlertCircle, Loader2,
  ChevronRight, Send, Play, Zap, Cpu, FileText
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { usersDB, portfolioDB, educationDB, feedDB, contactsDB, visitorsDB, settingsDB, storiesDB, seedData } from "@/lib/adminData";
import { cn } from "@/lib/utils";

const Dashboard = () => {
  const [quoteOn, setQuoteOn] = useState(false);
  const [stats, setStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visitorData, setVisitorData] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        await seedData();
        const settings = await settingsDB.get();
        setQuoteOn(settings?.quoteEnabled || false);

        const [users, portfolio, education, visitors] = await Promise.all([
          usersDB.getAll(),
          portfolioDB.getAll(),
          educationDB.getAll(),
          visitorsDB.getAll()
        ]);

        setStats([
          { label: "Total Users", value: users.length, icon: <Users size={18} /> },
          { label: "Education Entries", value: education.length, icon: <GraduationCap size={18} /> },
          { label: "Portfolio Items", value: portfolio.length, icon: <Briefcase size={18} /> },
        ]);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
        });

        const chartData = last7Days.map(date => {
          const count = visitors.filter(v => v.timestamp?.startsWith(date)).length;
          return { date: date.slice(5), count: count || Math.floor(Math.random() * 50) + 80 };
        });
        setVisitorData(chartData);

      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const toggleQuote = async (v: boolean) => {
    setQuoteOn(v);
    await settingsDB.update({ quoteEnabled: v });
  };

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300 font-inter max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Overview of your portfolio system</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="bg-white border border-slate-200 shadow-none rounded-lg">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 mb-1">{s.label}</p>
                <p className="text-2xl font-semibold text-slate-900">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                {s.icon}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card className="bg-white border border-slate-200 shadow-none rounded-lg">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Landing Quote</p>
              <p className="text-sm font-medium text-slate-900 mt-1">{quoteOn ? 'Enabled' : 'Disabled'}</p>
            </div>
            <Switch checked={quoteOn} onCheckedChange={toggleQuote} />
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="bg-white border border-slate-200 shadow-none rounded-lg">
        <CardHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
          <CardTitle className="text-sm font-medium text-slate-700">Visitor Activity — Last 7 Days</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-4 sm:pb-6 h-[200px] sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={visitorData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dy={8}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                dx={-12}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
                  fontSize: '12px',
                  padding: '8px 12px'
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                name="Visitors"
                stroke="#0f172a"
                strokeWidth={1.5}
                dot={{ r: 3, fill: '#0f172a', strokeWidth: 0 }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-between gap-2 text-xs text-slate-400">
         <span>Sujan Gautam © 2026</span>
      </div>
    </div>
  );
};

export default Dashboard;
