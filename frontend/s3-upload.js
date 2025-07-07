// S3 config stub for serverless fallback
// Fill in your credentials and bucket info if using AWS S3

const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const S3_BUCKET = process.env.AWS_S3_BUCKET;

const uploadFileToS3 = async (fileBuffer, fileName, mimeType) => {
  const params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Body: fileBuffer,
    ContentType: mimeType,
    ACL: 'public-read',
  };
  return s3.upload(params).promise();
};

module.exports = { uploadFileToS3 };
