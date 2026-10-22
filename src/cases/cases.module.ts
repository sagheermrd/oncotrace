import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller.js';
import { CasesService } from './cases.service.js';
import { DevAuthGuard } from '../auth/dev-auth.guard.js';

@Module({
  controllers: [CasesController],
  providers: [CasesService, DevAuthGuard],
})
export class CasesModule {}
