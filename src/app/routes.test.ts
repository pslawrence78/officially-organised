import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { appRoutes, normalizeRouterBasename, requiredRoutePaths, trancheOneRoutePaths } from "./routes";

describe("Tranche 0 route contract", () => {
  afterEach(() => cleanup());

  it("contains every required route", () => {
    expect(requiredRoutePaths).toEqual([
      "/",
      "/today",
      "/week",
      "/hub",
      "/hub/wallboard",
      "/calendar",
      "/car",
      "/prep",
      "/people",
      "/people/:memberId",
      "/routines",
      "/templates",
      "/places",
      "/settings",
      "/settings/import",
      "/settings/export",
      "/settings/sync",
      "/settings/school-calendar",
      "/settings/school-half-terms",
      "/settings/countdowns",
    ]);
  });

  it("contains every Tranche 1 workflow route", () => {
    expect(trancheOneRoutePaths).toEqual([
      "/events/new",
      "/events/:eventId",
      "/events/:eventId/edit",
      "/places/new",
      "/places/:placeId/edit",
    ]);
  });

  it("normalises the production base URL for React Router", () => {
    expect(normalizeRouterBasename("/officially-organised/")).toBe("/officially-organised");
    expect(normalizeRouterBasename("/")).toBe("/");
  });

  it.each([
    ["/officially-organised/", true],
    ["/officially-organised/today", "today"],
    ["/officially-organised/week", "week"],
    ["/officially-organised/hub", true],
    ["/officially-organised/hub/wallboard", "wallboard"],
    ["/officially-organised/car", "car"],
    ["/officially-organised/unknown", "*"],
  ])("resolves %s within the deployed base path", (path, expectedRoute) => {
    const testRouter = createMemoryRouter(appRoutes, {
      basename: "/officially-organised",
      initialEntries: [path],
    });

    const matchedRoute = testRouter.state.matches.at(-1)?.route;
    expect(matchedRoute?.index ?? matchedRoute?.path).toBe(expectedRoute);
  });

  it("keeps the Hub outside the normal application shell", () => {
    const testRouter = createMemoryRouter(appRoutes, {
      basename: "/officially-organised",
      initialEntries: ["/officially-organised/hub"],
    });

    expect(testRouter.state.matches).toHaveLength(2);
    expect(testRouter.state.matches[0].route.path).toBe("/hub");
    expect(testRouter.state.matches[1].route.index).toBe(true);
  });

  it("keeps the Hub wallboard outside the normal application shell", () => {
    const testRouter = createMemoryRouter(appRoutes, {
      basename: "/officially-organised",
      initialEntries: ["/officially-organised/hub/wallboard"],
    });

    expect(testRouter.state.matches).toHaveLength(2);
    expect(testRouter.state.matches[0].route.path).toBe("/hub");
    expect(testRouter.state.matches[1].route.path).toBe("wallboard");
  });

  it.each([
    ["/officially-organised/hub", "Household Hub display"],
    ["/officially-organised/hub/wallboard", "Household Hub wallboard"],
  ])("renders %s without the normal application shell", async (path, landmarkName) => {
    const testRouter = createMemoryRouter(appRoutes, {
      basename: "/officially-organised",
      initialEntries: [path],
    });

    render(createElement(RouterProvider, { router: testRouter }));

    expect(await screen.findByRole("main", { name: landmarkName })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Page not found" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Officially Organised dashboard" })).not.toBeInTheDocument();
  });

  it("renders unknown routes through the normal shell NotFound", async () => {
    const testRouter = createMemoryRouter(appRoutes, {
      basename: "/officially-organised",
      initialEntries: ["/officially-organised/unknown"],
    });

    render(createElement(RouterProvider, { router: testRouter }));

    expect(await screen.findByRole("heading", { name: "Page not found" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });

  it.each(["/", "/today", "/week", "/car", "/prep", "/settings"])("renders %s through the normal application shell", async (path) => {
    const testRouter = createMemoryRouter(appRoutes, {
      basename: "/officially-organised",
      initialEntries: [`/officially-organised${path === "/" ? "/" : path}`],
    });

    render(createElement(RouterProvider, { router: testRouter }));

    await waitFor(() => expect(screen.getByRole("link", { name: "Officially Organised dashboard" })).toBeInTheDocument());
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "More" })).toBeInTheDocument();
  });
});
