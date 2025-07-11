import { desc, eq } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'

export const getRoomQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.get(
    '/rooms/:roomId/questions',
    {
      schema: {
        params: z.object({
          roomId: z.string().min(1)
        }),
        response: {
          200: z.object({
            questions: z.array(
              z.object({
                id: z.string(),
                question: z.string().nullable(),
                answer: z.string().nullable(),
                createdAt: z.coerce.date()
              })
            )
          })
        }
      }
    },
    async (req) => {
      const { roomId } = req.params

      const results = await db
        .select({
          id: schema.questions.id,
          question: schema.questions.question,
          answer: schema.questions.answer,
          createdAt: schema.questions.createdAt
        })
        .from(schema.questions)
        .where(eq(schema.questions.roomId, roomId))
        .orderBy(desc(schema.questions.createdAt))

      return {
        questions: results
      }
    }
  )
}
