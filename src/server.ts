import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import fastify from 'fastify'
import {
  hasZodFastifySchemaValidationErrors,
  isResponseSerializationError,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider
} from 'fastify-type-provider-zod'
import { env } from './env.ts'
import { createQuestionRoute } from './http/routes/create-question.ts'
import { createRoomRoute } from './http/routes/create-room.ts'
import { getRoomQuestionRoute } from './http/routes/get-room-questions.ts'
import { getRoomsRoute } from './http/routes/get-rooms.ts'
import { uploadAudioRoute } from './http/routes/upload-audio.ts'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.register(fastifyCors, {
  origin: 'http://localhost:5173'
})

app.register(fastifyMultipart)

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.setErrorHandler((err, req, reply) => {
  if (hasZodFastifySchemaValidationErrors(err)) {
    return reply.status(400).send({
      error: 'Response Validation Error',
      message: "Request doesn't match the schema",
      statusCode: 400,
      details: {
        issues: err.validation,
        method: req.method,
        url: req.url
      }
    })
  }

  if (isResponseSerializationError(err)) {
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: "Response doesn't match the schema",
      statusCode: 500,
      details: {
        issues: err.cause.issues,
        method: err.method,
        url: err.url
      }
    })
  }

  reply.status(500).send({
    error: 'Internal Server Error'
  })
})

app.get('/health', () => 'OK')

app.register(getRoomsRoute)
app.register(createRoomRoute)
app.register(getRoomQuestionRoute)
app.register(createQuestionRoute)
app.register(uploadAudioRoute)

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0'
  })
  .then(() => {
    console.log(`HTTP server running on http://localhost:${env.PORT}`)
  })
