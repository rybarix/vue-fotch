// Import the framework and instantiate it
import Fastify, { FastifyRequest } from 'fastify'
import formbody from '@fastify/formbody'

const fastify = Fastify({
  logger: false
})

fastify.register(formbody)

fastify.get('/get', async function handler(_, __) {
  return { hello: 'world' }
})

fastify.get('/get/:id', async function handler(request: FastifyRequest<{ Params: { id: number } }>, __) {
  return { id: Number(request.params.id) };
})

fastify.post<{ Body: { email: string }}>('/post', async function handler(request, __) {

  return { id: 1, email: request.body.email }
})


export async function run() {
  try {
    await fastify.listen({ port: 3000 })
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

export async function shutdown() {
  process.exit(0)
}
