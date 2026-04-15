import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { servicesDB, ServiceItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "icon", label: "Icon", type: "select", options: ["Palette", "Image", "Code", "Smartphone", "Globe", "Layers"] },
  { key: "active", label: "Active", type: "toggle" },
];

const AdminServices = () => {
  const [data, setData] = useState<ServiceItem[]>(servicesDB.getAll());
  return (
    <CrudTable
      title="Services"
      fields={fields}
      data={data}
      onAdd={item => servicesDB.create(item)}
      onUpdate={(id, u) => servicesDB.update(id, u)}
      onDelete={id => servicesDB.delete(id)}
      onRefresh={() => setData(servicesDB.getAll())}
    />
  );
};

export default AdminServices;
