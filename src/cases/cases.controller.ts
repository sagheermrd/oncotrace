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
@UseGuards(devAuthGuard.DevAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  async createCase(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Body() createCaseDto: CreateCaseDto,
  ) {
    console.log('Creating case with data:', this.casesService);
    return this.casesService.createCase(req.user, createCaseDto);
  }

  @Get()
  async findAllCases(
    @Req() req: devAuthGuard.AuthenticatedRequest,
    @Query() query: ListCaseQueryDto,
  ) {
    return await this.casesService.findAllCases(req.user, query);
  }

  @Get(':caseId')
  async findCaseById(
    @Req() request: devAuthGuard.AuthenticatedRequest,
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
  ) {
    return await this.casesService.findCaseById(request.user, caseId);
  }
}
