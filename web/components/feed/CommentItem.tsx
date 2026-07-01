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
  ToggleLikeResult,
} from '@/lib/types';
import CommentForm from './CommentForm';
import WhoLiked from './WhoLiked';

function CommentBody({
  comment,
  currentUser,
  isReply,
  onReplyClick,
}: {
  comment: CommentDto;
  currentUser: AuthUser;
  isReply: boolean;
  onReplyClick?: () => void;
}) {
  const like = useLike(comment.likedByMe, comment.likeCount, () =>
    apiPost<ToggleLikeResult>(`/comments/${comment.id}/like`),
  );

  return (
    <div className="_comment_main" style={{ display: 'flex', gap: 10 }}>
      <div className="_comment_image">
        <span className="_comment_image_link">
          <img
            src={avatarSrc(comment.author)}
            alt={fullName(comment.author)}
            className="_comment_img1"
            width={36}
            height={36}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        </span>
      </div>
      <div className="_comment_area" style={{ flex: 1 }}>
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
          <div className="_total_reactions">
            <WhoLiked
              count={like.count}
              topLikers={[]}
              likersPath={`/comments/${comment.id}/likers`}
            />
          </div>
          <div className="_comment_reply">
            <div className="_comment_reply_num">
              <ul
                className="_comment_reply_list"
                style={{ display: 'flex', gap: 12, listStyle: 'none', padding: 0, margin: 0 }}
              >
                <li>
                  <span
                    className={`_comment_like ${like.liked ? '_is_active' : ''}`}
                    onClick={like.onToggle}
                    style={{ cursor: 'pointer' }}
                  >
                    {like.liked ? 'Liked' : 'Like'}
                    {like.count > 0 ? ` · ${like.count}` : ''}
                  </span>
                </li>
                {!isReply && (
                  <li>
                    <span onClick={onReplyClick} style={{ cursor: 'pointer' }}>
                      Reply
                    </span>
                  </li>
                )}
                <li>
                  <span className="_time_link">{timeAgo(comment.createdAt)}</span>
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
        currentUser={currentUser}
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
            <CommentBody
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              isReply
            />
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
