import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPhotoSchema, insertAlbumSchema } from "@shared/schema";

export async function registerRoutes(app: Express) {
  // Photo routes
  app.get("/api/photos", async (_req, res) => {
    const photos = await storage.getPhotos();
    res.json(photos);
  });

  app.get("/api/photos/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }
    const photos = await storage.searchPhotos(query);
    res.json(photos);
  });

  app.post("/api/photos", async (req, res) => {
    const result = insertPhotoSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid photo data" });
    }
    const photo = await storage.createPhoto(result.data);
    res.status(201).json(photo);
  });

  app.delete("/api/photos/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid photo ID" });
    }
    await storage.deletePhoto(id);
    res.status(204).send();
  });

  // Album routes
  app.get("/api/albums", async (_req, res) => {
    const albums = await storage.getAlbums();
    res.json(albums);
  });

  app.get("/api/albums/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid album ID" });
    }
    const album = await storage.getAlbum(id);
    if (!album) {
      return res.status(404).json({ message: "Album not found" });
    }
    const photos = await storage.getPhotosByAlbum(id);
    res.json({ ...album, photos });
  });

  app.post("/api/albums", async (req, res) => {
    const result = insertAlbumSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid album data" });
    }
    const album = await storage.createAlbum(result.data);
    res.status(201).json(album);
  });

  app.delete("/api/albums/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid album ID" });
    }
    await storage.deleteAlbum(id);
    res.status(204).send();
  });

  const httpServer = createServer(app);
  return httpServer;
}
