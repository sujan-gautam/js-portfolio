import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { usersDB, AdminUser } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "name", label: "Name", type: "text", required: true },
  { key: "email", label: "Email", type: "text", required: true },
  { key: "role", label: "Role", type: "select", options: ["admin", "editor", "viewer"] },
  { key: "status", label: "Status", type: "select", options: ["active", "inactive"] },
  { key: "createdAt", label: "Joined", type: "date" },
];

const AdminUsers = () => {
  const [data, setData] = useState<AdminUser[]>(usersDB.getAll());
  return (
    <CrudTable
      title="Users"
      fields={fields}
      data={data}
      onAdd={item => usersDB.create(item)}
      onUpdate={(id, u) => usersDB.update(id, u)}
      onDelete={id => usersDB.delete(id)}
      onRefresh={() => setData(usersDB.getAll())}
    />
  );
};

export default AdminUsers;
