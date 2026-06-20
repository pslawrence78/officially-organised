import type { ResourceNeedWithEvent } from "../../domain/types";
import { db } from "../db";

export async function getResourceNeeds(resourceId?: string): Promise<ResourceNeedWithEvent[]> {
  const [events, resources] = await Promise.all([db.events.toArray(), db.resources.toArray()]);
  const resourcesById = new Map(resources.map((resource) => [resource.id, resource]));
  return events
    .flatMap((event) => event.resourceNeeds.map((need) => ({ need, event, resource: resourcesById.get(need.resourceId) })))
    .filter((item): item is ResourceNeedWithEvent => Boolean(item.resource) && (!resourceId || item.need.resourceId === resourceId))
    .sort((a, b) => (a.need.neededFrom ?? a.event.startAt).localeCompare(b.need.neededFrom ?? b.event.startAt));
}
