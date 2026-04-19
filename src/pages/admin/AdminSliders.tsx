import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { slidersDB, SliderItem } from "@/lib/adminData";

const BASE = "/admin/sliders";

export const fields: FieldConfig[] = [
  { key: "title",    label: "Title",    type: "text",   required: true },
  { key: "subtitle", label: "Subtitle", type: "text" },
  { key: "image",    label: "Image URL",type: "url" },
  { key: "order",    label: "Order",    type: "number" },
  { key: "active",   label: "Active",   type: "toggle" },
];

export const AdminSlidersList = () => {
  const [data, setData] = useState<SliderItem[]>([]);
  useEffect(() => { slidersDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Sliders" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await slidersDB.create(item); slidersDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await slidersDB.update(id, u); slidersDB.getAll().then(setData); }}
      onDelete={async id => { await slidersDB.delete(id); slidersDB.getAll().then(setData); }}
      onRefresh={() => slidersDB.getAll().then(setData)} />
  );
};

export const AdminSlidersForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) slidersDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Slider" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await slidersDB.update(item.id, item); else await slidersDB.create(item); }} />
  );
};

const AdminSliders = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminSliders;
