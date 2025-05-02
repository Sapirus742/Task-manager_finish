import { api } from './axios';
import { CreateMessageDto, MessageDto, UpdateMessageDto } from '../common/types';

export async function getAll(): Promise<MessageDto[]> {
  const response = await api.get('/message');
  if (response.status == 200) {
    return response.data;
  }
  return [];
}

export async function get(id: number): Promise<MessageDto | undefined> {
  const response = await api.get('/message/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function create(
  newMessage: CreateMessageDto
): Promise<MessageDto | undefined> {
  const response = await api.post('/message', newMessage);
  if (response.status == 201) {
    return response.data;
  }
  return;
}

export async function update(
  id: number,
  payload: UpdateMessageDto
): Promise<MessageDto | undefined> {
  const response = await api.patch('/message/' + id, payload);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function remove(id: number): Promise<MessageDto | undefined> {
  const response = await api.delete('/message/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}