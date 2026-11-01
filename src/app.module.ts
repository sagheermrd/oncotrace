import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module.js';
import { CasesModule } from './cases/cases.module.js';
import { SamplesModule } from './samples/samples.module.ts';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    CasesModule,
    SamplesModule,
  ],
})
export class AppModule {}
