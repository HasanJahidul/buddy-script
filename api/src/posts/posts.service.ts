import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/user-select';
import { clampLimit, toPage } from '../common/pagination';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

const postInclude = {
  author: { select: publicUserSelect },
  likes: {
    take: 3,
    orderBy: { createdAt: 'desc' as const },
    select: { user: { select: publicUserSelect } },
  },
} satisfies Prisma.PostInclude;

type PostWithRelations = Prisma.PostGetPayload<{ include: typeof postInclude }>;

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(meId: string, cursor?: string, limitInput?: number) {
    const limit = clampLimit(limitInput);
    const rows = await this.prisma.post.findMany({
      where: { OR: [{ visibility: Visibility.PUBLIC }, { authorId: meId }] },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: postInclude,
    });

    const { items, nextCursor } = toPage(rows, limit);
    const likedSet = await this.likedPostIds(meId, items.map((p) => p.id));
    return {
      items: items.map((p) => this.toDto(p, likedSet.has(p.id))),
      nextCursor,
    };
  }

  async getOne(meId: string, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: postInclude,
    });
    if (!post || (post.visibility === Visibility.PRIVATE && post.authorId !== meId)) {
      throw new NotFoundException('Post not found');
    }
    const likedSet = await this.likedPostIds(meId, [post.id]);
    return this.toDto(post, likedSet.has(post.id));
  }

  async create(meId: string, dto: CreatePostDto) {
    const content = dto.content?.trim() || null;
    const imageUrl = dto.imageUrl?.trim() || null;
    if (!content && !imageUrl) {
      throw new BadRequestException('A post needs text or an image');
    }
    const post = await this.prisma.post.create({
      data: {
        authorId: meId,
        content,
        imageUrl,
        visibility: dto.visibility ?? Visibility.PUBLIC,
      },
      include: postInclude,
    });
    return this.toDto(post, false);
  }

  async update(meId: string, id: string, dto: UpdatePostDto) {
    await this.assertOwner(meId, id);
    const post = await this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.content !== undefined ? { content: dto.content.trim() || null } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
      },
      include: postInclude,
    });
    const likedSet = await this.likedPostIds(meId, [post.id]);
    return this.toDto(post, likedSet.has(post.id));
  }

  async remove(meId: string, id: string) {
    await this.assertOwner(meId, id);
    await this.prisma.post.delete({ where: { id } });
    return { ok: true };
  }

  async likers(id: string, cursor?: string, limitInput?: number) {
    const limit = clampLimit(limitInput, 10);
    const rows = await this.prisma.postLike.findMany({
      where: { postId: id },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, user: { select: publicUserSelect } },
    });
    const { items, nextCursor } = toPage(rows, limit);
    return { items: items.map((r) => r.user), nextCursor };
  }

  private async assertOwner(meId: string, id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== meId) {
      throw new ForbiddenException('Not your post');
    }
  }

  private async likedPostIds(meId: string, ids: string[]): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.prisma.postLike.findMany({
      where: { userId: meId, postId: { in: ids } },
      select: { postId: true },
    });
    return new Set(rows.map((r) => r.postId));
  }

  private toDto(post: PostWithRelations, likedByMe: boolean) {
    return {
      id: post.id,
      content: post.content,
      imageUrl: post.imageUrl,
      visibility: post.visibility,
      createdAt: post.createdAt,
      author: post.author,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      likedByMe,
      topLikers: post.likes.map((l) => l.user),
    };
  }
}
