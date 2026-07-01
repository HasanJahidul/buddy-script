import { PrismaClient, Visibility, type User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_PASSWORD = 'Password123';

const demoUsers = [
  {
    email: 'alice@buddy.dev',
    firstName: 'Alice',
    lastName: 'Nguyen',
    avatarUrl: '/assets/images/chat_profile.png',
  },
  {
    email: 'bob@buddy.dev',
    firstName: 'Bob',
    lastName: 'Carter',
    avatarUrl: '/assets/images/chat_profile1.png',
  },
  {
    email: 'carol@buddy.dev',
    firstName: 'Carol',
    lastName: 'Diaz',
    avatarUrl: '/assets/images/Avatar.png',
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const users: User[] = [];
  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { firstName: u.firstName, lastName: u.lastName, avatarUrl: u.avatarUrl },
      create: { ...u, passwordHash },
    });
    users.push(user);
  }
  const [alice, bob, carol] = users;

  // Reset demo posts (cascades to their comments + likes) so the seed is repeatable.
  await prisma.post.deleteMany({
    where: { authorId: { in: users.map((u) => u.id) } },
  });

  // Public post by Bob with an image, liked by Alice + Carol, with a comment thread.
  const post1 = await prisma.post.create({
    data: {
      authorId: bob.id,
      content: 'Just shipped the Healthy Tracking App 🎉 Feedback welcome!',
      imageUrl: '/assets/images/card_ppl1.png',
      visibility: Visibility.PUBLIC,
    },
  });
  await prisma.postLike.createMany({
    data: [
      { postId: post1.id, userId: alice.id },
      { postId: post1.id, userId: carol.id },
    ],
  });
  await prisma.post.update({
    where: { id: post1.id },
    data: { likeCount: 2 },
  });

  const comment1 = await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: alice.id,
      content: 'This looks amazing — love the clean UI!',
      likeCount: 1,
    },
  });
  await prisma.commentLike.create({
    data: { commentId: comment1.id, userId: bob.id },
  });
  await prisma.comment.create({
    data: {
      postId: post1.id,
      authorId: bob.id,
      parentId: comment1.id,
      content: 'Thanks Alice! More features coming soon.',
    },
  });
  await prisma.post.update({
    where: { id: post1.id },
    data: { commentCount: 2 },
  });

  // Public text post by Carol.
  await prisma.post.create({
    data: {
      authorId: carol.id,
      content: 'Good morning Buddy Script! What is everyone building today?',
      visibility: Visibility.PUBLIC,
    },
  });

  // Private post by Alice — only visible to Alice.
  await prisma.post.create({
    data: {
      authorId: alice.id,
      content: 'Private note to self: refactor the auth flow before the demo.',
      visibility: Visibility.PRIVATE,
    },
  });

  // eslint-disable-next-line no-console
  console.log(
    `Seeded ${users.length} users (password: ${DEMO_PASSWORD}) and demo posts.`,
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
