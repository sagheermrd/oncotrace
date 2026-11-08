import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

import { InputFileType } from '../../generated/prisma/client.ts';

export class CreateInputFileDto {
  @IsString()
  @MaxLength(255)
  fileName!: string;

  @IsEnum(InputFileType)
  fileType!: InputFileType;

  @IsOptional()
  @IsString()
  @Matches(/^(0|[1-9]\d{0,18})$/, {
    message: 'expectedSizeBytes must be a non-negative integer string',
  })
  expectedSizeBytes?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-fA-F0-9]{64}$/, {
    message: 'expectedChecksumSha256 must be a valid SHA-256 checksum',
  })
  expectedChecksumSha256?: string;
}
