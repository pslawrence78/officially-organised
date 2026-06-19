import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { db } from "../db";
import { seedInitialDataIfNeeded } from "./appRepository";
import { createPlace, deletePlace, getPlaceById, getPlaces, updatePlace } from "./placeRepository";

describe("place repository", () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
    await seedInitialDataIfNeeded();
  });

  afterEach(async () => {
    await db.delete();
  });

  it("creates, lists and reads a place", async () => {
    const created = await createPlace({ name: "Lichfield Leisure Centre", placeType: "club", postcode: "WS13" });
    expect(await getPlaces()).toEqual([created]);
    await expect(getPlaceById(created.id)).resolves.toEqual(created);
  });

  it("updates and deletes a place", async () => {
    const created = await createPlace({ name: "Pool", placeType: "club" });
    const updated = await updatePlace(created.id, { name: "Leisure Centre", postcode: "WS13" });
    expect(updated).toMatchObject({ name: "Leisure Centre", postcode: "WS13" });
    await deletePlace(created.id);
    await expect(getPlaceById(created.id)).resolves.toBeUndefined();
  });
});
