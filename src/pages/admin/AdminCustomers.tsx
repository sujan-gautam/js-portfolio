import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { customersDB, CustomerItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "email", label: "Email", type: "text" },
  { key: "company", label: "Company", type: "text" },
  { key: "project", label: "Project", type: "text" },
  { key: "status", label: "Status", type: "select", options: ["active", "completed", "pending"] },
];

const AdminCustomers = () => {
  const [data, setData] = useState<CustomerItem[]>(customersDB.getAll());
  return (
    <CrudTable
      title="Customers"
      fields={fields}
      data={data}
      onAdd={item => customersDB.create(item)}
      onUpdate={(id, u) => customersDB.update(id, u)}
      onDelete={id => customersDB.delete(id)}
      onRefresh={() => setData(customersDB.getAll())}
    />
  );
};

export default AdminCustomers;
