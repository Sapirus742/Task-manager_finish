import { api } from './axios';
import { CreateIdeaDto, IdeaDto, UpdateIdeaDto } from '../../../backend/src/common/types';

export async function getAll(): Promise<IdeaDto[]> {
  const response = await api.get('/idea');
  if (response.status == 200) {
    return response.data;
  }
  return [];
}

export async function get(id: number): Promise<IdeaDto | undefined> {
  const response = await api.get('/idea/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function addApproved(id: number, app: number): Promise<IdeaDto | undefined> {
  const response = await api.get('/idea/' + id + '/' + app);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function create(
  newIdea: CreateIdeaDto
): Promise<IdeaDto | undefined> {
  const response = await api.post('/idea', newIdea);
  if (response.status == 201) {
    return response.data;
  }
  return;
}

export async function update(
  id: number,
  payload: UpdateIdeaDto
): Promise<IdeaDto | undefined> {
  const response = await api.patch('/idea/' + id, payload);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function remove(id: number): Promise<IdeaDto | undefined> {
  const response = await api.delete('/idea/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}