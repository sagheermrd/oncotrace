import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListCaseQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of cases returned per page.',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({
    description:
      'Opaque cursor returned by the previous page. Omit it to retrieve the first page.',
    example:
      'eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTIwVDEwOjAwOjAwLjAwMFoiLCJpZCI6IjExMTExMTExLTExMTEtNDExMS04MTExLTExMTExMTExMTExMSJ9',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
