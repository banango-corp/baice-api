const VError = require('verror')
const uuid = require('uuid').v4
const fileType = require('file-type')
const mm = require('music-metadata')
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob')

async function uploadAudio(audioBuffer, accountName, accountKey, containerName) {
  try {
    const { mime: mimeType, ext: fileExtension } = await fileType.fromBuffer(audioBuffer)
    const { format: { duration: audioDuration } } = await mm.parseBuffer(audioBuffer, { mimeType })
    if (audioDuration > 30) {
      throw new VError({ name: 'ExceededMaximumDuration' }, 'Audio buffer exceeded the maximum duration of 30 seconds')
    }

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blobName = `${uuid()}.${fileExtension}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.upload(audioBuffer, Buffer.byteLength(audioBuffer), {
      blobHTTPHeaders: {
        blobContentType: mimeType
      }
    })

    const blobURL = blockBlobClient.url
    const temporaryAccessQueryParams = generateBlobSASQueryParameters({
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      startsOn: new Date(),
      expiresOn: new Date(new Date().valueOf() + 60000 * 60 * 24) // Expires in 24 hours
    }, sharedKeyCredential).toString()

    const temporaryURL = `${blobURL}?${temporaryAccessQueryParams}`

    return { audioName: blobName, audioDuration, temporaryURL }
  } catch (error) {
    throw new VError(error, 'Failed to store the audio buffer')
  }
}

module.exports = {
  uploadAudio
}
