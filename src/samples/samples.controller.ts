import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import * as devAuthGuard from '../auth/dev-auth.guard.js';
import { CreateSampleDto } from './dto/create-sample.dto.js';
import { ListSamplesQueryDto } from './dto/list-samples-query.dto.js';
import { SamplesService } from './samples.service.js';

@Controller('cases/:caseId/samples')
@UseGuards(devAuthGuard.DevAuthGuard)
export class SamplesController {
  constructor(private readonly samplesService: SamplesService) {}
  @Get()
  async findAllSamples(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Query() query: ListSamplesQueryDto,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    console.log('Authenticated user:', req.user);
    return this.samplesService.findAllSamples(
      req.user.userId,
      req.user.organizationId,
      caseId,
      query,
    );
  }

  @UseGuards(devAuthGuard.DevAuthGuard)
  @Post()
  async createSample(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Body() createSampleDto: CreateSampleDto,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    return this.samplesService.createSample(
      req.user.userId,
      req.user.organizationId,
      caseId,
      createSampleDto,
    );
  }

  @UseGuards(devAuthGuard.DevAuthGuard)
  @Get(':sampleId')
  async getSampleById(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Param('sampleId', ParseUUIDPipe) sampleId: string,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    return this.samplesService.findSampleById(
      req.user.userId,
      req.user.organizationId,
      caseId,
      sampleId,
    );
  }
}
