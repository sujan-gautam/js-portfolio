import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { adsDB, AdItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "image", label: "Image URL", type: "url" },
  { key: "link", label: "Link", type: "url" },
  { key: "position", label: "Position", type: "select", options: ["Top", "Bottom", "Sidebar", "Popup"] },
  { key: "active", label: "Active", type: "toggle" },
  { key: "impressions", label: "Impressions", type: "number" },
  { key: "clicks", label: "Clicks", type: "number" },
];

const AdminAds = () => {
  const [data, setData] = useState<AdItem[]>(adsDB.getAll());
  return (
    <CrudTable
      title="ADS"
      fields={fields}
      data={data}
      onAdd={item => adsDB.create(item)}
      onUpdate={(id, u) => adsDB.update(id, u)}
      onDelete={id => adsDB.delete(id)}
      onRefresh={() => setData(adsDB.getAll())}
    />
  );
};

export default AdminAds;
