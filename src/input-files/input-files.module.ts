import { Module } from '@nestjs/common';
import { InputFilesController } from './input-files.controller.js';
import { InputFilesService } from './input-files.service.js';

@Module({
  controllers: [InputFilesController],
  providers: [InputFilesService],
})
export class InputFilesModule {}
