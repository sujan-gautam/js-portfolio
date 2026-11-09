import { Component, Suspense, type ReactNode } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { usePageVersions, type PageVersionKey } from "@/lib/pageVersions";

class RedesignBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function VersionedPage({ page, v1, v2, quiet = false }: { page: PageVersionKey; v1: ReactNode; v2: ReactNode; quiet?: boolean }) {
  const { data, isPending } = usePageVersions();
  const { pathname } = useLocation();
  const loading = quiet ? null : <p role="status" className="sr-only">Loading page…</p>;
  if (isPending) return loading;
  return (
    <Suspense fallback={loading}>
      {data?.[page] === "v2" ? <RedesignBoundary key={`${page}:${pathname}`} fallback={v1}>{v2}</RedesignBoundary> : v1}
    </Suspense>
  );
}

export function StoryRedirect() {
  const { id } = useParams<{ id: string }>();
  const { data, isPending } = usePageVersions();
  if (isPending) return null;
  const pathname = data?.home === "v2" ? "/feed/" : "/";
  return <Navigate to={`${pathname}?${new URLSearchParams({ story: id ?? "" })}`} replace />;
}
