import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  externalReference?: string;
}
