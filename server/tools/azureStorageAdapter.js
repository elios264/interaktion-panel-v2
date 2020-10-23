const { BlobServiceClient } = require('@azure/storage-blob');

// reference: https://docs.microsoft.com/en-us/azure/storage/blobs/storage-quickstart-blobs-nodejs#download-blobs
class AzureStorageAdapter {

  constructor(connectionString, container) {
    this.container = container;
    this.client = new BlobServiceClient.fromConnectionString(connectionString); // eslint-disable-line new-cap
  }

  async createFile(filename, data) {
    const containerClient = this.client.getContainerClient(this.container);
    const blockBlobClient = containerClient.getBlockBlobClient(filename);
    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);

    return uploadBlobResponse;
  }

  async deleteFile(filename) {
    const containerClient = this.client.getContainerClient(this.container);
    const deleteBlobResponse = await containerClient.deleteBlob(filename);
    return deleteBlobResponse;
  }

  getFileData() {
    throw new Error('getFileData needs to be implemented');
  }

  getFileLocation(config, filename) {
    return `${this.client.url}${this.container}/${filename}`;
  }

}

module.exports = {
  AzureStorageAdapter,
};
