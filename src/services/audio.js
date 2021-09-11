'use strict'

const VError = require('verror')
const uuid = require('uuid').v4
const fileType = require('file-type')
const mm = require('music-metadata')
const { StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob')

const buildTemporaryAccessQueryParams = (accountName, accountKey, containerName) => (audioName) => {
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  return generateBlobSASQueryParameters({
    containerName,
    blobName: audioName,
    permissions: BlobSASPermissions.parse('r'),
    startsOn: new Date(),
    expiresOn: new Date(new Date().valueOf() + 60000 * 60 * 24) // Expires in 24 hours
  }, sharedKeyCredential).toString()
}

const blobServiceUrl = (accountName) => `https://${accountName}.blob.core.windows.net`

const buildStorageAudioURL = (accountName, accountKey, containerName, BlobServiceClient) => (audioName, temporaryAccessQueryParams) => {
  const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
  const blobServiceClient = new BlobServiceClient(blobServiceUrl(accountName), sharedKeyCredential)
  const containerClient = blobServiceClient.getContainerClient(containerName)
  const blockBlobClient = containerClient.getBlockBlobClient(audioName)
  return `${blockBlobClient.url}?${temporaryAccessQueryParams}`
}

const uploadAudio = (accountName, accountKey, containerName, BlobServiceClient) => async (audioBuffer) => {
  try {
    const { mime: mimeType, ext: fileExtension } = await fileType.fromBuffer(audioBuffer)
    const { format: { duration: audioDuration } } = await mm.parseBuffer(audioBuffer, { mimeType })
    if (audioDuration > 30) {
      throw new VError({ name: 'ExceededMaximumDuration' }, 'Audio buffer exceeded the maximum duration of 30 seconds')
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
    const blobServiceClient = new BlobServiceClient(blobServiceUrl(accountName), sharedKeyCredential)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const audioName = `${uuid()}.${fileExtension}`
    const blockBlobClient = containerClient.getBlockBlobClient(audioName)

    await blockBlobClient.upload(audioBuffer, Buffer.byteLength(audioBuffer), {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    })

    const temporaryAccessQueryParams = buildTemporaryAccessQueryParams({
      audioName,
      accountName,
      accountKey,
      containerName
    })

    return {
      audioName,
      audioDuration,
      temporaryAccessQueryParams
    }
  } catch (error) {
    throw new VError(error, 'Failed to store the audio buffer')
  }
}

module.exports = (accountName, accountKey, containerName, BlobServiceClient) => ({
  uploadAudio: uploadAudio(accountName, accountKey, containerName, BlobServiceClient),
  buildTemporaryAccessQueryParams: buildTemporaryAccessQueryParams(accountName, accountKey, containerName),
  buildStorageAudioURL: buildStorageAudioURL(accountName, accountKey, containerName, BlobServiceClient)
})
