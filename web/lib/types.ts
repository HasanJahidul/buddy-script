export type Visibility = 'PUBLIC' | 'PRIVATE';

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

export interface AuthUser extends PublicUser {
  email: string;
}

export interface PostDto {
  id: string;
  content: string | null;
  imageUrl: string | null;
  visibility: Visibility;
  createdAt: string;
  author: PublicUser;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  topLikers: PublicUser[];
}

export interface CommentDto {
  id: string;
  content: string;
  createdAt: string;
  parentId: string | null;
  author: PublicUser;
  likeCount: number;
  likedByMe: boolean;
  replyCount: number;
}

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
}

export interface ToggleLikeResult {
  liked: boolean;
  likeCount: number;
}
