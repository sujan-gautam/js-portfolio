import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { updatesDB, UpdateItem } from "@/lib/adminData";

const BASE = "/admin/updates";

export const fields: FieldConfig[] = [
  { key: "title",       label: "Title",       type: "text",     required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "type",        label: "Type",        type: "select",   options: ["feature", "bugfix", "improvement"] },
  { key: "createdAt",   label: "Date",        type: "date" },
];

export const AdminUpdatesList = () => {
  const [data, setData] = useState<UpdateItem[]>([]);
  useEffect(() => { updatesDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Updates" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await updatesDB.create(item); updatesDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await updatesDB.update(id, u); updatesDB.getAll().then(setData); }}
      onDelete={async id => { await updatesDB.delete(id); updatesDB.getAll().then(setData); }}
      onRefresh={() => updatesDB.getAll().then(setData)} />
  );
};

export const AdminUpdatesForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) updatesDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Update" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await updatesDB.update(item.id, item); else await updatesDB.create(item); }} />
  );
};

const AdminUpdates = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminUpdates;
