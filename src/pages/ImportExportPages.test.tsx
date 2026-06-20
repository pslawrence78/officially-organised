import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories/appRepository";
import { createExportPayload } from "../services/importExportService";
import { ExportPage } from "./ExportPage";
import { ImportPage } from "./ImportPage";

describe("import and export pages", () => {
  beforeEach(async () => { await db.delete(); await db.open(); await seedInitialDataIfNeeded(); });
  afterEach(async () => { cleanup(); await db.delete(); });
  it("renders a private backup summary", async () => { render(<MemoryRouter><ExportPage /></MemoryRouter>); expect(await screen.findByRole("button", { name: "Download backup" })).toBeInTheDocument(); expect(screen.getByText(/private family information/i)).toBeInTheDocument(); });
  it("previews valid pasted JSON and gates restore with the exact phrase", async () => {
    const payload = await createExportPayload(); render(<MemoryRouter><ImportPage /></MemoryRouter>);
    fireEvent.change(screen.getByLabelText("Paste backup JSON"), { target: { value: JSON.stringify(payload) } }); fireEvent.click(screen.getByRole("button", { name: "Validate and preview" }));
    expect(await screen.findByText("Backup is valid")).toBeInTheDocument(); const restore = screen.getByRole("button", { name: "Restore and replace local data" }); expect(restore).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Confirmation phrase"), { target: { value: "RESTORE MY DATA" } }); await waitFor(() => expect(restore).toBeEnabled());
  });
  it("shows understandable errors for invalid JSON", async () => { render(<MemoryRouter><ImportPage /></MemoryRouter>); fireEvent.change(screen.getByLabelText("Paste backup JSON"), { target: { value: "{" } }); fireEvent.click(screen.getByRole("button", { name: "Validate and preview" })); expect(await screen.findByText(/not valid JSON/i)).toBeInTheDocument(); });
});
