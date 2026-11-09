import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { API_BASE } from "@/config";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { pageVersionLabels, pageVersionsQueryKey, usePageVersions, type PageVersionKey, type PageVersions } from "@/lib/pageVersions";

export default function PageVersionSettings() {
  const queryClient = useQueryClient();
  const { data, isPending, isError, refetch } = usePageVersions();
  const [changes, setChanges] = useState<PageVersions>({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const keys = Object.keys(pageVersionLabels) as PageVersionKey[];
  const currentVersion = (key: PageVersionKey) => data?.[key] ?? "v1";
  const pendingCount = Object.keys(changes).length;

  function selectAll(version: "v1" | "v2") {
    setChanges(Object.fromEntries(keys.filter((key) => currentVersion(key) !== version).map((key) => [key, version])));
    setFeedback("");
  }

  async function save() {
    setSaving(true);
    setFeedback("");
    try {
      const response = await axios.put<PageVersions>(`${API_BASE}/page-versions`, changes);
      queryClient.setQueryData(pageVersionsQueryKey, response.data);
      setChanges({});
      setFeedback("Page versions saved.");
    } catch {
      setFeedback("Couldn’t save page versions. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="page-versions-heading" className="rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
      <h2 id="page-versions-heading" className="text-base font-semibold text-slate-900">Page versions</h2>
      <p className="mt-1 text-sm text-slate-600">V2 is the production default. Use V1 to restore the original layout for any page.</p>
      {isPending ? <p role="status" className="mt-3 text-sm text-slate-600">Loading page versions…</p> : isError && !data ? (
        <p className="mt-3 text-sm text-slate-600">Page versions could not load. <button type="button" className="underline" onClick={() => void refetch()}>Retry</button></p>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => selectAll("v2")}>Select all V2</Button>
            <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => selectAll("v1")}>Select all V1</Button>
            {pendingCount > 0 && <span className="text-xs text-slate-600">{pendingCount} unsaved {pendingCount === 1 ? "change" : "changes"}</span>}
          </div>
          <div className="mt-3 grid gap-x-8 sm:grid-cols-2">
            {keys.map((key) => {
              const enabled = (changes[key] ?? currentVersion(key)) === "v2";
              return (
                <div key={key} className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-100">
                  <label htmlFor={`page-version-${key}`} className="text-sm text-slate-800">{pageVersionLabels[key]}</label>
                  <div className="flex shrink-0 items-center gap-2">
                    <span aria-hidden="true" className="text-xs text-slate-500">{enabled ? "V2" : "V1"}</span>
                    <Switch id={`page-version-${key}`} checked={enabled} disabled={saving} onCheckedChange={(checked) => {
                      setFeedback("");
                      setChanges((current) => {
                        const next = { ...current };
                        const version = checked ? "v2" : "v1";
                        if (version === currentVersion(key)) delete next[key];
                        else next[key] = version;
                        return next;
                      });
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={save} disabled={saving || !pendingCount}>Save page versions</Button>
            {pendingCount > 0 && <Button type="button" variant="ghost" disabled={saving} onClick={() => { setChanges({}); setFeedback(""); }}>Discard changes</Button>}
            <span role="status" className="text-sm text-slate-600">{feedback}</span>
          </div>
        </>
      )}
    </section>
  );
}
