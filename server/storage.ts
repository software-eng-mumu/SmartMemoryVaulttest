import { Photo, Album, InsertPhoto, InsertAlbum } from "@shared/schema";

export interface IStorage {
  // Photo operations
  getPhotos(): Promise<Photo[]>;
  getPhoto(id: number): Promise<Photo | undefined>;
  getPhotosByAlbum(albumId: number): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
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

  constructor() {
    this.photos = new Map();
    this.albums = new Map();
    this.photoId = 1;
    this.albumId = 1;

    // Add sample photos
    const samplePhotos = [
      "https://images.unsplash.com/photo-1518998053901-5348d3961a04",
      "https://images.unsplash.com/photo-1578496479914-7ef3b0193be3",
      "https://images.unsplash.com/photo-1583912267382-49a82d19bd94",
      "https://images.unsplash.com/photo-1576086476234-1103be98f096",
      "https://images.unsplash.com/photo-1579165466741-7f35e4755660",
      "https://images.unsplash.com/photo-1576669801838-1b1c52121e6a",
      "https://images.unsplash.com/photo-1583911860367-8b9fa77c6f4c",
      "https://images.unsplash.com/photo-1583911860205-72f8ac8ddcbe",
      "https://images.unsplash.com/photo-1576086671120-8cf1f46d1373",
      "https://images.unsplash.com/photo-1578496479939-722d9dd1cc5b"
    ].map((url, i) => ({
      id: i + 1,
      title: `Sample Photo ${i + 1}`,
      description: "A sample photo",
      url,
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

  async createPhoto(photo: InsertPhoto): Promise<Photo> {
    const newPhoto: Photo = {
      ...photo,
      id: this.photoId++,
      createdAt: new Date()
    };
    this.photos.set(newPhoto.id, newPhoto);
    return newPhoto;
  }

  async deletePhoto(id: number): Promise<void> {
    this.photos.delete(id);
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
      createdAt: new Date()
    };
    this.albums.set(newAlbum.id, newAlbum);
    return newAlbum;
  }

  async deleteAlbum(id: number): Promise<void> {
    this.albums.delete(id);
    // Remove album reference from photos
    for (const photo of this.photos.values()) {
      if (photo.albumId === id) {
        this.photos.set(photo.id, { ...photo, albumId: null });
      }
    }
  }
}

export const storage = new MemStorage();
