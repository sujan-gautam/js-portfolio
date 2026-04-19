import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { servicesDB, ServiceItem } from "@/lib/adminData";

const BASE = "/admin/services";

export const fields: FieldConfig[] = [
  { key: "title",       label: "Title",       type: "text",   required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "icon",        label: "Icon",        type: "select", options: ["Palette", "Image", "Code", "Smartphone", "Globe", "Layers"] },
  { key: "active",      label: "Active",      type: "toggle" },
];

export const AdminServicesList = () => {
  const [data, setData] = useState<ServiceItem[]>([]);
  useEffect(() => { servicesDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Services" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await servicesDB.create(item); servicesDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await servicesDB.update(id, u); servicesDB.getAll().then(setData); }}
      onDelete={async id => { await servicesDB.delete(id); servicesDB.getAll().then(setData); }}
      onRefresh={() => servicesDB.getAll().then(setData)} />
  );
};

export const AdminServicesForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) servicesDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Service" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await servicesDB.update(item.id, item); else await servicesDB.create(item); }} />
  );
};

const AdminServices = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminServices;
