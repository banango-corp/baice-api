'use strict'

const { VError } = require('verror')

const DUPLICATE_KEY_ERROR = 11000

function streamToBuffer(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = []
    readableStream.on('data', (data) => {
      chunks.push(data instanceof Buffer ? data : Buffer.from(data))
    })
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    readableStream.on('error', reject)
  })
}

async function createInitialUsers(userService) {
  try {
    await userService.createUser({
      username: 'user1',
      password: '1234',
      role: 'USER'
    })
  } catch (error) {
    if (error.code !== DUPLICATE_KEY_ERROR) {
      throw new VError(error, 'Failed to create one of the initial users of role USER')
    }
  }
  try {
    await userService.createUser({
      username: 'admin1',
      password: '1234',
      role: 'ADMIN'
    })
  } catch (error) {
    if (error.code !== DUPLICATE_KEY_ERROR) {
      throw new VError(error, 'Failed to create one of the initial users of role ADMIN')
    }
  }
}

module.exports = {
  streamToBuffer,
  createInitialUsers
}
