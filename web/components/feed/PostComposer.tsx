'use client';

import { useRef, useState } from 'react';
import { apiPost, ApiError } from '@/lib/api';
import { avatarSrc } from '@/lib/format';
import type { AuthUser, PostDto, Visibility } from '@/lib/types';

async function uploadImage(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await apiPost<{
    uploadUrl: string;
    publicUrl: string;
  }>('/uploads/presign', { contentType: file.type, size: file.size });
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!put.ok) throw new Error('Image upload failed');
  return publicUrl;
}

export default function PostComposer({
  currentUser,
  onCreated,
}: {
  currentUser: AuthUser;
  onCreated: (post: PostDto) => void;
}) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('PUBLIC');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError(null);
    if (f && f.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller');
      return;
    }
    setFile(f);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  function clearImage() {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function submit() {
    if (!content.trim() && !file) {
      setError('Write something or add an image');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (file) imageUrl = await uploadImage(file);
      const post = await apiPost<PostDto>('/posts', {
        content: content.trim() || undefined,
        imageUrl,
        visibility,
      });
      onCreated(post);
      setContent('');
      clearImage();
      setVisibility('PUBLIC');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="_feed_inner_text_area _b_radious6 _padd_b24 _padd_t24 _padd_r24 _padd_l24 _mar_b16">
      <div className="_feed_inner_text_area_box">
        <div className="_feed_inner_text_area_box_image">
          <img
            src={avatarSrc(currentUser)}
            alt={currentUser.firstName}
            className="_txt_img"
            width={44}
            height={44}
            style={{ borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>
        <div className="_feed_inner_text_area_box_form" style={{ flex: 1 }}>
          <textarea
            className="form-control _textarea"
            placeholder="Write something ..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {error && <p className="_form_error">{error}</p>}

      {preview && (
        <div className="_composer_preview">
          <img src={preview} alt="preview" />
          <button type="button" onClick={clearImage} aria-label="Remove image">
            ×
          </button>
        </div>
      )}

      <div
        className="_feed_inner_text_area_bottom"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 16,
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div
          className="_feed_inner_text_area_item"
          style={{ display: 'flex', alignItems: 'center', gap: 14 }}
        >
          <div className="_feed_inner_text_area_bottom_photo _feed_common">
            <button
              type="button"
              className="_feed_inner_text_area_bottom_photo_link"
              onClick={() => fileRef.current?.click()}
            >
              <span className="_feed_inner_text_area_bottom_photo_iamge _mar_img">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="3" width="18" height="18" rx="3" stroke="#0d6efd" strokeWidth="1.6" />
                  <circle cx="8.5" cy="8.5" r="1.8" fill="#0d6efd" />
                  <path d="M21 16l-5-5-9 9" stroke="#0d6efd" strokeWidth="1.6" fill="none" />
                </svg>
              </span>
              Photo
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={pickImage}
              hidden
            />
          </div>

          <select
            className="_visibility_select"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            aria-label="Post visibility"
          >
            <option value="PUBLIC">🌐 Public</option>
            <option value="PRIVATE">🔒 Private</option>
          </select>
        </div>

        <div className="_feed_inner_text_area_btn">
          <button
            type="button"
            className="_feed_inner_text_area_btn_link"
            onClick={submit}
            disabled={submitting}
          >
            <span>{submitting ? 'Posting…' : 'Post'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
