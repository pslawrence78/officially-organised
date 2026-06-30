import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories";
import { BetaReadinessPage } from "./BetaReadinessPage";
import { seedDenseLawrenceWeekFixture } from "../test/denseWeekFixture";

describe("BetaReadinessPage", () => {
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

  it("renders safe diagnostics and checklist controls", async () => {
    render(<MemoryRouter><BetaReadinessPage /></MemoryRouter>);
    expect(await screen.findByRole("heading", { name: "Beta readiness" })).toBeInTheDocument();
    expect(screen.getByText("Private and technical only")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Copy beta diagnostics" })).toBeInTheDocument();
    expect(await screen.findByRole("checkbox", { name: /Installed on iPhone/i })).toBeInTheDocument();
  });

  it("copies diagnostics without event titles or secrets", async () => {
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<MemoryRouter><BetaReadinessPage /></MemoryRouter>);

    fireEvent.click(await screen.findByRole("button", { name: "Copy beta diagnostics" }));

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("Officially Organised beta diagnostics");
    expect(copied).not.toContain("Seb swimming");
    expect(copied).not.toContain("resource_family_car");
  });

  it("persists checklist progress in local settings", async () => {
    render(<MemoryRouter><BetaReadinessPage /></MemoryRouter>);
    const checkbox = await screen.findByRole("checkbox", { name: /Backup export checked/i });
    fireEvent.click(checkbox);
    await waitFor(() => expect(checkbox).toBeChecked());
    expect((await db.settings.get("beta_readiness_checklist"))?.value).toMatchObject({
      backupExportChecked: true,
    });
  });
});
