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
                <h3 class="text-subtitle1 text-weight-bold q-mb-xs">Заявки от команд:</h3>
                <template v-if="teamStore.isLoading">
                  <q-spinner color="primary" size="3em" />
                  <div>Загрузка данных о командах...</div>
                </template>
                
                <!-- Список команд, подавших заявку -->
                <q-list bordered separator v-if="pendingTeams.length > 0">
                  <q-item
                    v-for="team in pendingTeams"
                    :key="team.id"
                    clickable
                    class="pending-team-item"
                    @click="openTeamDetailsDialog(team)"
                  >
                    <q-item-section>
                      <q-item-label>{{ team.name }}</q-item-label>
                      <q-item-label caption>{{ team.description }}</q-item-label>
                    </q-item-section>
                    
                    <q-item-section side v-if="canApproveTeam">
                      <q-btn 
                        label="Выбрать" 
                        color="positive" 
                        @click.stop="approveTeam(team)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
                
                <!-- Текущая команда проекта -->
                <template v-if="currentTeam && project?.status === StatusProject.teamFound">
                  <div class="current-team-section q-mt-md">
                    <h4 class="text-subtitle1 text-weight-bold q-mb-sm">Текущая команда проекта</h4>
                    
                    <div class="team-name q-mb-md">
                      <q-icon name="groups" class="q-mr-sm" />
                      <strong>Команда:</strong> {{ currentTeam.name }}
                      <q-chip size="s" :color="currentTeam.privacy === 'Close' ? 'negative' : 'positive'" text-color="white">
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

                    <q-btn
                      label="Просмотреть команду"
                      color="primary"
                      @click="openTeamDetailsDialog(currentTeam)"
                      class="q-mb-md"
                    />
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
                      size="s"
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

  <q-dialog v-model="showConfirmDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Подтверждение выбора команды</div>
      </q-card-section>

      <q-card-section>
        <p>Вы собираетесь выбрать команду <strong>"{{ selectedTeamForApproval?.name }}"</strong> для проекта.</p>
        
        <template v-if="mismatchReasons.length > 0">
          <div class="text-negative q-mt-md">
            <p><strong>Обратите внимание:</strong></p>
            <ul>
              <li v-for="(reason, index) in mismatchReasons" :key="index">
                {{ reason }}
              </li>
            </ul>
          </div>
          
          <p class="q-mt-md">Вы уверены, что хотите выбрать эту команду, несмотря на несоответствие?</p>
        </template>
        <template v-else>
          <p class="q-mt-md">Вы уверены, что хотите выбрать эту команду?</p>
        </template>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn 
          flat 
          label="Подтвердить выбор" 
          color="positive" 
          @click="confirmTeamApproval"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Диалог для просмотра команды -->
  <q-dialog v-model="showTeamDetails">
    <q-card v-if="selectedTeam" class="team-details-card">
      <q-card-section>
        <h2 class="team-heading">{{ selectedTeam.name }}</h2>

        <!-- Описание команды -->
        <div class="team-description q-mb-md" v-if="selectedTeam.description">
          <strong>Описание:</strong>&nbsp;
          <p>{{ selectedTeam.description }}</p>
        </div>

        <!-- Блок с компетенциями команды -->
        <div v-if="getTeamCompetencies(selectedTeam).length > 0" class="q-mb-md">
          <div class="text-subtitle2 q-mb-xs">Компетенции команды:</div>
          <div class="competencies-container">
            <q-chip
              v-for="(competency, index) in getTeamCompetencies(selectedTeam)"
              :key="index"
              color="primary"
              text-color="white"
              size="s"
              class="q-mr-xs q-mb-xs"
            >
              {{ competency }}
            </q-chip>
          </div>
        </div>
        
        <!-- Владелец команды -->
        <div class="team-owner q-mb-md" v-if="selectedTeam.user_owner">
          <q-icon name="person" class="q-mr-sm" />
          <strong>Создал: </strong>&nbsp;
          <span>{{ selectedTeam.user_owner.firstname }} {{ selectedTeam.user_owner.lastname }}</span>
        </div>

        <!-- Подпись "Команда" -->
        <div class="team-label q-mb-sm">
          <q-icon name="people" class="q-mr-sm" />
          <strong>Команда:</strong>
        </div>

        <!-- Блок участников -->
        <div class="members-container q-pa-sm bg-grey-2 rounded-borders">
          <!-- Владелец -->
          <div class="member-item owner" v-if="selectedTeam.user_owner">
              <div class="member-info">
                <span class="member-name">
                  {{ selectedTeam.user_owner?.firstname }} {{ selectedTeam.user_owner?.lastname }}
                  <q-badge color="teal" class="q-ml-sm">Владелец</q-badge>
                </span>
                <span class="member-email" v-if="selectedTeam.user_owner?.email">
                  <strong style="color: black">email: </strong> {{ selectedTeam.user_owner.email }}
                </span>
              </div>
            </div>

          <!-- Тимлид (если не владелец) -->
          <div 
            v-if="selectedTeam.user_leader && selectedTeam.user_leader.id !== selectedTeam.user_owner?.id"
            class="member-item leader q-mb-xs"
          >
            <div class="member-info">
              <span class="member-name">
                {{ selectedTeam.user_leader.firstname }} {{ selectedTeam.user_leader.lastname }}
                <q-badge color="primary" class="q-ml-sm">Тимлид</q-badge>
              </span>
              <span class="member-email" v-if="selectedTeam.user_leader.email">
                <strong style="color: black">email: </strong> {{ selectedTeam.user_leader.email }}
              </span>
            </div>
          </div>

          <!-- Остальные участники -->
          <div 
            v-for="member in getRegularMembers(selectedTeam)" 
            :key="member.id" 
            class="member-item q-mb-xs"
          >
            <div class="member-info">
              <span class="member-name">
                {{ member.firstname }} {{ member.lastname }}
              </span>
              <span class="member-email" v-if="member.email">
                <strong style="color: black">email: </strong> {{ member.email }}
              </span>
            </div>
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
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
import { update as updateTeam } from 'src/api/team.api'; 
import { update as updateProject, get as getProject } from 'src/api/project.api'; 

