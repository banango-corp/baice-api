'use strict'

const sinon = require('sinon')

const mockBlobServiceClient = () => {
  const uploadSpy = sinon.spy()

  const blockBlobClientMock = {
    upload: uploadSpy,
    url: 'http://mock.com'
  }

  const containerClientMock = {
    getBlockBlobClient: () => blockBlobClientMock
  }

  const BlobServiceClientMock = sinon.stub()
  BlobServiceClientMock.prototype.getContainerClient = sinon.stub().returns(containerClientMock)

  return {
    BlobServiceClientMock,
    uploadSpy
  }
}

module.exports = {
  mockBlobServiceClient
}
