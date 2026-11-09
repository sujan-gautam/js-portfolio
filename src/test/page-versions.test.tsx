import { lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { StoryRedirect, VersionedPage } from "@/components/VersionedPage";
import { pageVersionsQueryKey, type PageVersions } from "@/lib/pageVersions";

const makeClient = (versions: PageVersions) => {
  const client = new QueryClient();
  client.setQueryData(pageVersionsQueryKey, versions);
  return client;
};

function CurrentUrl() {
  const { pathname, search } = useLocation();
  return <output>{pathname}{search}</output>;
}

describe("version boundaries", () => {
  it("leaves V1 mounted and never loads its V2 code when another page changes", async () => {
    const client = makeClient({ home: "v1", contact: "v2" });
    const loadV2Home = vi.fn(async () => ({ default: () => <p>V2 Home</p> }));
    const V2Home = lazy(loadV2Home);
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <VersionedPage page="home" v1={<input aria-label="V1 draft" />} v2={<V2Home />} />
          <VersionedPage page="contact" v1={<p>V1 Contact</p>} v2={<p>V2 Contact</p>} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
    const draft = screen.getByRole<HTMLInputElement>("textbox", { name: "V1 draft" });
    draft.value = "Keep this draft";
    expect(screen.getByText("V2 Contact")).toBeInTheDocument();
    await act(async () => { client.setQueryData(pageVersionsQueryKey, { home: "v1", contact: "v1" }); });
    expect(await screen.findByText("V1 Contact")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "V1 draft" })).toBe(draft);
    expect(draft).toHaveValue("Keep this draft");
    expect(loadV2Home).not.toHaveBeenCalled();
  });

  it("restores the V1 page when the V2 module cannot load", async () => {
    const client = makeClient({ about: "v2" });
    const V2About = lazy(async () => { throw new Error("V2 chunk unavailable"); });
    const report = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(
        <QueryClientProvider client={client}>
          <MemoryRouter>
            <VersionedPage page="about" v1={<h1>V1 About</h1>} v2={<V2About />} />
          </MemoryRouter>
        </QueryClientProvider>,
      );
      expect(await screen.findByRole("heading", { name: "V1 About" })).toBeInTheDocument();
      expect(client.getQueryData(pageVersionsQueryKey)).toEqual({ about: "v2" });
    } finally {
      report.mockRestore();
    }
  });

  it.each([
    ["v1", "/?story=story-1"],
    ["v2", "/feed/?story=story-1"],
  ] as const)("keeps the story entry route compatible with %s Home", async (home, expected) => {
    const client = makeClient({ home, story: home === "v1" ? "v2" : "v1" });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/story/story-1"]}>
          <Routes>
            <Route path="/story/:id" element={<StoryRedirect />} />
            <Route path="*" element={<CurrentUrl />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText(expected)).toBeInTheDocument();
  });
});
