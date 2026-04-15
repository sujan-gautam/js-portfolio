import { useState } from "react";
import { CrudTable, FieldConfig } from "@/components/admin/CrudTable";
import { musicDB, MusicItem } from "@/lib/adminData";

const fields: FieldConfig[] = [
  { key: "title", label: "Title", type: "text", required: true },
  { key: "artist", label: "Artist", type: "text" },
  { key: "url", label: "Music URL", type: "url" },
  { key: "active", label: "Active", type: "toggle" },
];

const AdminMusic = () => {
  const [data, setData] = useState<MusicItem[]>(musicDB.getAll());
  return (
    <CrudTable
      title="Music"
      fields={fields}
      data={data}
      onAdd={item => musicDB.create(item)}
      onUpdate={(id, u) => musicDB.update(id, u)}
      onDelete={id => musicDB.delete(id)}
      onRefresh={() => setData(musicDB.getAll())}
    />
  );
};

export default AdminMusic;
