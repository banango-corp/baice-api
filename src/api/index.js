const fastify = require('fastify')
const fastifyCors = require('fastify-cors')

const { createModels } = require('../models')

const { postPost } = require('./routes')

const { streamToBuffer } = require('./utils')

function setupRoutes(server, { env, logger, models }) {
  server.register(fastifyCors, {})

  server.addContentTypeParser(/^audio\/.*/, async function (request, payload) {
    return await streamToBuffer(payload)
  })

  server.addHook('preHandler', async () => {
    // TODO: Authentication could be performed here
  })

  server.get('/', () => ({ baiceApi: true }))
  server.post('/post', postPost({ env, logger, models }))
}

async function start({ env, logger, db }) {
  const models = createModels(db)
  await db.connect(env.MONGODB_CONN_STRING)

  const server = fastify.fastify({ logger })
  setupRoutes(server, { env, logger, models })
  await server.listen(env.HTTP_SERVER_PORT, '0.0.0.0')
  return server
}

module.exports = {
  start
}
