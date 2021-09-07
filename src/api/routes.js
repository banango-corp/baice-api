const { uploadAudio } = require('../services/audio')
const { createPost } = require('../services/post')

const postPost = ({ env, logger, models }) => async (request, reply) => {
  const { audioName, audioDuration, temporaryURL } = await uploadAudio(
    request.body,
    env.ACCOUNT_NAME,
    env.ACCOUNT_KEY,
    env.CONTAINER_NAME
  )

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
      audioURL: temporaryURL,
      audioDuration,
      likesCount: 0,
      dislikesCount: 0,
      playsCount: 0,
      createdAt
    })
}

module.exports = {
  postPost
}
