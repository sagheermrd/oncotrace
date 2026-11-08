import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class InputFileResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '55555555-5555-4555-8555-555555555555',
  })
  id!: string;

  @ApiProperty({
    example: 'sample_R1.fastq.gz',
  })
  fileName!: string;

  @ApiProperty({
    enum: ['FASTQ', 'BAM', 'CRAM', 'VCF', 'GVCF', 'BED', 'OTHER'],
    example: 'FASTQ',
  })
  fileType!: string;

  @ApiPropertyOptional({
    description:
      'File size in bytes, represented as a string to preserve integer precision.',
    example: '104857600',
    nullable: true,
  })
  expectedSizeBytes!: string | null;

  @ApiProperty({
    enum: [
      'REGISTERED',
      'UPLOADING',
      'UPLOADED',
      'VALIDATING',
      'VALIDATED',
      'FAILED',
    ],
    example: 'REGISTERED',
  })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;
}

export class SampleResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '33333333-3333-4333-8333-333333333333',
  })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    example: '22222222-2222-4222-8222-222222222222',
  })
  organizationId!: string;

  @ApiProperty({
    format: 'uuid',
    example: '44444444-4444-4444-8444-444444444444',
  })
  caseId!: string;

  @ApiProperty({ example: 'SAMPLE-001' })
  externalId!: string;

  @ApiProperty({ example: 'TUMOR' })
  sampleType!: string;

  @ApiProperty({
    enum: ['REGISTERED', 'READY', 'ARCHIVED'],
    example: 'REGISTERED',
  })
  status!: string;

  @ApiProperty({ format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ format: 'date-time' })
  updatedAt!: Date;

  @ApiPropertyOptional({
    type: () => [InputFileResponseDto],
    description: 'Input files registered for this sample.',
  })
  inputFiles?: InputFileResponseDto[];
}
