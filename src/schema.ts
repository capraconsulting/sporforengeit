import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const thread = sqliteTable("thread", {
    id: text("id").primaryKey(),
    authorId: text('author_id').notNull(),
    content: text("content").notNull(),
    channelId: text("channel_id").notNull()
})