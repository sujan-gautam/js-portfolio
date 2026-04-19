import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { funWorkDB, FunWorkItem } from "@/lib/adminData";

const BASE = "/admin/funwork";

export const fields: FieldConfig[] = [
  { key: "title",       label: "Title",       type: "text",     required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "image",       label: "Image",       type: "url" },
  { key: "link",        label: "Link",        type: "url" },
  { key: "category",   label: "Category",    type: "text" },
];

export const AdminFunWorkList = () => {
  const [data, setData] = useState<FunWorkItem[]>([]);
  useEffect(() => { funWorkDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Fun Archive" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await funWorkDB.create(item); funWorkDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await funWorkDB.update(id, u); funWorkDB.getAll().then(setData); }}
      onDelete={async id => { await funWorkDB.delete(id); funWorkDB.getAll().then(setData); }}
      onRefresh={() => funWorkDB.getAll().then(setData)} />
  );
};

export const AdminFunWorkForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) funWorkDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Fun Archive" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await funWorkDB.update(item.id, item); else await funWorkDB.create(item); }} />
  );
};

const AdminFunWork = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminFunWork;
