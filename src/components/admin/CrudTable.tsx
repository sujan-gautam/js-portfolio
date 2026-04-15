import { useState } from "react";
import { Trash2, Pencil, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateId } from "@/lib/adminData";

export interface FieldConfig {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "toggle" | "select" | "date" | "url";
  options?: string[];
  required?: boolean;
  hideInTable?: boolean;
}

interface CrudTableProps<T extends { id: string }> {
  title: string;
  fields: FieldConfig[];
  data: T[];
  onAdd: (item: T) => void;
  onUpdate: (id: string, updates: Partial<T>) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function CrudTable<T extends { id: string }>({
  title, fields, data, onAdd, onUpdate, onDelete, onRefresh,
}: CrudTableProps<T>) {
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});

  const tableFields = fields.filter(f => !f.hideInTable);

  const filteredData = data.filter(item =>
    Object.values(item).some(v =>
      String(v).toLowerCase().includes(search.toLowerCase())
    )
  );

  const openAdd = () => {
    setEditItem(null);
    const defaults: Record<string, any> = {};
    fields.forEach(f => {
      if (f.type === "toggle") defaults[f.key] = false;
      else if (f.type === "number") defaults[f.key] = 0;
      else defaults[f.key] = "";
    });
    setFormData(defaults);
    setDialogOpen(true);
  };

  const openEdit = (item: T) => {
    setEditItem(item);
    setFormData({ ...item });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (editItem) {
      onUpdate(editItem.id, formData);
    } else {
      onAdd({ ...formData, id: generateId() } as T);
    }
    setDialogOpen(false);
    onRefresh();
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
      onRefresh();
    }
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.key];
    switch (field.type) {
      case "textarea":
        return <Textarea value={value || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} className="bg-muted border-border" />;
      case "toggle":
        return <Switch checked={!!value} onCheckedChange={v => setFormData({ ...formData, [field.key]: v })} />;
      case "select":
        return (
          <Select value={value || ""} onValueChange={v => setFormData({ ...formData, [field.key]: v })}>
            <SelectTrigger className="bg-muted border-border"><SelectValue /></SelectTrigger>
            <SelectContent>
              {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        );
      case "number":
        return <Input type="number" value={value ?? 0} onChange={e => setFormData({ ...formData, [field.key]: Number(e.target.value) })} className="bg-muted border-border" />;
      default:
        return <Input type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"} value={value || ""} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })} className="bg-muted border-border" />;
    }
  };

  const formatCell = (value: any, field: FieldConfig) => {
    if (field.type === "toggle") return value ? "✅" : "❌";
    if (typeof value === "string" && value.length > 40) return value.slice(0, 40) + "…";
    return String(value ?? "");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <Button onClick={openAdd} className="gap-2">
          <Plus size={16} /> Add New
        </Button>
      </div>

      <div className="mb-4 relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 bg-muted border-border" />
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {tableFields.map(f => (
                <TableHead key={f.key} className="text-muted-foreground font-semibold">{f.label}</TableHead>
              ))}
              <TableHead className="w-24 text-muted-foreground font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={tableFields.length + 1} className="text-center text-muted-foreground py-8">
                  No records found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/30">
                  {tableFields.map(f => (
                    <TableCell key={f.key}>{formatCell((item as any)[f.key], f)}</TableCell>
                  ))}
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(item)}>
                        <Pencil size={14} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)} className="text-destructive hover:text-destructive">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground mt-2">{filteredData.length} record(s)</p>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle>{editItem ? "Edit" : "Add"} {title.replace(/s$/, "")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {fields.map(f => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-sm">{f.label}</Label>
                {renderField(f)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this record?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
