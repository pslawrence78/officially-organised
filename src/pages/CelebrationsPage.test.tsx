import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { getEventById, seedInitialDataIfNeeded } from "../data/repositories";
import { CelebrationsPage } from "./CelebrationsPage";

describe("Celebrations page", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("renders the empty state for celebrations", async () => {
    render(<MemoryRouter><CelebrationsPage /></MemoryRouter>);
    expect(await screen.findByText(/No celebrations yet/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Gifts & Celebrations" })).toBeInTheDocument();
  });

  it("creates a celebration and a gift plan through the page flow", async () => {
    render(<MemoryRouter><CelebrationsPage /></MemoryRouter>);

    fireEvent.change(await screen.findByLabelText("Occasion title"), { target: { value: "Alex birthday" } });
    fireEvent.click(screen.getByRole("button", { name: "Create celebration" }));
    expect(await screen.findByText("Celebration created.")).toBeInTheDocument();

    const occasionSelect = screen.getByLabelText("Occasion") as HTMLSelectElement;
    await waitFor(() => expect([...occasionSelect.options].some((option) => option.textContent?.includes("Alex birthday"))).toBe(true));
    fireEvent.change(occasionSelect, { target: { value: [...occasionSelect.options].find((option) => option.textContent?.includes("Alex birthday"))?.value } });
    const recipientFields = await screen.findAllByLabelText("Recipient name");
    fireEvent.change(recipientFields[1], { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Gift status"), { target: { value: "to_buy" } });
    fireEvent.click(screen.getByRole("button", { name: "Create gift plan" }));

    expect(await screen.findByText("Gift plan created.")).toBeInTheDocument();
    await waitFor(async () => expect(await db.giftPlans.count()).toBe(1));
    expect((await db.giftPlans.toCollection().first())?.recipientName).toBe("Alex");
  });

  it("generates prep tasks for a saved gift plan", async () => {
    render(<MemoryRouter><CelebrationsPage /></MemoryRouter>);

    fireEvent.change(await screen.findByLabelText("Occasion title"), { target: { value: "School party" } });
    fireEvent.click(screen.getByRole("button", { name: "Create celebration" }));
    await screen.findByText("Celebration created.");

    const occasionSelect = screen.getByLabelText("Occasion") as HTMLSelectElement;
    await waitFor(() => expect([...occasionSelect.options].some((option) => option.textContent?.includes("School party"))).toBe(true));
    fireEvent.change(occasionSelect, { target: { value: [...occasionSelect.options].find((option) => option.textContent?.includes("School party"))?.value } });
    const recipientFields = await screen.findAllByLabelText("Recipient name");
    fireEvent.change(recipientFields[1], { target: { value: "Classmate" } });
    fireEvent.click(screen.getByRole("button", { name: "Create gift plan" }));
    await screen.findByText("Gift plan created.");
    await waitFor(async () => expect(await db.giftPlans.count()).toBe(1));

    fireEvent.click(screen.getAllByRole("button", { name: "Generate/update prep tasks" })[0]);
    await waitFor(async () => expect((await db.giftPlans.toCollection().first())?.linkedEventId).toBeTruthy());
    const savedPlan = await db.giftPlans.toCollection().first();
    await waitFor(async () => expect((await getEventById(savedPlan!.linkedEventId!))?.prepTasks.length).toBeGreaterThan(0));
  });
});
