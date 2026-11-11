import { ApiProperty } from '@nestjs/swagger';

export class UploadUrlResponseDto {
  @ApiProperty({ format: 'uuid' })
  uploadSessionId!: string;

  @ApiProperty({ format: 'uri' })
  uploadUrl!: string;

  @ApiProperty({ example: 'PUT' })
  method!: 'PUT';

  @ApiProperty({ format: 'date-time' })
  expiresAt!: Date;

  @ApiProperty({
    type: 'object',
    additionalProperties: { type: 'string' },
    example: {
      'Content-Type': 'application/octet-stream',
    },
  })
  requiredHeaders!: Record<string, string>;
}
