import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CrudTable, CrudForm, FieldConfig } from "@/components/admin/CrudTable";
import { skillsDB, SkillItem } from "@/lib/adminData";

const BASE = "/admin/skills";

export const fields: FieldConfig[] = [
  { key: "name",        label: "Skill Name",       type: "text",   required: true },
  { key: "image",       label: "Skill Icon/Image",  type: "url",    required: true },
  { key: "proficiency", label: "Proficiency (%)",   type: "number" },
];

export const AdminSkillsList = () => {
  const [data, setData] = useState<SkillItem[]>([]);
  useEffect(() => { skillsDB.getAll().then(setData); }, []);
  return (
    <CrudTable title="Skills" fields={fields} data={data} basePath={BASE}
      onAdd={async item => { await skillsDB.create(item); skillsDB.getAll().then(setData); }}
      onUpdate={async (id, u) => { await skillsDB.update(id, u); skillsDB.getAll().then(setData); }}
      onDelete={async id => { await skillsDB.delete(id); skillsDB.getAll().then(setData); }}
      onRefresh={() => skillsDB.getAll().then(setData)} />
  );
};

export const AdminSkillsForm = () => {
  const { id } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<any>(undefined);
  useEffect(() => {
    if (id) skillsDB.getAll().then(all => setInitialData(all.find(i => i.id === id) || {}));
    else setInitialData({});
  }, [id]);
  if (initialData === undefined) return null;
  return (
    <CrudForm title="Skill" fields={fields} basePath={BASE} initialData={initialData}
      onSave={async item => { if (item.id) await skillsDB.update(item.id, item); else await skillsDB.create(item); }} />
  );
};

const AdminSkills = () => { const navigate = useNavigate(); useEffect(() => { navigate(BASE, { replace: true }); }, []); return null; };
export default AdminSkills;
