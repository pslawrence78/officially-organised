import { describe, expect, it } from "vitest";
import { requiredRoutePaths, trancheOneRoutePaths } from "./routes";

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
});
