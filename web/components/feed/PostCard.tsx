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

  // Show the current user's avatar in the who-liked stack optimistically:
  // drop them from the server list, then prepend if they currently like it.
  const others = post.topLikers.filter((u) => u.id !== currentUser.id);
  const displayLikers = like.liked ? [currentUser, ...others] : others;

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
            topLikers={displayLikers}
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

        <div className="_feed_inner_timeline_reaction">
          <button
            type="button"
            className={`_feed_inner_timeline_reaction_emoji _feed_reaction ${
              like.liked ? '_feed_reaction_active _is_active' : ''
            }`}
            onClick={like.onToggle}
          >
            <span className="_feed_inner_timeline_reaction_link">
              <span>
                <svg
                  className="_reaction_svg"
                  width="19"
                  height="19"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M7 10v10M2 12v6a2 2 0 002 2h13.28a2 2 0 001.98-1.7l1.38-9A2 2 0 0019.66 7H14V4a2 2 0 00-2-2l-3 7v11"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                </svg>
                {like.liked ? 'Liked' : 'Like'}
              </span>
            </span>
          </button>
          <button
            type="button"
            className="_feed_inner_timeline_reaction_comment _feed_reaction"
            onClick={() => setCommentsOpen((v) => !v)}
          >
            <span className="_feed_inner_timeline_reaction_link">
              <span>
                <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="21" height="21" fill="none" viewBox="0 0 21 21">
                  <path stroke="#000" d="M1 10.5c0-.464 0-.696.009-.893A9 9 0 019.607 1.01C9.804 1 10.036 1 10.5 1v0c.464 0 .696 0 .893.009a9 9 0 018.598 8.598c.009.197.009.429.009.893v6.046c0 1.36 0 2.041-.317 2.535a2 2 0 01-.602.602c-.494.317-1.174.317-2.535.317H10.5c-.464 0-.696 0-.893-.009a9 9 0 01-8.598-8.598C1 11.196 1 10.964 1 10.5v0z" />
                  <path stroke="#000" strokeLinecap="round" strokeLinejoin="round" d="M6.938 9.313h7.125M10.5 14.063h3.563" />
                </svg>
                Comment
              </span>
            </span>
          </button>
          <button
            type="button"
            className="_feed_inner_timeline_reaction_share _feed_reaction"
          >
            <span className="_feed_inner_timeline_reaction_link">
              <span>
                <svg className="_reaction_svg" xmlns="http://www.w3.org/2000/svg" width="24" height="21" fill="none" viewBox="0 0 24 21">
                  <path stroke="#000" strokeLinejoin="round" d="M23 10.5L12.917 1v5.429C3.267 6.429 1 13.258 1 20c2.785-3.52 5.248-5.429 11.917-5.429V20L23 10.5z" />
                </svg>
                Share
              </span>
            </span>
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
