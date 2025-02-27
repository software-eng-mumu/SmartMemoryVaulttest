import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPhotoSchema, insertAlbumSchema } from "@shared/schema";
import * as fs from 'fs';
import { exec } from 'child_process';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

export async function registerRoutes(app: Express) {
  // Photo routes
  app.get("/api/photos", async (_req, res) => {
    const photos = await storage.getPhotos();
    res.json(photos);
  });

  // Serve photo images
  app.get("/api/photos/:id/image", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid photo ID" });
    }

    const photo = await storage.getPhoto(id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found" });
    }

    res.setHeader('Content-Type', 'image/jpeg');
    res.send(photo.imageData);
  });

  app.get("/api/photos/search", async (req, res) => {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }
    const photos = await storage.searchPhotos(query);
    res.json(photos);
  });

  app.post("/api/photos", upload.single('file'), async (req, res) => {
    try {
      const photoData = JSON.parse(req.body.data);
      const result = insertPhotoSchema.safeParse(photoData);

      if (!result.success) {
        return res.status(400).json({ message: "Invalid photo data" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const photo = await storage.createPhoto({
        ...result.data,
        url: `/api/photos/${result.data.id}/image`
      }, req.file.buffer);

      res.status(201).json(photo);
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ message: "Failed to upload photo" });
    }
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
    const { photos: photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ message: "Invalid photos array" });
    }

    try {
      const tempDir = path.join(process.cwd(), 'temp', `slideshow-${Date.now()}`);
      await fs.promises.mkdir(tempDir, { recursive: true });

      // Create a file list for ffmpeg
      const inputFile = path.join(tempDir, 'input.txt');
      let fileContent = '';

      for (let i = 0; i < photoIds.length; i++) {
        const photo = await storage.getPhoto(parseInt(photoIds[i]));
        if (!photo) continue;

        const photoFile = path.join(tempDir, `photo-${i}.jpg`);
        await fs.promises.writeFile(photoFile, photo.imageData);
        fileContent += `file 'photo-${i}.jpg'\nduration 3\n`;
      }

      await fs.promises.writeFile(inputFile, fileContent);

      // Generate video with ffmpeg
      await new Promise((resolve, reject) => {
        const command = `ffmpeg -f concat -safe 0 -i "${inputFile}" -vf "fade=t=in:st=0:d=1,fade=t=out:st=2:d=1" -pix_fmt yuv420p "${path.join(tempDir, 'output.mp4')}"`;
        exec(command, { cwd: tempDir }, (error) => {
          if (error) {
            console.error('FFmpeg error:', error);
            reject(error);
          } else {
            resolve(null);
          }
        });
      });

      // Send video file
      const video = await fs.promises.readFile(path.join(tempDir, 'output.mp4'));
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename=slideshow.mp4');
      res.send(video);

      // Cleanup
      await fs.promises.rm(tempDir, { recursive: true });
    } catch (error) {
      console.error('Video generation error:', error);
      res.status(500).json({ message: "Failed to generate video" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}