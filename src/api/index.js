const fastify = require('fastify')
const fastifyCors = require('fastify-cors')
const { postPost } = require('./routes')

const { streamToBuffer } = require('./utils')

function setupRoutes(server, env, logger) {
  server.register(fastifyCors, {})

  server.addContentTypeParser(/^audio\/.*/, async function (request, payload) {
    return await streamToBuffer(payload)
  })

  server.addHook('preHandler', async () => {
    // TODO: Authentication could be performed here
  })

  server.get('/', () => ({ baiceApi: true }))
  server.post('/post', postPost(env))
}

async function start(env, logger) {
  const server = fastify.fastify({ logger })
  setupRoutes(server, env, logger)
  await server.listen(env.HTTP_SERVER_PORT, '0.0.0.0')
  return server
}

module.exports = {
  start
}
