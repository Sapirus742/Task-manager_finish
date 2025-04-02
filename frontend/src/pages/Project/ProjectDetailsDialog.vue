<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="project-details-card">
      <q-card-section>
        <div class="project-title-wrapper">
          <h2 class="text-h5 text-weight-bold q-mb-md project-title">{{ project?.name }}</h2>
        </div>

        <!-- Блок с инициатором -->
        <div class="initiator-section q-mb-md">
          <q-icon name="person" size="sm" class="q-mr-sm" />
          <span class="text-weight-bold">Инициатор: </span>
          <span>{{ project?.initiator?.firstname }} {{ project?.initiator?.lastname }}</span>
          <q-chip v-if="project?.initiator?.roles" size="sm" color="primary" text-color="white">
            {{ project.initiator.roles.join(', ') }}
          </q-chip>
        </div>

        <q-tabs 
          v-model="tab" 
          dense 
          active-color="primary" 
          indicator-color="primary" 
          class="q-mb-md"
        >
          <q-tab name="description" label="Описание" />
          <q-tab name="team" label="Команда" />
          <q-tab name="details" label="Детали" />
        </q-tabs>

        <div class="panels-container">
          <q-tab-panels v-model="tab" animated style="height: 100%;">
            <!-- Вкладка с описанием проекта -->
            <q-tab-panel name="description">
              <div class="description-section panel-content">
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Проблема</h3>
                <p class="q-mb-sm">{{ project?.problem || 'Не указана' }}</p>
                
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Решение</h3>
                <p class="q-mb-sm">{{ project?.solution || 'Не указано' }}</p>
                
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Ожидаемый результат</h3>
                <p>{{ project?.result || 'Не указан' }}</p>
              </div>
            </q-tab-panel>

            <q-tab-panel name="team">
              <div class="team-section panel-content">
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Команды проекта</h3>
                <template v-if="teamStore.isLoading">
                  <q-spinner color="primary" size="3em" />
                  <div>Загрузка данных о командах...</div>
                </template>
                
                <!-- Список команд, подавших заявку -->
                <q-list bordered separator v-if="pendingTeams.length > 0">
                  <q-expansion-item
                    v-for="team in pendingTeams"
                    :key="team.id"
                    group="teams"
                    class="pending-team-item"
                  >
                    <template v-slot:header>
                      <q-item-section>
                        <q-item-label>{{ team.name }}</q-item-label>
                        <q-item-label caption>{{ team.description }}</q-item-label>
                      </q-item-section>
                      
                      <q-item-section side v-if="canApproveTeam">
                        <q-btn 
                          label="Выбрать" 
                          color="positive" 
                          @click.stop="approveTeam(team.id)"
                        />
                      </q-item-section>
                    </template>

                    <!-- Подробная информация о команде -->
                    <q-card>
                      <q-card-section>
                        <div v-if="team.user_owner" class="member-item owner row items-center q-mb-xs">
                          <div class="col">
                            <span class="text-weight-medium">
                              {{ team.user_owner.firstname }} {{ team.user_owner.lastname }}
                            </span>
                            <q-badge color="teal" class="q-ml-sm">Владелец</q-badge>
                            <q-chip v-if="team.user_owner.competence?.length" size="s" color="grey-4" text-color="dark" class="q-ml-sm">
                              {{ team.user_owner.competence.join(', ') }}
                            </q-chip>
                          </div>
                          <div v-if="team.user_owner.email" class="col-auto text-caption text-grey">
                            {{ team.user_owner.email }}
                          </div>
                        </div>

                        <div 
                          v-if="team.user_leader && team.user_leader.id !== team.user_owner?.id"
                          class="member-item leader row items-center q-mb-xs"
                        >
                          <div class="col">
                            <span class="text-weight-medium">
                              {{ team.user_leader.firstname }} {{ team.user_leader.lastname }}
                            </span>
                            <q-badge color="primary" class="q-ml-sm">Тимлид</q-badge>
                            <q-chip v-if="team.user_leader.competence?.length" size="s" color="grey-4" text-color="dark" class="q-ml-sm">
                              {{ team.user_leader.competence.join(', ') }}
                            </q-chip>
                          </div>
                          <div v-if="team.user_leader.email" class="col-auto text-caption text-grey">
                            {{ team.user_leader.email }}
                          </div>
                        </div>

                        <div 
                          v-for="member in getRegularMembers(team)" 
                          :key="member.id" 
                          class="member-item row items-center q-mb-xs"
                        >
                          <div class="col">
                            <span>{{ member.firstname }} {{ member.lastname }}</span>
                            <q-chip v-if="member.competence?.length" size="s" color="grey-4" text-color="dark" class="q-ml-sm">
                              {{ member.competence.join(', ') }}
                            </q-chip>
                          </div>
                          <div v-if="member.email" class="col-auto text-caption text-grey">
                            {{ member.email }}
                          </div>
                        </div>
                      </q-card-section>
                    </q-card>
                  </q-expansion-item>
                </q-list>
                
                 <!-- Текущая команда проекта (старое отображение) -->
                 <template v-if="currentTeam && project?.status === StatusProject.teamFound">
                  <div class="current-team-section q-mt-md">
                    <h4 class="text-subtitle1 text-weight-bold q-mb-sm">Текущая команда проекта</h4>
                    
                    <div class="team-name q-mb-md">
                      <q-icon name="groups" class="q-mr-sm" />
                      <strong>Команда:</strong> {{ currentTeam.name }}
                      <q-chip size="s" :color="currentTeam.privacy === 'Close' ? 'negative' : 'positive'" text-color="white" >
                        {{ currentTeam.privacy === 'Close' ? 'Закрытая' : 'Открытая' }}
                      </q-chip>
                      <q-chip size="s" color="info" text-color="white">
                        {{ currentTeam.status }}
                      </q-chip>
                    </div>
                    
                    <!-- Описание команды -->
                    <div v-if="currentTeam.description" class="q-mb-md">
                      <h4 class="text-subtitle2 text-weight-bold q-mb-xs">Описание команды:</h4>
                      <p>{{ currentTeam.description }}</p>
                    </div>

                    <!-- Участники команды -->
                    <div class="members-container q-pa-sm bg-grey-2 rounded-borders q-mb-md">
                      <!-- Владелец команды -->
                      <div class="member-item owner row items-center q-mb-xs" v-if="currentTeam.user_owner">
                        <div class="col">
                          <span class="text-weight-medium">
                            {{ currentTeam.user_owner.firstname }} {{ currentTeam.user_owner.lastname }}
                          </span>
                          <q-badge color="teal" class="q-ml-sm">Владелец</q-badge>
                          <q-chip v-if="currentTeam.user_owner.competence?.length" size="s" color="grey-4" text-color="dark" class="q-ml-sm">
                            {{ currentTeam.user_owner.competence.join(', ') }}
                          </q-chip>
                        </div>
                        <div v-if="currentTeam.user_owner.email" class="col-auto text-caption text-grey">
                          {{ currentTeam.user_owner.email }}
                        </div>
                      </div>

                      <!-- Тимлид -->
                      <div 
                        v-if="currentTeam.user_leader && currentTeam.user_leader.id !== currentTeam.user_owner?.id"
                        class="member-item leader row items-center q-mb-xs"
                      >
                        <div class="col">
                          <span class="text-weight-medium">
                            {{ currentTeam.user_leader.firstname }} {{ currentTeam.user_leader.lastname }}
                          </span>
                          <q-badge color="primary" class="q-ml-sm">Тимлид</q-badge>
                          <q-chip v-if="currentTeam.user_leader.competence?.length" size="s" color="grey-4" text-color="dark" class="q-ml-sm">
                            {{ currentTeam.user_leader.competence.join(', ') }}
                          </q-chip>
                        </div>
                        <div v-if="currentTeam.user_leader.email" class="col-auto text-caption text-grey">
                          {{ currentTeam.user_leader.email }}
                        </div>
                      </div>

                      <!-- Остальные участники -->
                      <template v-if="currentTeam.user?.length">
                        <div 
                          v-for="member in getRegularMembers(currentTeam)" 
                          :key="member.id" 
                          class="member-item row items-center q-mb-xs"
                        >
                          <div class="col">
                            <span>{{ member.firstname }} {{ member.lastname }}</span>
                            <q-chip v-if="member.competence?.length" size="s" color="grey-4" text-color="dark" class="q-ml-sm">
                              {{ member.competence.join(', ') }}
                            </q-chip>
                          </div>
                          <div v-if="member.email" class="col-auto text-caption text-grey">
                            {{ member.email }}
                          </div>
                        </div>
                      </template>
                    </div>
                  </div>
                </template>
                
                <div v-else-if="pendingTeams.length === 0" class="text-grey">
                  Нет заявок от команд
                </div>
              </div>
            </q-tab-panel>

            <!-- Вкладка с техническими деталями -->
            <q-tab-panel name="details">
              <div class="details-section panel-content">
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Технологии</h3>
                <div class="tech-stack q-mb-sm">
                  <template v-if="project?.stack?.length">
                    <q-chip 
                      v-for="tech in project.stack" 
                      :key="tech" 
                      color="primary" 
                      text-color="white" 
                      size="sm"
                    >
                      {{ tech }}
                    </q-chip>
                  </template>
                  <span v-else class="text-grey">Не указаны</span>
                </div>
                
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Ресурсы</h3>
                <p class="q-mb-sm">{{ project?.resource || 'Не указаны' }}</p>
                
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Заказчик</h3>
                <p class="q-mb-sm">{{ project?.customer || 'Не указан' }}</p>
                
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Максимальное количество участников</h3>
                <p>{{ project?.maxUsers || 'Не указано' }}</p>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>

      <q-card-actions class="footer-actions">
        <q-badge :color="getStatusColor(project?.status)" class="status-badge">
          {{ project?.status }}
        </q-badge>
        
        <div class="date-center">
          {{ formatDate(project?.startProject) }} - {{ formatDate(project?.stopProject) }}
        </div>
        
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { StatusProject, StatusTeam } from '../../../../backend/src/common/types';
import type { ProjectDto, TeamDto } from '../../../../backend/src/common/types';
import { useTeamStore } from 'src/stores/team-store';
import { useQuasar } from 'quasar';
import { useMainStore } from 'src/stores/main-store';
import {update as updateTeam} from 'src/api/team.api'; 
import {update as updateProject, get as getProject} from 'src/api/project.api'; 

