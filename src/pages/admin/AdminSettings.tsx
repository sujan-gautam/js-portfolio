import { useState, useEffect } from "react";
import { settingsDB, aboutDB, courtesyDB, AdminSettings, AboutData, CourtesyItem, generateId } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import axios from "axios";
import { API_BASE } from "@/config";
import { Trash2, Plus, Globe, Loader2, Settings as SettingsIcon, CheckCircle2, X, Heart, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIRefineButton } from "@/components/admin/AIRefineButton";

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<AdminSettings>({ socialLinks: [] } as any);
  const [about, setAbout] = useState<AboutData>({} as AboutData);
  const [courtesy, setCourtesy] = useState<CourtesyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingOG, setUploadingOG] = useState(false);

  const handleUploadOG = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingOG(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
                             const { data } = await axios.post(`${API_BASE}/upload`, fd);
      setSettings(prev => ({ ...prev, ogImage: data.url }));
      toast.success("OG Image uploaded!");
    } catch {
      toast.error("Upload failed");
    }
    setUploadingOG(false);
  };

  useEffect(() => {
    Promise.all([
      settingsDB.get(),
      aboutDB.get(),
      courtesyDB.getAll()
    ]).then(([s, a, c]) => {
      setSettings(s || { siteName: "Portfolio", siteDescription: "", socialLinks: [], quoteEnabled: true } as any);
      setAbout(a || {} as any);
      setCourtesy(c || []);
      setLoading(false);
    });
  }, []);

  const saveAll = async () => {
    try {
      await Promise.all([
        settingsDB.update(settings),
        aboutDB.update(about)
      ]);
      toast.success("Settings saved successfully");
    } catch {
      toast.error("Save failed");
    }
  };

  if (loading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 size={24} className="animate-spin text-slate-400" />
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-inter max-w-5xl mx-auto pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your site configuration</p>
        </div>
        <Button onClick={saveAll} className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 text-sm transition-all">
           <CheckCircle2 size={15} className="mr-2"/> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Main Settings Card */}
         <div className="space-y-6">
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
               <CardHeader className="px-6 py-4 border-b border-slate-100">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <SettingsIcon size={13} /> Main Configuration
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium text-slate-700">Site Name</Label>
                     <Input value={settings.siteName} onChange={e => setSettings({ ...settings, siteName: e.target.value })} className="h-10 bg-white border-slate-200 rounded-md text-sm" />
                  </div>
                  
                  {/* Brand Assets */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-slate-700">Site Logo</Label>
                       <div className="flex gap-2">
                         <Input value={settings.siteLogo || ""} onChange={e => setSettings({ ...settings, siteLogo: e.target.value })} className="h-9 bg-white border-slate-200 rounded-md text-sm" placeholder="https://" />
                         <label className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer transition-colors border border-slate-200 flex items-center justify-center shrink-0">
                           <Upload size={14} />
                           <input type="file" className="hidden" onChange={async (e) => {
                             const f = e.target.files?.[0]; if (!f) return;
                             const fd = new FormData(); fd.append("file", f);
                                                    const { data } = await axios.post(`${API_BASE}/upload`, fd);
                             setSettings({ ...settings, siteLogo: data.url });
                             toast.success("Logo uploaded");
                           }} />
                         </label>
                       </div>
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-slate-700">Favicon (.ico/png)</Label>
                       <div className="flex gap-2">
                         <Input value={settings.favicon || ""} onChange={e => setSettings({ ...settings, favicon: e.target.value })} className="h-9 bg-white border-slate-200 rounded-md text-sm" placeholder="https://" />
                         <label className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer transition-colors border border-slate-200 flex items-center justify-center shrink-0">
                           <Upload size={14} />
                           <input type="file" className="hidden" onChange={async (e) => {
                             const f = e.target.files?.[0]; if (!f) return;
                             const fd = new FormData(); fd.append("file", f);
                                                    const { data } = await axios.post(`${API_BASE}/upload`, fd);
                             setSettings({ ...settings, favicon: data.url });
                             toast.success("Favicon uploaded");
                           }} />
                         </label>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                     <Label className="text-xs font-medium text-slate-700">Admin Panel Logo (Optional)</Label>
                     <div className="flex gap-2">
                        <Input value={settings.adminLogo || ""} onChange={e => setSettings({ ...settings, adminLogo: e.target.value })} className="h-9 bg-white border-slate-200 rounded-md text-sm" placeholder="Custom admin logo URL" />
                        <label className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md cursor-pointer transition-colors border border-slate-200 flex items-center justify-center shrink-0">
                           <Upload size={14} />
                           <input type="file" className="hidden" onChange={async (e) => {
                             const f = e.target.files?.[0]; if (!f) return;
                             const fd = new FormData(); fd.append("file", f);
                                                    const { data } = await axios.post(`${API_BASE}/upload`, fd);
                             setSettings({ ...settings, adminLogo: data.url });
                             toast.success("Admin logo uploaded");
                           }} />
                        </label>
                     </div>
                  </div>

                  <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700">Site Description</Label>
                        <AIRefineButton 
                           value={settings.siteDescription || ""} 
                           onRefine={(v) => setSettings({ ...settings, siteDescription: v })} 
                           context="Website Site Description (SEO Metadata)"
                        />
                     </div>
                     <textarea
                         value={settings.siteDescription}
                         onChange={e => setSettings({ ...settings, siteDescription: e.target.value })}
                        className="w-full h-24 p-3 bg-white border border-slate-200 rounded-md outline-none text-sm text-slate-800 leading-relaxed focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all resize-none"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium text-slate-700">Courtesy Section Bio</Label>
                        <AIRefineButton 
                           value={settings.courtesyDescription || ""} 
                           onRefine={(v) => setSettings({ ...settings, courtesyDescription: v })} 
                           context="Courtesy Bio (Thanking contributors)"
                        />
                     </div>
                     <textarea
                        value={settings.courtesyDescription || ""}
                        onChange={e => setSettings({ ...settings, courtesyDescription: e.target.value })}
                        className="w-full h-24 p-3 bg-white border border-slate-200 rounded-md outline-none text-sm text-slate-800 leading-relaxed focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all resize-none"
                     />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-md border border-slate-200">
                     <div>
                        <p className="text-sm font-medium text-slate-800">Landing Quote</p>
                        <p className="text-xs text-slate-500 mt-0.5">Show auto-generated quote on homepage</p>
                     </div>
                     <Switch checked={settings.quoteEnabled ?? true} onCheckedChange={v => setSettings({ ...settings, quoteEnabled: v })} />
                  </div>
               </CardContent>
            </Card>

            {/* SEO Settings Card */}
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
               <CardHeader className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-row space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <Globe size={13} /> SEO & Metatags
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-6 space-y-5">
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium text-slate-700">SEO Title Override</Label>
                     <Input placeholder="Custom title for Google" value={settings.seoTitle || ""} onChange={e => setSettings({ ...settings, seoTitle: e.target.value })} className="h-10 bg-white border-slate-200 rounded-md text-sm" />
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium text-slate-700">Keywords (Comma Separated)</Label>
                     <Input placeholder="e.g. Developer, Designer, React" value={settings.seoKeywords || ""} onChange={e => setSettings({ ...settings, seoKeywords: e.target.value })} className="h-10 bg-white border-slate-200 rounded-md text-sm" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-slate-700">Author</Label>
                       <Input placeholder="e.g. Sujan Gautam" value={settings.seoAuthor || ""} onChange={e => setSettings({ ...settings, seoAuthor: e.target.value })} className="h-10 bg-white border-slate-200 rounded-md text-sm" />
                    </div>
                    <div className="space-y-1.5">
                       <Label className="text-xs font-medium text-slate-700">Twitter Handle</Label>
                       <Input placeholder="@username" value={settings.twitterHandle || ""} onChange={e => setSettings({ ...settings, twitterHandle: e.target.value })} className="h-10 bg-white border-slate-200 rounded-md text-sm" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium text-slate-700">OG Share Image URL</Label>
                     <div className="flex gap-2 items-center">
                       <Input placeholder="https://" value={settings.ogImage || ""} onChange={e => setSettings({ ...settings, ogImage: e.target.value })} className="flex-1 h-10 bg-white border-slate-200 rounded-md text-sm" />
                       <label className="flex-shrink-0 flex items-center justify-center h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-md cursor-pointer transition-colors border border-slate-200">
                         {uploadingOG ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} className="mr-2" />}
                         {uploadingOG ? "Uploading..." : "Upload to Cloud"}
                         <input type="file" accept="image/*" className="hidden" onChange={handleUploadOG} disabled={uploadingOG} />
                       </label>
                     </div>
                  </div>
                  <div className="space-y-1.5">
                     <Label className="text-xs font-medium text-slate-700">Theme Color</Label>
                     <div className="flex gap-2 items-center">
                       <Input type="color" value={settings.seoThemeColor || "#CB2729"} onChange={e => setSettings({ ...settings, seoThemeColor: e.target.value })} className="w-12 h-10 p-1 cursor-pointer bg-white border-slate-200 rounded-md" />
                       <Input value={settings.seoThemeColor || "#CB2729"} onChange={e => setSettings({ ...settings, seoThemeColor: e.target.value })} className="flex-1 h-10 bg-white border-slate-200 rounded-md text-sm uppercase" />
                     </div>
                  </div>
               </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
               <CardHeader className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-row space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <Globe size={13} /> Social Connections
                  </CardTitle>
                  <button
                    onClick={() => setSettings({ ...settings, socialLinks: [...(settings.socialLinks || []), { platform: "", url: "" }] })}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                  >
                    <Plus size={13} /> Add Link
                  </button>
               </CardHeader>
               <CardContent className="p-6 space-y-4">
                  {settings.socialLinks && settings.socialLinks.length > 0 ? (
                     settings.socialLinks.map((link, i) => (
                       <div key={i} className="flex gap-3 animate-in fade-in duration-200">
                          <div className="flex-1 space-y-1">
                             <Label className="text-xs text-slate-500">Platform</Label>
                             <Input
                               placeholder="e.g. Instagram"
                               value={link.platform || ""}
                               onChange={e => {
                                  const n = settings.socialLinks.map((l, idx) => idx === i ? { ...l, platform: e.target.value } : l);
                                  setSettings({ ...settings, socialLinks: n });
                               }}
                               className="h-9 text-sm rounded-md bg-slate-50 border-slate-200 focus:bg-white"
                             />
                          </div>
                          <div className="flex-[2] space-y-1">
                             <Label className="text-xs text-slate-500">URL</Label>
                             <Input
                               placeholder="https://..."
                               value={link.url || ""}
                               onChange={e => {
                                  const n = settings.socialLinks.map((l, idx) => idx === i ? { ...l, url: e.target.value } : l);
                                  setSettings({ ...settings, socialLinks: n });
                               }}
                               className="h-9 text-sm rounded-md bg-slate-50 border-slate-200 focus:bg-white"
                             />
                          </div>
                          <div className="pt-5">
                             <button
                               type="button"
                               onClick={() => {
                                  const n = settings.socialLinks.filter((_, idx) => idx !== i);
                                  setSettings({ ...settings, socialLinks: n });
                               }}
                               className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                             >
                                <Trash2 size={14}/>
                             </button>
                          </div>
                       </div>
                     ))
                  ) : (
                     <div className="py-10 text-center border border-dashed border-slate-200 rounded-md">
                        <p className="text-sm text-slate-400">No social links added</p>
                     </div>
                  )}
               </CardContent>
            </Card>
         </div>

         {/* Courtesy Section */}
         <div className="space-y-6">
            <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
               <CardHeader className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-row space-y-0">
                  <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
                    <Heart size={13} /> Courtesy Members
                  </CardTitle>
                  <button
                    onClick={async () => {
                       const newItem = { id: generateId(), name: "Member", role: "Contributor", message: "Thank you!", socialLinks: [], active: true };
                       await courtesyDB.create(newItem);
                       setCourtesy([...courtesy, newItem]);
                    }}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1"
                  >
                    <Plus size={13} /> New Member
                  </button>
               </CardHeader>
               <CardContent className="p-6 space-y-4">
                  {courtesy.map(c => (
                     <div key={c.id} className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-4 relative group hover:bg-white hover:shadow-sm transition-all">
                        <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                              <Label className="text-xs text-slate-500">Name</Label>
                              <Input value={c.name} onChange={e => courtesyDB.update(c.id, { name: e.target.value }).then(() => setCourtesy(p => p.map(it => it.id === c.id ? { ...it, name: e.target.value } : it)))} className="h-9 text-sm rounded-md bg-white border-slate-200" />
                           </div>
                           <div className="space-y-1">
                              <Label className="text-xs text-slate-500">Role</Label>
                              <Input value={c.role} onChange={e => courtesyDB.update(c.id, { role: e.target.value }).then(() => setCourtesy(p => p.map(it => it.id === c.id ? { ...it, role: e.target.value } : it)))} className="h-9 text-sm rounded-md bg-white border-slate-200" />
                           </div>
                        </div>
                         <div className="space-y-2">
                            <div className="flex items-center justify-between">
                               <Label className="text-xs text-slate-500">Social Links</Label>
                               <button
                                 type="button"
                                 onClick={() => {
                                    const nLinks = [...(c.socialLinks || []), { platform: "", url: "" }];
                                    courtesyDB.update(c.id, { socialLinks: nLinks }).then(() => setCourtesy(p => p.map(it => it.id === c.id ? { ...it, socialLinks: nLinks } : it)));
                                 }}
                                 className="text-xs font-medium text-slate-500 hover:text-slate-900 flex items-center gap-1"
                               >
                                  <Plus size={11} /> Link
                               </button>
                            </div>
                            <div className="space-y-2">
                               {c.socialLinks?.map((sl, idx) => (
                                  <div key={idx} className="flex gap-2">
                                     <Input placeholder="Type" value={sl.platform} onChange={e => {
                                        const nLinks = c.socialLinks.map((l, i) => i === idx ? { ...l, platform: e.target.value } : l);
                                        courtesyDB.update(c.id, { socialLinks: nLinks }).then(() => setCourtesy(p => p.map(it => it.id === c.id ? { ...it, socialLinks: nLinks } : it)));
                                     }} className="h-8 text-xs rounded-md bg-white border-slate-200 w-24" />
                                     <Input placeholder="URL" value={sl.url} onChange={e => {
                                        const nLinks = c.socialLinks.map((l, i) => i === idx ? { ...l, url: e.target.value } : l);
                                        courtesyDB.update(c.id, { socialLinks: nLinks }).then(() => setCourtesy(p => p.map(it => it.id === c.id ? { ...it, socialLinks: nLinks } : it)));
                                     }} className="h-8 text-xs rounded-md bg-white border-slate-200 flex-1" />
                                     <button onClick={() => {
                                        const nLinks = c.socialLinks.filter((_, i) => i !== idx);
                                        courtesyDB.update(c.id, { socialLinks: nLinks }).then(() => setCourtesy(p => p.map(it => it.id === c.id ? { ...it, socialLinks: nLinks } : it)));
                                     }} className="p-1.5 text-slate-400 hover:text-red-600 rounded-md transition-colors"><X size={13}/></button>
                                  </div>
                               ))}
                            </div>
                         </div>

                         <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2">
                               <Switch checked={c.active} onCheckedChange={v => courtesyDB.update(c.id, { active: v }).then(() => setCourtesy(p => p.map(it => it.id === c.id ? { ...it, active: v } : it)))} />
                               <span className="text-xs text-slate-600 font-medium">Display Member</span>
                            </div>
                            <button onClick={() => { courtesyDB.delete(c.id); setCourtesy(p => p.filter(it => it.id !== c.id)); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                         </div>
                      </div>
                  ))}
                  {courtesy.length === 0 && (
                    <div className="py-10 text-center border border-dashed border-slate-200 rounded-md">
                      <p className="text-sm text-slate-400">No courtesy members added</p>
                    </div>
                  )}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
