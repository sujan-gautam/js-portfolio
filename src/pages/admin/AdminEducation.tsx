import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { educationDB, EducationItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "degree", label: "Degree", type: "text", required: true },
  { key: "institution", label: "Institution", type: "text", required: true },
  { key: "year", label: "Year", type: "text" },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
];

const AdminEducation = () => {
  const [data, setData] = useState<EducationItem[]>(educationDB.getAll());
  return (
    <CrudTable
      title="Education"
      fields={fields}
      data={data}
      onAdd={item => educationDB.create(item)}
      onUpdate={(id, u) => educationDB.update(id, u)}
      onDelete={id => educationDB.delete(id)}
      onRefresh={() => setData(educationDB.getAll())}
    />
  );
};

export default AdminEducation;
