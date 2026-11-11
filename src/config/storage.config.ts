import { registerAs } from '@nestjs/config';

function getOptionalBoolean(
  val: string | undefined,
  defaultValue: boolean,
): boolean | undefined {
  if (val === undefined || val.trim() === '') {
    return defaultValue;
  }
  const normalizedVal = val.trim().toLowerCase();
  if (normalizedVal === 'true') {
    return true;
  }
  if (normalizedVal === 'false') {
    return false;
  }
  throw new Error('S3_FORCE_PATH_STYLE must be true or false');
}

export default registerAs('storage', () => {
  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.S3_REGION?.trim() || 'eu-central-1';
  const endpoint = process.env.S3_ENDPOINT?.trim() || undefined;

  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim() || undefined;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim() || undefined;

  if (!bucket) {
    throw new Error('S3_BUCKET environment variable is required');
  }

  if (Boolean(accessKeyId) !== Boolean(secretAccessKey)) {
    throw new Error(
      'S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY must be configured together',
    );
  }

  return {
    bucket,
    region,
    endpoint,
    accessKeyId,
    secretAccessKey,
    forcePathStyle: getOptionalBoolean(
      process.env.S3_FORCE_PATH_STYLE,
      Boolean(endpoint),
    ),
    credentials:
      accessKeyId && secretAccessKey
        ? { accessKeyId, secretAccessKey }
        : undefined,
    UploadUrlExpirationSeconds: 600, // 10 minutes
  };
});
