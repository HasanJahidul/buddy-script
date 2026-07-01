import { Injectable, NotFoundException } from '@nestjs/common';
import { Visibility } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private readonly prisma: PrismaService) {}

  async togglePostLike(meId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, authorId: true, visibility: true },
    });
    if (
      !post ||
      (post.visibility === Visibility.PRIVATE && post.authorId !== meId)
    ) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.prisma.postLike.findUnique({
      where: { userId_postId: { userId: meId, postId } },
      select: { id: true },
    });

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.postLike.delete({
          where: { userId_postId: { userId: meId, postId } },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);
      return { liked: false, likeCount: updated.likeCount };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.postLike.create({ data: { userId: meId, postId } }),
      this.prisma.post.update({
        where: { id: postId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      }),
    ]);
    return { liked: true, likeCount: updated.likeCount };
  }

  async toggleCommentLike(meId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        post: { select: { authorId: true, visibility: true } },
      },
    });
    if (
      !comment ||
      (comment.post.visibility === Visibility.PRIVATE &&
        comment.post.authorId !== meId)
    ) {
      throw new NotFoundException('Comment not found');
    }

    const existing = await this.prisma.commentLike.findUnique({
      where: { userId_commentId: { userId: meId, commentId } },
      select: { id: true },
    });

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.commentLike.delete({
          where: { userId_commentId: { userId: meId, commentId } },
        }),
        this.prisma.comment.update({
          where: { id: commentId },
          data: { likeCount: { decrement: 1 } },
          select: { likeCount: true },
        }),
      ]);
      return { liked: false, likeCount: updated.likeCount };
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.commentLike.create({ data: { userId: meId, commentId } }),
      this.prisma.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true },
      }),
    ]);
    return { liked: true, likeCount: updated.likeCount };
  }
}
