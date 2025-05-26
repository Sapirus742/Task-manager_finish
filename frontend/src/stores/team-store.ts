import { defineStore } from 'pinia';
import { ref } from 'vue';
import { TeamDto } from '../../../backend/src/common/types';
import * as api from '../api/team.api';
import * as projectApi from '../api/project.api';

export const useTeamStore = defineStore('team', () => {
    const currentTeam = ref<TeamDto | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    // Добавляем метод для очистки текущей команды
    const clearCurrentTeam = () => {
        currentTeam.value = null;
    };

    const fetchTeam = async (teamId: number) => {
        try {
            isLoading.value = true;
            error.value = null;
            const data = await api.get(teamId);
            console.log('TeamData:',data)
            currentTeam.value = data || null;
            return currentTeam.value;
        } catch (err) {
            error.value = 'Не удалось загрузить команду';
            console.error('Error fetching team:', err);
            return null;
        } finally {
            isLoading.value = false;
        }
    };

    const fetchTeamByProject = async (projectId: number) => {
        try {
          isLoading.value = true;
          error.value = null;
          const project = await projectApi.get(projectId);
          if (project?.teams?.[0]?.id) {
            const team = await fetchTeam(project.teams[0].id);
            currentTeam.value = team;
            return team;
          }
          currentTeam.value = null;
          return null;
        } catch (err) {
          error.value = 'Не удалось загрузить команду проекта';
          console.error('Error fetching project team:', err);
          currentTeam.value = null;
          return null;
        } finally {
          isLoading.value = false;
        }
      };

    return {
        currentTeam,
        isLoading,
        error,
        fetchTeam,
        fetchTeamByProject,
        clearCurrentTeam,
    };
});