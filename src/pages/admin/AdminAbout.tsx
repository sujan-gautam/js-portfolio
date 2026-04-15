import { useState, useEffect } from "react";
import { aboutDB, AboutData } from "@/lib/adminData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

const AdminAbout = () => {
  const [data, setData] = useState<AboutData>(aboutDB.get());

  useEffect(() => { setData(aboutDB.get()); }, []);

  const save = () => {
    aboutDB.update(data);
    toast({ title: "About updated!" });
  };

  const fields: { key: keyof AboutData; label: string; type?: "textarea" }[] = [
    { key: "name", label: "Full Name" },
    { key: "title", label: "Title/Role" },
    { key: "bio", label: "Bio", type: "textarea" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address" },
    { key: "dob", label: "Date of Birth" },
    { key: "nationality", label: "Nationality" },
    { key: "languages", label: "Languages" },
    { key: "experience", label: "Experience" },
    { key: "clients", label: "Clients" },
    { key: "projects", label: "Projects" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">About Me</h1>
      <Card className="bg-card border-border">
        <CardHeader><CardTitle>Edit Profile Info</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {fields.map(f => (
            <div key={f.key} className="space-y-1.5">
              <Label>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea value={data[f.key]} onChange={e => setData({ ...data, [f.key]: e.target.value })} className="bg-muted border-border" />
              ) : (
                <Input value={data[f.key]} onChange={e => setData({ ...data, [f.key]: e.target.value })} className="bg-muted border-border" />
              )}
            </div>
          ))}
          <Button onClick={save} className="mt-4">Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAbout;
