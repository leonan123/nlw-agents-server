import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { rooms } from './rooms.ts'

export const questions = pgTable('questions', {
  id: uuid().defaultRandom().primaryKey(),
  roomId: uuid()
    .references(() => rooms.id)
    .notNull(),
  question: text().notNull(),
  answer: text(),
  createdAt: timestamp().notNull().defaultNow(),
  updatedAt: timestamp().notNull().defaultNow()
})
