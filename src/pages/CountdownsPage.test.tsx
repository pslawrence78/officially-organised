import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { getCountdownTargets, getSchoolCalendar, saveSchoolCalendar, seedInitialDataIfNeeded } from "../data/repositories";
import { CountdownsPage } from "./CountdownsPage";

describe("countdown management", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
    const calendar = await getSchoolCalendar();
    if (calendar) {
      await saveSchoolCalendar({
        ...calendar,
        closureDays: calendar.closureDays.map((day) => day.id === "school_closure_inset" ? { ...day, date: "2026-07-01" } : day),
      });
    }
  });
  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("adds and edits a manual countdown", async () => {
    render(<MemoryRouter><CountdownsPage /></MemoryRouter>);
    expect(await screen.findByText("Illustrative Summer Holiday")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Add countdown" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Illustrative Family Day" } });
    fireEvent.change(screen.getByLabelText("Target date"), { target: { value: "2026-09-12" } });
    fireEvent.change(screen.getByLabelText("Dashboard visibility"), { target: { value: "dashboard_primary" } });
    fireEvent.click(screen.getByRole("button", { name: "Save countdown" }));
    await waitFor(() => expect(screen.getByText("Illustrative Family Day")).toBeInTheDocument());
    const item = screen.getByText("Illustrative Family Day").closest("article")!;
    fireEvent.click(within(item).getByRole("button", { name: "Edit" }));
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Edited Family Day" } });
    fireEvent.click(screen.getByLabelText("Show sleeps"));
    fireEvent.click(screen.getByRole("button", { name: "Save countdown" }));
    await waitFor(() => expect(screen.getByText("Edited Family Day")).toBeInTheDocument());
    expect((await getCountdownTargets()).find((target) => target.title === "Edited Family Day")).toMatchObject({ visibility: "dashboard_primary", showSleeps: false });
  });

  it("offers school-calendar dates without auto-adding them", async () => {
    render(<MemoryRouter><CountdownsPage /></MemoryRouter>);
    const suggestionTitle = await screen.findByText("Illustrative INSET Day");
    const suggestion = suggestionTitle.closest("article")!;
    expect((await getCountdownTargets()).some((target) => target.title === "Illustrative INSET Day")).toBe(false);
    fireEvent.click(within(suggestion).getByRole("button", { name: "Add" }));
    await waitFor(async () => expect((await getCountdownTargets()).some((target) => target.title === "Illustrative INSET Day")).toBe(true));
  });
});
