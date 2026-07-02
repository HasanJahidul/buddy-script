'use client';

import { useState } from 'react';
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { AuthUser, CommentDto, Page } from '@/lib/types';
import CommentForm from './CommentForm';
import CommentItem from './CommentItem';

export default function CommentSection({
  postId,
  currentUser,
  commentCount,
  onCommentAdded,
}: {
  postId: string;
  currentUser: AuthUser;
  commentCount: number;
  onCommentAdded: () => void;
}) {
  const queryClient = useQueryClient();
  const commentsKey = ['comments', postId];
  const [expanded, setExpanded] = useState(false);

  const query = useInfiniteQuery({
    queryKey: commentsKey,
    queryFn: ({ pageParam }) =>
      apiGet<Page<CommentDto>>(
        `/posts/${postId}/comments?limit=10${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  // API returns newest-first; render oldest -> newest (newest at the bottom).
  const loaded = query.data?.pages.flatMap((p) => p.items) ?? [];
  const chronological = [...loaded].reverse();

  // Collapsed shows only the latest comment; expanded shows everything loaded.
  const visible = expanded ? chronological : chronological.slice(-1);
  const hidden = Math.max(0, commentCount - visible.length);

  async function viewPrevious() {
    if (!expanded) {
      setExpanded(true);
      if (query.hasNextPage && loaded.length < commentCount) {
        await query.fetchNextPage();
      }
    } else if (query.hasNextPage) {
      await query.fetchNextPage();
    }
  }

  function handleCreated(comment: CommentDto) {
    onCommentAdded();
    queryClient.setQueryData<InfiniteData<Page<CommentDto>>>(
      commentsKey,
      (old) => {
        if (!old) {
          return {
            pages: [{ items: [comment], nextCursor: null }],
            pageParams: [undefined],
          };
        }
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [{ ...first, items: [comment, ...first.items] }, ...rest],
        };
      },
    );
  }

  return (
    <div className="_feed_inner_timeline_cooment_area _mar_t16">
      <CommentForm
        postId={postId}
        currentUser={currentUser}
        onCreated={handleCreated}
      />

      <div className="_timline_comment_main _mar_t16">
        {query.isLoading && <p className="_muted_note">Loading comments…</p>}

        {!query.isLoading && commentCount === 0 && (
          <p className="_muted_note">No comments yet. Be the first!</p>
        )}

        {hidden > 0 && (
          <div className="_previous_comment">
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={() => void viewPrevious()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage
                ? 'Loading…'
                : `View ${hidden} previous comment${hidden === 1 ? '' : 's'}`}
            </button>
          </div>
        )}

        {visible.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            postId={postId}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}
