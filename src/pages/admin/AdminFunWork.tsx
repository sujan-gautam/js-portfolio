import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { funWorkDB, FunWorkItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "image", label: "Image URL", type: "url" },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "category", label: "Category", type: "select", options: ["Meme", "Illustration", "Sketch", "Other"] },
];

const AdminFunWork = () => {
  const [data, setData] = useState<FunWorkItem[]>(funWorkDB.getAll());
  return (
    <CrudTable
      title="Fun Work"
      fields={fields}
      data={data}
      onAdd={item => funWorkDB.create(item)}
      onUpdate={(id, u) => funWorkDB.update(id, u)}
      onDelete={id => funWorkDB.delete(id)}
      onRefresh={() => setData(funWorkDB.getAll())}
    />
  );
};

export default AdminFunWork;
