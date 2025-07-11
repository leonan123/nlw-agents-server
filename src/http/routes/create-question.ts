import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/questions',
    {
      schema: {
        params: z.object({
          roomId: z.string().min(1)
        }),
        body: z.object({
          question: z.string().min(1)
        }),
        response: {
          201: z.object({
            questionId: z.string()
          })
        }
      }
    },
    async (req, reply) => {
      const { roomId } = req.params
      const { question } = req.body

      const [createdQuestion] = await db
        .insert(schema.questions)
        .values({
          roomId,
          question
        })
        .returning()

      if (!createdQuestion) {
        throw new Error('Failed to create question.')
      }

      reply.status(201).send({
        questionId: createdQuestion.id
      })
    }
  )
}
