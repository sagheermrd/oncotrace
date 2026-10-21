import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CasesService } from './cases.service.js';
import { AuthenticatedRequest, DevAuthGuard } from '../auth/dev-auth.guard.js';
import { CreateCaseDto } from './dto/create-case.dto.js';

@Controller('cases')
@UseGuards(DevAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  async createCase(
    @Req() req: AuthenticatedRequest,
    @Body() createCaseDto: CreateCaseDto,
  ) {
    return this.casesService.createCase(req.user, createCaseDto);
  }

  @Get()
  async findAllCases(@Req() req: AuthenticatedRequest) {
    return await this.casesService.findAllCases(req.user);
  }

  @Get(':caseId')
  async findCaseById(
    @Req() request: AuthenticatedRequest,
    @Param('caseId', new ParseUUIDPipe()) caseId: string,
  ) {
    return await this.casesService.findCaseById(request.user, caseId);
  }
}
