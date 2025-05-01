// src/stores/comment-store.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as commentApi from '../api/comment.api';
import type { CommentDto, CreateCommentDto, UpdateCommentDto } from '../../../backend/src/common/types';

export const useCommentStore = defineStore('comment', () => {
  const comments = ref<CommentDto[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchComments = async (ideaId: number) => {
    isLoading.value = true;
    try {
      comments.value = await commentApi.getByIdeaId(ideaId); // Новый метод в API
    } catch (err) {
      error.value = 'Ошибка загрузки комментариев';
    } finally {
      isLoading.value = false;
    }
  };

  const createComment = async (commentData: CreateCommentDto) => {
    isLoading.value = true;
    try {
      const newComment = await commentApi.create(commentData);
      if (newComment) {
        comments.value.push(newComment);
      }
      return newComment;
    } catch (err) {
      error.value = 'Ошибка создания комментария';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const updateComment = async (id: number, updateData: UpdateCommentDto) => {
    isLoading.value = true;
    try {
      const updatedComment = await commentApi.update(id, updateData);
      if (updatedComment) {
        const index = comments.value.findIndex(c => c.id === id);
        if (index !== -1) {
          comments.value[index] = updatedComment;
        }
      }
      return updatedComment;
    } catch (err) {
      error.value = 'Ошибка обновления комментария';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteComment = async (id: number) => {
    isLoading.value = true;
    try {
      await commentApi.remove(id);
      comments.value = comments.value.filter(c => c.id !== id);
    } catch (err) {
      error.value = 'Ошибка удаления комментария';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    comments,
    isLoading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment
  };
});