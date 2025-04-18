import { api } from './axios';
import { CreateExchangeDto, ExchangeDto, UpdateExchangeDto } from '../../../backend/src/common/types';

export async function getAll(): Promise<ExchangeDto[]> {
  const response = await api.get('/exchange');
  if (response.status == 200) {
    return response.data;
  }
  return [];
}

export async function get(id: number): Promise<ExchangeDto | undefined> {
  const response = await api.get('/exchange/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function create(
  newExchange: CreateExchangeDto
): Promise<ExchangeDto | undefined> {
  const response = await api.post('/exchange', newExchange);
  if (response.status == 201) {
    return response.data;
  }
  return;
}

export async function update(
  id: number,
  payload: UpdateExchangeDto
): Promise<ExchangeDto | undefined> {
  const response = await api.patch('/exchange/' + id, payload);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function remove(id: number): Promise<ExchangeDto | undefined> {
  const response = await api.delete('/exchange/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}
export async function updateExchangeProjects(
  id: number,
  projectIds: number[]
): Promise<ExchangeDto | undefined> {
  const response = await api.patch(`/exchange/${id}/projects`, { projects: projectIds });
  if (response.status == 200) {
    return response.data;
  }
  return;
}