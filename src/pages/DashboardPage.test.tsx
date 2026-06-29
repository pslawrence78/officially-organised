import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FAMILY_CAR_RESOURCE_ID } from "../domain/constants";
import type { CountdownTarget, FamilyEventInput, PrepTask, ResourceNeed } from "../domain/types";
import { db } from "../data/db";
import { createEvent, getEventById, saveCountdownTarget, seedInitialDataIfNeeded } from "../data/repositories";
import { createCelebration } from "../data/repositories/celebrationRepository";
import { createGiftPlan } from "../data/repositories/giftPlanRepository";
import { addDaysToDateKey, currentDateKey, localDateTimeToIso } from "../utils/dates";
import { DashboardPage } from "./DashboardPage";

const timestamp = "2026-01-01T00:00:00.000Z";

function eventInput(title: string, dateKey = currentDateKey(), overrides: Partial<FamilyEventInput> = {}): FamilyEventInput {
  return {
    title,
    category: "family_social",
    status: "confirmed",
    startAt: localDateTimeToIso(`${dateKey}T10:00`),
    endAt: localDateTimeToIso(`${dateKey}T11:00`),
    allDay: false,
    participants: ["member_phil"],
    responsibleAdults: [],
    prepTasks: [],
    resourceNeeds: [],
    ...overrides,
  };
}

function prepTask(title: string, dueAt: string, blocksEvent = false): PrepTask {
  return { id: `prep_${title.replace(/\W/g, "_")}`, title, ownerIds: ["member_phil"], dueAt, priority: blocksEvent ? "critical" : "important", status: "open", blocksEvent, createdAt: timestamp, updatedAt: timestamp };
}

function carNeed(id: string, status: "required" | "maybe"): ResourceNeed {
  return { id, resourceId: FAMILY_CAR_RESOURCE_ID, needStatus: status, neededFrom: localDateTimeToIso(`${currentDateKey()}T10:00`), neededUntil: localDateTimeToIso(`${currentDateKey()}T11:00`), createdAt: timestamp, updatedAt: timestamp };
}

function renderDashboard() {
  return render(<MemoryRouter><DashboardPage /></MemoryRouter>);
}

function countdown(id: string, days: number, visibility: CountdownTarget["visibility"] = "dashboard_secondary", active = true): CountdownTarget {
  const timestamp = new Date().toISOString();
  return { id, title: id, targetDate: addDaysToDateKey(currentDateKey(), days), sourceType: "manual", visibility, showSleeps: true, active, createdAt: timestamp, updatedAt: timestamp };
}

