'use strict'

const fastify = require('fastify')
const fastifyCors = require('fastify-cors')

const { createModels } = require('../models')
const {
  postPost,
  getFeed,
  getPostAudio,
  putPostLike,
  deletePost,
  getHealthCheck
} = require('./routes')
const { streamToBuffer } = require('./utils')

function setupServer({ env, logger, models, dbConn }) {
  const server = fastify({ logger })
  server.register(fastifyCors, {})

  server.addContentTypeParser(/^audio\/.*/, async function (request, payload) {
    return await streamToBuffer(payload)
  })

  server.addHook('preHandler', async () => {
    // TODO: Perform authentication here
  })

  server.get('/health-check', getHealthCheck())
  server.post('/post', postPost({ env, models }))
  server.get('/feed', getFeed({ env, models }))
  server.get('/post/audio/:audioName', getPostAudio({ env, models }))
  server.put('/post/:postId/like', putPostLike({ env, models, dbConn }))
  server.delete('/post/:postId', deletePost({ models }))

  return server
}

async function start({ env, logger, db }) {
  const models = createModels(db)
  const dbConn = await db.connect(env.MONGODB_CONN_STRING)
  const server = setupServer({ env, logger, models, dbConn })
  await server.listen(env.HTTP_SERVER_PORT, '0.0.0.0')
  return server
}

module.exports = {
  setupServer,
  start
}