const $q = useQuasar();
const showDialog = ref(false);
const project = ref<ProjectDto>();
const tab = ref('description');
const maxHeight = ref(0);
const teamStore = useTeamStore();
const mainStore = useMainStore();

// Переменную для диалога подтверждения
const showConfirmDialog = ref(false);
const selectedTeamForApproval = ref<TeamDto | null>(null);
const mismatchReasons = ref<string[]>([]);

// Добавляем переменные для управления диалогом команды
const showTeamDetails = ref(false);
const selectedTeam = ref<TeamDto | null>(null);

const currentTeam = computed<TeamDto | null>(() => {
  if (teamStore.currentTeam) return teamStore.currentTeam;
  return project.value?.teams?.[0] || null;
});

// Функция для получения уникальных компетенций команды
const getTeamCompetencies = (team: TeamDto): string[] => {
  const competencies = new Set<string>();
  
  // Добавляем компетенции владельца
  if (team.user_owner?.competence?.length) {
    team.user_owner.competence.forEach(c => competencies.add(c));
  }
  
  // Добавляем компетенции тимлида
  if (team.user_leader?.competence?.length) {
    team.user_leader.competence.forEach(c => competencies.add(c));
  }
  
  // Добавляем компетенции участников
  team.user?.forEach(member => {
    if (member.competence?.length) {
      member.competence.forEach(c => competencies.add(c));
    }
  });
  
  return Array.from(competencies);
};

const pendingTeams = computed(() => {
  if (!project.value?.teams) return [];
  return project.value.teams.filter(t => {
    return t.status === StatusTeam.joinProject && 
           t.user && t.user_owner;
  });
});

const canApproveTeam = computed(() => {
  return mainStore.isCustomer() && 
         project.value?.initiator.id === mainStore.userId;
});

// Функция для открытия диалога с деталями команды
const openTeamDetailsDialog = (team: TeamDto) => {
  selectedTeam.value = team;
  showTeamDetails.value = true;
};

