import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { feedDB, FeedItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "image", label: "Image URL", type: "url" },
  { key: "caption", label: "Caption", type: "textarea", hideInTable: true },
  { key: "location", label: "Location", type: "text" },
  { key: "date", label: "Date", type: "text" },
  { key: "views", label: "Views", type: "number" },
  { key: "likes", label: "Likes", type: "number" },
];

const AdminFeed = () => {
  const [data, setData] = useState<FeedItem[]>(feedDB.getAll());
  return (
    <CrudTable
      title="Image Feed"
      fields={fields}
      data={data}
      onAdd={item => feedDB.create(item)}
      onUpdate={(id, u) => feedDB.update(id, u)}
      onDelete={id => feedDB.delete(id)}
      onRefresh={() => setData(feedDB.getAll())}
    />
  );
};

export default AdminFeed;
