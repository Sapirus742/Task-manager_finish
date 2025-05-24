import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../api/agile.api';
import type { AgileDto, CreateAgileDto, UpdateAgileDto } from '../../../backend/src/common/types';

export const useAgileStore = defineStore('agile', () => {
  const tasks = ref<AgileDto[]>([]);
  const isLoading = ref(false);

  const fetchTasksByProject = async (projectId: number) => {
    isLoading.value = true;
    try {
      const allTasks = await api.getAll();
      tasks.value = allTasks.filter(task => task.project.id === projectId);
    } finally {
      isLoading.value = false;
    }
  };

  const createTask = async (payload: CreateAgileDto) => {
    isLoading.value = true;
    try {
      const newTask = await api.create(payload);
      if (newTask) {
        tasks.value.push(newTask);
      }
      return newTask;
    } finally {
      isLoading.value = false;
    }
  };

  const updateTask = async (id: number, payload: UpdateAgileDto) => {
    isLoading.value = true;
    try {
      const updatedTask = await api.update(id, payload);
      if (updatedTask) {
        const index = tasks.value.findIndex(t => t.id === id);
        if (index !== -1) {
          tasks.value[index] = updatedTask;
        }
      }
      return updatedTask;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteTask = async (id: number) => {
    isLoading.value = true;
    try {
      await api.remove(id);
      tasks.value = tasks.value.filter(t => t.id !== id);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    tasks,
    isLoading,
    fetchTasksByProject,
    createTask,
    updateTask,
    deleteTask,
  };
});