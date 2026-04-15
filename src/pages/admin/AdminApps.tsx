import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { appsDB, AppItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "name", label: "App Name", type: "text", required: true },
  { key: "platform", label: "Platform", type: "select", options: ["Android", "iOS", "Web", "Desktop"] },
  { key: "downloadUrl", label: "Download URL", type: "url" },
  { key: "icon", label: "Icon URL", type: "url" },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "active", label: "Active", type: "toggle" },
];

const AdminApps = () => {
  const [data, setData] = useState<AppItem[]>(appsDB.getAll());
  return (
    <CrudTable
      title="Apps"
      fields={fields}
      data={data}
      onAdd={item => appsDB.create(item)}
      onUpdate={(id, u) => appsDB.update(id, u)}
      onDelete={id => appsDB.delete(id)}
      onRefresh={() => setData(appsDB.getAll())}
    />
  );
};

export default AdminApps;
