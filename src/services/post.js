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

module.exports = {
  createPost
}
