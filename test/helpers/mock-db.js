'use strict'

const mockModels = () => {
  const fakePost = {
    _id: '123',
    username: 'TO_BE_SET',
    audioName: 'AS65D8FASD6F5.mp3',
    audioDuration: 0,
    likes: [],
    playsCount: 0,
    createdAt: new Date(),
    save: () => {}
  }
  const Post = function () {
    return fakePost
  }
  Post.find = () => ({
    sort: () => ({
      limit: () => ({
        exec: () => ([fakePost])
      })
    })
  })
  Post.findById = () => ({
    exec: () => fakePost
  })
  Post.deleteOne = () => ({
    deletedCount: 1
  })
  return {
    Post
  }
}

const mockDBConnection = () => {
  const sessionMock = {
    withTransaction: async (fn) => {
      await fn()
    }
  }
  const mockConn = {
    startSession: () => sessionMock
  }
  return mockConn
}

module.exports = {
  mockModels,
  mockDBConnection
}
