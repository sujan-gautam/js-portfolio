import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { contactsDB, ContactMessage } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "name", label: "Name", type: "text" },
  { key: "email", label: "Email", type: "text" },
  { key: "subject", label: "Subject", type: "text" },
  { key: "message", label: "Message", type: "textarea", hideInTable: true },
  { key: "read", label: "Read", type: "toggle" },
  { key: "createdAt", label: "Date", type: "date" },
];

const AdminContact = () => {
  const [data, setData] = useState<ContactMessage[]>(contactsDB.getAll());
  return (
    <CrudTable
      title="Contact Messages"
      fields={fields}
      data={data}
      onAdd={item => contactsDB.create(item)}
      onUpdate={(id, u) => contactsDB.update(id, u)}
      onDelete={id => contactsDB.delete(id)}
      onRefresh={() => setData(contactsDB.getAll())}
    />
  );
};

export default AdminContact;
