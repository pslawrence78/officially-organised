import { PREP_TASK_PRIORITIES, PREP_TASK_STATUSES } from "../constants";
import type { FamilyMember, NewPrepTaskInput, PrepTask, PrepTaskInput } from "../types";

export type PrepTaskValidationErrors = Record<string, string>;

export function validatePrepTask(task: PrepTaskInput | NewPrepTaskInput, familyMembers: FamilyMember[]): PrepTaskValidationErrors {
  const errors: PrepTaskValidationErrors = {};
  const adultIds = new Set(familyMembers.filter((member) => member.memberType === "adult").map((member) => member.id));

  if (!task.title.trim()) errors.title = "Give the preparation task a title.";
  if (task.ownerIds.some((id) => !adultIds.has(id))) errors.ownerIds = "Preparation can only be assigned to Phil or Beck.";
  if (task.dueAt && Number.isNaN(Date.parse(task.dueAt))) errors.dueAt = "Choose a valid due date and time.";
  if (!PREP_TASK_PRIORITIES.includes(task.priority)) errors.priority = "Choose a valid priority.";
  if (!PREP_TASK_STATUSES.includes(task.status)) errors.status = "Choose a valid status.";
  if (typeof task.blocksEvent !== "boolean") errors.blocksEvent = "Choose whether this blocks the event.";

  return errors;
}

export function validatePrepTasks(tasks: PrepTask[], familyMembers: FamilyMember[]) {
  const ids = new Set<string>();
  for (const task of tasks) {
    if (ids.has(task.id)) return "Preparation task IDs must be unique.";
    ids.add(task.id);
    if (Object.keys(validatePrepTask(task, familyMembers)).length > 0) return "One or more preparation tasks need attention.";
  }
  return undefined;
}

export function cleanPrepTask<T extends PrepTaskInput | NewPrepTaskInput>(task: T): T {
  return {
    ...task,
    title: task.title.trim(),
    notes: task.notes?.trim() || undefined,
  };
}
