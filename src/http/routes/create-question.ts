import { and, eq, sql } from 'drizzle-orm'
import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'
import { generateAnswer, generateEmbeddings } from '../../services/gemini.ts'

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
            questionId: z.string(),
            answer: z.string().nullable()
          })
        }
      }
    },
    async (req, reply) => {
      const { roomId } = req.params
      const { question } = req.body

      const embeddings = await generateEmbeddings(question)
      const embeddingsAsString = `[${embeddings.join(',')}]`

      const chunks = await db
        .select({
          id: schema.audioChunks.id,
          transcription: schema.audioChunks.transcription,
          similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`
        })
        .from(schema.audioChunks)
        .where(
          and(
            eq(schema.audioChunks.roomId, roomId),
            sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > 0.7`
          )
        )
        .orderBy(
          sql`(${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`
        )
        .limit(3)

      let answer: string | null = null

      if (chunks.length > 0) {
        const transcriptions = chunks.map((chunk) => chunk.transcription)

        answer = await generateAnswer(question, transcriptions)
      }

      const [createdQuestion] = await db
        .insert(schema.questions)
        .values({
          roomId,
          question,
          answer
        })
        .returning()

      if (!createdQuestion) {
        throw new Error('Failed to create question.')
      }

      reply.status(201).send({
        questionId: createdQuestion.id,
        answer
      })
    }
  )
}
