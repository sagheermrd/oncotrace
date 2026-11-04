import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ListSamplesQueryDto {
  @ApiPropertyOptional({
    type: 'integer',
    description: 'Maximum number of samples returned per page.',
    example: 20,
    default: 20,
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
    type: 'string',
    description:
      'Opaque cursor returned by the previous page. Omit it to retrieve the first page.',
    example: 'eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTIwVDEwOjAwOjAwLjAwMFoifQ',
  })
  @IsOptional()
  @IsString()
  cursor?: string;
}
