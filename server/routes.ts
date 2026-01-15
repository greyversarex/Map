import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import multer from "multer";
import path from "path";
import fs from "fs";

// Local file upload configuration
const UPLOADS_DIR = process.env.UPLOADS_DIR || "./uploads";

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

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

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
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
