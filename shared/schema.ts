import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// Default location types (for fallback/seed)
export const DEFAULT_LOCATION_TYPES = {
  kmz: "kmz",
  branch: "branch",
  reserve: "reserve",
  glacier: "glacier",
  fishery: "fishery",
  nursery: "nursery",
} as const;

// === TABLE DEFINITIONS ===

// Marker effect options
export const MARKER_EFFECTS = {
  none: { label: "Без эффекта", labelEn: "No effect" },
  pulse: { label: "Пульсация", labelEn: "Pulse" },
  ring: { label: "Расходящиеся круги", labelEn: "Expanding rings" },
  ringSlow: { label: "Медленные круги", labelEn: "Slow rings" },
  glow: { label: "Свечение", labelEn: "Glow" },
  frost: { label: "Мерцание", labelEn: "Shimmer" },
} as const;

// Location Types table - user-manageable types with custom icons
export const locationTypes = pgTable("location_types", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  nameRu: text("name_ru"),
  nameEn: text("name_en"),
  iconUrl: text("icon_url"),
  color: text("color").default("#22c55e"),
  bgColor: text("bg_color").default("#dcfce7"),
  borderColor: text("border_color").default("#22c55e"),
  markerEffect: text("marker_effect").default("pulse"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Location Media table - multiple photos/videos per location
export const locationMedia = pgTable("location_media", {
  id: serial("id").primaryKey(),
  locationId: integer("location_id").notNull(),
  mediaType: text("media_type").notNull(), // 'photo' or 'video'
  url: text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption: text("caption"),
  sortOrder: integer("sort_order").default(0),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Locations table
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
  locationTypeId: integer("location_type_id"),
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

export const insertLocationTypeSchema = createInsertSchema(locationTypes).omit({
  id: true,
  createdAt: true,
});

export const insertLocationMediaSchema = createInsertSchema(locationMedia).omit({
  id: true,
  createdAt: true,
});

// === EXPLICIT API CONTRACT TYPES ===
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;

export type LocationType = typeof locationTypes.$inferSelect;
export type InsertLocationType = z.infer<typeof insertLocationTypeSchema>;

export type LocationMedia = typeof locationMedia.$inferSelect;
export type InsertLocationMedia = z.infer<typeof insertLocationMediaSchema>;

export type CreateLocationRequest = InsertLocation;
export type UpdateLocationRequest = Partial<InsertLocation>;

export type CreateLocationTypeRequest = InsertLocationType;
export type UpdateLocationTypeRequest = Partial<InsertLocationType>;

export type CreateLocationMediaRequest = InsertLocationMedia;

export type LocationResponse = Location;
export type LocationsListResponse = Location[];
export type LocationTypeResponse = LocationType;
export type LocationTypesListResponse = LocationType[];
export type LocationMediaResponse = LocationMedia;
export type LocationMediaListResponse = LocationMedia[];

// Books/Documents table
export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleRu: text("title_ru"),
  titleEn: text("title_en"),
  author: text("author"),
  description: text("description"),
  descriptionRu: text("description_ru"),
  descriptionEn: text("description_en"),
  coverUrl: text("cover_url"),
  documentUrl: text("document_url"),
  category: text("category").default("general"),
  year: integer("year"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertBookSchema = createInsertSchema(books).omit({
  id: true,
  createdAt: true,
});

export type Book = typeof books.$inferSelect;
export type InsertBook = z.infer<typeof insertBookSchema>;
export type CreateBookRequest = InsertBook;
export type UpdateBookRequest = Partial<InsertBook>;
export type BookResponse = Book;
export type BooksListResponse = Book[];
