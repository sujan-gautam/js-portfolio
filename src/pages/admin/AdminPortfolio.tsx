import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { portfolioDB, PortfolioItem } from "@/lib/adminData";
import axios from "axios";
import { API_BASE } from "@/config";
import { toast } from "sonner";

const BASE = "/admin/portfolio";

export const fields: FieldConfig[] = [
  { key: "title",       label: "Title",       type: "text",     required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "image",       label: "Image",       type: "url" },
  { key: "link",        label: "Project Link",type: "url" },
  { key: "tags",        label: "Tags",        type: "text" },
  { key: "category",   label: "Category",    type: "text" },
];

export const AdminPortfolioList = () => {
  const [data, setData] = useState<PortfolioItem[]>([]);
  useEffect(() => { portfolioDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Portfolio" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await portfolioDB.create(item); portfolioDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await portfolioDB.update(id, u); portfolioDB.getAll().then(setData); }}
      onDelete={async id => { await portfolioDB.delete(id); portfolioDB.getAll().then(setData); }}
      onRefresh={() => portfolioDB.getAll().then(setData)}
      onRefineItem={async (item) => {
        if (!item.description) return toast.error("No description to refine");
        const loadingToast = toast.loading(`Refining ${item.title}...`);
        try {
          const { data: refinedData } = await axios.post(`${API_BASE}/utils/refine-content`, {
            text: item.description,
            context: `Portfolio project: ${item.title}`
          });
          if (refinedData.refined) {
            await portfolioDB.update(item.id, { ...item, description: refinedData.refined });
            portfolioDB.getAll().then(setData);
            toast.success("Refined successfully", { id: loadingToast });
          } else {
            toast.error("Refinement failed", { id: loadingToast });
          }
        } catch {
          toast.error("An error occurred", { id: loadingToast });
        }
      }}
    />
  );
};

export const AdminPortfolioForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) portfolioDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Portfolio" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await portfolioDB.update(item.id, item); else await portfolioDB.create(item); }} />
  );
};

const AdminPortfolio = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminPortfolio;
