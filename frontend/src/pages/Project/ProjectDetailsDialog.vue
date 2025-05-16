<template>
  <q-dialog 
  v-model="showDialog"
  @update:model-value="val => !val && closeDialog()"
>
    <q-card class="project-details-card">
      <q-card-section>
        <div class="project-header">
          <div class="project-title-wrapper">
            <h2 class="text-h5 text-weight-bold q-mb-sm project-title">{{ project?.name }}</h2>
            <q-badge 
              :color="getStatusColor(project?.status)" 
              class="status-badge"
            >
              {{ getStatusLabel(project?.status) }}
            </q-badge>
          </div>

          <div class="project-meta">
            <div class="initiator-section"
                 @click="project?.initiator?.id && openUserProfile(project.initiator.id)">
              <q-icon name="person" size="sm" class="q-mr-xs" />
              <span class="text-weight-medium">Инициатор:</span>
              <span>{{ project?.initiator?.firstname }} {{ project?.initiator?.lastname }}</span>
            </div>

            <div class="date-section">
              <q-icon name="event" size="sm" class="q-mr-xs" />
              <span>{{ formatDate(project?.startProject) }} — {{ formatDate(project?.stopProject) }}</span>
            </div>
          </div>
        </div>

        <q-tabs 
          v-model="tab" 
          dense
          class="q-mt-md"
          active-color="primary"
          indicator-color="primary"
          align="left"
        >
          <q-tab name="description" label="Описание" />
          <q-tab name="team" label="Команда" />
          <q-tab name="details" label="Детали" />
        </q-tabs>

        <q-separator />

        <div class="panels-container">
          <q-tab-panels v-model="tab" animated>
            <!-- Вкладка Описание -->
            <q-tab-panel name="description">
              <div class="description-section">
                <div class="detail-block">
                  <h3 class="section-title">Проблема</h3>
                  <p class="section-content">{{ project?.problem || 'Не указана' }}</p>
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Решение</h3>
                  <p class="section-content">{{ project?.solution || 'Не указано' }}</p>
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Ожидаемый результат</h3>
                  <p class="section-content">{{ project?.result || 'Не указан' }}</p>
                </div>
              </div>
            </q-tab-panel>

            <!-- Вкладка Команда -->
            <q-tab-panel name="team">
              <div class="team-section">
                <h3 class="section-title q-mb-md">Заявки от команд</h3>
                
                <template v-if="teamStore.isLoading">
                  <div class="loading-state">
                    <q-spinner color="primary" size="3em" />
                    <div>Загрузка данных о командах...</div>
                  </div>
                </template>
                
                <template v-else>
                  <q-list bordered separator v-if="pendingTeams.length > 0" class="team-list">
                    <q-item
                      v-for="team in pendingTeams"
                      :key="team.id"
                      clickable
                      class="pending-team-item"
                      @click="openTeamDetailsDialog(team)"
                    >
                      <q-item-section>
                        <q-item-label class="team-name">{{ team.name }}</q-item-label>
                        <q-item-label caption class="team-description">{{ team.description }}</q-item-label>
                      </q-item-section>
                      
                      <q-item-section side v-if="canApproveTeam">
                        <q-btn 
                          label="Выбрать" 
                          color="positive" 
                          size="sm"
                          @click.stop="approveTeam(team)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                  
                  <template v-if="currentTeam && project?.status === StatusProject.teamFound">
                    <div class="current-team-section">
                      <h4 class="section-title">Текущая команда проекта</h4>
                      
                      <div class="detail-block q-mb-md">
                        <div class="team-meta">
                          <q-icon name="groups" class="q-mr-sm" />
                          <span class="text-weight-medium">Название:</span>
                          <span>{{ currentTeam.name }}</span>
                        </div>
                        
                        <div class="team-tags q-mt-sm">
                          <q-chip size="sm" :color="currentTeam.privacy === 'Close' ? 'negative' : 'positive'" text-color="white">
                            {{ currentTeam.privacy === 'Close' ? 'Закрытая' : 'Открытая' }}
                          </q-chip>
                          <q-chip size="sm" color="info" text-color="white">
                            {{ currentTeam.status }}
                          </q-chip>
                        </div>
                      </div>
                      
                      <div class="detail-block" v-if="currentTeam.description">
                        <h4 class="section-title">Описание команды</h4>
                        <p class="section-content">{{ currentTeam.description }}</p>
                      </div>

                      <q-btn
                        label="Просмотреть команду"
                        color="primary"
                        @click="openTeamDetailsDialog(currentTeam)"
                        class="q-mt-md"
                      />
                    </div>
                  </template>
                  
                  <div v-else-if="pendingTeams.length === 0" class="empty-state">
                    <q-icon name="info" size="sm" />
                    <span>Нет заявок от команд</span>
                  </div>
                </template>
              </div>
            </q-tab-panel>

            <!-- Вкладка Детали -->
            <q-tab-panel name="details">
              <div class="details-section">
                <div class="detail-block">
                  <h3 class="section-title">Технологии</h3>
                  <div class="tech-stack">
                    <template v-if="project?.stack?.length">
                      <q-chip 
                        v-for="tech in project.stack" 
                        :key="tech" 
                        color="primary" 
                        text-color="white" 
                        size="sm"
                        class="tech-tag"
                      >
                        {{ tech }}
                      </q-chip>
                    </template>
                    <span v-else class="text-grey">Не указаны</span>
                  </div>
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Ресурсы</h3>
                  <p class="section-content">{{ project?.resource || 'Не указаны' }}</p>
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Заказчик</h3>
                  <p class="section-content">{{ project?.customer || 'Не указан' }}</p>
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Участники</h3>
                  <p class="section-content">{{ project?.maxUsers || 'Не указано' }}</p>
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>

      <q-card-actions class="footer-actions">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Диалог подтверждения выбора команды -->
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

  <!-- Диалог просмотра команды -->
  <q-dialog v-model="showTeamDetails" persistent>
    <q-card class="team-details-card glossy-card" v-if="selectedTeam" style="max-width: 800px; width: 100%">
        <q-card-section class="team-header bg-primary text-white">
          <div class="row items-center justify-between">
            <div class="text-h4 text-weight-bold">Профиль команды</div>
            <q-btn 
              icon="close" 
              flat 
              round 
              dense 
              v-close-popup 
              class="close-btn"
            />
          </div>
        </q-card-section>

        <q-card-section class="team-content q-pa-lg">
          <div v-if="selectedTeam" class="single-column-layout">
            <!-- Основная информация в красивом контейнере -->
            <div class="info-container q-mb-md">
              <div class="row q-col-gutter-md">
                <!-- Блок с основной информацией -->
                <div class="col-md-6 col-sm-12">
                  <q-card class="info-card elevated-card" flat bordered>
                    <q-card-section>
                      <div class="text-h5 text-primary q-mb-md">Основная информация</div>
                      
                      <div class="info-grid q-gutter-y-md">
                        <div class="info-item">
                          <q-icon name="lock" size="sm" class="q-mr-sm"/>
                          <span class="text-weight-medium">Приватность:</span>
                          <q-chip
                            :color="selectedTeam.privacy === PrivacyTeam.close ? 'deep-orange' : 'teal'"
                            text-color="white"
                            size="md"
                            class="q-ml-sm"
                          >
                            {{ selectedTeam.privacy === PrivacyTeam.close ? 'Закрытая' : 'Открытая' }}
                          </q-chip>
                        </div>

                        <div class="info-item">
                          <q-icon name="flag" size="sm" class="q-mr-sm"/>
                          <span class="text-weight-medium">Статус:</span>
                          <q-chip
                            :color="getTeamStatusColor(selectedTeam.status)"
                            text-color="white"
                            size="md"
                            class="q-ml-sm"
                          >
                            {{ selectedTeam.status }}
                          </q-chip>
                        </div>

                        <div class="info-item">
                          <q-icon name="people" size="sm" class="q-mr-sm"/>
                          <span class="text-weight-medium">Участников:</span>
                          <span class="text-h6 text-primary q-ml-sm">{{ getUniqueMembersCount(selectedTeam) }}</span>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Блок с компетенциями -->
                <div class="col-md-6 col-sm-12" v-if="getTeamCompetencies(selectedTeam).length > 0">
                  <q-card class="competencies-card elevated-card" flat bordered>
                    <q-card-section>
                      <div class="text-h5 text-primary q-mb-md">Компетенции</div>
                      <div class="competencies-container q-gutter-sm">
                        <q-chip
                          v-for="(competency, index) in getTeamCompetencies(selectedTeam)"
                          :key="index"
                          color="accent"
                          text-color="white"
                          size="md"
                          class="shadow-1"
                        >
                          <q-avatar color="white" text-color="accent" size="sm" class="q-mr-sm">
                            {{ competency[0] }}
                          </q-avatar>
                          {{ competency }}
                        </q-chip>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Описание команды -->
            <q-card class="description-card elevated-card q-mb-md" flat bordered>
              <q-card-section>
                <div class="text-h5 text-primary q-mb-sm">О команде</div>
                <q-separator color="primary" class="q-mb-md"/>
                <div class="team-description text-body1" :class="{ 'text-grey-6': !selectedTeam.description }">
                  {{ selectedTeam.description || 'Команда пока не добавила описание' }}
                </div>
              </q-card-section>
            </q-card>

            <!-- Участники команды -->
            <q-card class="members-card elevated-card" flat bordered>
              <q-card-section>
                <div class="text-h5 text-primary">Участники</div>
                <q-separator color="primary" class="q-mb-md"/>

                <div class="members-list q-gutter-y-md">
                  <!-- Владелец -->
                  <div v-if="selectedTeam.user_owner" class="member-item owner row items-center q-pa-sm rounded-borders"
                      @click="openUserProfile(selectedTeam.user_owner.id)">
                    <q-avatar size="lg" class="q-mr-md" color="teal" text-color="white">
                      {{ selectedTeam.user_owner.firstname[0] }}{{ selectedTeam.user_owner.lastname[0] }}
                    </q-avatar>
                    <div class="member-info column">
                      <div class="member-name text-h6">
                        {{ selectedTeam.user_owner.firstname }} {{ selectedTeam.user_owner.lastname }}
                        <q-badge color="teal" class="q-ml-sm">Владелец</q-badge>
                        <q-badge v-if="isLeaderAlsoOwner(selectedTeam)" color="primary" class="q-ml-sm">Тимлид</q-badge>
                      </div>
                      <div class="member-contacts row q-gutter-x-md q-mt-xs">
                        <div v-if="selectedTeam.user_owner.email" class="member-contact row items-center">
                          <q-icon name="email" size="sm" class="q-mr-xs"/>
                          <span>{{ selectedTeam.user_owner.email }}</span>
                        </div>
                        <div v-if="selectedTeam.user_owner.telephone" class="member-contact row items-center">
                          <q-icon name="phone" size="sm" class="q-mr-xs"/>
                          <span>{{ formatPhone(selectedTeam.user_owner.telephone) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Тимлид (если не владелец) -->
                  <div v-if="selectedTeam.user_leader && !isLeaderAlsoOwner" 
                      class="member-item leader row items-center q-pa-sm rounded-borders"
                      @click="openUserProfile(selectedTeam.user_leader.id)">
                    <q-avatar size="lg" class="q-mr-md" color="primary" text-color="white">
                      {{ selectedTeam.user_leader.firstname[0] }}{{ selectedTeam.user_leader.lastname[0] }}
                    </q-avatar>
                    <div class="member-info column">
                      <div class="member-name text-h6">
                        {{ selectedTeam.user_leader.firstname }} {{ selectedTeam.user_leader.lastname }}
                        <q-badge color="primary" class="q-ml-sm">Тимлид</q-badge>
                      </div>
                      <div class="member-contacts row q-gutter-x-md q-mt-xs">
                        <div v-if="selectedTeam.user_leader.email" class="member-contact row items-center">
                          <q-icon name="email" size="sm" class="q-mr-xs"/>
                          <span>{{ selectedTeam.user_leader.email }}</span>
                        </div>
                        <div v-if="selectedTeam.user_leader.telephone" class="member-contact row items-center">
                          <q-icon name="phone" size="sm" class="q-mr-xs"/>
                          <span>{{ formatPhone(selectedTeam.user_leader.telephone) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Обычные участники -->
                  <div v-for="user in getRegularMembers(selectedTeam)" 
                      :key="user.id" 
                      class="member-item row items-center q-pa-sm rounded-borders"
                      @click.stop="openUserProfile(user.id)">
                    <q-avatar size="lg" class="q-mr-md" color="grey-4" text-color="dark">
                      {{ user.firstname[0] }}{{ user.lastname[0] }}
                    </q-avatar>
                    <div class="member-info column">
                      <div class="member-name text-subtitle1">
                        {{ user.firstname }} {{ user.lastname }}
                      </div>
                      <div class="member-contacts row q-gutter-x-md q-mt-xs">
                        <div v-if="user.email" class="member-contact row items-center">
                          <q-icon name="email" size="sm" class="q-mr-xs"/>
                          <span>{{ user.email }}</span>
                        </div>
                        <div v-if="user.telephone" class="member-contact row items-center">
                          <q-icon name="phone" size="sm" class="q-mr-xs"/>
                          <span>{{ formatPhone(user.telephone) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Пустое состояние -->
                  <div v-if="selectedTeam.user.length === 0 && 
                            (!selectedTeam.user_owner || !selectedTeam.user_leader)" 
                      class="empty-state text-grey-6 text-center q-pa-lg">
                    <q-icon name="people_outline" size="xl"/>
                    <div class="text-h6 q-mt-sm">Нет участников</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1">        
          <q-btn flat label="Закрыть" color="grey" v-close-popup icon="close"/>
        </q-card-actions>
      </q-card>
  </q-dialog>
  
  <teleport to="body">
    <UserProfileOpen 
      v-if="selectedUserId" 
      :key="selectedUserId"
      :userId="selectedUserId" 
      v-model="isProfileOpen"
    />
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { StatusProject, StatusTeam,  PrivacyTeam } from '../../../../backend/src/common/types';
import type { ProjectDto, TeamDto } from '../../../../backend/src/common/types';
import { useTeamStore } from 'src/stores/team-store';
import { useQuasar } from 'quasar';
import { useMainStore } from 'src/stores/main-store';
import { update as updateTeam } from 'src/api/team.api'; 
import { update as updateProject, get as getProject } from 'src/api/project.api'; 
import UserProfileOpen from 'src/pages/UserProfileOpen.vue';

const $q = useQuasar();
const showDialog = ref(false);
const project = ref<ProjectDto>();
const tab = ref('description');
const maxHeight = ref(0);
const teamStore = useTeamStore();
const mainStore = useMainStore();

const selectedUserId = ref<number | null>(null);
const isProfileOpen = ref(false);

const openUserProfile = (userId: number) => {
  selectedUserId.value = userId;
  isProfileOpen.value = true;
};

const showConfirmDialog = ref(false);
const selectedTeamForApproval = ref<TeamDto | null>(null);
const mismatchReasons = ref<string[]>([]);

const showTeamDetails = ref(false);
const selectedTeam = ref<TeamDto | null>(null);

const currentTeam = computed<TeamDto | null>(() => {
  if (teamStore.currentTeam) return teamStore.currentTeam;
  return project.value?.teams?.[0] || null;
});

const getStatusLabel = (status?: string) => {
  switch (status) {
    case StatusProject.searchTeam: return 'Поиск команды';
    case StatusProject.teamFound: return 'Команда найдена';
    case StatusProject.selectionTeam: return 'Отбор команды';
    case StatusProject.draft: return 'Черновик';
    default: return status || 'Неизвестно';
  }
};

// Функция для цвета статуса команды
const getTeamStatusColor = (status: StatusTeam) => {
  switch (status) {
    case StatusTeam.inProgress: return 'positive';
    case StatusTeam.searchProject: return 'info';
    case StatusTeam.joinProject: return 'warning';
    case StatusTeam.delete: return 'negative';
    default: return 'grey';
  }
};

const isLeaderAlsoOwner = (team: TeamDto) => {
  return team.user_owner?.id === team.user_leader?.id;
};

const formatPhone = (phone?: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
};

const getTeamCompetencies = (team: TeamDto): string[] => {
  const competencies = new Set<string>();
  
  if (team.user_owner?.competence?.length) {
    team.user_owner.competence.forEach(c => competencies.add(c));
  }
  
  if (team.user_leader?.competence?.length) {
    team.user_leader.competence.forEach(c => competencies.add(c));
  }
  
  team.user?.forEach(member => {
    if (member.competence?.length) {
      member.competence.forEach(c => competencies.add(c));
    }
  });
  
  return Array.from(competencies);
};

// Функция для подсчета участников
const getUniqueMembersCount = (team: TeamDto): number => {
  const members = new Set<number>();
  if (team.user_owner?.id) members.add(team.user_owner.id);
  if (team.user_leader?.id) members.add(team.user_leader.id);
  team.user?.forEach(user => { if (user?.id) members.add(user.id); });
  return members.size;
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

const openTeamDetailsDialog = (team: TeamDto) => {
  selectedTeam.value = team;
  showTeamDetails.value = true;
};

const approveTeam = async (team: TeamDto) => {
  selectedTeamForApproval.value = team;
  mismatchReasons.value = [];
  
  if (project.value) {
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
    case StatusProject.draft: return 'grey';
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

const closeDialog = () => {
  showDialog.value = false;
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
.project-details-card {
  width: 800px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
}

.project-header {
  margin-bottom: 16px;
}

.project-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.project-title {
  margin: 0;
  line-height: 1.3;
}

.status-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.9rem;
  color: #555;
}

.initiator-section,
.date-section {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.initiator-section:hover {
  color: #1976d2;
}

.panels-container {
  min-height: 400px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 0;
}

.detail-block {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.detail-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #bdbdbd;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
}

.section-content {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.5;
  margin-bottom: 0;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tech-tag {
  font-size: 0.8rem;
}

.team-list {
  border-radius: 8px;
  overflow: hidden;
}

.pending-team-item {
  transition: background-color 0.2s;
}

.pending-team-item:hover {
  background-color: #f5f5f5;
}

.team-name {
  font-weight: 500;
}

.team-description {
  font-size: 0.9rem;
  color: #666;
}

.current-team-section {
  margin-top: 24px;
}

.team-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.team-tags {
  display: flex;
  gap: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  color: #666;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.footer-actions {
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
}

/* Team details dialog styles */
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
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.team-owner:hover {
  background-color: #f5f5f5;
}

.team-label {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.members-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.member-item {
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.member-item:hover {
  background-color: #f5f5f5;
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

.competencies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 600px) {
  .project-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .panels-container {
    min-height: 300px;
    max-height: 50vh;
  }
  
  .detail-block {
    padding: 12px;
  }
}
</style>