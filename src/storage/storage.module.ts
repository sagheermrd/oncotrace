import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';

import storageConfig from '../config/storage.config.js';
import { S3StorageService } from './s3-storage.service.js';
import { OBJECT_STORAGE, S3_CLIENT } from './storage.constants.js';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: S3_CLIENT,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): S3Client => {
        const config =
          configService.getOrThrow<ReturnType<typeof storageConfig>>('storage');

        return new S3Client({
          region: config.region,
          ...(config.endpoint ? { endpoint: config.endpoint } : {}),
          forcePathStyle: config.forcePathStyle,
          ...(config.credentials ? { credentials: config.credentials } : {}),
        });
      },
    },
    S3StorageService,
    {
      provide: OBJECT_STORAGE,
      useExisting: S3StorageService,
    },
  ],
  exports: [OBJECT_STORAGE],
})
export class StorageModule {}
