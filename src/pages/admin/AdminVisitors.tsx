import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { visitorsDB, VisitorRecord } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "ip", label: "IP", type: "text" },
  { key: "page", label: "Page", type: "text" },
  { key: "device", label: "Device", type: "text" },
  { key: "browser", label: "Browser", type: "text" },
  { key: "timestamp", label: "Time", type: "date" },
];

const AdminVisitors = () => {
  const [data, setData] = useState<VisitorRecord[]>(visitorsDB.getAll());
  return (
    <CrudTable
      title="Visitors"
      fields={fields}
      data={data}
      onAdd={item => visitorsDB.create(item)}
      onUpdate={(id, u) => visitorsDB.update(id, u)}
      onDelete={id => visitorsDB.delete(id)}
      onRefresh={() => setData(visitorsDB.getAll())}
    />
  );
};

export default AdminVisitors;
