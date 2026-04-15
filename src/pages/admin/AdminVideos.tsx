import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { videosDB, VideoItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "url", label: "Video URL", type: "url" },
  { key: "thumbnail", label: "Thumbnail URL", type: "url" },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "createdAt", label: "Date", type: "date" },
];

const AdminVideos = () => {
  const [data, setData] = useState<VideoItem[]>(videosDB.getAll());
  return (
    <CrudTable
      title="Videos"
      fields={fields}
      data={data}
      onAdd={item => videosDB.create(item)}
      onUpdate={(id, u) => videosDB.update(id, u)}
      onDelete={id => videosDB.delete(id)}
      onRefresh={() => setData(videosDB.getAll())}
    />
  );
};

export default AdminVideos;
