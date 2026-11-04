import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
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
import { SampleResponseDto } from './dto/sample-response.dto.js';
import { PaginatedSamplesResponseDto } from './dto/paginated-samples-response.dto.js';
import * as devAuthGuard from '../auth/dev-auth.guard.js';
import { CreateSampleDto } from './dto/create-sample.dto.js';
import { ListSamplesQueryDto } from './dto/list-samples-query.dto.js';
import { SamplesService } from './samples.service.js';

@Controller('cases/:caseId/samples')
@ApiTags('Samples')
@UseGuards(devAuthGuard.DevAuthGuard)
export class SamplesController {
  constructor(private readonly samplesService: SamplesService) {}
  @Get()
  @ApiOperation({
    summary: 'List samples',
    description:
      'Returns samples belonging to the specified case, ordered by creation date and ID in descending order. Supports cursor-based pagination.',
  })
  @ApiParam({
    name: 'caseId',
    description: 'UUID of the research case.',
  })
  @ApiOkResponse({
    description: 'Paginated list of samples.',
    type: PaginatedSamplesResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid pagination limit or cursor.',
  })
  @ApiNotFoundResponse({
    description: 'Research case not found or not accessible.',
  })
  async findAllSamples(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Query() query: ListSamplesQueryDto,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    return this.samplesService.findAllSamples(
      req.user.organizationId,
      req.user.userId,
      caseId,
      query,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Register a sample',
    description:
      'Creates a sample inside an existing research case. The organization is derived from the authenticated user context.',
  })
  @ApiParam({
    name: 'caseId',
    description: 'UUID of the research case.',
    example: '22222222-2222-4222-8222-222222222222',
  })
  @ApiCreatedResponse({
    description: 'Sample successfully registered.',
    type: SampleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid case UUID or request validation failed.',
  })
  @ApiNotFoundResponse({
    description: 'Research case not found or not accessible.',
  })
  @ApiConflictResponse({
    description: 'A sample with this external ID already exists in this case.',
  })
  async createSample(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Body() createSampleDto: CreateSampleDto,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    return this.samplesService.createSample(
      req.user.organizationId,
      req.user.userId,
      caseId,
      createSampleDto,
    );
  }

  @Get(':sampleId')
  @ApiOperation({
    summary: 'Retrieve a sample',
    description: 'Returns a sample belonging to the specified research case.',
  })
  @ApiParam({
    name: 'caseId',
    description: 'UUID of the research case.',
  })
  @ApiParam({
    name: 'sampleId',
    description: 'UUID of the sample.',
  })
  @ApiOkResponse({
    description: 'Sample successfully retrieved.',
    type: SampleResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid case or sample UUID.',
  })
  @ApiNotFoundResponse({
    description: 'Sample or research case not found or not accessible.',
  })
  async getSampleById(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Param('sampleId', ParseUUIDPipe) sampleId: string,
    @Param('caseId', ParseUUIDPipe) caseId: string,
  ) {
    return this.samplesService.findSampleById(
      req.user.organizationId,
      req.user.userId,
      caseId,
      sampleId,
    );
  }
}
