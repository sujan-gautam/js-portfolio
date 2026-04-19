import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { contactsDB, ContactMessage } from "@/lib/adminData";

const BASE = "/admin/contact";

export const fields: FieldConfig[] = [
  { key: "name",    label: "Name",    type: "text" },
  { key: "email",   label: "Email",   type: "text" },
  { key: "subject", label: "Subject", type: "text" },
  { key: "message", label: "Message", type: "textarea", hideInTable: true },
  { key: "read",    label: "Read",    type: "toggle" },
  { key: "createdAt", label: "Date",  type: "date" },
];

export const AdminContactList = () => {
  const [data, setData] = useState<ContactMessage[]>([]);
  useEffect(() => { contactsDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Contact Messages" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await contactsDB.create(item); contactsDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await contactsDB.update(id, u); contactsDB.getAll().then(setData); }}
      onDelete={async id => { await contactsDB.delete(id); contactsDB.getAll().then(setData); }}
      onRefresh={() => contactsDB.getAll().then(setData)} />
  );
};

export const AdminContactForm = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) contactsDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Contact Message" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await contactsDB.update(item.id, item); else await contactsDB.create(item); }} />
  );
};

// Default export kept for backwards compatibility
const AdminContact = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminContact;
