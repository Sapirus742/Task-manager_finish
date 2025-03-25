import { api } from './axios';
import { CreateTeamDto, TeamDto, UpdateTeamDto} from '../../../backend/src/common/types';

export async function getAll(): Promise<TeamDto[]> {
  const response = await api.get('/team');
  if (response.status == 200) {
    return response.data;
  }
  return [];
}

export async function get(id: number): Promise<TeamDto | undefined> {
  const response = await api.get('/team/' + id);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function create(
  newTeam: CreateTeamDto
): Promise<TeamDto | undefined> {
  const response = await api.post('/team', newTeam);
  if (response.status == 201) {
    return response.data;
  }
  return;
}

export async function update(
  id: number,
  payload: UpdateTeamDto
): Promise<TeamDto | undefined> {
  const response = await api.patch('/team/' + id, payload);
  if (response.status == 200) {
    return response.data;
  }
  return;
}

export async function remove(id: number): Promise<void> {
  try {
    console.log('[API] DELETE /team/' + id);
    const response = await api.delete('/team/' + id);
    
    if (response.status !== 200 && response.status !== 204) {
      throw new Error(`HTTP ${response.status}`);
    }
    console.log('[API] Команда удалена');
  } catch (error) {
    console.error('[API] Ошибка удаления:', error);
    throw error;
  }
}