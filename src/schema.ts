import { check, foreignKey, integer, jsonb, pgTable, primaryKey, text } from "drizzle-orm/pg-core";
import { defineRelations, sql } from "drizzle-orm";
import type { ChapterContentElement } from "./types.ts";

export const novelTable = pgTable(
  "novel",
  {
    id: integer().notNull(),
    name: text().notNull(),
  },
  (table) => [primaryKey({ columns: [table.id] }), check("chk_id", sql`${table.id} >= 0`)],
);

export const volumeTable = pgTable(
  "volume",
  {
    id: integer().notNull(),
    novelId: integer("novel_id").notNull(),
    no: integer().notNull(),
    name: text().notNull(),
    cover: text().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.novelId] }),
    foreignKey({ columns: [table.novelId], foreignColumns: [novelTable.id] })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check("chk_id", sql`${table.id} >= 0`),
    check("chk_novel_id", sql`${table.novelId} >= 0`),
    check("chk_no", sql`${table.no} >= 0`),
  ],
);

export const chapterTable = pgTable(
  "chapter",
  {
    id: integer().notNull(),
    volumeId: integer("volume_id").notNull(),
    novelId: integer("novel_id").notNull(),
    no: integer().notNull(),
    name: text().notNull(),
    content: jsonb().notNull().default([]).$type<ChapterContentElement[]>(),
  },
  (table) => [
    primaryKey({ columns: [table.id, table.volumeId, table.novelId] }),
    foreignKey({
      columns: [table.volumeId, table.novelId],
      foreignColumns: [volumeTable.id, volumeTable.novelId],
    })
      .onDelete("cascade")
      .onUpdate("cascade"),
    check("chk_id", sql`${table.id} >= 0`),
    check("chk_volume_id", sql`${table.volumeId} >= 0`),
    check("chk_novel_id", sql`${table.novelId} >= 0`),
    check("chk_no", sql`${table.no} >= 0`),
  ],
);

export const relations = defineRelations({ novelTable, volumeTable, chapterTable }, (r) => ({
  novelTable: {
    volumes: r.many.volumeTable({
      from: r.novelTable.id,
      to: r.volumeTable.novelId,
    }),
  },
  volumeTable: {
    novel: r.one.novelTable({
      from: r.volumeTable.novelId,
      to: r.novelTable.id,
    }),
    chapters: r.many.chapterTable({
      from: [r.volumeTable.id, r.volumeTable.novelId],
      to: [r.chapterTable.volumeId, r.chapterTable.novelId],
    }),
  },
  chapterTable: {
    volume: r.one.volumeTable({
      from: [r.chapterTable.volumeId, r.chapterTable.novelId],
      to: [r.volumeTable.id, r.volumeTable.novelId],
    }),
  },
}));
