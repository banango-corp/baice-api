const fastify = require('fastify')
const fastifyCors = require('fastify-cors')

const audioService = require('../services/audio')
const { streamToBuffer } = require('./utils')

function setupRoutes(server, env, logger) {
  server.register(fastifyCors, {})
  server.addContentTypeParser(/^audio\/.*/, async function (request, payload) {
    return await streamToBuffer(payload)
  })
  server.addHook('preHandler', async (request, reply) => {
    logger.info('Authentication could be performed here')
  })
  server.get('/', () => ({ baiceApi: true }))
  server.post('/post', async (request, reply) => {
    const { temporaryURL } = await audioService.storeAudio(
      request.body,
      env.ACCOUNT_NAME,
      env.ACCOUNT_KEY,
      env.CONTAINER_NAME
    )
    reply
      .code(200)
      .send({ audioURL: temporaryURL })
  })
}

async function start(env, logger) {
  const server = fastify.fastify({ logger })
  setupRoutes(server, env, logger)
  await server.listen(env.HTTP_SERVER_PORT)
}

module.exports = {
  start
}
