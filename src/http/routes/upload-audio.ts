import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'
import { generateEmbeddings, transcribeAudio } from '../../services/gemini.ts'

export const uploadAudioRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/audio',
    {
      schema: {
        params: z.object({
          roomId: z.string().min(1)
        })
      }
    },
    async (req, reply) => {
      const { roomId } = req.params
      const audio = await req.file()

      if (!audio) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Missing audio file'
        })
      }

      const audioBuffer = await audio.toBuffer()
      const audioAsBase64 = audioBuffer.toString('base64')
      const transcription = await transcribeAudio(audioAsBase64, audio.mimetype)
      const embeddings = await generateEmbeddings(transcription)

      const [chunk] = await db
        .insert(schema.audioChunks)
        .values({
          roomId,
          transcription,
          embeddings
        })
        .returning()

      if (!chunk) {
        return reply.status(500).send({
          error: 'Internal Server Error',
          message: 'Failed to create audio chunk'
        })
      }

      return reply.status(201).send({
        chuckId: chunk.id
      })
    }
  )
}
