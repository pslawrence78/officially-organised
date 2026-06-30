import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories";
import { seedDenseLawrenceWeekFixture } from "../test/denseWeekFixture";
import { appRoutes } from "./routes";

async function renderPath(path: string) {
  const router = createMemoryRouter(appRoutes, {
    basename: "/officially-organised",
    initialEntries: [`/officially-organised${path}`],
  });
  render(createElement(RouterProvider, { router }));
  return router;
}

describe("route smoke coverage with dense beta-week data", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
    await seedDenseLawrenceWeekFixture();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it.each([
    "/",
    "/today",
    "/week",
    "/calendar",
    "/car",
    "/prep",
    "/people",
    "/people/member_seb",
    "/routines",
    "/school",
    "/celebrations",
    "/household",
    "/household-admin",
    "/settings",
    "/settings/import",
    "/settings/export",
    "/settings/release-readiness",
    "/settings/sync",
    "/settings/beta-readiness",
  ])("renders %s inside the app shell without crashing", async (path) => {
    await renderPath(path);
    await waitFor(() => expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "Officially Organised dashboard" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Page not found" })).not.toBeInTheDocument();
    const alert = screen.queryByRole("alert");
    if (alert) expect(alert).not.toHaveTextContent("Something went awry.");
  });

  it.each([
    ["/hub", "Household Hub display"],
    ["/hub/wallboard", "Household Hub wallboard"],
  ])("renders %s without the normal shell navigation", async (path, landmarkName) => {
    await renderPath(path);
    expect(await screen.findByRole("main", { name: landmarkName })).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
  });

  it("shows a safe fallback for a missing person detail route", async () => {
    await renderPath("/people/missing-person");
    expect(await screen.findByRole("heading", { name: "Person not found" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });

  it("shows a safe not-found fallback for an invalid route", async () => {
    await renderPath("/definitely-not-real");
    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
  });
});
