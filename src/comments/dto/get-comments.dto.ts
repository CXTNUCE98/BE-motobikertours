import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCommentsDto {
  @ApiPropertyOptional({
    description: 'Filter comments by blog ID',
    example: 'uuid-blog-123',
  })
  @IsOptional()
  @IsUUID()
  blogId?: string;

  @ApiPropertyOptional({
    description: 'Filter replies by parent comment ID',
    example: 'uuid-comment-123',
  })
  @IsOptional()
  @IsUUID()
  parentId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
