import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser, type AuthUser } from '../common/current-user.decorator';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { FeedQueryDto } from './dto/feed-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  feed(@CurrentUser() me: AuthUser, @Query() query: FeedQueryDto) {
    return this.posts.getFeed(me.id, query.cursor, query.limit);
  }

  @Post()
  create(@CurrentUser() me: AuthUser, @Body() dto: CreatePostDto) {
    return this.posts.create(me.id, dto);
  }

  @Get(':id')
  getOne(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.posts.getOne(me.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() me: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.posts.update(me.id, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() me: AuthUser, @Param('id') id: string) {
    return this.posts.remove(me.id, id);
  }

  @Get(':id/likers')
  likers(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.posts.likers(id, cursor, limit);
  }
}
