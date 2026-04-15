import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { popupsDB, PopupItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "content", label: "Content", type: "textarea", hideInTable: true },
  { key: "image", label: "Image URL", type: "url" },
  { key: "active", label: "Active", type: "toggle" },
  { key: "startDate", label: "Start Date", type: "date" },
  { key: "endDate", label: "End Date", type: "date" },
];

const AdminPopups = () => {
  const [data, setData] = useState<PopupItem[]>(popupsDB.getAll());
  return (
    <CrudTable
      title="Popups"
      fields={fields}
      data={data}
      onAdd={item => popupsDB.create(item)}
      onUpdate={(id, u) => popupsDB.update(id, u)}
      onDelete={id => popupsDB.delete(id)}
      onRefresh={() => setData(popupsDB.getAll())}
    />
  );
};

export default AdminPopups;