const approveTeam = async (team: TeamDto) => {
  selectedTeamForApproval.value = team;
  mismatchReasons.value = [];
  
  // Проверяем соответствие критериям
  if (project.value) {
    // Проверка технологий
    if (project.value.stack && project.value.stack.length > 0) {
      const teamTechs = getTeamCompetencies(team);
      const missingTechs = project.value.stack.filter(tech => 
        !teamTechs.includes(tech)
      );
      
      if (missingTechs.length > 0) {
        mismatchReasons.value.push(
          `Команда не имеет следующих требуемых технологий: ${missingTechs.join(', ')}`
        );
      }
    }
    
    // Проверка количества участников
    if (project.value.maxUsers) {
      const maxUsers = parseInt(project.value.maxUsers);
      const teamSize = team.user?.length || 0;
      
      if (!isNaN(maxUsers) && teamSize > maxUsers) {
        mismatchReasons.value.push(
          `В команде ${teamSize} участников, что превышает максимально допустимое количество (${maxUsers})`
        );
      }
    }
  }
  
  showConfirmDialog.value = true;
};

// Функция для подтверждения выбора
const confirmTeamApproval = async () => {
  if (!selectedTeamForApproval.value?.id || !project.value?.id) return;
  
  try {
    const otherTeams = project.value?.teams?.filter(t => 
      t.id !== selectedTeamForApproval.value?.id
    ) || [];
    
    await updateTeam(selectedTeamForApproval.value.id, { 
      status: StatusTeam.inProgress 
    });
    
    await Promise.all(otherTeams.map(async team => {
      try {
        await updateTeam(team.id, {
          status: StatusTeam.searchProject,
          project: null
        });
      } catch (error) {
        console.error(`Ошибка обновления команды ${team.id}:`, error);
      }
    }));
    
    await updateProject(project.value.id, {
      status: StatusProject.teamFound
    });
    
    await teamStore.fetchTeamByProject(project.value.id);
    
    $q.notify({
      message: 'Команда успешно выбрана для проекта',
      color: 'positive'
    });
    
    showConfirmDialog.value = false;
    
    // Обновление с задержкой 3 секунд
    setTimeout(() => {
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('Ошибка выбора команды:', error);
    $q.notify({
      message: 'Ошибка выбора команды',
      color: 'negative'
    });
  }
};

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
    case StatusProject.selectionTeam: return 'blue';
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
  
  if (teamStore.clearCurrentTeam) {
    teamStore.clearCurrentTeam();
  }
  
  if (projectData.id) {
    try {
      const updatedProject = await getProject(projectData.id);
      if (updatedProject) {
        project.value = updatedProject;
        
        if (updatedProject.teams?.length) {
          const teamsWithDetails = await Promise.all(
            updatedProject.teams.map(async t => {
              try {
                const teamDetails = await teamStore.fetchTeam(t.id);
                return teamDetails || t;
              } catch {
                return t;
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
  border-radius: 4px;
  background-color: #f1f1f1;
  transition: background-color 0.2s;
}

.pending-team-item:hover {
  background-color: #f0f0f0;
}

.pending-team-item .q-item {
  padding: 12px 16px;
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
  :deep(*) {
    border-color: transparent !important;
  }
}

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
  marker: none;
}

.team-name {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 6px;
}

/* Стили для диалога команды */
.team-details-card {
  width: 600px;
  max-width: 90vw;
}

.team-heading {
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.team-description {
  padding: 8px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.team-owner {
  display: flex;
  align-items: center;
}

.team-label {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
}

.members-container {
  border: 1px solid #e0e0e0;
}

.member-item {
  padding: 8px;
  border-radius: 4px;
}

.member-item.owner {
  background-color: rgba(0, 150, 136, 0.05);
  border-left: 3px solid #009688;
}

.member-item.leader {
  background-color: rgba(25, 118, 210, 0.05);
  border-left: 3px solid #1976d2;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 500;
}

.member-email {
  color: #666;
  font-size: 0.9em;
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