import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { updatesDB, UpdateItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "type", label: "Type", type: "select", options: ["feature", "bugfix", "improvement"] },
  { key: "createdAt", label: "Date", type: "date" },
];

const AdminUpdates = () => {
  const [data, setData] = useState<UpdateItem[]>(updatesDB.getAll());
  return (
    <CrudTable
      title="Updates"
      fields={fields}
      data={data}
      onAdd={item => updatesDB.create(item)}
      onUpdate={(id, u) => updatesDB.update(id, u)}
      onDelete={id => updatesDB.delete(id)}
      onRefresh={() => setData(updatesDB.getAll())}
    />
  );
};

export default AdminUpdates;
