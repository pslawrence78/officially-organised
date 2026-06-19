import type { Place, PlaceInput, PlaceUpdates } from "../../domain/types";
import { PLACE_TYPES } from "../../domain/constants";
import { createId } from "../../utils/ids";
import { db } from "../db";

export type PlaceValidationErrors = Record<string, string>;

export function validatePlaceInput(input: PlaceInput): PlaceValidationErrors {
  const errors: PlaceValidationErrors = {};
  if (!input.name.trim()) errors.name = "Give the place a name.";
  if (!PLACE_TYPES.includes(input.placeType)) errors.placeType = "Choose a valid place type.";
  if (input.defaultTravelMinutes !== undefined && (!Number.isFinite(input.defaultTravelMinutes) || input.defaultTravelMinutes < 0)) {
    errors.defaultTravelMinutes = "Enter a valid travel time of zero or more minutes.";
  }
  return errors;
}

function cleanPlaceInput(input: PlaceInput): PlaceInput {
  return {
    ...input,
    name: input.name.trim(),
    address: input.address?.trim() || undefined,
    postcode: input.postcode?.trim() || undefined,
    travelNotes: input.travelNotes?.trim() || undefined,
    parkingNotes: input.parkingNotes?.trim() || undefined,
  };
}

export async function createPlace(input: PlaceInput): Promise<Place> {
  const errors = validatePlaceInput(input);
  if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0]);
  const timestamp = new Date().toISOString();
  const place: Place = {
    ...cleanPlaceInput(input),
    id: createId("place"),
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  await db.transaction("rw", [db.places, db.auditLog], async () => {
    await db.places.add(place);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "place",
      entityId: place.id,
      action: "created",
      timestamp,
      summary: `Created ${place.name}`,
    });
  });
  return place;
}

export async function updatePlace(id: string, updates: PlaceUpdates): Promise<Place> {
  const existing = await db.places.get(id);
  if (!existing) throw new Error("Place not found");
  const input: PlaceInput = {
    name: updates.name ?? existing.name,
    placeType: updates.placeType ?? existing.placeType,
    address: "address" in updates ? updates.address : existing.address,
    postcode: "postcode" in updates ? updates.postcode : existing.postcode,
    defaultTravelMinutes: "defaultTravelMinutes" in updates ? updates.defaultTravelMinutes : existing.defaultTravelMinutes,
    travelNotes: "travelNotes" in updates ? updates.travelNotes : existing.travelNotes,
    parkingNotes: "parkingNotes" in updates ? updates.parkingNotes : existing.parkingNotes,
  };
  const errors = validatePlaceInput(input);
  if (Object.keys(errors).length > 0) throw new Error(Object.values(errors)[0]);

  const timestamp = new Date().toISOString();
  const place: Place = { ...existing, ...cleanPlaceInput(input), updatedAt: timestamp };
  await db.transaction("rw", [db.places, db.auditLog], async () => {
    await db.places.put(place);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "place",
      entityId: id,
      action: "updated",
      timestamp,
      summary: `Updated ${place.name}`,
    });
  });
  return place;
}

export async function deletePlace(id: string): Promise<void> {
  const existing = await db.places.get(id);
  if (!existing) return;
  const timestamp = new Date().toISOString();
  await db.transaction("rw", [db.places, db.auditLog], async () => {
    await db.places.delete(id);
    await db.auditLog.add({
      id: createId("audit"),
      entityType: "place",
      entityId: id,
      action: "deleted",
      timestamp,
      summary: `Deleted ${existing.name}`,
    });
  });
}

export async function getPlaceById(id: string) {
  return db.places.get(id);
}

export async function getPlaces() {
  return db.places.orderBy("name").toArray();
}
