import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { APP_VERSION } from "../config/appVersion";
import { PRODUCT_NAME } from "../config/productIdentity";
import { SettingsPage } from "../pages/SettingsPage";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories";
import { seedDenseLawrenceWeekFixture } from "../test/denseWeekFixture";
import { appRoutes, normalizeRouterBasename, requiredRoutePaths, routerBasename } from "./routes";

async function renderPath(path: string) {
  const router = createMemoryRouter(appRoutes, {
    basename: "/officially-organised",
    initialEntries: [`/officially-organised${path}`],
  });
  render(createElement(RouterProvider, { router }));
  return router;
}

describe("RC1 release candidate readiness", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("keeps release identity and hosted routing aligned to RC1", () => {
    expect(PRODUCT_NAME).toBe("Officially Organised");
    expect(APP_VERSION).toBe("1.0.0-rc.1");
    expect(routerBasename).toBe("/officially-organised");
    expect(normalizeRouterBasename("/officially-organised/")).toBe("/officially-organised");
    expect(requiredRoutePaths).toContain("/household");
    expect(requiredRoutePaths).toContain("/settings/release-readiness");
  });

  it("renders core empty-state routes without placeholder or raw error copy", async () => {
    for (const path of [
      "/",
      "/today",
      "/week",
      "/car",
      "/prep",
      "/celebrations",
      "/household",
      "/settings",
      "/settings/sync",
      "/settings/release-readiness",
      "/settings/import",
      "/settings/export",
    ]) {
      cleanup();
      await renderPath(path);
      await waitFor(() => expect(screen.queryByText(/TODO|placeholder|coming soon|undefined/i)).not.toBeInTheDocument());
      expect(screen.queryByText("Something went awry.")).not.toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Page not found" })).not.toBeInTheDocument();
    }

    expect(screen.getByRole("heading", { name: "Export backup" })).toBeInTheDocument();
    expect(screen.getByText(/private family information/i)).toBeInTheDocument();
  });

  it("keeps calm route-specific empty states on the main operational views", async () => {
    await renderPath("/");
    expect(await screen.findByText("Nothing needs attention")).toBeInTheDocument();
    expect(screen.getByText("No events today")).toBeInTheDocument();
    expect(screen.getByText("No car needs today")).toBeInTheDocument();

    cleanup();
    await renderPath("/today");
    expect(await screen.findByText("Nothing planned today")).toBeInTheDocument();

    cleanup();
    await renderPath("/week");
    expect(await screen.findAllByText("No events")).toHaveLength(7);

    cleanup();
    await renderPath("/car");
    expect(await screen.findByText("No upcoming car needs")).toBeInTheDocument();

    cleanup();
    await renderPath("/prep");
    expect(await screen.findByRole("heading", { name: "Prep" })).toBeInTheDocument();

    cleanup();
    await renderPath("/celebrations");
    expect(await screen.findByText("No upcoming celebrations yet")).toBeInTheDocument();

    cleanup();
    await renderPath("/household");
    expect(await screen.findByText("No household admin items here")).toBeInTheDocument();

    cleanup();
    await renderPath("/settings/sync");
    expect(await screen.findByText("No open sync conflicts")).toBeInTheDocument();
  });

  it("keeps reset protection in place on Settings", async () => {
    render(<MemoryRouter><SettingsPage /></MemoryRouter>);
    const resetButton = await screen.findByRole("button", { name: "Reset and reseed local data" });
    expect(resetButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Confirmation phrase"), {
      target: { value: "RESET OFFICIALLY ORGANISED" },
    });

    await waitFor(() => expect(resetButton).toBeEnabled());
  });

  it("renders dense-week routes without crashing", async () => {
    await seedDenseLawrenceWeekFixture();

    for (const path of ["/", "/today", "/week", "/prep", "/car", "/school", "/celebrations", "/household-admin"]) {
      cleanup();
      await renderPath(path);
      await waitFor(() => expect(screen.queryByRole("heading", { name: "Page not found" })).not.toBeInTheDocument());
      expect(screen.queryByText("This section could not be loaded.")).not.toBeInTheDocument();
    }
  });
});
