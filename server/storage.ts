import { db } from "./db";
import {
  locations,
  locationTypes,
  locationMedia,
  type CreateLocationRequest,
  type UpdateLocationRequest,
  type LocationResponse,
  type CreateLocationTypeRequest,
  type UpdateLocationTypeRequest,
  type LocationTypeResponse,
  type CreateLocationMediaRequest,
  type LocationMediaResponse,
} from "@shared/schema";
import { eq, asc } from "drizzle-orm";
import { authStorage, type IAuthStorage } from "./replit_integrations/auth/storage";

export interface IStorage extends IAuthStorage {
  // Locations
  getLocations(): Promise<LocationResponse[]>;
  getLocation(id: number): Promise<LocationResponse | undefined>;
  createLocation(location: CreateLocationRequest): Promise<LocationResponse>;
  updateLocation(id: number, updates: UpdateLocationRequest): Promise<LocationResponse>;
  deleteLocation(id: number): Promise<void>;
  
  // Location Types
  getLocationTypes(): Promise<LocationTypeResponse[]>;
  getLocationType(id: number): Promise<LocationTypeResponse | undefined>;
  getLocationTypeBySlug(slug: string): Promise<LocationTypeResponse | undefined>;
  createLocationType(locationType: CreateLocationTypeRequest): Promise<LocationTypeResponse>;
  updateLocationType(id: number, updates: UpdateLocationTypeRequest): Promise<LocationTypeResponse>;
  deleteLocationType(id: number): Promise<void>;
  
  // Location Media
  getLocationMedia(locationId: number): Promise<LocationMediaResponse[]>;
  createLocationMedia(media: CreateLocationMediaRequest): Promise<LocationMediaResponse>;
  updateLocationMedia(id: number, updates: Partial<CreateLocationMediaRequest>): Promise<LocationMediaResponse>;
  deleteLocationMedia(id: number): Promise<void>;
  deleteLocationMediaByLocationId(locationId: number): Promise<void>;
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
    await this.deleteLocationMediaByLocationId(id);
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Location Types Storage Implementation
  async getLocationTypes(): Promise<LocationTypeResponse[]> {
    return await db.select().from(locationTypes).orderBy(asc(locationTypes.sortOrder));
  }

  async getLocationType(id: number): Promise<LocationTypeResponse | undefined> {
    const [locationType] = await db.select().from(locationTypes).where(eq(locationTypes.id, id));
    return locationType;
  }

  async getLocationTypeBySlug(slug: string): Promise<LocationTypeResponse | undefined> {
    const [locationType] = await db.select().from(locationTypes).where(eq(locationTypes.slug, slug));
    return locationType;
  }

  async createLocationType(locationType: CreateLocationTypeRequest): Promise<LocationTypeResponse> {
    const [newType] = await db.insert(locationTypes).values(locationType).returning();
    return newType;
  }

  async updateLocationType(id: number, updates: UpdateLocationTypeRequest): Promise<LocationTypeResponse> {
    const [updated] = await db
      .update(locationTypes)
      .set(updates)
      .where(eq(locationTypes.id, id))
      .returning();
    return updated;
  }

  async deleteLocationType(id: number): Promise<void> {
    await db.delete(locationTypes).where(eq(locationTypes.id, id));
  }

  // Location Media Storage Implementation
  async getLocationMedia(locationId: number): Promise<LocationMediaResponse[]> {
    return await db
      .select()
      .from(locationMedia)
      .where(eq(locationMedia.locationId, locationId))
      .orderBy(asc(locationMedia.sortOrder));
  }

  async createLocationMedia(media: CreateLocationMediaRequest): Promise<LocationMediaResponse> {
    const [newMedia] = await db.insert(locationMedia).values(media).returning();
    return newMedia;
  }

  async updateLocationMedia(id: number, updates: Partial<CreateLocationMediaRequest>): Promise<LocationMediaResponse> {
    const [updated] = await db
      .update(locationMedia)
      .set(updates)
      .where(eq(locationMedia.id, id))
      .returning();
    return updated;
  }

  async deleteLocationMedia(id: number): Promise<void> {
    await db.delete(locationMedia).where(eq(locationMedia.id, id));
  }

  async deleteLocationMediaByLocationId(locationId: number): Promise<void> {
    await db.delete(locationMedia).where(eq(locationMedia.locationId, locationId));
  }
}

export const storage = new DatabaseStorage();
