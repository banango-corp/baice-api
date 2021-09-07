const audioService = require('./audio')

async function createPost({
  username,
  audioName,
  audioDuration
}) {
  return {
    id: 'TO_BE_SET',
    createdAt: new Date()
  }
}

module.exports = {
  createPost
}
