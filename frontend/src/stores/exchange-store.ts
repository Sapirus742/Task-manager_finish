import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../api/exchange.api';
import { ExchangeDto, CreateExchangeDto, UpdateExchangeDto } from '../../../backend/src/common/types';

export const useExchangeStore = defineStore('exchange', () => {
  const exchanges = ref<ExchangeDto[]>([]);
  const currentExchange = ref<ExchangeDto | null>(null);
  const isLoading = ref(false);

  const fetchAllExchanges = async () => {
    isLoading.value = true;
    try {
      exchanges.value = await api.getAll();
    } finally {
      isLoading.value = false;
    }
  };

  const fetchExchange = async (id: number) => {
    isLoading.value = true;
    try {
      const exchange = await api.get(id);
      if (exchange) {
        currentExchange.value = exchange;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const createExchange = async (payload: CreateExchangeDto) => {
    isLoading.value = true;
    try {
      const newExchange = await api.create(payload);
      if (newExchange) {
        exchanges.value.unshift(newExchange);
        return newExchange;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const updateExchange = async (id: number, payload: UpdateExchangeDto) => {
    isLoading.value = true;
    try {
      const updatedExchange = await api.update(id, payload);
      if (updatedExchange) {
        const index = exchanges.value.findIndex(e => e.id === id);
        if (index !== -1) {
          exchanges.value[index] = updatedExchange;
        }
        if (currentExchange.value?.id === id) {
          currentExchange.value = updatedExchange;
        }
        return updatedExchange;
      }
    } finally {
      isLoading.value = false;
    }
  };

  const deleteExchange = async (id: number) => {
    isLoading.value = true;
    try {
      const deletedExchange = await api.remove(id);
      if (deletedExchange) {
        exchanges.value = exchanges.value.filter(e => e.id !== id);
        if (currentExchange.value?.id === id) {
          currentExchange.value = null;
        }
      }
    } finally {
      isLoading.value = false;
    }
  };

  return {
    exchanges,
    currentExchange,
    isLoading,
    fetchAllExchanges,
    fetchExchange,
    createExchange,
    updateExchange,
    deleteExchange,
  };
});