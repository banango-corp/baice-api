'use strict'

const { URLSearchParams } = require('url')

const { version } = require('../../package.json')

const authorize = (userService, allowedRole) => async (request, reply) => {
  const { headers: { authorization } } = request
  if (!authorization) {
    return reply.code(400).send({
      error: 'The authorization header is missing'
    })
  }
  const parts = authorization.split(' ')
  if (parts.length !== 2) {
    return reply.code(400).send({
      error: 'The authorization header is invalid'
    })
  }
  const token = parts[1]
  const payload = await userService.verifyToken(token)
  if (!payload) {
    return reply.code(400).send({
      error: 'The token is invalid'
    })
  }
  if (!allowedRole.includes(payload.role)) {
    return reply.code(401).send({
      error: 'Not authorized'
    })
  }
  request.user = { username: payload.username, role: payload.role }
}

// TODO: Improve this endpoint to check the database connectivity
const getHealthCheck = () => () => ({ isHealthy: true, version })

const postLogin = ({ userService }) => async (request, reply) => {
  const { headers: { authorization } } = request
  if (!authorization) {
    return reply.code(400).send({
      error: 'The authorization header is missing'
    })
  }
  const parts = authorization.split(' ')
  if (parts.length !== 2) {
    return reply.code(400).send({
      error: 'The authorization header is invalid'
    })
  }
  const [username, password] = Buffer.from(parts[1], 'base64').toString().split(':')
  const result = await userService.login(username, password)
  if (result.failed) {
    return reply.code(401).send({
      error: 'The provided user and/or password is wrong'
    })
  }
  reply.code(200).send(result)
}

const postLogout = () => async (request, reply) => {
  reply.code(200).send()
}

const postPost = ({ audioService, postService }) => async (request, reply) => {
  const { audioName, audioDuration, temporaryAccessQueryParams } = await audioService.uploadAudio(request.body)

  const post = await postService.createPost(temporaryAccessQueryParams, {
    username: request.user.username,
    audioName,
    audioDuration
  })

  reply
    .code(200)
    .send(post)
}

const getFeed = ({ postService }) => async (request, reply) => {
  const posts = await postService.getFeedForUser(request.user.username)

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
  const post = await postService.likePost(request.user.username, postId)
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

const getUsers = ({ userService }) => async (request, reply) => {
  const users = await userService.listUsers()
  reply
    .code(200)
    .send(users)
}

module.exports = {
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
}
