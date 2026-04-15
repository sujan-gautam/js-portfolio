import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { whatsNewDB, WhatsNewItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "version", label: "Version", type: "text" },
  { key: "createdAt", label: "Date", type: "date" },
];

const AdminWhatsNew = () => {
  const [data, setData] = useState<WhatsNewItem[]>(whatsNewDB.getAll());
  return (
    <CrudTable
      title="What's New"
      fields={fields}
      data={data}
      onAdd={item => whatsNewDB.create(item)}
      onUpdate={(id, u) => whatsNewDB.update(id, u)}
      onDelete={id => whatsNewDB.delete(id)}
      onRefresh={() => setData(whatsNewDB.getAll())}
    />
  );
};

export default AdminWhatsNew;
