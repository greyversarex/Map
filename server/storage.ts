import { db } from "./db";
import {
  locations,
  type CreateLocationRequest,
  type UpdateLocationRequest,
  type LocationResponse
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  getLocations(): Promise<LocationResponse[]>;
  getLocation(id: number): Promise<LocationResponse | undefined>;
  createLocation(location: CreateLocationRequest): Promise<LocationResponse>;
  updateLocation(id: number, updates: UpdateLocationRequest): Promise<LocationResponse>;
  deleteLocation(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Auth Storage Implementation
  getUser = authStorage.getUser;
  upsertUser = authStorage.upsertUser;

  // Location Storage Implementation
  async getLocations(): Promise<LocationResponse[]> {
    return await db.select().from(locations);
  }

  async getLocation(id: number): Promise<LocationResponse | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async createLocation(location: CreateLocationRequest): Promise<LocationResponse> {
    const [newLocation] = await db.insert(locations).values(location).returning();
    return newLocation;
  }

  async updateLocation(id: number, updates: UpdateLocationRequest): Promise<LocationResponse> {
    const [updated] = await db
      .update(locations)
      .set(updates)
      .where(eq(locations.id, id))
      .returning();
    return updated;
  }

  async deleteLocation(id: number): Promise<void> {
    await db.delete(locations).where(eq(locations.id, id));
  }
}

export const storage = new DatabaseStorage();
