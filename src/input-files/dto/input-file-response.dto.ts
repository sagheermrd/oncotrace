import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  InputFileStatus,
  InputFileType,
} from '../../generated/prisma/client.ts';

export class InputFileResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  fileName!: string;

  @ApiProperty({ enum: InputFileType })
  fileType!: InputFileType;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: '104857600',
  })
  sizeBytes!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 'a'.repeat(64),
  })
  checksumSha256!: string | null;

  @ApiProperty({ enum: InputFileStatus })
  status!: InputFileStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
