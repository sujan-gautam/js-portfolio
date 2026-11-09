import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { API_BASE } from "@/config";

export const pageVersionLabels = {
  home: "Home",
  about: "About",
  feed: "Feed",
  portfolio: "Portfolio",
  contact: "Contact",
  feedPost: "Feed post and article",
  blog: "Articles index",
  blogPost: "Blog article",
  story: "Story viewer",
  navigation: "Bottom navigation",
} as const;

export type PageVersionKey = keyof typeof pageVersionLabels;
export type PageVersions = Partial<Record<PageVersionKey, "v1" | "v2">>;
export const pageVersionsQueryKey = ["page-versions"] as const;

export function usePageVersions() {
  return useQuery({
    queryKey: pageVersionsQueryKey,
    queryFn: async ({ signal }) => (await axios.get<PageVersions>(`${API_BASE}/page-versions`, { signal, timeout: 5000 })).data,
    staleTime: 30_000,
    retry: false,
  });
}
