import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../data/db";
import { SyncSettingsPanel } from "./SyncSettingsPanel";

vi.mock("../../sync/authService", () => ({
  getCurrentSession: vi.fn(async () => ({ ok: false, reason: "not_configured", message: "Unavailable until Supabase is configured" })),
  signInWithMagicLink: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("../../sync/syncEngine", () => ({
  createCloudHouseholdFromThisDevice: vi.fn(),
  linkFirstRemoteHousehold: vi.fn(),
  runManualSync: vi.fn(),
}));

describe("SyncSettingsPanel", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(() => cleanup());

  it("renders safely when Supabase is not configured", async () => {
    render(<MemoryRouter><SyncSettingsPanel env={{}} /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Manual cloud sync" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Not configured")).toBeInTheDocument());
    expect(await screen.findByText("Unavailable until Supabase is configured")).toBeInTheDocument();
    expect(screen.getByText(/IndexedDB remains the live operational source of truth/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeDisabled();
  });
});
