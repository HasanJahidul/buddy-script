'use client';

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
  onCommentAdded,
}: {
  postId: string;
  currentUser: AuthUser;
  onCommentAdded: () => void;
}) {
  const queryClient = useQueryClient();
  const commentsKey = ['comments', postId];

  const query = useInfiniteQuery({
    queryKey: commentsKey,
    queryFn: ({ pageParam }) =>
      apiGet<Page<CommentDto>>(
        `/posts/${postId}/comments?limit=10${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const comments = query.data?.pages.flatMap((p) => p.items) ?? [];

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

        {!query.isLoading && comments.length === 0 && (
          <p className="_muted_note">No comments yet. Be the first!</p>
        )}

        {comments.map((c) => (
          <CommentItem
            key={c.id}
            comment={c}
            postId={postId}
            currentUser={currentUser}
          />
        ))}

        {query.hasNextPage && (
          <div className="_previous_comment">
            <button
              type="button"
              className="_previous_comment_txt"
              onClick={() => void query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage
                ? 'Loading…'
                : 'View previous comments'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
