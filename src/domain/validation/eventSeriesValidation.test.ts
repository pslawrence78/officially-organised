import { describe, expect, it } from "vitest";
import type { EventSeriesInput } from "../types";
import { seedFamilyMembers, seedResources } from "../../data/seedData/initialData";
import { validateEventSeries } from "./eventSeriesValidation";

describe("event series validation", () => {
  it("reports unsafe routine inputs clearly", () => {
    const input: EventSeriesInput = { title: " ", category: "club", status: "active", recurrence: { frequency: "monthly", startDate: "", endDate: "2020-01-01", startTime: "09:00", durationMinutes: 0, dayOfMonth: 32 }, defaultParticipants: ["missing"], defaultResponsibleAdults: ["member_seb"], defaultPlaceId: "missing", defaultResourceNeeds: [{ id: "x", resourceId: "missing", needStatus: "required", beforeStartMinutes: 0, afterEndMinutes: 0 }], defaultPrepTasks: [], exceptions: [] };
    expect(validateEventSeries(input, seedFamilyMembers, [], seedResources)).toMatchObject({ title: expect.any(String), startDate: expect.any(String), day: expect.any(String), duration: expect.any(String), participants: expect.any(String), responsibleAdults: expect.any(String), placeId: expect.any(String), resources: expect.any(String) });
  });
});
