'use strict'

const crypto = require('crypto')
const bcrypt = require('bcrypt')
const jose = require('jose')
const { sanitizeFilter } = require('mongoose')

const secretKey = crypto.createSecretKey(crypto.randomBytes(100))

const createUser = (models) => async ({
  username,
  password,
  role
}) => {
  const passwordHash = await bcrypt.hash(password, 10)

  const user = new models.User({
    username,
    passwordHash,
    role
  })
  await user.save()

  return {
    username: user.username,
    role: user.role,
    createdAt: user.createdAt
  }
}

const listUsers = (models) => async () => {
  const users = await models.User.find({}).exec()
  return users.map(({ username, role, createdAt }) => ({ username, role, createdAt }))
}

const login = (models) => async (username, password) => {
  const found = await models.User.findOne(sanitizeFilter({ username })).exec()
  if (!found) {
    return { failed: 'Could not find a user matching the provided username' }
  }
  const match = await bcrypt.compare(password, found.passwordHash)
  if (!match) {
    return { failed: 'The provided password does not match this user\'s password' }
  }
  const token = await new jose.SignJWT({
    username: found.username,
    role: found.role
  }).setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(parseInt(Date.now() / 1000, 10))
    .setExpirationTime('2h')
    .sign(secretKey)
  return { token }
}

const verifyToken = async (token) => {
  try {
    const { payload } = await jose.jwtVerify(token, secretKey)
    return payload
  } catch (_) {
    return undefined
  }
}

module.exports = (models) => ({
  createUser: createUser(models),
  listUsers: listUsers(models),
  login: login(models),
  verifyToken
})
