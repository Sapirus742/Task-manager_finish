<template>
  <div class="project-card" @click="$emit('click')">
    <div class="card-content">
      <!-- Заголовок и статус в одной строке -->
      <div class="title-row">
        <h3 class="project-title">{{ project.name }}</h3>
        <q-badge 
          :color="statusColor" 
          class="status-badge"
          :label="statusLabel"
        />
      </div>

      <!-- Основное содержание -->
      <div class="content-section">
        <p class="project-description">
          {{ truncateSolution(project.solution) }}
        </p>

        <div class="meta-info">
          <div class="meta-item">
            <q-icon name="person_outline" />
            <span>{{ project.customer || 'Не указан' }}</span>
          </div>
          
          <div class="meta-item">
            <q-icon name="groups" />
            <span>{{ teamCountText }}</span>
          </div>
        </div>

        <div class="tech-stack">
          <q-chip
            v-for="tech in displayedTechStack"
            :key="tech"
            size="sm"
            color="primary"
            text-color="white"
          >
            {{ tech }}
          </q-chip>
          <q-chip 
            v-if="hasExtraTechs" 
            size="sm" 
            color="grey-4" 
            text-color="grey-8"
          >
            +{{ project.stack.length - 3 }}
          </q-chip>
        </div>
      </div>

      <!-- Футер с датами -->
      <div class="date-range">
        <q-icon name="event" size="sm" />
        <span>{{ dateRangeText }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StatusProject } from '../../../../backend/src/common/types';
import type { ProjectDto } from '../../../../backend/src/common/types';

const props = defineProps<{
  project: ProjectDto;
}>();

defineEmits(['click']);

// Вычисляемые свойства
const statusColor = computed(() => ({
  [StatusProject.draft]: 'grey-6',
  [StatusProject.searchTeam]: 'orange',
  [StatusProject.selectionTeam]: 'blue',
  [StatusProject.teamFound]: 'green'
}[props.project.status] || 'grey'));

const statusLabel = computed(() => ({
  [StatusProject.draft]: 'Черновик',
  [StatusProject.searchTeam]: 'Поиск команды',
  [StatusProject.selectionTeam]: 'Отбор',
  [StatusProject.teamFound]: 'Команда найдена'
}[props.project.status] || props.project.status));

const displayedTechStack = computed(() => 
  props.project.stack?.slice(0, 3) || []);

const hasExtraTechs = computed(() => 
  props.project.stack?.length > 3);

const teamCountText = computed(() => {
  const current = props.project.teams?.length || 0;
  const max = parseInt(props.project.maxUsers) || 0;
  return max > 0 ? `${current}/${max}` : current.toString();
});

const dateRangeText = computed(() => {
  const start = formatDate(props.project.startProject);
  const end = formatDate(props.project.stopProject);
  return `${start} — ${end}`;
});

// Вспомогательные функции
const formatDate = (date?: Date) => {
  if (!date) return 'н/д';
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const truncateSolution = (solution?: string) => {
  if (!solution) return 'Описание отсутствует';
  const maxLength = 120;
  return solution.length > maxLength 
    ? `${solution.substring(0, maxLength)}...` 
    : solution;
};
</script>

<style scoped>
.project-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.project-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: #bdbdbd;
}

.card-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  gap: 8px;
}

.project-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
  color: #333;
}

.status-badge {
  font-size: 0.7rem;
  padding: 4px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.content-section {
  flex-grow: 1;
  margin-bottom: 12px;
}

.project-description {
  color: #555;
  line-height: 1.4;
  margin-bottom: 16px;
  font-size: 0.9rem;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #666;
}

.meta-item q-icon {
  color: #9e9e9e;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.date-range {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  color: #757575;
  padding-top: 8px;
  border-top: 1px solid #f5f5f5;
  margin-top: auto;
}

@media (max-width: 600px) {
  .project-card {
    padding: 12px;
  }
  
  .project-title {
    font-size: 1rem;
  }
  
  .meta-info {
    gap: 8px;
  }
}
/* Темная тема для карточки проекта */
.body--dark .project-card {
  background-color: #121212 !important;
  border-color: #333 !important;
  color: #ffffff;
}

.body--dark .project-card:hover {
  background-color: #1e1e1e !important;
  border-color: #444 !important;
}

.body--dark .project-title {
  color: #ffffff;
}

.body--dark .project-description {
  color: #b0b0b0;
}

.body--dark .meta-item {
  color: #b0b0b0;
}

.body--dark .meta-item q-icon {
  color: #757575;
}

.body--dark .date-range {
  color: #9e9e9e;
  border-top-color: #333;
}
</style>