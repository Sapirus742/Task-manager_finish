import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';
import { IdeaDto, StatusIdea, UpdateIdeaDto, Competence } from '../../../backend/src/common/types';
import * as ideaApi from '../api/idea.api';
import { useMainStore } from './main-store';

interface CreateIdeaPayload {
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
}

export const useIdeaStore = defineStore('idea', () => {
  const state = reactive({
    ideas: [] as IdeaDto[],
    isLoading: false,
    error: null as string | null,
  });

  const mainStore = useMainStore();

  const fetchIdeas = async () => {
    state.isLoading = true;
    state.error = null;
    try {
      state.ideas = await ideaApi.getAll();
    } catch (error) {
      state.error = 'Не удалось загрузить идеи';
      console.error('Ошибка при загрузке идей:', error);
    } finally {
      state.isLoading = false;
    }
  };

  const createIdea = async (ideaData: CreateIdeaPayload) => {
    state.isLoading = true;
    state.error = null;
    try {
      const newIdea = await ideaApi.create({
        name: ideaData.name,
        problem: ideaData.problem,
        solution: ideaData.solution,
        result: ideaData.result,
        resource: ideaData.resource,
        stack: [Competence.no], // Добавляем значение по умолчанию
        status: StatusIdea.underEditing,
        comment: [],
        initiator: mainStore.userId,
      });

      if (newIdea) {
        state.ideas.unshift(newIdea);
        mainStore.idea_initiator.push(newIdea);
      }
      return newIdea;
    } catch (error) {
      state.error = 'Не удалось создать идею';
      console.error('Ошибка при создании идеи:', error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const updateIdea = async (id: number, updateData: UpdateIdeaDto) => {
    state.isLoading = true;
    state.error = null;
    try {
      const updatedIdea = await ideaApi.update(id, {
        ...updateData,
        stack: updateData.stack || [Competence.no] // Значение по умолчанию при обновлении
      });
      
      if (updatedIdea) {
        const index = state.ideas.findIndex(i => i.id === id);
        if (index !== -1) {
          state.ideas[index] = updatedIdea;
        }
      }
      return updatedIdea;
    } catch (error) {
      state.error = 'Не удалось обновить идею';
      console.error('Ошибка при обновлении идеи:', error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const deleteIdea = async (id: number) => {
    state.isLoading = true;
    state.error = null;
    try {
      const deletedIdea = await ideaApi.remove(id);
      if (deletedIdea) {
        state.ideas = state.ideas.filter(i => i.id !== id);
        mainStore.idea_initiator = mainStore.idea_initiator.filter(i => i.id !== id);
      }
      return deletedIdea;
    } catch (error) {
      state.error = 'Не удалось удалить идею';
      console.error('Ошибка при удалении идеи:', error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const approveIdea = async (ideaId: number, userId: number) => {
    state.isLoading = true;
    state.error = null;
    try {
      const updatedIdea = await ideaApi.addApproved(ideaId, userId);
      if (updatedIdea) {
        const index = state.ideas.findIndex(i => i.id === ideaId);
        if (index !== -1) {
          // Обновляем массив approved в идее
          state.ideas[index].approved = updatedIdea.approved;
        }
      }
      return updatedIdea;
    } catch (error) {
      state.error = 'Не удалось одобрить идею';
      console.error('Ошибка при одобрении идеи:', error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };
  
  const get = async (id: number): Promise<IdeaDto | undefined> => {
    state.isLoading = true;
    state.error = null;
    try {
      const idea = await ideaApi.get(id);
      return idea;
    } catch (error) {
      state.error = `Не удалось загрузить идею ${id}`;
      console.error(`Ошибка при загрузке идеи ${id}:`, error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };
  
  

  return {
    ...toRefs(state),
    fetchIdeas,
    get, // Добавляем этот метод
    createIdea,
    updateIdea,
    deleteIdea,
    approveIdea,
  };
});