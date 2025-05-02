import { api } from './axios';
import { CommentDto, CreateCommentDto, UpdateCommentDto } from '../../../backend/src/common/types';

export async function getAll(): Promise<CommentDto[]> {
  const response = await api.get('/comment');
  if (response.status == 200) {
    return response.data;
  }
  return [];
}

export async function get(id: number): Promise<CommentDto | undefined> {
  const response = await api.get('/comment/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function create(
  newComment: CreateCommentDto
): Promise<CommentDto | undefined> {
  const response = await api.post('/comment', newComment);
  if (response.status == 201) {
    return response.data;
  }
  return;
}

export async function update(
  id: number,
  payload: UpdateCommentDto
): Promise<CommentDto | undefined> {
  const response = await api.patch('/comment/' + id, payload);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function remove(id: number): Promise<CommentDto | undefined> {
  const response = await api.delete('/comment/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function getByIdeaId(ideaId: number): Promise<CommentDto[]> {
  const response = await api.get(`/comment/idea/${ideaId}`);
  if (response.status == 200) {
    return response.data;
  }
  return [];
}