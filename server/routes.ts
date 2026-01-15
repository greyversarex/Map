import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Auth
  await setupAuth(app);
  registerAuthRoutes(app);

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
