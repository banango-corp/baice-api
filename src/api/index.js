'use strict'

const { BlobServiceClient } = require('@azure/storage-blob')
const fastify = require('fastify')
const fastifyCors = require('fastify-cors')

const { createModels } = require('../models')
const buildAudioService = require('../services/audio')
const buildPostService = require('../services/post')
const buildUserService = require('../services/user')
const {
  authorize,
  getHealthCheck,
  postLogin,
  postLogout,
  postPost,
  getFeed,
  getPostAudio,
  putPostLike,
  deletePost,
  getUsers
} = require('./routes')
const { streamToBuffer, createInitialUsers } = require('./utils')

function setupServer({ logger, audioService, postService, userService }) {
  const server = fastify({ logger })
  server.register(fastifyCors, {})

  server.addContentTypeParser(/^audio\/.*/, async function (request, payload) {
    return await streamToBuffer(payload)
  })

  const options = { preValidation: authorize(userService, ['USER', 'ADMIN']) }

  server.get('/health-check', getHealthCheck())

  server.post('/login', postLogin({ userService }))
  server.post('/logout', options, postLogout({ userService }))

  server.post('/post', options, postPost({ audioService, postService }))
  server.get('/feed', options, getFeed({ postService }))
  server.get('/post/audio/:audioName', options, getPostAudio({ audioService, postService }))
  server.put('/post/:postId/like', options, putPostLike({ postService }))
  server.delete('/post/:postId', options, deletePost({ postService }))

  server.get('/users', { preValidation: authorize(userService, ['ADMIN']) }, getUsers({ userService }))

  return server
}

async function start({ env, logger, db }) {
  const models = createModels(db)
  const dbConn = await db.connect(env.MONGODB_CONN_STRING)

  const audioService = buildAudioService(env.ACCOUNT_NAME, env.ACCOUNT_KEY, env.CONTAINER_NAME, BlobServiceClient)
  const postService = buildPostService(models, dbConn, audioService, env.AUDIO_URL_PREFIX)
  const userService = buildUserService(models)

  await createInitialUsers(userService)

  const server = setupServer({ logger, audioService, postService, userService })
  await server.listen(env.HTTP_SERVER_PORT, '0.0.0.0')

  return server
}

module.exports = {
  setupServer,
  start
}
