import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { educationDB, EducationItem } from "@/lib/adminData";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { API_BASE } from "@/config";
import { toast } from "sonner";

const BASE = "/admin/education";

export const fields: FieldConfig[] = [
  { key: "degree",      label: "Degree",      type: "text",     required: true },
  { key: "institution", label: "Institution", type: "text",     required: true },
  { key: "year",        label: "Year",        type: "text" },
  { key: "gpa",         label: "GPA",         type: "text" },
  { key: "image",       label: "Logo URL",    type: "url" },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
];

export const AdminEducationList = () => {
  const [data, setData] = useState<EducationItem[]>([]);
  const [refiningAll, setRefiningAll] = useState(false);

  useEffect(() => { educationDB.getAll().then(setData); }, []);

  const handleRefineAll = async () => {
    if (!confirm("This will refine the description for ALL education entries using AI. Continue?")) return;
    setRefiningAll(true);
    let count = 0;
    try {
      for (const item of data) {
        if (item.description && item.description.length > 5) {
          const { data: refinedData } = await axios.post(`${API_BASE}/utils/refine-content`, {
            text: item.description,
            context: `Education entry for ${item.degree} at ${item.institution}`
          });
          if (refinedData.refined) {
            await educationDB.update(item.id, { ...item, description: refinedData.refined });
            count++;
            // Small delay to prevent rate limiting (429)
            await new Promise(resolve => setTimeout(resolve, 1500));
          }
        }
      }
      educationDB.getAll().then(setData);
      toast.success(`Successfully refined ${count} entries.`);
    } catch (error) {
       toast.error("An error occurred during batch refinement.");
    } finally {
      setRefiningAll(false);
    }
  };

  return (
    <CrudTable 
      title="Education" 
      fields={fields} 
      data={data} 
      basePath={BASE}
      onAdd={async item => { await educationDB.create(item); educationDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await educationDB.update(id, u); educationDB.getAll().then(setData); }}
      onDelete={async id => { await educationDB.delete(id); educationDB.getAll().then(setData); }}
      onRefresh={() => educationDB.getAll().then(setData)}
      onRefineItem={async (item) => {
        if (!item.description) return toast.error("No description to refine");
        const loadingToast = toast.loading(`Refining ${item.degree}...`);
        try {
          const { data: refinedData } = await axios.post(`${API_BASE}/utils/refine-content`, {
            text: item.description,
            context: `Education entry for ${item.degree} at ${item.institution}`
          });
          if (refinedData.refined) {
            await educationDB.update(item.id, { ...item, description: refinedData.refined });
            educationDB.getAll().then(setData);
            toast.success("Refined successfully", { id: loadingToast });
          } else {
            toast.error("Refinement failed", { id: loadingToast });
          }
        } catch {
          toast.error("An error occurred", { id: loadingToast });
        }
      }}
      extraHeaderActions={
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleRefineAll} 
          disabled={refiningAll || data.length === 0}
          className="h-9 border-slate-200 text-slate-700 hover:bg-slate-50 gap-2"
        >
          {refiningAll ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-amber-500" />}
          {refiningAll ? "Refining..." : "Refine All with AI"}
        </Button>
      }
    />
  );
};

export const AdminEducationForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) educationDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Education" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await educationDB.update(item.id, item); else await educationDB.create(item); }} />
  );
};

const AdminEducation = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminEducation;
