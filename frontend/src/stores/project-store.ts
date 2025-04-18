// src/stores/project-store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../api/project.api';
import { ProjectDto } from '../../../backend/src/common/types';

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

  return {
    projects,
    isLoading,
    fetchAllProjects,
  };
});