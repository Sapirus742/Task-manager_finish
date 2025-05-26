/* eslint-disable @typescript-eslint/no-explicit-any */
import { api } from './axios';
import { CreatePortfolioDto, PortfolioDto, UpdatePortfolioDto } from '../../../backend/src/common/types';

export async function getAll(): Promise<PortfolioDto[]> {
  const response = await api.get('/portfolio');
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

export async function get(id: number): Promise<PortfolioDto | undefined> {
  const response = await api.get('/portfolio/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function create(
  newPortfolio: CreatePortfolioDto
): Promise<PortfolioDto | undefined> {
  console.log('[API] Отправка запроса на создание записи в портфолио:', newPortfolio) 
  try {
    const response = await api.post('/portfolio', newPortfolio);
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
    console.error('[API] Ошибка при создании:', {
      message: error.message,
      response: error.response,
      config: error.config
    });
    throw err;
  }
}

export async function update(
  id: number,
  payload: UpdatePortfolioDto
): Promise<PortfolioDto | undefined> {
  const response = await api.patch('/portfolio/' + id, payload);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function remove(id: number): Promise<PortfolioDto | undefined> {
  const response = await api.delete('/portfolio/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}