'use strict'

const { URLSearchParams } = require('url')

const postPost = ({ audioService, postService }) => async (request, reply) => {
  const { audioName, audioDuration, temporaryAccessQueryParams } = await audioService.uploadAudio(request.body)

  const post = await postService.createPost(temporaryAccessQueryParams, {
    username: 'TO_BE_SET',
    audioName,
    audioDuration
  })

  reply
    .code(200)
    .send(post)
}

const getFeed = ({ postService }) => async (request, reply) => {
  const posts = await postService.getFeedForUser('TO_BE_SET')

  reply
    .code(200)
    .send(posts)
}

const getPostAudio = ({ audioService, postService }) => async (request, reply) => {
  const encodedQueryParams = (new URLSearchParams(Object.entries(request.query))).toString()
  const audioName = request.params.audioName

  const url = audioService.buildStorageAudioURL(audioName, encodedQueryParams)

  reply.redirect(url)

  await postService.increasePlayCount(audioName)
}

const putPostLike = ({ postService }) => async (request, reply) => {
  const { postId } = request.params
  const post = await postService.likePost('TO_BE_SET', postId)
  reply
    .code(200)
    .send(post)
}

const deletePost = ({ postService }) => async (request, reply) => {
  const { postId } = request.params
  await postService.removePost(postId)
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
