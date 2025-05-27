// src/stores/project-store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../api/project.api';
import { ProjectDto, UpdateProjectDto } from '../../../backend/src/common/types';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<ProjectDto[]>([]);
  const isLoading = ref(false);

  const fetchAllProjects = async () => {
    isLoading.value = true;
    try {
      projects.value = await api.getAll();
    } finally {
      isLoading.value = false;
    }
  };

const updateProject = async (id: number, payload: UpdateProjectDto) => {
    isLoading.value = true;
    try {
      const updatedProject = await api.update(id, payload);
      if (updatedProject) {
        const index = projects.value.findIndex(p => p.id === id);
        if (index !== -1) {
          projects.value[index] = updatedProject;
        }
        return updatedProject;
      }
    } finally {
      isLoading.value = false;
    }
  };

  return {
    projects,
    isLoading,
    fetchAllProjects,
    updateProject
  };
});