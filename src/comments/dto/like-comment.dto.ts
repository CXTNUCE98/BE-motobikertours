import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsEnum } from 'class-validator';

export enum LikeType {
  LIKE = 'like',
  DISLIKE = 'dislike',
}

export class LikeCommentDto {
  @ApiProperty({ example: 'uuid-user-123' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: LikeType, example: LikeType.LIKE })
  @IsEnum(LikeType)
  type: LikeType;
}
