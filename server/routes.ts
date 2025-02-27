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
  console.log('开始初始化应用...');

  try {
    // 初始化示例照片
    console.log('开始初始化示例照片...');
    await storage.initializeSamplePhotos();
    console.log('示例照片初始化完成');
  } catch (error) {
    console.error('初始化示例照片时出错:', error);
    // 继续启动应用，不要因为示例数据初始化失败而中断启动
  }

  // Photo routes
  app.get("/api/photos", async (_req, res) => {
    try {
      const photos = await storage.getPhotos();
      res.json(photos);
    } catch (error) {
      console.error('获取照片列表时出错:', error);
      res.status(500).json({ message: "获取照片列表失败" });
    }
  });

  // Serve photo images
  app.get("/api/photos/:id/image", async (req, res) => {
    try {
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
    } catch (error) {
      console.error('获取照片图片时出错:', error);
      res.status(500).json({ message: "获取照片图片失败" });
    }
  });

  app.get("/api/photos/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query required" });
      }
      const photos = await storage.searchPhotos(query);
      res.json(photos);
    } catch (error) {
      console.error('搜索照片时出错:', error);
      res.status(500).json({ message: "搜索照片失败" });
    }
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
      console.error('上传照片时出错:', error);
      res.status(500).json({ message: "上传照片失败" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid photo ID" });
      }
      await storage.deletePhoto(id);
      res.status(204).send();
    } catch (error) {
      console.error('删除照片时出错:', error);
      res.status(500).json({ message: "删除照片失败" });
    }
  });

  // Album routes
  app.get("/api/albums", async (_req, res) => {
    try {
      const albums = await storage.getAlbums();
      res.json(albums);
    } catch (error) {
      console.error('获取相册列表时出错:', error);
      res.status(500).json({ message: "获取相册列表失败" });
    }
  });

  app.get("/api/albums/:id", async (req, res) => {
    try {
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
    } catch (error) {
      console.error('获取相册详情时出错:', error);
      res.status(500).json({ message: "获取相册详情失败" });
    }
  });

  app.post("/api/albums", async (req, res) => {
    try {
      const result = insertAlbumSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid album data" });
      }
      const album = await storage.createAlbum(result.data);
      res.status(201).json(album);
    } catch (error) {
      console.error('创建相册时出错:', error);
      res.status(500).json({ message: "创建相册失败" });
    }
  });

  app.delete("/api/albums/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid album ID" });
      }
      await storage.deleteAlbum(id);
      res.status(204).send();
    } catch (error) {
      console.error('删除相册时出错:', error);
      res.status(500).json({ message: "删除相册失败" });
    }
  });

  app.post("/api/generate-video", async (req, res) => {
    const { photos: photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ message: "无效的照片数组" });
    }

    try {
      console.log('开始为以下照片生成视频:', photoIds);
      const tempDir = path.join(process.cwd(), 'temp', `slideshow-${Date.now()}`);
      await fs.promises.mkdir(tempDir, { recursive: true });
      console.log('创建临时目录:', tempDir);

      // Create a file list for ffmpeg
      const inputFile = path.join(tempDir, 'input.txt');
      let fileContent = '';

      for (let i = 0; i < photoIds.length; i++) {
        const photo = await storage.getPhoto(parseInt(photoIds[i]));
        if (!photo) {
          console.error(`未找到ID为 ${photoIds[i]} 的照片`);
          continue;
        }

        const photoFile = path.join(tempDir, `photo-${i}.jpg`);
        await fs.promises.writeFile(photoFile, photo.imageData);
        fileContent += `file 'photo-${i}.jpg'\nduration 3\n`;
        console.log(`已保存照片 ${i + 1}/${photoIds.length}`);
      }

      await fs.promises.writeFile(inputFile, fileContent);
      console.log('已创建ffmpeg输入文件');

      // Generate video with ffmpeg
      const outputPath = path.join(tempDir, 'output.mp4');
      console.log('开始生成视频...');

      await new Promise((resolve, reject) => {
        const command = `ffmpeg -f concat -safe 0 -i "${inputFile}" -vf "fade=t=in:st=0:d=1,fade=t=out:st=2:d=1" -pix_fmt yuv420p "${outputPath}"`;
        console.log('执行ffmpeg命令:', command);

        exec(command, { cwd: tempDir }, (error, stdout, stderr) => {
          if (error) {
            console.error('FFmpeg错误:', error);
            console.error('FFmpeg stderr:', stderr);
            reject(error);
          } else {
            console.log('FFmpeg stdout:', stdout);
            resolve(null);
          }
        });
      });

      console.log('视频生成完成，准备发送');
      const video = await fs.promises.readFile(outputPath);
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename=slideshow.mp4');
      res.send(video);

      // Cleanup
      await fs.promises.rm(tempDir, { recursive: true });
      console.log('清理临时文件完成');
    } catch (error) {
      console.error('视频生成错误:', error);
      res.status(500).json({ message: "生成视频失败" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}