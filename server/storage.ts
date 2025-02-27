import { Photo, Album, InsertPhoto, InsertAlbum } from "@shared/schema";
import * as fs from 'fs';
import * as path from 'path';

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
}

export class MemStorage implements IStorage {
  private photos: Map<number, Photo>;
  private albums: Map<number, Album>;
  private photoId: number;
  private albumId: number;
  private uploadDir: string;

  constructor() {
    this.photos = new Map();
    this.albums = new Map();
    this.photoId = 1;
    this.albumId = 1;
    this.uploadDir = path.join(process.cwd(), 'uploads');

    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }

    // Add sample photos
    const samplePhotos: Photo[] = [
      "sample1.jpg",
      "sample2.jpg",
      "sample3.jpg",
      "sample4.jpg",
      "sample5.jpg",
      "sample6.jpg",
      "sample7.jpg",
      "sample8.jpg",
      "sample9.jpg",
      "sample10.jpg"
    ].map((filename, i) => ({
      id: i + 1,
      title: `Sample Photo ${i + 1}`,
      description: "A sample photo",
      url: `/uploads/${filename}`,
      tags: ["sample"],
      albumId: null,
      createdAt: new Date()
    }));

    samplePhotos.forEach(photo => this.photos.set(photo.id, photo));
    this.photoId = samplePhotos.length + 1;
  }

  async getPhotos(): Promise<Photo[]> {
    return Array.from(this.photos.values());
  }

  async getPhoto(id: number): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async getPhotosByAlbum(albumId: number): Promise<Photo[]> {
    return Array.from(this.photos.values()).filter(p => p.albumId === albumId);
  }

  async createPhoto(photo: InsertPhoto, file: Buffer): Promise<Photo> {
    const filename = `photo-${Date.now()}.jpg`;
    const filepath = path.join(this.uploadDir, filename);

    // Save file to disk
    await fs.promises.writeFile(filepath, file);

    const newPhoto: Photo = {
      ...photo,
      id: this.photoId++,
      url: `/uploads/${filename}`,
      createdAt: new Date(),
      description: photo.description || null
    };

    this.photos.set(newPhoto.id, newPhoto);
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<void> {
    const photo = this.photos.get(id);
    if (photo) {
      // Delete file from disk
      const filename = photo.url.split('/').pop();
      if (filename) {
        const filepath = path.join(this.uploadDir, filename);
        if (fs.existsSync(filepath)) {
          await fs.promises.unlink(filepath);
        }
      }
      this.photos.delete(id);
    }
  }

  async searchPhotos(query: string): Promise<Photo[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.photos.values()).filter(photo => 
      photo.title.toLowerCase().includes(lowercaseQuery) ||
      photo.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    );
  }

  async getAlbums(): Promise<Album[]> {
    return Array.from(this.albums.values());
  }

  async getAlbum(id: number): Promise<Album | undefined> {
    return this.albums.get(id);
  }

  async createAlbum(album: InsertAlbum): Promise<Album> {
    const newAlbum: Album = {
      ...album,
      id: this.albumId++,
      createdAt: new Date(),
      description: album.description || null
    };
    this.albums.set(newAlbum.id, newAlbum);
    return newAlbum;
  }

  async deleteAlbum(id: number): Promise<void> {
    this.albums.delete(id);
    // Remove album reference from photos
    for (const photo of this.photos.values()) {
      if (photo.albumId === id) {
        const updatedPhoto = { ...photo, albumId: null };
        this.photos.set(photo.id, updatedPhoto);
      }
    }
  }
}

export const storage = new MemStorage();