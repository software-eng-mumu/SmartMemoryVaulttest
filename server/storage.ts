import { Photo, Album, InsertPhoto, InsertAlbum, photos, albums } from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike } from "drizzle-orm";
import fetch from "node-fetch";

export interface IStorage {
  // Photo operations
  getPhotos(): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByAlbum(albumId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto, file: Buffer): Promise<Photo>;
  deletePhoto(id: number): Promise<void>;
  searchPhotos(query: string): Promise<Photo[]>;

  // Album operations
  getAlbums(): Promise<Album[]>;
  getAlbum(id: number): Promise<Album | undefined>;
  createAlbum(album: InsertAlbum): Promise<Album>;
  deleteAlbum(id: number): Promise<void>;

  // Sample data
  initializeSamplePhotos(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async initializeSamplePhotos(): Promise<void> {
    console.log('正在检查示例照片...');
    const samplePhotos = [
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04",
      "https://images.unsplash.com/photo-1578496479914-7ef3b0193be3",
      "https://images.unsplash.com/photo-1583912267382-49a82d19bd94",
      "https://images.unsplash.com/photo-1576086476234-1103be98f096",
    ];

    try {
      const existingPhotos = await this.getPhotos();
      if (existingPhotos.length === 0) {
        console.log('未找到照片，开始下载示例...');
        for (let i = 0; i < samplePhotos.length; i++) {
          try {
            const response = await fetch(samplePhotos[i]);
            const buffer = await response.buffer();

            await this.createPhoto({
              title: `示例照片 ${i + 1}`,
              description: "一张示例照片",
              url: `/api/photos/${i + 1}/image`,
              tags: ["示例"],
              albumId: null,
            }, buffer);
            console.log(`示例照片 ${i + 1} 已下载并保存`);
          } catch (error) {
            console.error(`下载示例照片 ${i + 1} 失败:`, error);
          }
        }
      }
    } catch (error) {
      console.error('初始化示例照片时出错:', error);
    }
  }

  async getPhotos(): Promise<Photo[]> {
    return await db.select().from(photos).orderBy(desc(photos.createdAt));
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo;
  }

  async getPhotosByAlbum(albumId: number): Promise<Photo[]> {
    return await db.select().from(photos).where(eq(photos.albumId, albumId));
  }

  async createPhoto(photo: InsertPhoto, file: Buffer): Promise<Photo> {
    const [newPhoto] = await db.insert(photos).values({
      title: photo.title,
      description: photo.description,
      url: photo.url,
      tags: photo.tags,
      albumId: photo.albumId,
      imageData: file
    }).returning();
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<void> {
    await db.delete(photos).where(eq(photos.id, id));
  }

  async searchPhotos(query: string): Promise<Photo[]> {
    const lowercaseQuery = query.toLowerCase();
    return await db.select()
      .from(photos)
      .where(ilike(photos.title, `%${lowercaseQuery}%`));
  }

  async getAlbums(): Promise<Album[]> {
    return await db.select().from(albums);
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album;
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const [newAlbum] = await db.insert(albums).values(album).returning();
    return newAlbum;
  }

  async deleteAlbum(id: number): Promise<void> {
    // First update all photos in this album to have no album
    await db.update(photos)
      .set({ albumId: null })
      .where(eq(photos.albumId, id));

    // Then delete the album
    await db.delete(albums).where(eq(albums.id, id));
  }
}

export const storage = new DatabaseStorage();