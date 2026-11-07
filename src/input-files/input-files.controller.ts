import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateInputFileDto } from './dto/create-input-file.dto.js';
import { InputFileResponseDto } from './dto/input-file-response.dto.js';
import { InputFilesService } from './input-files.service.js';
import * as devAuthGuard from '../auth/dev-auth.guard.ts';

@UseGuards(devAuthGuard.DevAuthGuard)
@ApiTags('input-files')
@Controller('cases/:caseId/samples/:sampleId/input-files')
export class InputFilesController {
  constructor(private readonly inputFilesService: InputFilesService) {}

  @Post()
  @ApiOperation({
    summary: 'Register input file metadata',
  })
  @ApiCreatedResponse({ type: InputFileResponseDto })
  async createInputFile(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Param('caseId') caseId: string,
    @Param('sampleId') sampleId: string,
    @Body() createInputFileDto: CreateInputFileDto,
  ): Promise<InputFileResponseDto> {
    return this.inputFilesService.createInputFile(
      req.user.organizationId,
      req.user.userId,
      caseId,
      sampleId,
      createInputFileDto,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'List input files for a sample',
  })
  @ApiOkResponse({ type: [InputFileResponseDto] })
  async findAllInputFiles(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Param('caseId') caseId: string,
    @Param('sampleId') sampleId: string,
  ): Promise<InputFileResponseDto[]> {
    return this.inputFilesService.findAllInputFiles(
      req.user.organizationId,
      req.user.userId,
      caseId,
      sampleId,
    );
  }
  @Get(':inputFileId')
  @ApiOperation({ summary: 'Retrieve input file metadata' })
  @ApiOkResponse({ type: InputFileResponseDto })
  findOne(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Param('caseId') caseId: string,
    @Param('sampleId') sampleId: string,
    @Param('inputFileId') inputFileId: string,
  ) {
    return this.inputFilesService.findInputFileById(
      req.user.organizationId,
      req.user.userId,
      caseId,
      sampleId,
      inputFileId,
    );
  }
}