describe("Dashboard operational readiness", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    cleanup();
    await db.delete();
  });

  it("shows reassuring empty states on a no-events day", async () => {
    renderDashboard();
    expect(await screen.findByText("Nothing needs attention")).toBeInTheDocument();
    expect(screen.getByText("No events today")).toBeInTheDocument();
    expect(screen.getByText("No car needs today")).toBeInTheDocument();
    expect(screen.getByText("No prep due")).toBeInTheDocument();
    expect(screen.getByText("Quiet or low-activity week")).toBeInTheDocument();
    expect(screen.getByText(/Seb: school/)).toBeInTheDocument();
  });

  it("shows a normal day without manufacturing risk", async () => {
    await createEvent(eventInput("Routine family plan"));
    renderDashboard();
    expect(await screen.findByText("Routine family plan")).toBeInTheDocument();
    expect(screen.getByText("Everything important is covered")).toBeInTheDocument();
  });

  it("puts a required car clash in critical Dashboard attention", async () => {
    await createEvent(eventInput("First car journey", currentDateKey(), { resourceNeeds: [carNeed("need_first", "required")] }));
    await createEvent(eventInput("Second car journey", currentDateKey(), { resourceNeeds: [carNeed("need_second", "required")] }));
    renderDashboard();
    expect(await screen.findByText("Family car clash")).toBeInTheDocument();
    expect(screen.getByText("Car clash")).toBeInTheDocument();
    expect(screen.getByText("1 critical")).toBeInTheDocument();
  });

  it("shows a required/maybe clash as warning-level attention", async () => {
    await createEvent(eventInput("Required journey", currentDateKey(), { resourceNeeds: [carNeed("need_required", "required")] }));
    await createEvent(eventInput("Maybe journey", currentDateKey(), { resourceNeeds: [carNeed("need_maybe", "maybe")] }));
    renderDashboard();
    expect(await screen.findByText("Possible family car clash")).toBeInTheDocument();
    expect(screen.getByText("Possible car clash")).toBeInTheDocument();
    expect(screen.getByText("Check when ready")).toBeInTheDocument();
  });

  it("surfaces ordinary overdue prep with its event and action", async () => {
    await createEvent(eventInput("Trip out", currentDateKey(), { prepTasks: [prepTask("Pack snacks", new Date(Date.now() - 60_000).toISOString())] }));
    renderDashboard();
    expect(await screen.findByText("Preparation overdue")).toBeInTheDocument();
    expect(screen.getByText(/Pack snacks is overdue for Trip out/)).toBeInTheDocument();
    expect(screen.getByText("Complete it or update the plan.")).toBeInTheDocument();
  });

  it("surfaces critical overdue prep and removes it when completed", async () => {
    const event = await createEvent(eventInput("Important trip", currentDateKey(), { prepTasks: [prepTask("Charge equipment", new Date(Date.now() - 60_000).toISOString(), true)] }));
    renderDashboard();
    expect(await screen.findByText("Critical preparation overdue")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mark complete" }));
    await waitFor(() => expect(screen.queryByText("Critical preparation overdue")).not.toBeInTheDocument());
    expect(screen.getByText("Nothing needs attention")).toBeInTheDocument();
    expect((await getEventById(event.id))?.prepTasks[0].status).toBe("done");
  });

  it("keeps risks above ordinary coming-up items in a busy week", async () => {
    await createEvent(eventInput("Risky journey one", currentDateKey(), { resourceNeeds: [carNeed("need_busy_one", "required")] }));
    await createEvent(eventInput("Risky journey two", currentDateKey(), { resourceNeeds: [carNeed("need_busy_two", "required")] }));
    for (let day = 1; day <= 3; day += 1) await createEvent(eventInput(`Coming up ${day}`, addDaysToDateKey(currentDateKey(), day)));
    await saveCountdownTarget(countdown("Dashboard family countdown", 20, "dashboard_primary"));
    const { container } = renderDashboard();
    await screen.findByText("Family car clash");
    const attention = container.querySelector('[data-dashboard-section="attention"]')!;
    const comingUp = container.querySelector('[data-dashboard-section="coming-up"]')!;
    const countdownSection = container.querySelector('[data-dashboard-section="countdowns"]')!;
    expect(attention.compareDocumentPosition(comingUp) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(attention.compareDocumentPosition(countdownSection) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("renders primary before sorted secondary countdowns and excludes unsafe targets", async () => {
    await db.countdownTargets.clear();
    await Promise.all([
      saveCountdownTarget(countdown("Primary countdown", 30, "dashboard_primary")),
      saveCountdownTarget(countdown("Later secondary", 20)),
      saveCountdownTarget(countdown("Sooner secondary", 10)),
      saveCountdownTarget(countdown("Passed countdown", -1)),
      saveCountdownTarget(countdown("Inactive countdown", 2, "dashboard_secondary", false)),
      saveCountdownTarget(countdown("Hidden countdown", 3, "hidden")),
    ]);
    const { container } = renderDashboard();
    await screen.findByText("Primary countdown");
    expect(screen.queryByText("Passed countdown")).not.toBeInTheDocument();
    expect(screen.queryByText("Inactive countdown")).not.toBeInTheDocument();
    expect(screen.queryByText("Hidden countdown")).not.toBeInTheDocument();
    const cards = [...container.querySelectorAll(".countdown-card h3")].map((item) => item.textContent);
    expect(cards).toEqual(["Primary countdown", "Sooner secondary", "Later secondary"]);
  });

  it("links event, conflict, prep, car and section cards to useful targets", async () => {
    const tomorrow = addDaysToDateKey(currentDateKey(), 1);
    const dueTomorrow = localDateTimeToIso(`${tomorrow}T09:00`);
    const event = await createEvent(eventInput("Linked plan", tomorrow, { prepTasks: [prepTask("Linked prep", dueTomorrow)] }));
    await createEvent(eventInput("Clash one", currentDateKey(), { resourceNeeds: [carNeed("need_link_one", "required")] }));
    await createEvent(eventInput("Clash two", currentDateKey(), { resourceNeeds: [carNeed("need_link_two", "required")] }));
    renderDashboard();
    expect((await screen.findByText("Linked prep")).closest("article")?.querySelector("a")).toHaveAttribute("href", `/events/${event.id}`);
    expect(screen.getByRole("link", { name: "Open Today" })).toHaveAttribute("href", "/today");
    expect(screen.getByRole("link", { name: "Open Car" })).toHaveAttribute("href", "/car");
    expect(screen.getByRole("link", { name: "Open Prep" })).toHaveAttribute("href", "/prep");
    expect(screen.getByRole("link", { name: "Open Week" })).toHaveAttribute("href", "/week");
    expect(screen.getByText("Family car clash").closest("a")).toHaveAttribute("href", expect.stringMatching(/^\/events\//));
  });

  it("shows only bounded at-risk celebration issues on the dashboard", async () => {
    const urgentDate = addDaysToDateKey(currentDateKey(), 1);
    const laterDate = addDaysToDateKey(currentDateKey(), 30);
    const urgentCelebration = await createCelebration({ householdId: "household_lawrence", title: "Urgent party", occasionType: "birthday_party", date: urgentDate, recurrence: "none", ownerAdultIds: ["member_phil"], status: "planned" });
    await createGiftPlan({ celebrationId: urgentCelebration.id, recipientName: "Alex", responsibleAdultId: "member_phil", giftStatus: "to_buy", cardStatus: "to_buy", rsvpStatus: "to_reply", targetDate: urgentDate, buyBy: urgentDate, archived: false, linkedPrepTaskIds: [] });
    const farCelebration = await createCelebration({ householdId: "household_lawrence", title: "Far away party", occasionType: "birthday_party", date: laterDate, recurrence: "none", ownerAdultIds: ["member_phil"], status: "planned" });
    await createGiftPlan({ celebrationId: farCelebration.id, recipientName: "Sam", responsibleAdultId: "member_phil", giftStatus: "to_buy", cardStatus: "to_buy", rsvpStatus: "to_reply", targetDate: laterDate, buyBy: addDaysToDateKey(laterDate, -10), archived: false, linkedPrepTaskIds: [] });

    renderDashboard();

    expect(await screen.findByText("Celebration prep")).toBeInTheDocument();
    expect(screen.getByText("Urgent party")).toBeInTheDocument();
    expect(screen.queryByText("Far away party")).not.toBeInTheDocument();
  });
});
