import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { videosDB, VideoItem } from "@/lib/adminData";

const BASE = "/admin/videos";

export const fields: FieldConfig[] = [
  { key: "title",       label: "Title",         type: "text",     required: true },
  { key: "url",         label: "Video URL",      type: "url" },
  { key: "thumbnail",   label: "Thumbnail URL",  type: "url" },
  { key: "description", label: "Description",    type: "textarea", hideInTable: true },
  { key: "createdAt",   label: "Date",           type: "date" },
];

export const AdminVideosList = () => {
  const [data, setData] = useState<VideoItem[]>([]);
  useEffect(() => { videosDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Videos" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await videosDB.create(item); videosDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await videosDB.update(id, u); videosDB.getAll().then(setData); }}
      onDelete={async id => { await videosDB.delete(id); videosDB.getAll().then(setData); }}
      onRefresh={() => videosDB.getAll().then(setData)} />
  );
};

export const AdminVideosForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) videosDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Video" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await videosDB.update(item.id, item); else await videosDB.create(item); }} />
  );
};

const AdminVideos = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminVideos;
