import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Location types
export const LOCATION_TYPES = {
  kmz: "kmz",           // КМЗ - Кумитаи Мухити Зист (головное управление)
  branch: "branch",     // Шуъбахо - филиалы
  reserve: "reserve",   // Мамнунгох - заповедники
  glacier: "glacier",   // Пиряххо - ледники
  fishery: "fishery",   // Мохипарвари - рыбоводство
  nursery: "nursery",   // Нихолхона - питомники
} as const;

export type LocationType = typeof LOCATION_TYPES[keyof typeof LOCATION_TYPES];

// === TABLE DEFINITIONS ===
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  descriptionEn: text("description_en"),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  locationType: text("location_type").default("kmz"),
  foundedYear: integer("founded_year"),
  workerCount: integer("worker_count"),
  area: text("area"),
  createdAt: timestamp("created_at").defaultNow(),
});

// === BASE SCHEMAS ===
export const insertLocationSchema = createInsertSchema(locations).omit({ 
  id: true, 
  createdAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type CreateLocationRequest = InsertLocation;
export type UpdateLocationRequest = Partial<InsertLocation>;

export type LocationResponse = Location;
export type LocationsListResponse = Location[];
