'use strict'

const { URLSearchParams } = require('url')

const { uploadAudio, buildStorageAudioURL } = require('../services/audio')
const {
  createPost,
  increasePlayCount,
  getFeedForUser,
  likePost,
  removePost
} = require('../services/post')

const postPost = ({ env, models }) => async (request, reply) => {
  const { audioName, audioDuration, temporaryAccessQueryParams } = await uploadAudio({
    audioBuffer: request.body,
    accountName: env.ACCOUNT_NAME,
    accountKey: env.ACCOUNT_KEY,
    containerName: env.CONTAINER_NAME
  })

  const post = await createPost(models, env.AUDIO_URL_PREFIX, temporaryAccessQueryParams, {
    username: 'TO_BE_SET',
    audioName,
    audioDuration
  })

  reply
    .code(200)
    .send(post)
}

const getFeed = ({ env, models }) => async (request, reply) => {
  const posts = await getFeedForUser({
    models,
    username: 'TO_BE_SET',
    accountName: env.ACCOUNT_NAME,
    accountKey: env.ACCOUNT_KEY,
    containerName: env.CONTAINER_NAME,
    audioURLPrefix: env.AUDIO_URL_PREFIX
  })

  reply
    .code(200)
    .send(posts)
}

const getPostAudio = ({ env, models }) => async (request, reply) => {
  const encodedQueryParams = (new URLSearchParams(Object.entries(request.query))).toString()
  const audioName = request.params.audioName

  const url = buildStorageAudioURL({
    audioName,
    temporaryAccessQueryParams: encodedQueryParams,
    accountName: env.ACCOUNT_NAME,
    accountKey: env.ACCOUNT_KEY,
    containerName: env.CONTAINER_NAME
  })

  reply.redirect(url)

  await increasePlayCount(models, audioName)
}

const putPostLike = ({ env, models, dbConn }) => async (request, reply) => {
  const { postId } = request.params
  const post = await likePost({
    models,
    dbConn,
    accountName: env.ACCOUNT_NAME,
    accountKey: env.ACCOUNT_KEY,
    containerName: env.CONTAINER_NAME,
    audioURLPrefix: env.AUDIO_URL_PREFIX,
    postId,
    username: 'TO_BE_SET'
  })
  reply
    .code(200)
    .send(post)
}

const deletePost = ({ models }) => async (request, reply) => {
  const { postId } = request.params
  await removePost({
    models,
    postId
  })
  reply
    .code(200)
    .send()
}

// TODO: Improve this endpoint to check the database connectivity
const getHealthCheck = () => () => ({ isHealthy: true })

module.exports = {
  postPost,
  getFeed,
  getPostAudio,
  putPostLike,
  deletePost,
  getHealthCheck
}
