import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../data/db";
import { seedInitialDataIfNeeded } from "../data/repositories";
import { AppShell } from "./AppShell";

describe("AppShell identity and mobile capture", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("renders the current product identity and links the brand to the deployed app root", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <AppShell />,
          children: [{ index: true, element: <p>Dashboard</p> }],
        },
      ],
      {
        basename: "/officially-organised",
        initialEntries: ["/officially-organised/"],
      },
    );

    render(<RouterProvider router={router} />);

    expect(screen.getByText("Officially Organised")).toBeVisible();
    expect(screen.getByRole("link", { name: "Officially Organised dashboard" })).toHaveAttribute(
      "href",
      "/officially-organised/",
    );
  });

  it("opens quick capture from the shared add button", async () => {
    const router = createMemoryRouter(
      [
        {
          path: "/",
          element: <AppShell />,
          children: [{ index: true, element: <p>Dashboard</p> }],
        },
      ],
      { initialEntries: ["/"] },
    );

    render(<RouterProvider router={router} />);

    fireEvent.click(screen.getByRole("button", { name: "Quick capture" }));

    expect(await screen.findByRole("dialog", { name: "Quick capture" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: /Event/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("button", { name: "Save now" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });
});
