import { defineStore } from 'pinia';
import { ref } from 'vue';
import { TeamDto } from '../../../backend/src/common/types';
import * as api from '../api/team.api';
import * as projectApi from '../api/project.api';

export const useTeamStore = defineStore('team', () => {
    const currentTeam = ref<TeamDto | null>(null);
    const isLoading = ref(false);
    const error = ref<string | null>(null);

    const fetchTeam = async (teamId: number) => {
        try {
            isLoading.value = true;
            error.value = null;
            const data = await api.get(teamId);
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
                // Загружаем полные данные команды по ID
                return await fetchTeam(project.teams[0].id);
            }
            return null;
        } catch (err) {
            error.value = 'Не удалось загрузить команду проекта';
            console.error('Error fetching project team:', err);
            return null;
        }
    };

    return {
        currentTeam,
        isLoading,
        error,
        fetchTeam,
        fetchTeamByProject,
    };
});