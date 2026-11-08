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

  @ApiProperty({
    type: String,
    nullable: true,
    example: '104857600',
    description: 'File size in bytes, represented as a decimal string.',
  })
  expectedSizeBytes!: string | null;

  @ApiProperty({
    nullable: true,
    example: 'a'.repeat(64),
  })
  expectedChecksumSha256!: string | null;

  @ApiProperty({ enum: InputFileStatus })
  status!: InputFileStatus;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
