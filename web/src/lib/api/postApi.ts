import apiClient from './apiClient';

export interface MediaItemDTO {
  url: string;
  mediaType: 'IMAGE' | 'VIDEO';
  fileName?: string;
}

export interface AuthorDTO {
  firebaseUid: string;
  name: string;
  profilePictureUrl?: string;
  role: 'STUDENT' | 'ALUMNI' | 'ADMIN';
  roleBadge: 'blue' | 'gold' | 'red';
  initials: string;
}

export interface PostMediaDTO {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  fileName?: string;
}

export interface PostDTO {
  id: string;
  author: AuthorDTO;
  textContent?: string;
  mediaItems: PostMediaDTO[];
  reactionCount: number;
  reactedByCurrentUser: boolean;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDTO {
  id: string;
  postId: string;
  parentId?: string;
  author: AuthorDTO;
  content: string;
  replies: CommentDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  last: boolean;
}

export const postApi = {
  createPost: (data: { textContent?: string; mediaUrls?: MediaItemDTO[] }): Promise<PostDTO> =>
    apiClient.post('/api/posts', data).then(r => r.data),

  getFeed: (page = 0, size = 20): Promise<Page<PostDTO>> =>
    apiClient.get('/api/posts', { params: { page, size } }).then(r => r.data),

  getPostsByUser: (userId: string, page = 0, size = 10): Promise<Page<PostDTO>> =>
    apiClient.get(`/api/posts/user/${userId}`, { params: { page, size } }).then(r => r.data),

  getPost: (id: string): Promise<PostDTO> =>
    apiClient.get(`/api/posts/${id}`).then(r => r.data),

  updatePost: (id: string, data: { textContent?: string }): Promise<PostDTO> =>
    apiClient.put(`/api/posts/${id}`, data).then(r => r.data),

  deletePost: (id: string): Promise<void> =>
    apiClient.delete(`/api/posts/${id}`).then(r => r.data),

  toggleReaction: (id: string): Promise<{ reacted: boolean }> =>
    apiClient.post(`/api/posts/${id}/react`).then(r => r.data),

  getComments: (postId: string, page = 0, size = 20): Promise<Page<CommentDTO>> =>
    apiClient.get(`/api/posts/${postId}/comments`, { params: { page, size } }).then(r => r.data),

  addComment: (postId: string, content: string): Promise<CommentDTO> =>
    apiClient.post(`/api/posts/${postId}/comments`, { content }).then(r => r.data),

  addReply: (postId: string, commentId: string, content: string): Promise<CommentDTO> =>
    apiClient.post(`/api/posts/${postId}/comments/${commentId}/replies`, { content }).then(r => r.data),

  getReactions: (postId: string): Promise<AuthorDTO[]> =>
    apiClient.get(`/api/posts/${postId}/reactions`).then(r => r.data),

  deleteComment: (postId: string, commentId: string): Promise<void> =>
    apiClient.delete(`/api/posts/${postId}/comments/${commentId}`).then(r => r.data),
};
