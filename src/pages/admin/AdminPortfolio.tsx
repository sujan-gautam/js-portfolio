import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { portfolioDB, PortfolioItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "description", label: "Description", type: "textarea", hideInTable: true },
  { key: "image", label: "Image URL", type: "url" },
  { key: "category", label: "Category", type: "select", options: ["Design", "Development", "Branding", "Photography"] },
  { key: "link", label: "Link", type: "url" },
  { key: "createdAt", label: "Created", type: "date" },
];

const AdminPortfolio = () => {
  const [data, setData] = useState<PortfolioItem[]>(portfolioDB.getAll());
  return (
    <CrudTable
      title="Portfolio"
      fields={fields}
      data={data}
      onAdd={item => portfolioDB.create(item)}
      onUpdate={(id, u) => portfolioDB.update(id, u)}
      onDelete={id => portfolioDB.delete(id)}
      onRefresh={() => setData(portfolioDB.getAll())}
    />
  );
};

export default AdminPortfolio;
