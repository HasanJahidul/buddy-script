import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  /** When set, this comment is a reply to the given (top-level) comment. */
  @IsOptional()
  @IsString()
  parentId?: string;
}
