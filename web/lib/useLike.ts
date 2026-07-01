'use client';

import { useState } from 'react';
import type { ToggleLikeResult } from './types';

/**
 * Optimistic like toggle. Flips liked/count immediately, calls the API, then
 * reconciles with the server result (or reverts on error).
 */
export function useLike(
  initialLiked: boolean,
  initialCount: number,
  toggle: () => Promise<ToggleLikeResult>,
) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function onToggle() {
    if (busy) return;
    setBusy(true);
    const prev = { liked, count };
    setLiked(!liked);
    setCount(liked ? count - 1 : count + 1);
    try {
      const res = await toggle();
      setLiked(res.liked);
      setCount(res.likeCount);
    } catch {
      setLiked(prev.liked);
      setCount(prev.count);
    } finally {
      setBusy(false);
    }
  }

  return { liked, count, busy, onToggle };
}
