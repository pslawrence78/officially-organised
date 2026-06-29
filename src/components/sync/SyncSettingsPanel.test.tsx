import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../data/db";
import { confirmFirstSync, ensureSyncDevice, updateSyncSettings } from "../../data/repositories";
import { SyncSettingsPanel } from "./SyncSettingsPanel";

const authState = vi.hoisted(() => ({
  session: null as null | { user: { id: string; email?: string } },
}));

vi.mock("../../sync/authService", () => ({
  getAuthDiagnostics: vi.fn(() => ({ supabaseConfigured: false, resolvedRedirectUrl: "https://www.lawnetcloud.uk/officially-organised/" })),
  getCurrentSession: vi.fn(async () => authState.session ? { ok: true, value: authState.session } : { ok: false, reason: "not_configured", message: "Unavailable until Supabase is configured" }),
  signInWithMagicLink: vi.fn(),
  signInWithPassword: vi.fn(),
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
    authState.session = null;
  });

  afterEach(() => cleanup());

  it("renders safely when Supabase is not configured", async () => {
    render(<MemoryRouter><SyncSettingsPanel env={{}} /></MemoryRouter>);

    expect(await screen.findByRole("heading", { name: "Manual cloud sync" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Not configured")).toBeInTheDocument());
    expect(await screen.findByText("Unavailable until Supabase is configured")).toBeInTheDocument();
    expect(screen.getByText(/IndexedDB remains the live operational source of truth/)).toBeInTheDocument();
    expect(screen.getByText(/Resolved auth redirect URL/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeDisabled();
  });

  it("requires first-sync confirmation before Sync now is enabled", async () => {
    authState.session = { user: { id: "user_1", email: "phil@example.com" } };
    await updateSyncSettings({ enabled: true, householdId: "household_1", userId: "user_1" });
    render(<MemoryRouter><SyncSettingsPanel env={{ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "secret-publishable-key" }} /></MemoryRouter>);

    expect(await screen.findByText("Before the first cloud sync")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync now" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /I have reviewed this/ }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm first sync guidance" }));

    await waitFor(() => expect(screen.queryByText("Before the first cloud sync")).not.toBeInTheDocument());
  });

  it("copies diagnostics without Supabase credentials", async () => {
    authState.session = { user: { id: "user_1", email: "phil@example.com" } };
    await ensureSyncDevice();
    await updateSyncSettings({ enabled: true, householdId: "household_1", userId: "user_1" });
    const writeText = vi.fn();
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<MemoryRouter><SyncSettingsPanel env={{ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "secret-publishable-key" }} /></MemoryRouter>);

    await screen.findByText("ph***@example.com");
    const copyButton = screen.getByRole("button", { name: "Copy diagnostics" });
    await waitFor(() => expect(copyButton).toBeEnabled());
    fireEvent.click(copyButton);

    await waitFor(() => expect(writeText).toHaveBeenCalled());
    const copied = writeText.mock.calls[0][0] as string;
    expect(copied).toContain("ph***@example.com");
    expect(copied).not.toContain("secret-publishable-key");
  });

  it("requires typed confirmation before disconnecting this device", async () => {
    authState.session = { user: { id: "user_1", email: "phil@example.com" } };
    await confirmFirstSync();
    await updateSyncSettings({ enabled: true, householdId: "household_1", userId: "user_1" });
    render(<MemoryRouter><SyncSettingsPanel env={{ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "secret-publishable-key" }} /></MemoryRouter>);

    const button = await screen.findByRole("button", { name: "Disconnect this device" });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Type DISCONNECT THIS DEVICE"), { target: { value: "DISCONNECT THIS DEVICE" } });
    expect(button).toBeEnabled();
  });
});
