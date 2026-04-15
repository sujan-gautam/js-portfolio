import { useState, useEffect } from "react";
import { settingsDB, AdminSettings } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus } from "lucide-react";

const AdminSettingsPage = () => {
  const [data, setData] = useState<AdminSettings>(settingsDB.get());

  useEffect(() => { setData(settingsDB.get()); }, []);

  const save = () => {
    settingsDB.update(data);
    toast({ title: "Settings saved!" });
  };

  const addSocial = () => {
    setData({ ...data, socialLinks: [...data.socialLinks, { platform: "", url: "" }] });
  };

  const removeSocial = (i: number) => {
    const links = [...data.socialLinks];
    links.splice(i, 1);
    setData({ ...data, socialLinks: links });
  };

  const updateSocial = (i: number, key: "platform" | "url", val: string) => {
    const links = [...data.socialLinks];
    links[i] = { ...links[i], [key]: val };
    setData({ ...data, socialLinks: links });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="space-y-6">
        <Card className="bg-card border-border">
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Site Name</Label>
              <Input value={data.siteName} onChange={e => setData({ ...data, siteName: e.target.value })} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Input value={data.siteDescription} onChange={e => setData({ ...data, siteDescription: e.target.value })} className="bg-muted border-border" />
            </div>
            <div className="space-y-1.5">
              <Label>Analytics ID</Label>
              <Input value={data.analyticsId} onChange={e => setData({ ...data, analyticsId: e.target.value })} className="bg-muted border-border" />
            </div>
            <div className="flex items-center gap-3">
              <Label>Quote</Label>
              <Switch checked={data.quoteEnabled} onCheckedChange={v => setData({ ...data, quoteEnabled: v })} />
            </div>
            <div className="flex items-center gap-3">
              <Label>Maintenance Mode</Label>
              <Switch checked={data.maintenanceMode} onCheckedChange={v => setData({ ...data, maintenanceMode: v })} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Social Links</CardTitle>
              <Button variant="outline" size="sm" onClick={addSocial}><Plus size={14} className="mr-1" />Add</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.socialLinks.map((link, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Platform" value={link.platform} onChange={e => updateSocial(i, "platform", e.target.value)} className="bg-muted border-border flex-1" />
                <Input placeholder="URL" value={link.url} onChange={e => updateSocial(i, "url", e.target.value)} className="bg-muted border-border flex-1" />
                <Button variant="ghost" size="icon" onClick={() => removeSocial(i)} className="text-destructive"><Trash2 size={14} /></Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button onClick={save}>Save All Settings</Button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
