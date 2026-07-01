import { clampLimit, toPage, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './pagination';

describe('clampLimit', () => {
  it('returns the default when undefined', () => {
    expect(clampLimit(undefined)).toBe(DEFAULT_PAGE_SIZE);
  });
  it('respects a custom default', () => {
    expect(clampLimit(undefined, 10)).toBe(10);
  });
  it('clamps above the max', () => {
    expect(clampLimit(9999)).toBe(MAX_PAGE_SIZE);
  });
  it('passes a valid value through', () => {
    expect(clampLimit(20)).toBe(20);
  });
});

describe('toPage', () => {
  it('returns no cursor when rows fit within the limit', () => {
    const page = toPage([{ id: 'a' }, { id: 'b' }], 5);
    expect(page.items).toHaveLength(2);
    expect(page.nextCursor).toBeNull();
  });

  it('trims the extra row and returns the last kept id as the cursor', () => {
    const page = toPage([{ id: 'a' }, { id: 'b' }, { id: 'c' }], 2);
    expect(page.items.map((i) => i.id)).toEqual(['a', 'b']);
    expect(page.nextCursor).toBe('b');
  });
});
