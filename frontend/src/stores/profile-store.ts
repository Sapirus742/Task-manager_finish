// stores/profile-store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { SecuredUser } from '../../../backend/src/common/types';
import * as api from '../api/users.api';

export const useProfileStore = defineStore('profile', () => {
  const userProfile = ref<SecuredUser | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchUserProfile = async (userId: number) => {
    try {
      isLoading.value = true;
      error.value = null;
      const data = await api.get(userId);
      userProfile.value = data || null;
    } catch (err) {
      error.value = 'Не удалось загрузить профиль пользователя';
      console.error('Error fetching user profile:', err);
    } finally {
      isLoading.value = false;
    }
  };

  return {
    userProfile,
    isLoading,
    error,
    fetchUserProfile,
  };
});