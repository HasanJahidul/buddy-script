import { Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { LikesService } from './likes.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class LikesController {
  constructor(private readonly likes: LikesService) {}

  @HttpCode(200)
  @Post('posts/:id/like')
  togglePostLike(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.likes.togglePostLike(me.id, id);
  }

  @HttpCode(200)
  @Post('comments/:id/like')
  toggleCommentLike(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.likes.toggleCommentLike(me.id, id);
  }
}
