/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from './axios';
import { CreateUserDto, SecuredUser, UpdateUserDto } from '../../../backend/src/common/types';

export async function getAll(): Promise<SecuredUser[]> {
  const response = await api.get('/users');
  if (response.status == 200) {
    return response.data;
  }
  return [];
}

interface ApiError extends Error {
  response?: {
    status?: number;
    data?: any;
  };
  config?: {
    url?: string;
    method?: string;
    data?: any;
  };
}

export async function create(
  newUser: CreateUserDto
): Promise<SecuredUser | undefined> {
  const response = await api.post('/users', newUser);
  if (response.status == 201) {
    return response.data;
  }
  return;
}

export async function get(id: number): Promise<SecuredUser | undefined> {
  const response = await api.get('/users/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function update(
  id: number,
  payload: UpdateUserDto
): Promise<SecuredUser | undefined> {
  console.log('[API] Отправка запроса на обновление:', { id, payload });
  try {
    const response = await api.patch('/users/' + id, payload);
    console.log('[API] Ответ сервера:', { 
      status: response.status, 
      data: response.data 
    });
    if (response.status == 200) {
      return response.data;
    }
    return;
  } catch (err: unknown) {
    const error = err as ApiError;
    console.error('[API] Ошибка при обновлении:', {
      message: error.message,
      response: error.response,
      config: error.config
    });
    throw err;
  }
}