const {
  buildTemporaryAccessQueryParams
} = require('./audio')

async function createPost(models, {
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
  return post.toJSON()
}

async function increasePlayCount(models, audioName) {
  // TODO
}

const buildPostAudioURL = (audioURLPrefix, audioName, temporaryAccessQueryParams) => `${audioURLPrefix}/post/audio/${audioName}?${temporaryAccessQueryParams}`

async function getFeedForUser({
  models,
  username,
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
      likesCount: post.likesCount,
      dislikesCount: post.dislikesCount,
      playsCount: post.playsCount,
      createdAt: post.createdAt
    }
  })

  return result
}

module.exports = {
  createPost,
  increasePlayCount,
  getFeedForUser,
  buildPostAudioURL
}
