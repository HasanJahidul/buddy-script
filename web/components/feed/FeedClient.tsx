'use client';

import { useEffect, useRef } from 'react';
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { AuthUser, Page, PostDto } from '@/lib/types';
import PostComposer from './PostComposer';
import PostCard from './PostCard';

export default function FeedClient({
  currentUser,
  initial,
}: {
  currentUser: AuthUser;
  initial: Page<PostDto> | null;
}) {
  const queryClient = useQueryClient();
  const feedKey = ['feed'];

  const query = useInfiniteQuery({
    queryKey: feedKey,
    queryFn: ({ pageParam }) =>
      apiGet<Page<PostDto>>(
        `/posts?limit=10${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    initialData: initial
      ? { pages: [initial], pageParams: [undefined] }
      : undefined,
  });

  const posts = query.data?.pages.flatMap((p) => p.items) ?? [];
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  function handleCreated(post: PostDto) {
    queryClient.setQueryData<InfiniteData<Page<PostDto>>>(feedKey, (old) => {
      if (!old) {
        return { pages: [{ items: [post], nextCursor: null }], pageParams: [undefined] };
      }
      const [first, ...rest] = old.pages;
      return {
        ...old,
        pages: [{ ...first, items: [post, ...first.items] }, ...rest],
      };
    });
  }

  // Infinite scroll sentinel.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        void fetchNextPage();
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div className="_feed_inner">
      <PostComposer currentUser={currentUser} onCreated={handleCreated} />

      {query.isLoading && <p className="_muted_note">Loading feed…</p>}

      {!query.isLoading && posts.length === 0 && (
        <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24">
          <p className="_muted_note">
            No posts yet. Share the first one above!
          </p>
        </div>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} currentUser={currentUser} />
      ))}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {query.isFetchingNextPage && (
        <p className="_muted_note">Loading more…</p>
      )}
    </div>
  );
}
