import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { storiesDB, StoryItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "image", label: "Image URL", type: "url" },
  { key: "active", label: "Active", type: "toggle" },
  { key: "createdAt", label: "Date", type: "date" },
];

const AdminStory = () => {
  const [data, setData] = useState<StoryItem[]>(storiesDB.getAll());
  return (
    <CrudTable
      title="Stories"
      fields={fields}
      data={data}
      onAdd={item => storiesDB.create(item)}
      onUpdate={(id, u) => storiesDB.update(id, u)}
      onDelete={id => storiesDB.delete(id)}
      onRefresh={() => setData(storiesDB.getAll())}
    />
  );
};

export default AdminStory;
