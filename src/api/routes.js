const { URLSearchParams } = require('url')

const { uploadAudio, buildStorageAudioURL } = require('../services/audio')
const { createPost, getFeedForUser, increasePlayCount, buildPostAudioURL } = require('../services/post')

const postPost = ({ env, logger, models }) => async (request, reply) => {
  const { audioName, audioDuration, temporaryAccessQueryParams } = await uploadAudio({
    audioBuffer: request.body,
    accountName: env.ACCOUNT_NAME,
    accountKey: env.ACCOUNT_KEY,
    containerName: env.CONTAINER_NAME
  })

  const audioURL = buildPostAudioURL(env.AUDIO_URL_PREFIX, audioName, temporaryAccessQueryParams)

  const { _id: id, createdAt } = await createPost(models, {
    username: 'TO_BE_SET',
    audioName,
    audioDuration
  })

  reply
    .code(200)
    .send({
      id,
      username: 'TO_BE_SET',
      audioURL,
      audioDuration,
      likesCount: 0,
      dislikesCount: 0,
      playsCount: 0,
      createdAt
    })
}

const getFeed = ({ env, logger, models }) => async (request, reply) => {
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

const getPostAudio = ({ env, logger, models }) => async (request, reply) => {
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

module.exports = {
  postPost,
  getFeed,
  getPostAudio
}
