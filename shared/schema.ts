import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { type BinaryDataType } from 'drizzle-orm/pg-core';
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define bytea since it's not exported directly
const bytea: () => BinaryDataType = () => ({
  dataType: () => 'bytea',
  enumValues: undefined,
  notNull: false,
});

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  imageData: bytea().notNull(),
  tags: text("tags").array().notNull(),
  albumId: integer("album_id").references(() => albums.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const albums = pgTable("albums", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPhotoSchema = createInsertSchema(photos).omit({ 
  id: true,
  createdAt: true,
  imageData: true
});

export const insertAlbumSchema = createInsertSchema(albums).omit({ 
  id: true,
  createdAt: true 
});

export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type Album = typeof albums.$inferSelect;
export type InsertAlbum = z.infer<typeof insertAlbumSchema>;