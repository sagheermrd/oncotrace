import { Module } from '@nestjs/common';
import { CasesController } from './cases.controller.js';
import { CasesService } from './cases.service.ts';
import { DevAuthGuard } from '../auth/dev-auth.guard.ts';

@Module({
  controllers: [CasesController],
  providers: [CasesService, DevAuthGuard],
})
export class CasesModule {}
