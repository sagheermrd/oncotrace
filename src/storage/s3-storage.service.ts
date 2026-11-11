import {
  DeleteObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import * as config from '@nestjs/config';

import storageConfig from '../config/storage.config.js';
import {
  CreatePresignedUploadUrlInput,
  ObjectStorage,
  StoredObjectMetadata,
} from './interfaces/object-storage.interface.js';
import { S3_CLIENT } from './storage.constants.js';

@Injectable()
export class S3StorageService implements ObjectStorage, OnModuleDestroy {
  constructor(
    @Inject(S3_CLIENT)
    private readonly s3Client: S3Client,
    @Inject(storageConfig.KEY)
    private readonly config: config.ConfigType<typeof storageConfig>,
  ) {}

  async createPresignedUploadUrl(
    input: CreatePresignedUploadUrlInput,
  ): Promise<string> {
    const { key, expiresInSeconds, contentType, contentLength } = input;

    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      ...(contentType ? { ContentType: contentType } : {}),
      ...(contentLength ? { ContentLength: contentLength } : {}),
    });

    return getSignedUrl(this.s3Client, command, {
      expiresIn: expiresInSeconds,
    });
  }

  async getObjectMetadata(key: string): Promise<StoredObjectMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        contentLength: response.ContentLength,
        contentType: response.ContentType,
        etag: response.ETag,
        checksumSha256: response.ChecksumSHA256,
        lastModified: response.LastModified,
      };
    } catch (error: unknown) {
      const statusCode =
        typeof error === 'object' && error !== null && '$metadata' in error
          ? (
              error as {
                $metadata?: { httpStatusCode?: number };
              }
            ).$metadata?.httpStatusCode
          : undefined;
      const errorName =
        typeof error === 'object' && error !== null && 'name' in error
          ? String((error as { name: unknown }).name)
          : undefined;

      if (statusCode === 404 || errorName === 'NotFound') {
        return null;
      }
      throw error;
    }
  }

  async deleteObject(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  onModuleDestroy() {
    this.s3Client.destroy();
  }
}
