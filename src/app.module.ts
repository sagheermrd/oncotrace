import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { CasesModule } from './cases/cases.module.js';
import { SamplesModule } from './samples/samples.module.ts';
import { InputFilesModule } from './input-files/input-files.module.js';
import StorageConfig from './config/storage.config.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [StorageConfig],
    }),
    PrismaModule,
    CasesModule,
    SamplesModule,
    InputFilesModule,
  ],
})
export class AppModule {}
