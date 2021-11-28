'use strict'

const { Schema } = require('mongoose')

const userSchema = new Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['ADMIN', 'USER'], required: true },
  createdAt: { type: Date, required: true, default: Date.now }
})

module.exports = (db) => db.model('User', userSchema)
