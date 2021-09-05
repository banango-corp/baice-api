const VError = require('verror')
const uuid = require('uuid').v4
const fileType = require('file-type')
const { BlobServiceClient, StorageSharedKeyCredential, generateBlobSASQueryParameters, BlobSASPermissions } = require('@azure/storage-blob')

async function storeAudio(audioBuffer, accountName, accountKey, containerName) {
  try {
    const fileTypeResult = await fileType.fromBuffer(audioBuffer)

    const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey)
    const blobServiceClient = new BlobServiceClient(`https://${accountName}.blob.core.windows.net`, sharedKeyCredential)
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blobName = `${uuid()}.${fileTypeResult.ext}`
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)

    await blockBlobClient.upload(audioBuffer, Buffer.byteLength(audioBuffer), {
      blobHTTPHeaders: {
        blobContentType: fileTypeResult.mime
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

    return { blobURL, temporaryURL }
  } catch (error) {
    throw new VError(error, 'Failed to store the audio buffer')
  }
}

module.exports = {
  storeAudio
}
