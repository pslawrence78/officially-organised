import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { AppShell } from "./AppShell";

describe("AppShell identity and base-path navigation", () => {
  it("renders the current product identity and links the brand to the deployed app root", () => {
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
});
