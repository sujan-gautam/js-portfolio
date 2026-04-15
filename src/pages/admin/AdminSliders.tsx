import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { slidersDB, SliderItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "subtitle", label: "Subtitle", type: "text" },
  { key: "image", label: "Image URL", type: "url" },
  { key: "order", label: "Order", type: "number" },
  { key: "active", label: "Active", type: "toggle" },
];

const AdminSliders = () => {
  const [data, setData] = useState<SliderItem[]>(slidersDB.getAll());
  return (
    <CrudTable
      title="Sliders"
      fields={fields}
      data={data}
      onAdd={item => slidersDB.create(item)}
      onUpdate={(id, u) => slidersDB.update(id, u)}
      onDelete={id => slidersDB.delete(id)}
      onRefresh={() => setData(slidersDB.getAll())}
    />
  );
};

export default AdminSliders;
