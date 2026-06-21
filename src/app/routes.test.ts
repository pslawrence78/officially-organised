import { createMemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { appRoutes, normalizeRouterBasename, requiredRoutePaths, trancheOneRoutePaths } from "./routes";

describe("Tranche 0 route contract", () => {
  it("contains every required route", () => {
    expect(requiredRoutePaths).toEqual([
      "/",
      "/today",
      "/week",
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
});
