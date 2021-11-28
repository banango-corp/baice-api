'use strict'

const VError = require('verror')
const { sanitizeFilter } = require('mongoose')

const buildPostAudioURL = (audioURLPrefix, audioName, temporaryAccessQueryParams) => `${audioURLPrefix}/post/audio/${audioName}?${temporaryAccessQueryParams}`

const createPost = (models, audioURLPrefix) => async (temporaryAccessQueryParams, {
  username,
  audioName,
  audioDuration
}) => {
  const post = new models.Post({
    username,
    audioName,
    audioDuration
  })
  await post.save()

  const audioURL = buildPostAudioURL(audioURLPrefix, audioName, temporaryAccessQueryParams)

  return {
    id: post._id,
    username: post.username,
    audioURL,
    audioDuration: post.audioDuration,
    likes: post.likes,
    likesCount: post.likes.length,
    playsCount: post.playsCount,
    createdAt: post.createdAt
  }
}

// eslint-disable-next-line no-unused-vars
const increasePlayCount = (models) => async (audioName) => {
  // TODO: Implement
}

// eslint-disable-next-line no-unused-vars
const getFeedForUser = (models, audioService, audioURLPrefix) => async (username) => {
  // TODO: retrieve only the posts from the users followed by the provided `username`
  const posts = await models.Post
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .exec()

  const result = posts.map((post) => {
    const temporaryAccessQueryParams = audioService.buildTemporaryAccessQueryParams(post.audioName)
    const audioURL = buildPostAudioURL(audioURLPrefix, post.audioName, temporaryAccessQueryParams)
    return {
      id: post._id,
      username: post.username,
      audioURL,
      audioDuration: post.audioDuration,
      likes: post.likes,
      likesCount: post.likes.length,
      playsCount: post.playsCount,
      createdAt: post.createdAt
    }
  })

  return result
}

const likePost = (models, dbConn, audioService, audioURLPrefix) => async (username, postId) => {
  const dbSession = await dbConn.startSession()
  let post
  await dbSession.withTransaction(async () => {
    post = await models.Post.findById(sanitizeFilter(postId)).exec()
    const index = post.likes.indexOf(username)
    if (index === -1) {
      post.likes.push(username)
    } else {
      post.likes.splice(index, 1)
    }
    await post.save()
  })
  const temporaryAccessQueryParams = audioService.buildTemporaryAccessQueryParams(post.audioName)
  const audioURL = buildPostAudioURL(audioURLPrefix, post.audioName, temporaryAccessQueryParams)
  return {
    id: post._id,
    username,
    audioURL,
    audioDuration: post.audioDuration,
    likes: post.likes,
    likesCount: post.likes.length,
    playsCount: post.playsCount,
    createdAt: post.createdAt
  }
}

const removePost = (models) => async (postId) => {
  const result = await models.Post.deleteOne(sanitizeFilter({ _id: postId }))
  if (result.deletedCount === 0) {
    throw new VError({ name: 'PostNotFound' }, 'Could not find a post with this ID')
  }
}

module.exports = (models, dbConn, audioService, audioURLPrefix) => ({
  createPost: createPost(models, audioURLPrefix),
  increasePlayCount: increasePlayCount(models),
  getFeedForUser: getFeedForUser(models, audioService, audioURLPrefix),
  likePost: likePost(models, dbConn, audioService, audioURLPrefix),
  removePost: removePost(models)
})
