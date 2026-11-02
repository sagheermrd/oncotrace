import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateSampleDto {
  @ApiProperty({
    description: 'External identifier assigned to the biological sample.',
    example: 'SAMPLE-001',
    maxLength: 255,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  externalId!: string;

  @ApiProperty({
    description: 'Biological sample type.',
    example: 'Tumor',
    maxLength: 100,
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sampleType!: string;
}
