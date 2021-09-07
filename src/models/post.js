const { Schema } = require('mongoose')

const postSchema = new Schema({
  username: { type: String, required: true },
  audioName: { type: String, required: true, unique: true },
  audioDuration: { type: String, required: true },
  likesCount: { type: Number, required: true, default: 0 },
  dislikesCount: { type: Number, required: true, default: 0 },
  playsCount: { type: Number, required: true, default: 0 },
  createdAt: { type: Date, required: true, default: Date.now }
})

module.exports = (db) => db.model('Post', postSchema)