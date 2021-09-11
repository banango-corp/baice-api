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
const { mockLogger } = require('../helpers/mock-logger')

test.before(async (t) => {
  const env = parseEnv(process.env)
  t.context = {
    env,
    models: createModels(db),
    dbConn: await db.connect(env.MONGODB_CONN_STRING)
  }
})

test('GET /health-check should return an object indicating the API is running and is healthy', async (t) => {
  const { env, models, dbConn } = t.context
  const logger = mockLogger()
  const server = setupServer({ env, logger, models, dbConn })
  const response = await server.inject({
    method: 'GET',
    url: '/health-check'
  })
  t.deepEqual(response.json(), { isHealthy: true })
})

test('POST /post should create a new post', async (t) => {
  const { env, models, dbConn } = t.context
  const logger = mockLogger()
  const server = setupServer({ env, logger, models, dbConn })

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
