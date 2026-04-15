import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Users, Briefcase, GraduationCap, Eye, Image, Mail, TrendingUp, Activity } from "lucide-react";
import { usersDB, portfolioDB, educationDB, feedDB, contactsDB, visitorsDB, settingsDB, seedData } from "@/lib/adminData";

const Dashboard = () => {
  const [quoteOn, setQuoteOn] = useState(false);

  useEffect(() => {
    seedData();
    setQuoteOn(settingsDB.get().quoteEnabled);
  }, []);

  const stats = [
    { label: "Total Users", value: usersDB.getAll().length, icon: Users, color: "text-blue-400" },
    { label: "Total Portfolio", value: portfolioDB.getAll().length, icon: Briefcase, color: "text-accent" },
    { label: "Total Education", value: educationDB.getAll().length, icon: GraduationCap, color: "text-green-400" },
    { label: "Total Feed", value: feedDB.getAll().length, icon: Image, color: "text-purple-400" },
    { label: "Messages", value: contactsDB.getAll().length, icon: Mail, color: "text-yellow-400" },
    { label: "Visitors", value: visitorsDB.getAll().length, icon: Eye, color: "text-cyan-400" },
  ];

  const toggleQuote = (v: boolean) => {
    setQuoteOn(v);
    settingsDB.update({ quoteEnabled: v });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, Sujan</p>
        </div>
        <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-4 py-2">
          <span className="text-sm text-muted-foreground">Quote</span>
          <span className="text-xs text-muted-foreground">OFF</span>
          <Switch checked={quoteOn} onCheckedChange={toggleQuote} />
          <span className="text-xs text-muted-foreground">ON</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((s) => (
          <Card key={s.label} className="bg-card border-border">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`p-3 rounded-lg bg-muted ${s.color}`}>
                <s.icon size={24} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={18} className="text-accent" />
            <h2 className="text-lg font-semibold text-foreground">Recent Movement</h2>
          </div>
          <div className="space-y-3">
            {[
              { text: "New portfolio item added", time: "2 min ago", icon: TrendingUp },
              { text: "User signed up", time: "15 min ago", icon: Users },
              { text: "New contact message", time: "1 hour ago", icon: Mail },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-border last:border-0">
                <a.icon size={14} className="text-accent" />
                <span className="text-foreground flex-1">{a.text}</span>
                <span className="text-muted-foreground text-xs">{a.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
