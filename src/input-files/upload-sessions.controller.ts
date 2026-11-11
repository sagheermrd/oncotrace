import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

import type { AuthenticatedRequest } from '../auth/types/authenticated-request.js';
import { InputFilesService } from './input-files.service.js';
import { CreateUploadUrlDto } from './dto/create-upload-url.dto.js';
import { UploadUrlResponseDto } from './dto/upload-url-response.dto.js';
import { DevAuthGuard } from '../auth/dev-auth.guard.ts';

@UseGuards(DevAuthGuard)
@ApiTags('Input File Uploads')
@Controller('input-files')
export class UploadSessionsController {
  constructor(private readonly inputFilesService: InputFilesService) {}

  @Post(':inputFileId/upload-url')
  @ApiOperation({
    summary: 'Generate a presigned URL for uploading an input file',
  })
  @ApiParam({
    name: 'inputFileId',
    description: 'Input file UUID',
  })
  @ApiResponse({
    status: 201,
    description: 'Upload URL generated',
    type: UploadUrlResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid content type' })
  @ApiResponse({ status: 403, description: 'Organization membership required' })
  @ApiResponse({ status: 404, description: 'Input file not found' })
  @ApiResponse({
    status: 409,
    description: 'File cannot currently be uploaded',
  })
  async createUploadUrl(
    @Param('inputFileId') inputFileId: string,
    @Body() dto: CreateUploadUrlDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<UploadUrlResponseDto> {
    return await this.inputFilesService.createUploadUrl(
      inputFileId,
      request.user,
      dto.contentType,
    );
  }
}
