import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connection.ts'
import { schema } from '../../db/schema/index.ts'

export const createRoomRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms',
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          description: z.string().optional()
        }),
        response: {
          201: z.object({
            roomId: z.string()
          })
        }
      }
    },
    async (req, reply) => {
      const { name, description } = req.body

      const [createdRoom] = await db
        .insert(schema.rooms)
        .values({
          name,
          description
        })
        .returning()

      if (!createdRoom) {
        throw new Error('Failed to create room')
      }

      reply.status(201).send({
        roomId: createdRoom.id
      })
    }
  )
}
