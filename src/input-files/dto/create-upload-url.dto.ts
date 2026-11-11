import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsMimeType, IsOptional, MaxLength } from 'class-validator';

export class CreateUploadUrlDto {
  @ApiPropertyOptional({
    example: 'application/octet-stream',
    maxLength: 127,
  })
  @IsOptional()
  @IsMimeType()
  @MaxLength(127)
  contentType?: string;
}
