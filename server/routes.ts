import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPhotoSchema, insertAlbumSchema } from "@shared/schema";
import * as fs from 'fs';
import { exec } from 'child_process';
import fetch from 'node-fetch';

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

  app.post("/api/generate-video", async (req, res) => {
    const { photos } = req.body;

    if (!Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ message: "Invalid photos array" });
    }

    try {
      const tempDir = `/tmp/slideshow-${Date.now()}`;
      await fs.promises.mkdir(tempDir, { recursive: true });

      for (let i = 0; i < photos.length; i++) {
        const response = await fetch(photos[i]);
        const buffer = await response.buffer();
        await fs.promises.writeFile(`${tempDir}/photo-${i}.jpg`, buffer);
      }

      const inputFile = `${tempDir}/input.txt`;
      const fileContent = photos.map((_, i) =>
        `file 'photo-${i}.jpg'\nduration 3`
      ).join('\n');
      await fs.promises.writeFile(inputFile, fileContent);

      await new Promise((resolve, reject) => {
        exec(
          `ffmpeg -f concat -safe 0 -i ${inputFile} -vf "fade=t=in:st=0:d=1,fade=t=out:st=2:d=1" -pix_fmt yuv420p ${tempDir}/output.mp4`,
          (error) => {
            if (error) reject(error);
            else resolve(null);
          }
        );
      });

      const video = await fs.promises.readFile(`${tempDir}/output.mp4`);
      res.setHeader('Content-Type', 'video/mp4');
      res.send(video);

      await fs.promises.rm(tempDir, { recursive: true });
    } catch (error) {
      console.error('Video generation error:', error);
      res.status(500).json({ message: "Failed to generate video" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}