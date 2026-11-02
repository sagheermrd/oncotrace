import {
  ApiTags,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
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
import { CasesService } from './cases.service.js';
import * as devAuthGuard from '../auth/dev-auth.guard.js';
import { CreateCaseDto } from './dto/create-case.dto.js';
import { ListCaseQueryDto } from './dto/list-cases-query.dto.js';

@Controller('cases')
@ApiTags('Cases')
@UseGuards(devAuthGuard.DevAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new case',
    description:
      'Creates a new research case. The organization is derived from the authenticated user context.',
  })
  @ApiCreatedResponse({
    description: 'The created case.',
    schema: {
      example: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Research Case 1',
        description: 'Description of Research Case 1',
        externalReference: 'EXT-REF-001',
        createdAt: '2026-10-20T10:00:00.000Z',
        updatedAt: '2026-10-20T10:00:00.000Z',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid input data. Ensure that the name is provided and meets length constraints.',
  })
  @ApiNotFoundResponse({
    description:
      'The organization associated with the authenticated user was not found. This should not occur under normal circumstances.',
  })
  async createCase(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Body() createCaseDto: CreateCaseDto,
  ) {
    return this.casesService.createCase(req.user, createCaseDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List cases',
    description:
      'Returns a paginated list of research cases accessible to the authenticated user.',
  })
  @ApiOkResponse({
    description: 'Paginated list of cases.',
    schema: {
      example: {
        items: [
          {
            id: '11111111-1111-4111-8111-111111111111',
            name: 'Research Case 1',
            description: 'Description of Research Case 1',
            externalReference: 'EXT-REF-001',
            createdAt: '2026-10-20T10:00:00.000Z',
            updatedAt: '2026-10-20T10:00:00.000Z',
          },
        ],
        pageInfo: {
          limit: 20,
          hasNextPage: false,
          nextCursor: null,
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Invalid pagination parameters. Ensure that the limit is between 1 and 100 and that the cursor, if provided, is valid.',
  })
  async findAllCases(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Query() query: ListCaseQueryDto,
  ) {
    return await this.casesService.findAllCases(req.user, query);
  }

  @Get(':caseId')
  @ApiOperation({
    summary: 'Find a case by ID',
    description:
      'Returns the research case with the specified ID if it is accessible to the authenticated user.',
  })
  @ApiOkResponse({
    description: 'The requested case.',
    schema: {
      example: {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'Research Case 1',
        description: 'Description of Research Case 1',
        externalReference: 'EXT-REF-001',
        createdAt: '2026-10-20T10:00:00.000Z',
        updatedAt: '2026-10-20T10:00:00.000Z',
      },
    },
  })
  @ApiNotFoundResponse({
    description:
      'The specified case was not found or is not accessible to the authenticated user.',
  })
  async findCaseById(
    @Req() request: devAuthGuard.AuthenticatedRequest,
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
  ) {
    return await this.casesService.findCaseById(request.user, caseId);
  }
}
