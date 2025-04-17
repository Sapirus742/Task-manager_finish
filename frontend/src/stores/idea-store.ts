import { defineStore } from 'pinia';
import { reactive, toRefs } from 'vue';
import { IdeaDto, StatusIdea, UpdateIdeaDto, Competencies } from '../../../backend/src/common/types';
import * as ideaApi from '../api/idea.api';
import { useMainStore } from './main-store';

interface CreateIdeaPayload {
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
}



const defaultCompetence = Competencies.LANGUAGES[0];

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
        stack: [defaultCompetence],  // Добавляем значение по умолчанию
        status: StatusIdea.draft,
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
        stack: updateData.stack || [defaultCompetence]  // Значение по умолчанию при обновлении
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

  const deleteIdea = async (id: number): Promise<void> => {
    state.isLoading = true;
    state.error = null;
    try {
      await ideaApi.remove(id);
      state.ideas = state.ideas.filter(i => i.id !== id);
      mainStore.idea_initiator = mainStore.idea_initiator.filter(i => i.id !== id);
    } catch (error) {
      state.error = 'Не удалось удалить идею';
      console.error('Ошибка при удалении идеи:', error);
      throw error;
    } finally {
      state.isLoading = false;
    }
  };

  const approveIdea = async (ideaId: number, userId: number): Promise<IdeaDto> => {
    state.isLoading = true;
    state.error = null;
    try {
      const idea = state.ideas.find(i => i.id === ideaId);
      
      if (!idea) throw new Error('Идея не найдена');
      if (idea.status !== StatusIdea.endorsed) {
        throw new Error('Можно одобрять только идеи со статусом endorsed');
      }
      if (idea.approved?.includes(userId)) {
        throw new Error('Вы уже одобрили эту идею');
      }
  
      // 1. Добавляем одобрение через API
      const updatedIdea = await ideaApi.addApproved(ideaId, userId);
      if (!updatedIdea) throw new Error('Не удалось обновить идею');
      
      // 2. Проверяем количество одобрений
      if (updatedIdea.approved.length >= 3) {
        // 3. Обновляем статус через API
        const approvedIdea = await ideaApi.update(ideaId, {
          status: StatusIdea.approved
        });
        
        if (!approvedIdea) throw new Error('Не удалось обновить статус идеи');
        
        // 4. Обновляем в хранилище
        const index = state.ideas.findIndex(i => i.id === ideaId);
        if (index !== -1) {
          state.ideas[index] = approvedIdea;
        }
        
        return approvedIdea;
      }
  
      // Обновляем локальное состояние
      const index = state.ideas.findIndex(i => i.id === ideaId);
      if (index !== -1) {
        state.ideas[index] = updatedIdea;
      }
      return updatedIdea;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Не удалось одобрить идею';
      throw error;
    } finally {
      state.isLoading = false;
    }
  };
  
  const endorseIdea = async (id: number): Promise<IdeaDto> => {
    state.isLoading = true;
    state.error = null;
    try {
      const response = await ideaApi.endorseIdea(id);
      const index = state.ideas.findIndex(i => i.id === id);
      if (index !== -1) {
        state.ideas[index] = response;
      }
      return response;
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Не удалось утвердить идею';
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
    endorseIdea,
    approveIdea,
  };
});