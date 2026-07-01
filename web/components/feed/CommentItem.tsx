'use client';

import { useState } from 'react';
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api';
import { avatarSrc, fullName, timeAgo } from '@/lib/format';
import { useLike } from '@/lib/useLike';
import type {
  AuthUser,
  CommentDto,
  Page,
  PublicUser,
  ToggleLikeResult,
} from '@/lib/types';
import CommentForm from './CommentForm';

function CommentBody({
  comment,
  isReply,
  onReplyClick,
}: {
  comment: CommentDto;
  isReply: boolean;
  onReplyClick?: () => void;
}) {
  const like = useLike(comment.likedByMe, comment.likeCount, () =>
    apiPost<ToggleLikeResult>(`/comments/${comment.id}/like`),
  );
  const [likersOpen, setLikersOpen] = useState(false);
  const [likers, setLikers] = useState<PublicUser[] | null>(null);
  const [loadingLikers, setLoadingLikers] = useState(false);

  async function toggleLikers() {
    const next = !likersOpen;
    setLikersOpen(next);
    if (next && !likers && !loadingLikers) {
      setLoadingLikers(true);
      try {
        const page = await apiGet<Page<PublicUser>>(
          `/comments/${comment.id}/likers`,
        );
        setLikers(page.items);
      } finally {
        setLoadingLikers(false);
      }
    }
  }

  return (
    <div className="_comment_main">
      <div className="_comment_image">
        <span className="_comment_image_link">
          <img
            src={avatarSrc(comment.author)}
            alt={fullName(comment.author)}
            className="_comment_img1"
          />
        </span>
      </div>
      <div className="_comment_area">
        <div className="_comment_details">
          <div className="_comment_details_top">
            <div className="_comment_name">
              <h4 className="_comment_name_title">{fullName(comment.author)}</h4>
            </div>
          </div>
          <div className="_comment_status">
            <p className="_comment_status_text">
              <span style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</span>
            </p>
          </div>

          {like.count > 0 && (
            <div
              className="_total_reactions"
              onClick={toggleLikers}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              <div className="_total_react">
                <span className="_reaction_like">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                  </svg>
                </span>
                <span className="_reaction_heart">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </span>
              </div>
              <span className="_total">{like.count}</span>
              {likersOpen && (
                <ul
                  className="_who_liked_pop"
                  style={{ position: 'absolute', top: '100%', left: 0, zIndex: 40 }}
                >
                  {loadingLikers && <li>Loading…</li>}
                  {!loadingLikers &&
                    likers?.map((u) => <li key={u.id}>{fullName(u)}</li>)}
                  {!loadingLikers && likers && like.count > likers.length && (
                    <li>…and more</li>
                  )}
                </ul>
              )}
            </div>
          )}

          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul className="_comment_reply_list">
                <li>
                  <span
                    className={`_comment_like ${like.liked ? '_is_active' : ''}`}
                    onClick={like.onToggle}
                    style={{ cursor: 'pointer' }}
                  >
                    {like.liked ? 'Liked' : 'Like'}.
                  </span>
                </li>
                {!isReply && (
                  <li>
                    <span onClick={onReplyClick} style={{ cursor: 'pointer' }}>
                      Reply.
                    </span>
                  </li>
                )}
                <li>
                  <span className="_time_link">.{timeAgo(comment.createdAt)}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentItem({
  comment,
  postId,
  currentUser,
}: {
  comment: CommentDto;
  postId: string;
  currentUser: AuthUser;
}) {
  const queryClient = useQueryClient();
  const [replyOpen, setReplyOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);
  const [replyCount, setReplyCount] = useState(comment.replyCount);

  const repliesKey = ['replies', comment.id];
  const repliesQuery = useInfiniteQuery({
    queryKey: repliesKey,
    enabled: repliesOpen,
    queryFn: ({ pageParam }) =>
      apiGet<Page<CommentDto>>(
        `/comments/${comment.id}/replies?limit=10${pageParam ? `&cursor=${pageParam}` : ''}`,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });

  const replies = repliesQuery.data?.pages.flatMap((p) => p.items) ?? [];

  function handleReplyCreated(reply: CommentDto) {
    setReplyCount((c) => c + 1);
    setRepliesOpen(true);
    setReplyOpen(false);
    queryClient.setQueryData<InfiniteData<Page<CommentDto>>>(
      repliesKey,
      (old) => {
        if (!old) {
          return { pages: [{ items: [reply], nextCursor: null }], pageParams: [undefined] };
        }
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [{ ...first, items: [reply, ...first.items] }, ...rest],
        };
      },
    );
  }

  return (
    <div className="_comment_wrapper _mar_b16">
      <CommentBody
        comment={comment}
        isReply={false}
        onReplyClick={() => setReplyOpen((v) => !v)}
      />

      <div style={{ marginLeft: 46 }}>
        {replyOpen && (
          <CommentForm
            postId={postId}
            parentId={comment.id}
            currentUser={currentUser}
            placeholder="Write a reply"
            onCreated={handleReplyCreated}
          />
        )}

        {!repliesOpen && replyCount > 0 && (
          <button
            type="button"
            className="_previous_comment_txt"
            onClick={() => setRepliesOpen(true)}
          >
            View {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
          </button>
        )}

        {repliesOpen &&
          replies.map((reply) => (
            <CommentBody key={reply.id} comment={reply} isReply />
          ))}

        {repliesOpen && repliesQuery.hasNextPage && (
          <button
            type="button"
            className="_previous_comment_txt"
            onClick={() => void repliesQuery.fetchNextPage()}
            disabled={repliesQuery.isFetchingNextPage}
          >
            View more replies
          </button>
        )}
      </div>
    </div>
  );
}
