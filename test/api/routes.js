'use strict'

const test = require('ava')
const db = require('mongoose')
const { access } = require('fs/promises')
const fs = require('fs')
const path = require('path')
const { DateTime } = require('luxon')

const { setupServer } = require('../../src/api')
const { parseEnv } = require('../../src/env')
const { createModels } = require('../../src/models')
const buildAudioService = require('../../src/services/audio')
const buildPostService = require('../../src/services/post')
const { mockLogger } = require('../helpers/mock-logger')
const { mockBlobServiceClient } = require('../helpers/mock-blob-service-client')

test.before(async (t) => {
  const env = parseEnv(process.env)

  const models = createModels(db)
  const dbConn = await db.connect(env.MONGODB_CONN_STRING)

  t.context = {
    env,
    models,
    dbConn
  }
})

test('GET /health-check should return an object indicating the API is running and is healthy', async (t) => {
  const { env, models, dbConn } = t.context

  const { BlobServiceClientMock } = mockBlobServiceClient()
  const audioService = buildAudioService(env.ACCOUNT_NAME, env.ACCOUNT_KEY, env.CONTAINER_NAME, BlobServiceClientMock)
  const postService = buildPostService(models, dbConn, audioService, env.AUDIO_URL_PREFIX)

  const logger = mockLogger()
  const server = setupServer({ logger, audioService, postService })

  const response = await server.inject({
    method: 'GET',
    url: '/health-check'
  })

  t.deepEqual(response.json(), { isHealthy: true })
})

test('POST /post should create a new post', async (t) => {
  const { env, models, dbConn } = t.context

  const { BlobServiceClientMock } = mockBlobServiceClient()
  const audioService = buildAudioService(env.ACCOUNT_NAME, env.ACCOUNT_KEY, env.CONTAINER_NAME, BlobServiceClientMock)
  const postService = buildPostService(models, dbConn, audioService, env.AUDIO_URL_PREFIX)

  const logger = mockLogger()
  const server = setupServer({ logger, audioService, postService })

  const pathValidAudioFile = path.join(process.env.PWD, 'test/assets/short-valid-audio.mp3')
  await access(pathValidAudioFile)
  const readStream = fs.createReadStream(pathValidAudioFile)

  const response = await server.inject({
    method: 'POST',
    url: '/post',
    headers: {
      'Content-Type': 'audio/mpeg'
    },
    payload: readStream
  })

  t.is(response.statusCode, 200)

  const payload = response.json()

  t.deepEqual(Object.keys(payload), [
    'id',
    'username',
    'audioURL',
    'audioDuration',
    'likes',
    'likesCount',
    'playsCount',
    'createdAt'
  ])

  t.is(typeof payload.id, 'string')
  t.truthy(DateTime.fromISO(payload.createdAt).isValid)

  const audioURL = new URL(payload.audioURL)
  t.is(audioURL.origin, 'http://localhost:9000')
  t.truthy(/^\/post\/audio\/.*.mp3$/.test(audioURL.pathname))

  t.like(payload, {
    username: 'TO_BE_SET',
    audioDuration: 29.648979591836735,
    likes: [],
    likesCount: 0,
    playsCount: 0
  })
})

