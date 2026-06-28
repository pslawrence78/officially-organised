import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../data/db";
import { SyncSettingsPanel } from "./SyncSettingsPanel";

describe("SyncSettingsPanel", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  afterEach(() => cleanup());

  it("renders safely when Supabase is not configured", async () => {
    render(<SyncSettingsPanel env={{}} />);

    expect(await screen.findByRole("heading", { name: "Supabase foundation" })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("Not configured")).toBeInTheDocument());
    expect(await screen.findByText("Unavailable until Supabase is configured")).toBeInTheDocument();
    expect(screen.getByText(/No family records are pushed or pulled/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request sign-in link" })).not.toBeInTheDocument();
  });
});
