import { useState, useEffect } from "react";
import { aboutDB } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { AdminSlidersList } from "@/pages/admin/AdminSliders";
import { cn } from "@/lib/utils";
import { AIRefineButton } from "@/components/admin/AIRefineButton";

interface ExtendedAboutData {
  title?: string;
  description?: string;
  name?: string;
  email?: string;
  address?: string;
  skill?: string;
  age?: string;
  freelanceStatus?: string;
  experience?: string;
  language?: string;
  yearsOfExperience?: string;
  happyClients?: string;
  projectCompleted?: string;
  awardsWon?: string;
  cvLink?: string;
  phone?: string;
  [key: string]: any;
}

const TABS = [
  { id: "about", label: "About" },
  { id: "personal", label: "Personal Info" },
  { id: "sliders", label: "Front Image" },
] as const;

type Tab = typeof TABS[number]["id"];

const AdminAbout = () => {
  const [data, setData] = useState<ExtendedAboutData>({});
  const [activeTab, setActiveTab] = useState<Tab>("personal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    aboutDB.get().then(res => {
      setData({
        ...res,
        description: (res as any).description || res.bio || "",
        cvUrl: res.cvUrl || (res as any).cvLink || ""
      });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    try {
      await aboutDB.update(data);
      toast.success("Info saved successfully");
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
    <div className="space-y-6 animate-in fade-in duration-300 font-inter max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">About Info</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage your personal and professional details</p>
        </div>
        <Button onClick={save} className="bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-md px-4 h-9 text-sm transition-all">
          Save Changes
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Tab Nav */}
        <div className="w-full lg:w-52 shrink-0">
          <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden p-0">
            <div className="px-4 py-3 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sections</span>
            </div>
            <nav className="flex flex-col py-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center px-4 py-2.5 text-sm font-medium transition-colors text-left",
                    activeTab === tab.id
                      ? "bg-slate-100 text-slate-900"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </Card>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="bg-white border border-slate-200 shadow-none rounded-lg overflow-hidden">
            <CardHeader className="px-6 py-4 border-b border-slate-100">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                {TABS.find(t => t.id === activeTab)?.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {activeTab === 'about' && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-medium text-slate-700">Bio / Description</Label>
                      <AIRefineButton 
                        value={data.description || ""} 
                        onRefine={(v) => setData({...data, description: v})} 
                        context="Professional Portfolio Bio"
                      />
                    </div>
                    <textarea
                      className="w-full h-40 p-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none text-sm text-slate-800 leading-relaxed resize-none"
                      value={data.description || ""}
                      onChange={e => setData({...data, description: e.target.value})}
                      placeholder="Tell about yourself..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Title" value={data.title} onChange={v => setData({...data, title: v})} />
                  <InputField label="Your Name" value={data.name} onChange={v => setData({...data, name: v})} />
                  <InputField label="Email Address" value={data.email} onChange={v => setData({...data, email: v})} />
                  <InputField label="Address" value={data.address} onChange={v => setData({...data, address: v})} />
                  <InputField label="Primary Skill" value={data.skill} onChange={v => setData({...data, skill: v})} />
                  <InputField label="Age" value={data.age} onChange={v => setData({...data, age: v})} />
                  <InputField label="Freelance Status" value={data.freelanceStatus} onChange={v => setData({...data, freelanceStatus: v})} />
                  <InputField label="Experience" value={data.experience} onChange={v => setData({...data, experience: v})} />
                  <InputField label="Language" value={data.language} onChange={v => setData({...data, language: v})} />
                  <InputField label="Years of Experience" value={data.yearsOfExperience} onChange={v => setData({...data, yearsOfExperience: v})} />
                  <InputField label="Happy Clients" value={data.happyClients} onChange={v => setData({...data, happyClients: v})} />
                  <InputField label="Phone Number" value={data.phone} onChange={v => setData({...data, phone: v})} />
                  <InputField label="Projects Completed" value={data.projectCompleted} onChange={v => setData({...data, projectCompleted: v})} />
                </div>
              )}

              {activeTab === 'sliders' && <AdminSlidersList />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const InputField = ({ label, value, onChange }: { label: string; value: string | undefined; onChange: (v: string) => void }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between">
      <Label className="text-xs font-medium text-slate-700">{label}</Label>
      <AIRefineButton 
        value={value || ""} 
        onRefine={onChange} 
        context={`Personal Information: ${label}`}
      />
    </div>
    <input
      type="text"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      className="w-full h-10 px-3 bg-white border border-slate-200 rounded-md focus:ring-2 focus:ring-slate-100 focus:border-slate-400 transition-all outline-none text-sm text-slate-800"
      placeholder={`Enter ${label}...`}
    />
  </div>
);

export default AdminAbout;
