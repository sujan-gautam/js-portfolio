import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { usersDB, AdminUser } from "@/lib/adminData";

const BASE = "/admin/users";

export const fields: FieldConfig[] = [
  { key: "name",      label: "Name",   type: "text",   required: true },
  { key: "email",     label: "Email",  type: "text",   required: true },
  { key: "role",      label: "Role",   type: "select", options: ["admin", "editor", "viewer"] },
  { key: "status",    label: "Status", type: "select", options: ["active", "inactive"] },
  { key: "createdAt", label: "Joined", type: "date" },
];

export const AdminUsersList = () => {
  const [data, setData] = useState<AdminUser[]>([]);
  useEffect(() => { usersDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Users" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await usersDB.create(item); usersDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await usersDB.update(id, u); usersDB.getAll().then(setData); }}
      onDelete={async id => { await usersDB.delete(id); usersDB.getAll().then(setData); }}
      onRefresh={() => usersDB.getAll().then(setData)} />
  );
};

export const AdminUsersForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) usersDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="User" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await usersDB.update(item.id, item); else await usersDB.create(item); }} />
  );
};

const AdminUsers = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminUsers;
