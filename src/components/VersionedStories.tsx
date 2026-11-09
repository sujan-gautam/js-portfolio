import { lazy } from "react";
import { VersionedPage } from "@/components/VersionedPage";

const LegacyStories = lazy(() => import("@/legacy/StoriesSection"));
const Stories = lazy(() => import("@/components/StoriesSection"));

export default function VersionedStories({ showLabel = true }: { showLabel?: boolean }) {
  return <VersionedPage page="story" v1={<LegacyStories showLabel={showLabel} />} v2={<Stories showLabel={showLabel} />} quiet />;
}
