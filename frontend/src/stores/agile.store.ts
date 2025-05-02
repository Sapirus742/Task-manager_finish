import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../../../backend/src/api/agile.api';
import type { AgileDto, CreateAgileDto, UpdateAgileDto } from '../../../backend/src/common/types';

export const useAgileStore = defineStore('agile', () => {
  const agileItems = ref<AgileDto[]>([]);
  const currentAgile = ref<AgileDto | null>(null);
  const isLoading = ref(false);

  const fetchAll = async () => {
    isLoading.value = true;
    try {
      agileItems.value = await api.getAll();
    } finally {
      isLoading.value = false;
    }
  };

  const createItem = async (payload: CreateAgileDto) => {
    const newItem = await api.create(payload);
    if (newItem) {
      agileItems.value.unshift(newItem);
    }
    return newItem;
  };

  const updateItem = async (id: number, payload: UpdateAgileDto) => {
    const updatedItem = await api.update(id, payload);
    if (updatedItem) {
      const index = agileItems.value.findIndex(item => item.id === id);
      if (index !== -1) {
        agileItems.value[index] = updatedItem;
      }
    }
    return updatedItem;
  };

  const deleteItem = async (id: number) => {
    await api.remove(id);
    agileItems.value = agileItems.value.filter(item => item.id !== id);
  };

  return {
    agileItems,
    currentAgile,
    isLoading,
    fetchAll,
    createItem,
    updateItem,
    deleteItem,
  };
});