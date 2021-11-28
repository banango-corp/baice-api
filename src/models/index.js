'use strict'

const Post = require('./post')
const User = require('./user')

const createModels = (db) => ({
  Post: Post(db),
  User: User(db)
})


module.exports = {
  createModels
}
