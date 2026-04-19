import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { visitorsDB, VisitorRecord } from "@/lib/adminData";

const BASE = "/admin/visitors";

export const fields: FieldConfig[] = [
  { key: "ip",        label: "IP",      type: "text" },
  { key: "page",      label: "Page",    type: "text" },
  { key: "device",    label: "Device",  type: "text" },
  { key: "browser",   label: "Browser", type: "text" },
  { key: "timestamp", label: "Time",    type: "date" },
];

export const AdminVisitorsList = () => {
  const [data, setData] = useState<VisitorRecord[]>([]);
  useEffect(() => { visitorsDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Visitors" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await visitorsDB.create(item); visitorsDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await visitorsDB.update(id, u); visitorsDB.getAll().then(setData); }}
      onDelete={async id => { await visitorsDB.delete(id); visitorsDB.getAll().then(setData); }}
      onRefresh={() => visitorsDB.getAll().then(setData)} />
  );
};

export const AdminVisitorsForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) visitorsDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Visitor" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await visitorsDB.update(item.id, item); else await visitorsDB.create(item); }} />
  );
};

const AdminVisitors = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminVisitors;
