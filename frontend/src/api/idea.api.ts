import { api } from './axios';
import { CreateIdeaDto, IdeaDto, UpdateIdeaDto } from '../../../backend/src/common/types';

export async function getAll(): Promise<IdeaDto[]> {
  try {
    const response = await api.get('/idea');
    return response.data;
  } catch (error) {
    console.error('Ошибка при загрузке идей:', error);
    throw error;
  }
}

export async function get(id: number): Promise<IdeaDto | undefined> {
  try {
    const response = await api.get(`/idea/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при загрузке идеи ${id}:`, error);
    throw error;
  }
}

export async function addApproved(id: number, app: number): Promise<IdeaDto | undefined> {
  try {
    const response = await api.get(`/idea/${id}/${app}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при одобрении идеи ${id}:`, error);
    throw error;
  }
}

export async function create(newIdea: CreateIdeaDto): Promise<IdeaDto | undefined> {
  try {
    const response = await api.post('/idea', newIdea);
    return response.data;
  } catch (error) {
    console.error('Ошибка при создании идеи:', error);
    throw error;
  }
}

export async function update(
  id: number,
  payload: UpdateIdeaDto
): Promise<IdeaDto | undefined> {
  try {
    const response = await api.patch(`/idea/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при обновлении идеи ${id}:`, error);
    throw error;
  }
}

export async function remove(id: number): Promise<IdeaDto | undefined> {
  try {
    const response = await api.delete(`/idea/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Ошибка при удалении идеи ${id}:`, error);
    throw error;
  }
}