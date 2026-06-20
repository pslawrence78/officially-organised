import { FAMILY_CAR_RESOURCE_ID } from "../domain/constants";
import type { Conflict, FamilyEvent, ResourceNeed } from "../domain/types";

const DEPENDANT_MEMBER_IDS = new Set(["member_seb", "member_albert"]);

function resourceWindow(event: FamilyEvent, need: ResourceNeed) {
  const start = Date.parse(need.neededFrom ?? event.startAt);
  const end = Date.parse(need.neededUntil ?? event.endAt);
  return Number.isFinite(start) && Number.isFinite(end) && start < end ? { start, end } : undefined;
}

function windowsOverlap(left: { start: number; end: number }, right: { start: number; end: number }) {
  return left.start < right.end && right.start < left.end;
}

function activeCarNeeds(event: FamilyEvent) {
  return event.resourceNeeds.filter((need) =>
    need.resourceId === FAMILY_CAR_RESOURCE_ID &&
    (need.needStatus === "required" || need.needStatus === "maybe"),
  );
}

/** Pure, deterministic projection of the current event data. Nothing is persisted. */
export function calculateConflicts(events: FamilyEvent[], now = new Date()): Conflict[] {
  const activeEvents = events.filter((event) => event.status !== "cancelled");
  const conflicts: Conflict[] = [];

  for (const event of activeEvents) {
    if (event.participants.some((id) => DEPENDANT_MEMBER_IDS.has(id)) && event.responsibleAdults.length === 0) {
      conflicts.push({
        id: `responsibility:${event.id}`,
        type: "unassigned_responsibility",
        severity: "critical",
        title: "Responsibility not assigned",
        description: `${event.title} includes Seb or Albert but has no responsible adult.`,
        eventIds: [event.id],
      });
    }

    for (const task of event.prepTasks) {
      if (task.status !== "open" || !task.dueAt || Date.parse(task.dueAt) >= now.getTime()) continue;
      const critical = task.blocksEvent;
      conflicts.push({
        id: `prep:${event.id}:${task.id}`,
        type: critical ? "critical_prep_overdue" : "prep_overdue",
        severity: critical ? "critical" : "warning",
        title: critical ? "Critical preparation overdue" : "Preparation overdue",
        description: `${task.title} is overdue for ${event.title}.`,
        eventIds: [event.id],
        prepTaskId: task.id,
      });
    }
  }

  for (let leftIndex = 0; leftIndex < activeEvents.length; leftIndex += 1) {
    const leftEvent = activeEvents[leftIndex];
    for (let rightIndex = leftIndex + 1; rightIndex < activeEvents.length; rightIndex += 1) {
      const rightEvent = activeEvents[rightIndex];
      for (const leftNeed of activeCarNeeds(leftEvent)) {
        for (const rightNeed of activeCarNeeds(rightEvent)) {
          const leftWindow = resourceWindow(leftEvent, leftNeed);
          const rightWindow = resourceWindow(rightEvent, rightNeed);
          if (!leftWindow || !rightWindow || !windowsOverlap(leftWindow, rightWindow)) continue;
          const bothRequired = leftNeed.needStatus === "required" && rightNeed.needStatus === "required";
          const requiredMaybe = leftNeed.needStatus !== rightNeed.needStatus;
          if (!bothRequired && !requiredMaybe) continue;
          conflicts.push({
            id: `car:${leftEvent.id}:${leftNeed.id}:${rightEvent.id}:${rightNeed.id}`,
            type: bothRequired ? "car_clash" : "maybe_car_clash",
            severity: bothRequired ? "critical" : "warning",
            title: bothRequired ? "Family car clash" : "Possible family car clash",
            description: `${leftEvent.title} and ${rightEvent.title} need the car at overlapping times.`,
            eventIds: [leftEvent.id, rightEvent.id],
            resourceId: FAMILY_CAR_RESOURCE_ID,
          });
        }
      }
    }
  }

  return conflicts.sort((left, right) => {
    if (left.severity !== right.severity) return left.severity === "critical" ? -1 : 1;
    return left.id.localeCompare(right.id);
  });
}

export function conflictsForEvent(conflicts: Conflict[], eventId: string) {
  return conflicts.filter((conflict) => conflict.eventIds.includes(eventId));
}

export function conflictsForEvents(conflicts: Conflict[], eventIds: Iterable<string>) {
  const ids = new Set(eventIds);
  return conflicts.filter((conflict) => conflict.eventIds.some((eventId) => ids.has(eventId)));
}
