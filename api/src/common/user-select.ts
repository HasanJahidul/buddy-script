import { Prisma } from '@prisma/client';

/** The public shape of a user embedded in posts/comments/likes responses. */
export const publicUserSelect = {
  id: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;
