import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as api from '../../../backend/src/api/message.api';
import type { CreateMessageDto, MessageDto } from '../../../backend/src/common/types';

export const useMessageStore = defineStore('message', () => {
  const messages = ref<MessageDto[]>([]);
  const isLoading = ref(false);

  const fetchMessages = async (agileId: number) => {
    isLoading.value = true;
    try {
      messages.value = await api.getByAgileId(agileId);
    } finally {
      isLoading.value = false;
    }
  };

  const createMessage = async (payload: CreateMessageDto) => {
    const newMessage = await api.create(payload);
    if (newMessage) {
      messages.value.push(newMessage);
    }
    return newMessage;
  };

  return {
    messages,
    isLoading,
    fetchMessages,
    createMessage,
  };
});