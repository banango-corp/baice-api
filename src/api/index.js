'use strict'

const { BlobServiceClient } = require('@azure/storage-blob')
const fastify = require('fastify')
const fastifyCors = require('fastify-cors')

const { createModels } = require('../models')
const buildAudioService = require('../services/audio')
const buildPostService = require('../services/post')
const {
  postPost,
  getFeed,
  getPostAudio,
  putPostLike,
  deletePost,
  getHealthCheck
} = require('./routes')
const { streamToBuffer } = require('./utils')

function setupServer({ logger, audioService, postService }) {
  const server = fastify({ logger })
  server.register(fastifyCors, {})

  server.addContentTypeParser(/^audio\/.*/, async function (request, payload) {
    return await streamToBuffer(payload)
  })

  server.addHook('preHandler', async () => {
    // TODO: Perform authentication here
  })

  server.get('/health-check', getHealthCheck())
  server.post('/post', postPost({ audioService, postService }))
  server.get('/feed', getFeed({ postService }))
  server.get('/post/audio/:audioName', getPostAudio({ audioService, postService }))
  server.put('/post/:postId/like', putPostLike({ postService }))
  server.delete('/post/:postId', deletePost({ postService }))

  return server
}

async function start({ env, logger, db }) {
  const models = createModels(db)
  const dbConn = await db.connect(env.MONGODB_CONN_STRING)

  const audioService = buildAudioService(env.ACCOUNT_NAME, env.ACCOUNT_KEY, env.CONTAINER_NAME, BlobServiceClient)
  const postService = buildPostService(models, dbConn, audioService, env.AUDIO_URL_PREFIX)

  const server = setupServer({ logger, audioService, postService })
  await server.listen(env.HTTP_SERVER_PORT, '0.0.0.0')

  return server
}

module.exports = {
  setupServer,
  start
}