test('GET /feed should retrieve the latest posts', async (t) => {
  const { env, models, dbConn } = t.context

  const { BlobServiceClientMock } = mockBlobServiceClient()
  const audioService = buildAudioService(env.ACCOUNT_NAME, env.ACCOUNT_KEY, env.CONTAINER_NAME, BlobServiceClientMock)
  const postService = buildPostService(models, dbConn, audioService, env.AUDIO_URL_PREFIX)

  const logger = mockLogger()
  const server = setupServer({ logger, audioService, postService })

  const pathValidAudioFile = path.join(process.env.PWD, 'test/assets/short-valid-audio.mp3')
  await access(pathValidAudioFile)
  const readStream = fs.createReadStream(pathValidAudioFile)

  let response = await server.inject({
    method: 'POST',
    url: '/post',
    headers: {
      'Content-Type': 'audio/mpeg'
    },
    payload: readStream
  })
  t.is(response.statusCode, 200)

  response = await server.inject({
    method: 'GET',
    url: '/feed'
  })
  t.is(response.statusCode, 200)

  const payload = response.json()

  t.truthy(payload.length > 0)
  t.deepEqual(Object.keys(payload[0]), [
    'id',
    'username',
    'audioURL',
    'audioDuration',
    'likes',
    'likesCount',
    'playsCount',
    'createdAt'
  ])

  t.is(typeof payload[0].id, 'string')
  t.truthy(DateTime.fromISO(payload[0].createdAt).isValid)

  const audioURL = new URL(payload[0].audioURL)
  t.is(audioURL.origin, 'http://localhost:9000')
  t.truthy(/^\/post\/audio\/.*.mp3$/.test(audioURL.pathname))
  t.deepEqual([...audioURL.searchParams.keys()], ['sv', 'st', 'se', 'sr', 'sp', 'sig'])

  t.like(payload[0], {
    username: 'TO_BE_SET',
    audioDuration: 29.648979591836735,
    likes: [],
    likesCount: 0,
    playsCount: 0
  })
})

test('PUT /post/:postId/like should like or dislike a post', async (t) => {
  const { env, models, dbConn } = t.context

  const { BlobServiceClientMock } = mockBlobServiceClient()
  const audioService = buildAudioService(env.ACCOUNT_NAME, env.ACCOUNT_KEY, env.CONTAINER_NAME, BlobServiceClientMock)
  const postService = buildPostService(models, dbConn, audioService, env.AUDIO_URL_PREFIX)

  const logger = mockLogger()
  const server = setupServer({ logger, audioService, postService })

  const pathValidAudioFile = path.join(process.env.PWD, 'test/assets/short-valid-audio.mp3')
  await access(pathValidAudioFile)
  const readStream = fs.createReadStream(pathValidAudioFile)

  let response = await server.inject({
    method: 'POST',
    url: '/post',
    headers: {
      'Content-Type': 'audio/mpeg'
    },
    payload: readStream
  })
  t.is(response.statusCode, 200)

  const post = response.json()

  response = await server.inject({
    method: 'PUT',
    url: `/post/${post.id}/like`
  })
  t.is(response.statusCode, 200)

  const postLiked = response.json()
  t.deepEqual(postLiked.likes, ['TO_BE_SET'])

  response = await server.inject({
    method: 'PUT',
    url: `/post/${post.id}/like`
  })
  t.is(response.statusCode, 200)

  const postDisliked = response.json()
  t.deepEqual(postDisliked.likes, [])
})

test('DELETE /post/:postId should remove an existing post', async (t) => {
  const { env, models, dbConn } = t.context

  const { BlobServiceClientMock } = mockBlobServiceClient()
  const audioService = buildAudioService(env.ACCOUNT_NAME, env.ACCOUNT_KEY, env.CONTAINER_NAME, BlobServiceClientMock)
  const postService = buildPostService(models, dbConn, audioService, env.AUDIO_URL_PREFIX)

  const logger = mockLogger()
  const server = setupServer({ logger, audioService, postService })

  const pathValidAudioFile = path.join(process.env.PWD, 'test/assets/short-valid-audio.mp3')
  await access(pathValidAudioFile)
  const readStream = fs.createReadStream(pathValidAudioFile)

  let response = await server.inject({
    method: 'POST',
    url: '/post',
    headers: {
      'Content-Type': 'audio/mpeg'
    },
    payload: readStream
  })
  t.is(response.statusCode, 200)

  const post = response.json()

  response = await server.inject({
    method: 'DELETE',
    url: `/post/${post.id}`
  })
  t.is(response.statusCode, 200)
})
