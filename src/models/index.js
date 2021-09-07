const Post = require('./post')

const createModels = (db) => ({
  Post: Post(db)
})


module.exports = {
  createModels
}
