'use strict'

const VError = require('verror')
const uuid = require('uuid').v4
// TODO: Check the TODO below regarding identification of the mimeType
// const fileType = require('file-type')
// const mm = require('music-metadata')
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
    // TODO: Identify the mimeType from the incoming buffer and retrieve the audio duration
    // const { mime: mimeType, ext: fileExtension } = await fileType.fromBuffer(audioBuffer)
    // const { format: { duration: audioDuration } } = await mm.parseBuffer(audioBuffer, { mimeType })
    // if (audioDuration > 30) {
    //   throw new VError({ name: 'ExceededMaximumDuration' }, 'Audio buffer exceeded the maximum duration of 30 seconds')
    // }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
    const blobServiceClient = new BlobServiceClient(blobServiceUrl(accountName), sharedKeyCredential)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const audioName = `${uuid()}.mp3` // TODO: Set the file extension using the result from fileType.fromBuffer
    const blockBlobClient = containerClient.getBlockBlobClient(audioName)

    await blockBlobClient.upload(audioBuffer, Buffer.byteLength(audioBuffer), {
      blobHTTPHeaders: {
        blobContentType: 'audio/mpeg' // TODO: Set the mimeType using the result from fileType.fromBuffer
      }
    })

    const temporaryAccessQueryParams = buildTemporaryAccessQueryParams(accountName, accountKey, containerName)(audioName)

    return {
      audioName,
      audioDuration: 0, // TODO: Return audio duration
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
