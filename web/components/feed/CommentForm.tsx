'use client';

import { useState } from 'react';
import { apiPost, ApiError } from '@/lib/api';
import { avatarSrc } from '@/lib/format';
import type { AuthUser, CommentDto } from '@/lib/types';

export default function CommentForm({
  postId,
  parentId,
  currentUser,
  placeholder = 'Write a comment',
  onCreated,
}: {
  postId: string;
  parentId?: string;
  currentUser: AuthUser;
  placeholder?: string;
  onCreated: (comment: CommentDto) => void;
}) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    const text = content.trim();
    if (!text || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const comment = await apiPost<CommentDto>(`/posts/${postId}/comments`, {
        content: text,
        parentId,
      });
      onCreated(comment);
      setContent('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to comment');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="_feed_inner_comment_box">
      <form
        className="_feed_inner_comment_box_form"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        style={{ display: 'flex', alignItems: 'center', gap: 10 }}
      >
        <div className="_feed_inner_comment_box_content" style={{ flex: 1, display: 'flex', gap: 10 }}>
          <div className="_feed_inner_comment_box_content_image">
            <img
              src={avatarSrc(currentUser)}
              alt={currentUser.firstName}
              className="_comment_img"
              width={36}
              height={36}
              style={{ borderRadius: '50%', objectFit: 'cover' }}
            />
          </div>
          <div className="_feed_inner_comment_box_content_txt" style={{ flex: 1 }}>
            <textarea
              className="form-control _comment_textarea"
              placeholder={placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
              rows={1}
            />
          </div>
        </div>
        <div className="_feed_inner_comment_box_icon">
          <button
            type="submit"
            className="_feed_inner_comment_box_icon_btn"
            disabled={submitting}
            aria-label="Send"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke="#0d6efd" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>
      {error && <p className="_form_error">{error}</p>}
    </div>
  );
}
