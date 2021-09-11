'use strict'

const {
  buildTemporaryAccessQueryParams
} = require('./audio')

async function createPost(models, audioURLPrefix, temporaryAccessQueryParams, {
  username,
  audioName,
  audioDuration
}) {
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

async function increasePlayCount(/* models, audioName */) {
  // TODO
}

const buildPostAudioURL = (audioURLPrefix, audioName, temporaryAccessQueryParams) => `${audioURLPrefix}/post/audio/${audioName}?${temporaryAccessQueryParams}`

async function getFeedForUser({
  models,
  // username,
  accountName,
  accountKey,
  containerName,
  audioURLPrefix
}) {
  // TODO: retrieve only the posts from the users the `username` follows
  const posts = await models.Post
    .find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .exec()

  const result = posts.map((post) => {
    const temporaryAccessQueryParams = buildTemporaryAccessQueryParams({
      audioName: post.audioName,
      accountName,
      accountKey,
      containerName
    })
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

async function likePost({
  models,
  dbConn,
  accountName,
  accountKey,
  containerName,
  audioURLPrefix,
  username,
  postId
}) {
  const dbSession = await dbConn.startSession()
  let post
  await dbSession.withTransaction(async () => {
    post = await models.Post.findById(postId).exec()
    const index = post.likes.indexOf(username)
    if (index === -1) {
      post.likes.push(username)
    } else {
      post.likes.splice(index, 1)
    }
    await post.save()
  })
  const {
    _id: id,
    audioName,
    audioDuration,
    likes,
    playsCount,
    createdAt
  } = post
  const temporaryAccessQueryParams = buildTemporaryAccessQueryParams({
    audioName,
    accountName,
    accountKey,
    containerName
  })
  const audioURL = buildPostAudioURL(audioURLPrefix, post.audioName, temporaryAccessQueryParams)
  return {
    id,
    username,
    audioURL,
    audioDuration,
    likes,
    likesCount: likes.length,
    playsCount,
    createdAt
  }
}

async function removePost({ models, postId }) {
  await models.Post.deleteOne({ _id: postId })
}

module.exports = {
  createPost,
  increasePlayCount,
  buildPostAudioURL,
  getFeedForUser,
  likePost,
  removePost
}
