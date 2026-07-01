import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { publicUserSelect } from '../common/user-select';
import { clampLimit, toPage } from '../common/pagination';
import { CreateCommentDto } from './dto/create-comment.dto';

const commentSelect = {
  id: true,
  content: true,
  createdAt: true,
  parentId: true,
  likeCount: true,
  author: { select: publicUserSelect },
  _count: { select: { replies: true } },
} satisfies Prisma.CommentSelect;

type CommentRow = Prisma.CommentGetPayload<{ select: typeof commentSelect }>;

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(meId: string, postId: string, dto: CreateCommentDto) {
    await this.assertPostVisible(meId, postId);

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, postId: true, parentId: true },
      });
      if (!parent || parent.postId !== postId) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parent.parentId !== null) {
        throw new BadRequestException('Cannot reply to a reply');
      }
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          postId,
          authorId: meId,
          content: dto.content.trim(),
          parentId: dto.parentId ?? null,
        },
        select: commentSelect,
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
        select: { id: true },
      }),
    ]);
    return this.toDto(comment, false);
  }

  async listComments(
    meId: string,
    postId: string,
    cursor?: string,
    limitInput?: number,
  ) {
    await this.assertPostVisible(meId, postId);
    const limit = clampLimit(limitInput, 10);
    const rows = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: commentSelect,
    });
    return this.buildPage(meId, rows, limit);
  }

  async listReplies(
    meId: string,
    commentId: string,
    cursor?: string,
    limitInput?: number,
  ) {
    const parent = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, post: { select: { authorId: true, visibility: true } } },
    });
    if (
      !parent ||
      (parent.post.visibility === Visibility.PRIVATE &&
        parent.post.authorId !== meId)
    ) {
      throw new NotFoundException('Comment not found');
    }
    const limit = clampLimit(limitInput, 10);
    const rows = await this.prisma.comment.findMany({
      where: { parentId: commentId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: commentSelect,
    });
    return this.buildPage(meId, rows, limit);
  }

  async likers(commentId: string, cursor?: string, limitInput?: number) {
    const limit = clampLimit(limitInput, 10);
    const rows = await this.prisma.commentLike.findMany({
      where: { commentId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: { id: true, user: { select: publicUserSelect } },
    });
    const { items, nextCursor } = toPage(rows, limit);
    return { items: items.map((r) => r.user), nextCursor };
  }

  private async buildPage(meId: string, rows: CommentRow[], limit: number) {
    const { items, nextCursor } = toPage(rows, limit);
    const likedSet = await this.likedCommentIds(
      meId,
      items.map((c) => c.id),
    );
    return {
      items: items.map((c) => this.toDto(c, likedSet.has(c.id))),
      nextCursor,
    };
  }

  private async assertPostVisible(meId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, visibility: true },
    });
    if (
      !post ||
      (post.visibility === Visibility.PRIVATE && post.authorId !== meId)
    ) {
      throw new NotFoundException('Post not found');
    }
  }

  private async likedCommentIds(
    meId: string,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await this.prisma.commentLike.findMany({
      where: { userId: meId, commentId: { in: ids } },
      select: { commentId: true },
    });
    return new Set(rows.map((r) => r.commentId));
  }

  private toDto(comment: CommentRow, likedByMe: boolean) {
    return {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      parentId: comment.parentId,
      author: comment.author,
      likeCount: comment.likeCount,
      likedByMe,
      replyCount: comment._count.replies,
    };
  }
}
