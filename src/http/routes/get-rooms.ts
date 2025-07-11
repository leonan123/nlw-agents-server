import { count, eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'

export const getRoomsRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/rooms',
    {
      schema: {
        response: {
          200: z.object({
            rooms: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                createdAt: z.coerce.date(),
                questionsCount: z.number()
              })
            )
          })
        }
      }
    },
    async () => {
      const results = await db
        .select({
          id: schema.rooms.id,
          name: schema.rooms.name,
          createdAt: schema.rooms.createdAt,
          questionsCount: count(schema.questions.id)
        })
        .from(schema.rooms)
        .leftJoin(
          schema.questions,
          eq(schema.rooms.id, schema.questions.roomId)
        )
        .groupBy(schema.rooms.id)
        .orderBy(schema.rooms.createdAt)

      return {
        rooms: results
      }
    }
  )
}