const $q = useQuasar();
const showDialog = ref(false);
const project = ref<ProjectDto>();
const tab = ref('description');
const maxHeight = ref(0);
const teamStore = useTeamStore();
const mainStore = useMainStore();

const currentTeam = computed<TeamDto | null>(() => {
  // Если есть команда в store - используем ее
  if (teamStore.currentTeam) return teamStore.currentTeam;
  
  // Иначе проверяем команду проекта
  return project.value?.teams?.[0] || null;
});

// Команды, подавшие заявку на проект
const pendingTeams = computed(() => {
  if (!project.value?.teams) return [];
  
  return project.value.teams.filter(t => {
    // Проверяем, что команда имеет статус "Подана на проект"
    // и что данные о команде загружены
    return t.status === StatusTeam.joinProject && 
           t.user && t.user_owner;
  });
});

// Может ли текущий пользователь одобрять команды
const canApproveTeam = computed(() => {
  return mainStore.isCustomer() && 
         project.value?.initiator.id === mainStore.userId;
});

// Одобрение команды
const approveTeam = async (teamId: number) => {
  try {
    // Получаем список всех команд проекта, кроме выбранной
    const otherTeams = project.value?.teams?.filter(t => t.id !== teamId) || [];
    
    // Обновляем статус выбранной команды
    await updateTeam(teamId, { 
      status: StatusTeam.inProgress 
    });
    
    // Обновляем статусы остальных команд и отвязываем их от проекта
    await Promise.all(otherTeams.map(async team => {
      try {
        await updateTeam(team.id, {
          status: StatusTeam.searchProject,
          project: null // Отвязываем команду от проекта
        });
      } catch (error) {
        console.error(`Ошибка обновления команды ${team.id}:`, error);
      }
    }));
    
    // Обновляем статус проекта
    if (project.value?.id) {
      await updateProject(project.value.id, {
        status: StatusProject.teamFound
      });
    }
    
    // Перезагружаем данные
    if (project.value?.id) {
      await teamStore.fetchTeamByProject(project.value.id);
    }
    
    $q.notify({
      message: 'Команда успешно выбрана для проекта',
      color: 'positive'
    });
  } catch (error) {
    console.error('Ошибка выбора команды:', error);
    $q.notify({
      message: 'Ошибка выбора команды',
      color: 'negative'
    });
  }
  window.location.reload();
};

