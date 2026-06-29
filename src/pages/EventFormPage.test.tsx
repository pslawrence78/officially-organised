import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { appRoutes } from "../app/routes";
import { db } from "../data/db";
import { getEvents, getSeries, seedInitialDataIfNeeded } from "../data/repositories";

describe("event form routine bridge", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("renders the routine bridge on Add event without recurring-event copy", async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/events/new"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByText("Create a routine instead")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create routine" })).toBeInTheDocument();
    expect(screen.queryByText(/recurring event/i)).not.toBeInTheDocument();
  });

  it("navigates to routines with transient prefill and creates nothing before save", async () => {
    const router = createMemoryRouter(appRoutes, { initialEntries: ["/events/new"] });
    render(<RouterProvider router={router} />);

    fireEvent.change(await screen.findByLabelText("Event title"), { target: { value: "Seb swimming" } });
    fireEvent.click(screen.getByRole("button", { name: "Create routine" }));

    expect(await screen.findByDisplayValue("Seb swimming")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/routines");
    expect((await getEvents())).toHaveLength(0);
    expect((await getSeries())).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Save routine" })).not.toBeInTheDocument());
    expect((await getEvents())).toHaveLength(0);
    expect((await getSeries())).toHaveLength(0);
  });
});
