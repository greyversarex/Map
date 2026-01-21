import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { insertLocationTypeSchema, insertLocationMediaSchema } from "@shared/schema";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import multer from "multer";
import path from "path";
import fs from "fs";

// Local file upload configuration - use absolute path
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
console.log("Uploads directory:", UPLOADS_DIR);

const localUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|webm/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images and videos are allowed'));
  }
});

// Simple admin credentials (set via environment variables)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Simple session-based authentication
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).isAdmin) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Register object storage routes for file uploads (Replit only)
  registerObjectStorageRoutes(app);

  // Serve uploaded files statically
  app.use('/uploads', (await import('express')).static(UPLOADS_DIR));

  // Local file upload endpoint (works on any server)
  app.post("/api/upload", isAuthenticated, localUpload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      res.json({ url: fileUrl, filename: req.file.filename });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  });

  // Simple admin login
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      (req.session as any).isAdmin = true;
      (req.session as any).adminUser = { username };
      return res.json({ success: true, user: { username } });
    }
    
    return res.status(401).json({ message: "Неверный логин или пароль" });
  });

  // Check admin session
  app.get("/api/admin/session", (req, res) => {
    if (req.session && (req.session as any).isAdmin) {
      return res.json({ isAdmin: true, user: (req.session as any).adminUser });
    }
    return res.json({ isAdmin: false });
  });

  // Admin logout
  app.post("/api/admin/logout", (req, res) => {
    req.session?.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ success: true });
    });
  });

  // Locations API
  app.get(api.locations.list.path, async (req, res) => {
    const locations = await storage.getLocations();
    res.json(locations);
  });

  app.get(api.locations.get.path, async (req, res) => {
    const location = await storage.getLocation(Number(req.params.id));
    if (!location) {
      return res.status(404).json({ message: 'Location not found' });
    }
    res.json(location);
  });

  // Protected Routes - require authentication
  app.post(api.locations.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.locations.create.input.parse(req.body);
      const location = await storage.createLocation(input);
      res.status(201).json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.put(api.locations.update.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.locations.update.input.parse(req.body);
      const location = await storage.updateLocation(Number(req.params.id), input);
      if (!location) {
        return res.status(404).json({ message: 'Location not found' });
      }
      res.json(location);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.locations.delete.path, isAuthenticated, async (req, res) => {
    await storage.deleteLocation(Number(req.params.id));
    res.status(204).send();
  });

  // Location Types API
  app.get("/api/location-types", async (req, res) => {
    const types = await storage.getLocationTypes();
    res.json(types);
  });

  app.get("/api/location-types/:id", async (req, res) => {
    const locationType = await storage.getLocationType(Number(req.params.id));
    if (!locationType) {
      return res.status(404).json({ message: "Location type not found" });
    }
    res.json(locationType);
  });

  app.post("/api/location-types", isAuthenticated, async (req, res) => {
    try {
      const input = insertLocationTypeSchema.parse(req.body);
      const locationType = await storage.createLocationType(input);
      res.status(201).json(locationType);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put("/api/location-types/:id", isAuthenticated, async (req, res) => {
    try {
      const input = insertLocationTypeSchema.partial().parse(req.body);
      const locationType = await storage.updateLocationType(Number(req.params.id), input);
      if (!locationType) {
        return res.status(404).json({ message: "Location type not found" });
      }
      res.json(locationType);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete("/api/location-types/:id", isAuthenticated, async (req, res) => {
    await storage.deleteLocationType(Number(req.params.id));
    res.status(204).send();
  });

  // Location Media API
  app.get("/api/locations/:id/media", async (req, res) => {
    const media = await storage.getLocationMedia(Number(req.params.id));
    res.json(media);
  });

  app.post("/api/locations/:id/media", isAuthenticated, async (req, res) => {
    try {
      const locationId = Number(req.params.id);
      const input = insertLocationMediaSchema.omit({ locationId: true }).parse(req.body);
      const media = await storage.createLocationMedia({ ...input, locationId });
      res.status(201).json(media);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.put("/api/media/:id", isAuthenticated, async (req, res) => {
    try {
      const input = insertLocationMediaSchema.partial().parse(req.body);
      const media = await storage.updateLocationMedia(Number(req.params.id), input);
      if (!media) {
        return res.status(404).json({ message: "Media not found" });
      }
      res.json(media);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join("."),
        });
      }
      throw err;
    }
  });

  app.delete("/api/media/:id", isAuthenticated, async (req, res) => {
    await storage.deleteLocationMedia(Number(req.params.id));
    res.status(204).send();
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  // Seed location types if none exist
  const existingTypes = await storage.getLocationTypes();
  if (existingTypes.length === 0) {
    const defaultTypes = [
      { slug: "kmz", name: "КМЗ (Идоракунии асосӣ)", nameRu: "КМЗ (Головное управление)", nameEn: "CEP (Headquarters)", color: "#16a34a", bgColor: "#dcfce7", borderColor: "#22c55e", sortOrder: 0 },
      { slug: "branch", name: "Шуъбаҳо", nameRu: "Филиалы", nameEn: "Branch offices", color: "#6b7280", bgColor: "#f3f4f6", borderColor: "#9ca3af", sortOrder: 1 },
      { slug: "reserve", name: "Мамнунгоҳ", nameRu: "Заповедники", nameEn: "Nature reserves", color: "#059669", bgColor: "#d1fae5", borderColor: "#10b981", sortOrder: 2 },
      { slug: "glacier", name: "Пиряххо", nameRu: "Ледники", nameEn: "Glaciers", color: "#06b6d4", bgColor: "#cffafe", borderColor: "#22d3ee", sortOrder: 3 },
      { slug: "fishery", name: "Моҳипарварӣ", nameRu: "Рыбоводство", nameEn: "Fish farms", color: "#3b82f6", bgColor: "#dbeafe", borderColor: "#60a5fa", sortOrder: 4 },
      { slug: "nursery", name: "Ниҳолхона", nameRu: "Питомники", nameEn: "Tree nurseries", color: "#84cc16", bgColor: "#ecfccb", borderColor: "#a3e635", sortOrder: 5 },
    ];
    for (const type of defaultTypes) {
      await storage.createLocationType(type);
    }
  }

  // Seed locations if none exist
  const existingLocations = await storage.getLocations();
  if (existingLocations.length === 0) {
    await storage.createLocation({
      name: "Dushanbe Flagpole",
      description: "One of the tallest flagpoles in the world, located in the capital city of Dushanbe.",
      lat: 38.5737,
      lng: 68.7864,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Dushanbe_flagpole.jpg/1200px-Dushanbe_flagpole.jpg",
    });
    await storage.createLocation({
      name: "Pamir Highway",
      description: "A scenic high-altitude road traversing the Pamir Mountains.",
      lat: 38.4127,
      lng: 73.9930,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Pamir_Highway_M41.jpg/1200px-Pamir_Highway_M41.jpg",
    });
    await storage.createLocation({
      name: "Iskanderkul Lake",
      description: "A stunning mountain lake named after Alexander the Great.",
      lat: 39.0769,
      lng: 68.3697,
      imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8f/Iskanderkul.jpg/1200px-Iskanderkul.jpg",
    });
  }
}
