import { api } from './axios';
import { AgileDto, CreateAgileDto, UpdateAgileDto } from '../../../backend/src/common/types';

export async function getAll(): Promise<AgileDto[]> {
  const response = await api.get('/agile');
  if (response.status == 200) {
    return response.data;
  }
  return [];
}

export async function get(id: number): Promise<AgileDto | undefined> {
  const response = await api.get('/agile/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function create(
  newAgile: CreateAgileDto
): Promise<AgileDto | undefined> {
  const response = await api.post('/agile', newAgile);
  if (response.status == 201) {
    return response.data;
  }
  return;
}

export async function update(
  id: number,
  payload: UpdateAgileDto
): Promise<AgileDto | undefined> {
  const response = await api.patch('/agile/' + id, payload);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function remove(id: number): Promise<AgileDto | undefined> {
  const response = await api.delete('/agile/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}