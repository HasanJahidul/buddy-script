import { IsInt, IsString, Max, Min } from 'class-validator';

export class PresignDto {
  @IsString()
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(5 * 1024 * 1024) // 5 MB
  size!: number;
}
