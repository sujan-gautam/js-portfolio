import { lazy, Suspense } from "react";
import { usePageVersions } from "@/lib/pageVersions";

const LegacyStories = lazy(() => import("@/legacy/StoriesSection"));
const Stories = lazy(() => import("@/components/StoriesSection"));

export default function VersionedStories({ showLabel = true }: { showLabel?: boolean }) {
  const { data, isPending } = usePageVersions();
  if (isPending) return null;
  const Viewer = data?.story === "v2" ? Stories : LegacyStories;
  return <Suspense fallback={null}><Viewer showLabel={showLabel} /></Suspense>;
}
