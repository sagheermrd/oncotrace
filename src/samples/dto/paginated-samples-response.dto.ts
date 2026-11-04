import { ApiProperty } from '@nestjs/swagger';
import { SampleResponseDto } from './sample-response.dto.js';

export class SamplesPageMetadataDto {
  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: true })
  hasNextPage!: boolean;

  @ApiProperty({
    example:
      'eyJjcmVhdGVkQXQiOiIyMDI2LTEwLTIwVDEwOjAwOjAwLjAwMFoiLCJpZCI6IjMzMzMzMzMzLTMzMzMtNDMzMy04MzMzLTMzMzMzMzMzMzMzMzMifQ',
    nullable: true,
    type: String,
  })
  nextCursor!: string | null;
}

export class PaginatedSamplesResponseDto {
  @ApiProperty({ type: () => [SampleResponseDto] })
  items!: SampleResponseDto[];

  @ApiProperty({ type: () => SamplesPageMetadataDto })
  pageInfo!: SamplesPageMetadataDto;
}
