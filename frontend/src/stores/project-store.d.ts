// src/stores/project-store.d.ts
import type { Ref } from 'vue';
import type { ProjectDto } from '../../../backend/src/common/types';

declare module 'src/stores/project-store' {
  export const useProjectStore: () => {
    projects: Ref<ProjectDto[]>;
    isLoading: Ref<boolean>;
    fetchAllProjects: () => Promise<void>;
  };
}