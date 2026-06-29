import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { createHouseholdAdminItem, seedInitialDataIfNeeded } from "../data/repositories";
import { HouseholdAdminPage } from "./HouseholdAdminPage";

describe("Household admin page", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("renders the empty state", async () => {
    render(<MemoryRouter><HouseholdAdminPage /></MemoryRouter>);
    expect(await screen.findByText("No household admin items here")).toBeInTheDocument();
  });

  it("creates, updates and archives an item", async () => {
    render(<MemoryRouter><HouseholdAdminPage /></MemoryRouter>);
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "Boiler service" } });
    fireEvent.click(screen.getByRole("button", { name: "Save item" }));
    expect(await screen.findByText("Household admin item added.")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Boiler service" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Provider"), { target: { value: "Warm Homes Ltd" } });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(await screen.findByText("Provider: Warm Homes Ltd")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Boiler service" })).not.toBeInTheDocument());
  });

  it("marks completed and calculates the next due date", async () => {
    await createHouseholdAdminItem({ title: "Home insurance", category: "insurance", adminType: "home_insurance", status: "active", dueDate: "2026-07-01", renewalCycle: "annual", ownerMemberId: "member_phil", reminderDaysBefore: [30, 14, 7] });
    render(<MemoryRouter><HouseholdAdminPage /></MemoryRouter>);
    fireEvent.click(await screen.findByRole("button", { name: "Mark completed" }));
    await screen.findByText("Item marked completed.");
    expect(await screen.findByText("2027-06-29")).toBeInTheDocument();
  });
});
