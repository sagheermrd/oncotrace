import { Module } from '@nestjs/common';
import { InputFilesController } from './input-files.controller.js';
import { InputFilesService } from './input-files.service.js';
import { StorageModule } from '../storage/storage.module.js';
import { UploadSessionsController } from './upload-sessions.controller.js';
@Module({
  imports: [StorageModule],
  controllers: [InputFilesController, UploadSessionsController],
  providers: [InputFilesService],
  exports: [InputFilesService],
})
export class InputFilesModule {}