// Функция для получения обычных участников (без владельца и тимлида)
const getRegularMembers = (team: TeamDto) => {
  if (!team?.user) return [];
  return team.user.filter(member => {
    const isOwner = member.id === team.user_owner?.id;
    const isLeader = team.user_leader && member.id === team.user_leader.id;
    return !isOwner && !isLeader;
  });
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case StatusProject.searchTeam: return 'orange';
    case StatusProject.teamFound: return 'green';
    default: return 'grey';
  }
};

const formatDate = (date?: Date) => {
  if (!date) return 'Не указана';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const calculateMaxHeight = () => {
  nextTick(() => {
    const panels = document.querySelectorAll('.panel-content');
    let max = 0;
    panels.forEach(panel => {
      max = Math.max(max, panel.scrollHeight);
    });
    maxHeight.value = max;
  });
};

const open = async (projectData: ProjectDto) => {
  project.value = { ...projectData }; 
  
  // Очищаем текущую команду перед загрузкой новой
  if (teamStore.clearCurrentTeam) {
    teamStore.clearCurrentTeam();
  }
  
  if (projectData.id) {
    try {
      // Загружаем свежие данные о командах проекта
      const updatedProject = await getProject(projectData.id);
      if (updatedProject) {
        project.value = updatedProject;
        
        // Дополнительно загружаем полные данные о командах
        if (updatedProject.teams?.length) {
          const teamsWithDetails = await Promise.all(
            updatedProject.teams.map(async t => {
              try {
                const teamDetails = await teamStore.fetchTeam(t.id);
                return teamDetails || t; // Возвращаем детали или базовые данные
              } catch {
                return t; // Если не удалось загрузить детали
              }
            })
          );
          project.value.teams = teamsWithDetails;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      $q.notify({
        type: 'negative',
        message: 'Ошибка загрузки данных проекта'
      });
    }
  }

  showDialog.value = true;
  calculateMaxHeight();
};
defineExpose({ open });
</script>

<style scoped>

.pending-team-item {
  margin-bottom: 8px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.pending-team-item .q-item {
  padding: 12px 16px;
}

.pending-team-item .q-expansion-item__content {
  padding: 0;
}

.member-item {
  padding: 8px 16px;
  border-bottom: 1px solid #eee;
}

.member-item:last-child {
  border-bottom: none;
}

.project-details-card {
  width: 750px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
}

.initiator-section {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  background: #f5f5f5;
  border-radius: 6px;
  font-size: 0.95rem;
  gap: 8px;
}

.project-title-wrapper {
  display: block;
  width: 100%;
  word-break: break-word;
  hyphens: auto;
}

.panels-container {
  min-height: 300px;
  height: v-bind(maxHeight + 'px');
  position: relative;
}

.footer-actions {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-badge {
  font-size: 0.75rem;
  padding: 6px 10px;
}

.date-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8rem;
  color: #666;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.panel-content {
  padding-bottom: 20px;
}

/* Стили для участников команды */
.members-container {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.member-item {
  padding: 8px;
  border-bottom: 1px solid #e0e0e0;
  transition: background-color 0.2s;
}

.member-item:last-child {
  border-bottom: none;
}

.member-item.leader {
  background-color: rgba(25, 118, 210, 0.05);
  border-left: 3px solid #1976d2;
}

.member-item.owner {
  background-color: rgba(0, 150, 136, 0.05);
  border-left: 3px solid #009688;
}

.team-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

@media (max-width: 800px) {
  .project-details-card {
    width: 90vw;
  }
  
  .panels-container {
    min-height: 200px;
    height: auto;
    max-height: 60vh;
  }
  
  .date-center {
    position: static;
    transform: none;
    order: -1;
    width: 100%;
    text-align: center;
    margin-bottom: 8px;
  }
  
  .footer-actions {
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  
  .team-name {
    flex-wrap: wrap;
  }
}
</style>