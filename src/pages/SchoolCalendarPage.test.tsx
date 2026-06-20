import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { getSchoolCalendar, seedInitialDataIfNeeded } from "../data/repositories";
import { SchoolCalendarPage } from "./SchoolCalendarPage";

describe("school calendar management", () => {
  beforeEach(async () => { await db.delete(); await db.open(); await seedInitialDataIfNeeded(); });
  afterEach(async () => { cleanup(); await db.delete(); });

  it("shows the illustrative calendar and adds a closure day locally", async () => {
    render(<MemoryRouter><SchoolCalendarPage /></MemoryRouter>);
    expect(await screen.findByText("Illustrative Primary School")).toBeInTheDocument();
    expect(screen.getByText("Illustrative Summer Term")).toBeInTheDocument();
    expect(screen.getByText("Illustrative INSET Day")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add closure" }));
    fireEvent.change(screen.getByLabelText("Label"), { target: { value: "Illustrative emergency closure" } });
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2026-07-02" } });
    fireEvent.click(screen.getByRole("button", { name: "Save closure" }));
    await waitFor(() => expect(screen.getByText("Illustrative emergency closure")).toBeInTheDocument());
    expect((await getSchoolCalendar())?.closureDays).toContainEqual(expect.objectContaining({ label: "Illustrative emergency closure" }));
  });
});
