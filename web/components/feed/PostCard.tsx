'use client';

import { useState } from 'react';
import { apiPost } from '@/lib/api';
import { avatarSrc, fullName, timeAgo } from '@/lib/format';
import { useLike } from '@/lib/useLike';
import type { AuthUser, PostDto, ToggleLikeResult } from '@/lib/types';
import WhoLiked from './WhoLiked';
import CommentSection from './CommentSection';

export default function PostCard({
  post,
  currentUser,
}: {
  post: PostDto;
  currentUser: AuthUser;
}) {
  const like = useLike(post.likedByMe, post.likeCount, () =>
    apiPost<ToggleLikeResult>(`/posts/${post.id}/like`),
  );
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount);

  return (
    <div className="_feed_inner_timeline_post_area _b_radious6 _padd_b24 _padd_t24 _mar_b16">
      <div className="_feed_inner_timeline_content _padd_r24 _padd_l24">
        <div className="_feed_inner_timeline_post_top">
          <div
            className="_feed_inner_timeline_post_box"
            style={{ display: 'flex', gap: 12, alignItems: 'center' }}
          >
            <div className="_feed_inner_timeline_post_box_image">
              <img
                src={avatarSrc(post.author)}
                alt={fullName(post.author)}
                className="_post_img"
                width={44}
                height={44}
                style={{ borderRadius: '50%', objectFit: 'cover' }}
              />
            </div>
            <div className="_feed_inner_timeline_post_box_txt">
              <h4 className="_feed_inner_timeline_post_box_title">
                {fullName(post.author)}
              </h4>
              <p className="_feed_inner_timeline_post_box_para">
                {timeAgo(post.createdAt)} ·{' '}
                <span>{post.visibility === 'PUBLIC' ? 'Public' : 'Private'}</span>
              </p>
            </div>
          </div>
        </div>

        {post.content && (
          <h4
            className="_feed_inner_timeline_post_title _mar_t16"
            style={{ whiteSpace: 'pre-wrap' }}
          >
            {post.content}
          </h4>
        )}

        {post.imageUrl && (
          <div className="_feed_inner_timeline_image _mar_t16 _mar_b16">
            <img
              src={post.imageUrl}
              alt="post"
              className="_time_img"
              style={{ maxWidth: '100%', borderRadius: 10 }}
            />
          </div>
        )}

        <div
          className="_feed_inner_timeline_total_reacts _padd_r24 _padd_l24 _mar_b26"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <WhoLiked
            count={like.count}
            topLikers={post.topLikers}
            likersPath={`/posts/${post.id}/likers`}
          />
          <div className="_feed_inner_timeline_total_reacts_txt">
            <p className="_feed_inner_timeline_total_reacts_para1">
              <span
                onClick={() => setCommentsOpen((v) => !v)}
                style={{ cursor: 'pointer' }}
              >
                <span>{commentCount}</span> Comment{commentCount === 1 ? '' : 's'}
              </span>
            </p>
          </div>
        </div>

        <div
          className="_feed_inner_timeline_reaction"
          style={{ display: 'flex', gap: 8 }}
        >
          <button
            type="button"
            className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${
              like.liked ? '_is_active' : ''
            }`}
            onClick={like.onToggle}
          >
            <span className="_feed_inner_timeline_reaction_link">
              {like.liked ? 'Liked' : 'Like'}
            </span>
          </button>
          <button
            type="button"
            className="_feed_inner_timeline_reaction_comment _feed_reaction"
            onClick={() => setCommentsOpen((v) => !v)}
          >
            <span className="_feed_inner_timeline_reaction_link">Comment</span>
          </button>
        </div>

        {commentsOpen && (
          <CommentSection
            postId={post.id}
            currentUser={currentUser}
            onCommentAdded={() => setCommentCount((c) => c + 1)}
          />
        )}
      </div>
    </div>
  );
}
