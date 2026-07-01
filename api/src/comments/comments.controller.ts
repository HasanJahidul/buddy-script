import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly comments: CommentsService) {}

  @Get('posts/:postId/comments')
  list(
    @CurrentUser() me: AuthUser,
    @Param('postId') postId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.comments.listComments(me.id, postId, cursor, limit);
  }

  @Post('posts/:postId/comments')
  create(
    @CurrentUser() me: AuthUser,
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.comments.create(me.id, postId, dto);
  }

  @Get('comments/:id/replies')
  replies(
    @CurrentUser() me: AuthUser,
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.comments.listReplies(me.id, id, cursor, limit);
  }

  @Get('comments/:id/likers')
  likers(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.comments.likers(id, cursor, limit);
  }
}
