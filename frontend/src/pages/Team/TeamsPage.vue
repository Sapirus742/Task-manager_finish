<template>
  <q-page class="flex flex-column">
    <div class="projects-container">
      <!-- Заголовок и кнопка создания -->
      <div class="header-section">
        <h2 class="project-title">Команды</h2>
        <q-btn
          v-if="mainStore.canCreateTeam()"
          label="Создать команду"
          color="primary"
          @click="openCreateTeamDialog"
          class="create-btn q-mb-md"
        />
      </div>

      <!-- Блок поиска -->
      <div class="search-box q-mb-md">
        <q-input
          v-model="searchQuery"
          outlined
          placeholder="Поиск команд по названию или описанию..."
          dense
          clearable
          class="search-input"
        >
          <template v-slot:prepend>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>

      <div class="filter-label">Фильтрация:</div>

      <!-- Фильтр по приватности -->
      <div class="filters q-mb-md">
        <q-btn-toggle
          v-model="activeFilter"
          spread
          no-caps
          toggle-color="primary"
          :options="[
            { label: 'Все', value: 'all' },
            { label: 'Открытые', value: PrivacyTeam.open },
            { label: 'Закрытые', value: PrivacyTeam.close }
          ]"
        />
      </div>

      <!-- Фильтр по статусу -->
      <div class = "filter q-md-md">
        <q-btn-toggle
          v-model="statusFilter"
          spread
          no-caps
          toggle-color="primary"
          :options="[
            { label: 'Все статусы', value: 'all' },
            { label: 'В процессе работы', value: StatusTeam.inProgress },
            { label: 'Поиск проекта', value: StatusTeam.searchProject },
            { label: 'Подана на проект', value: StatusTeam.joinProject },
            { label: 'На удалении', value: StatusTeam.delete }
          ]"
        />
      </div>

      <!-- Сортировка -->
      <div class="sorting-header q-mb-md">
        <div class="row items-center no-wrap">
          <!-- Сортировка по названию -->
          <div class="col-md-3 col-sm-6 col-xs-12">
            <q-btn
              flat dense no-caps
              @click="toggleSort('name')"
              :color="sortField === 'name' ? 'primary' : ''"
              class="full-width sort-btn"
            >
              Название
              <q-icon 
                v-if="sortField === 'name'" 
                name="keyboard_arrow_right" 
                class="q-ml-xs"
                :class="{ 'rotate-90': sortDirection === 'asc', 'rotate-270': sortDirection === 'desc' }"
              />
            </q-btn>
          </div>
          
          <!-- Сортировка по участникам -->
          <div class="col-md-2 col-sm-4 col-xs-6">
            <q-btn
              flat dense no-caps
              @click="toggleSort('members')"
              :color="sortField === 'members' ? 'primary' : ''"
              class="full-width sort-btn"
            >
              Участники
              <q-icon 
                v-if="sortField === 'members'" 
                name="keyboard_arrow_right" 
                class="q-ml-xs"
                :class="{ 'rotate-90': sortDirection === 'asc', 'rotate-270': sortDirection === 'desc' }"
              />
            </q-btn>
          </div>
          
          <!-- Сортировка по приватности -->
          <div class="col-md-2 col-sm-4 col-xs-6">
            <q-btn
              flat dense no-caps
              @click="toggleSort('privacy')"
              :color="sortField === 'privacy' ? 'primary' : ''"
              class="full-width sort-btn"
            >
              Приватность
              <q-icon 
                v-if="sortField === 'privacy'" 
                name="keyboard_arrow_right" 
                class="q-ml-xs"
                :class="{ 'rotate-90': sortDirection === 'asc', 'rotate-270': sortDirection === 'desc' }"
              />
            </q-btn>
          </div>
          
          <!-- Сортировка по статусу -->
          <div class="col-md-2 col-sm-4 col-xs-6">
            <q-btn
              flat dense no-caps
              @click="toggleSort('status')"
              :color="sortField === 'status' ? 'primary' : ''"
              class="full-width sort-btn"
            >
              Статус
              <q-icon 
                v-if="sortField === 'status'" 
                name="keyboard_arrow_right" 
                class="q-ml-xs"
                :class="{ 'rotate-90': sortDirection === 'asc', 'rotate-270': sortDirection === 'desc' }"
              />
            </q-btn>
          </div>
          
          <!-- Пустая колонка для кнопок действий -->
          <div class="col-md-3 col-sm-4 col-xs-6"></div>
        </div>
      </div>

      <!-- Список команд -->
      <div class="teams-list">
        <q-card
          v-for="(team) in paginatedTeams"
          :key="team.id"
          class="q-mb-sm team-card"
          :class="{ 'status-delete': team.status === StatusTeam.delete }"
          @click="toggleTeamDescription(team.id)"
        >
          <q-card-section class="team-card-content row items-center no-wrap">
            <!-- Название команды -->
            <div class="col-md-3 col-sm-6 col-xs-12 team-name">
              {{ team.name }}
            </div>
            
            <!-- Количество участников -->
            <div class="col-md-2 col-sm-4 col-xs-6 team-members-count">
              <q-icon name="people" class="q-mr-xs" />
              {{ getUniqueMembersCount(team) }}
            </div>
            
            <!-- Приватность -->
            <div class="col-md-2 col-sm-4 col-xs-6 privacy-chip-container">
              <q-chip
                :color="team.privacy === PrivacyTeam.close ? 'negative' : 'positive'"
                text-color="white"
                class="privacy-chip"
              >
                {{ team.privacy === PrivacyTeam.close ? 'Закрытая' : 'Открытая' }}
              </q-chip>
            </div>
            
            <!-- Статус -->
            <div class="col-md-2 col-sm-4 col-xs-6 status-chip-container">
              <q-chip
                v-if="team.status"
                :color="getStatusColor(team.status)"
                text-color="white"
                class="status-chip"
              >
                {{ team.status }}
              </q-chip>
            </div>
            
            <!-- Кнопки действий -->
            <div class="col-md-3 col-sm-6 col-xs-12 team-actions">
              <q-btn
                color="primary"
                label="Открыть"
                @click.stop="openTeamDetails(team)"
                class="open-btn"
              />
              <q-btn 
                v-if="mainStore.canJoinTeam(team)"
                flat
                label="Вступить"
                color="positive"
                @click.stop="handleJoinTeamClick(team)"
                class="join-btn"
              />
            </div>
          </q-card-section>

          <!-- Раскрывающееся описание -->
          <q-slide-transition>
            <div v-show="expandedTeams.includes(team.id)">
              <q-separator />
              <q-card-section class="team-description-section">
                <div class="text-subtitle2 q-mb-sm">Описание команды:</div>
                <div class="text-body2">
                  {{ team.description || 'Описание отсутствует' }}
                </div>

                <!-- Добавляем блок с компетенциями команды -->
                <div v-if="getTeamCompetencies(team).length > 0" class="q-mt-sm">
                  <div class="text-subtitle2 q-mb-xs">Компетенции команды:</div>
                  <div class="competencies-container">
                    <q-chip
                      v-for="(competency, index) in getTeamCompetencies(team)"
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
              </q-card-section>
            </div>
          </q-slide-transition>
        </q-card>
      </div>
      <!-- Пустое состояние -->
      <div v-if="teams.length === 0" class="empty-state">
        <q-icon name="info" size="xl" />
        <p>Нет команд.</p>
      </div>

      <!-- Пагинация -->
      <q-pagination
        v-if="teams.length > 0"
        v-model="currentPage"
        :max="totalPages"
        :input="true"
        class="q-mt-md"
        :max-pages="10"
      />
    </div>

    <!-- Диалог с деталями команды -->
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
                            :color="getStatusColor(selectedTeam.status)"
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
                          <span class="text-h6 text-primary q-ml-sm">{{ memberCount }}</span>
                        </div>

                        <div class="info-item" v-if = "getPendingMembersCount(selectedTeam) > 0">
                          <q-icon name="hourglass_empty" size="sm" class="q-mr-sm"/>
                          <span class="text-weight-medium">Заявок на вступление:</span>
                          <span class="text-h6 text-primary q-ml-sm">{{ pendingMembersCount }}</span>
                          <q-btn
                            v-if="mainStore.getCurrentUser().id === selectedTeam.user_leader?.id && getPendingMembersCount(selectedTeam) > 0"
                            color= "cyan-5"
                            label="Заявки"
                            @click.stop="openPendingRequests(selectedTeam)"
                            class="q-ml-sm"
                          />
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
                        <q-badge v-if="isLeaderAlsoOwner" color="primary" class="q-ml-sm">Тимлид</q-badge>
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
                  <div v-for="user in regularMembers" 
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
          <q-btn 
            v-if="mainStore.canEditTeam(selectedTeam)"
            flat 
            label="Редактировать" 
            color="primary" 
            icon="edit"
            @click="openEditTeamDialog(selectedTeam)" 
          />

          <q-btn 
            v-if="isCurrentUserMember(selectedTeam) && !isCurrentUserOwner(selectedTeam) && !isPendingMember"
            flat
            label="Покинуть команду"
            color="orange"
            icon="exit_to_app"
            @click="confirmLeaveTeam(selectedTeam)"
          />

          <q-btn 
            v-if="selectedTeam && mainStore.canJoinTeam(selectedTeam)"
            flat
            label="Подать заявку"
            color="positive"
            icon="person_add"
            @click="handleJoinTeamClick(selectedTeam)"
          />

          <q-btn 
            v-if="mainStore.canDeleteTeam(selectedTeam) && selectedTeam?.status === StatusTeam.delete"
            flat 
            label="Удалить" 
            :color="mainStore.getCurrentUser().id === selectedTeam.user_owner?.id ? 'deep-orange' : 'negative'" 
            @click="confirmDeleteTeam(selectedTeam)"
            :icon="mainStore.getCurrentUser().id === selectedTeam.user_owner?.id ? 'warning' : 'delete'"
          />
          <q-btn flat label="Закрыть" color="grey" v-close-popup icon="close"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
    <!-- Диалог создания команды -->
    <CreateTeamDialog ref="createTeamDialog" @create="addTeam" />
    
    <PendingRequestsDialog ref="pendingRequestsDialog" />
  </q-page>
  <EditTeamDialog ref="editTeamDialog" @update="updateTeam" />
  <teleport to="body">
    <UserProfileOpen 
      ref ="userProfileOpenRef" :userId="selectedUserId"
     />
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMainStore } from 'src/stores/main-store';
import { getAll, remove } from 'src/api/team.api';
import { update as updateProject } from 'src/api/project.api'; // Добавляем импорт функции update
import {update as updateUser} from 'src/api/users.api';
import {update as updateTeams} from 'src/api/team.api';
import CreateTeamDialog from './CreateTeamDialog.vue';
import EditTeamDialog from './EditTeamDialog.vue';
import { 
      create as createPortfolio,
      update as updatePortfolio,
      getAll as getAllPortfolio, } from 'src/api/portfolio.api';
import { UserCommandStatus } from '../../../../backend/src/common/types';
import { UserAccountStatus } from '../../../../backend/src/common/types';
import { 
  TeamDto, 
  PrivacyTeam,
  StatusProject,
  ProjectDto, 
  StatusTeam, 
  SecuredUser} from '../../../../backend/src/common/types'; // Добавляем StatusProject
import { useQuasar } from 'quasar';
import UserProfileOpen from 'src/pages/UserProfileOpen.vue';
import PendingRequestsDialog from '../PendingRequestsDialog.vue';

// Хранилище
const mainStore = useMainStore();

// Инициализируем Quasar
const $q = useQuasar();

// Хранение поискового запроса
const searchQuery = ref('');

// Команды
const teams = ref<TeamDto[]>([]);

// Объявляем activeFilter с типом
const activeFilter = ref<string | PrivacyTeam>('all');
const statusFilter = ref<string | StatusTeam>('all');

// Добавляем тип для сортировки
type SortField = 'privacy' | 'name' | 'status' | 'members';
type SortDirection = 'asc' | 'desc';

// Состояние сортировки
const sortField = ref<SortField>('name');
const sortDirection = ref<SortDirection>('asc');

const selectedUserId = ref<number>(0);
//const isProfileOpen = ref(false);

const userProfileOpenRef = ref();

const pendingRequestsDialog = ref<InstanceType<typeof PendingRequestsDialog>>();

const openUserProfile = (userId: number) => {
  console.log('Opening profile for user:', userId);
  selectedUserId.value = userId; 
  userProfileOpenRef.value?.open();
};

// Фильтрация и сортировка команд
const filteredTeams = computed(() => {
  let result = [...teams.value];

  // Фильтрация по поиску
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(team => 
      team.name.toLowerCase().includes(query) || 
      (team.description && team.description.toLowerCase().includes(query))
    );
  }
  
  // Фильтрация по приватности
  if (activeFilter.value !== 'all') {
    result = result.filter(team => team.privacy === activeFilter.value);
  }
  
  // Фильтрация по статусу
  if (statusFilter.value !== 'all') {
    result = result.filter(team => team.status === statusFilter.value);
  }
  
  // Сортировка
  result.sort((a, b) => {
    // Если сортируем по статусу, применяем кастомную логику
    if (sortField.value === 'status') {
      const aWeight = getStatusWeight(a.status);
      const bWeight = getStatusWeight(b.status);
      const comparison = aWeight - bWeight;
      return sortDirection.value === 'asc' ? comparison : -comparison;
    }
    
    // Для остальных случаев сортировки:
    // 1. Сначала команды не на удалении
    // 2. Затем команды на удалении
    if (a.status === StatusTeam.delete && b.status !== StatusTeam.delete) return 1;
    if (a.status !== StatusTeam.delete && b.status === StatusTeam.delete) return -1;
    
    // Применяем выбранную сортировку для остальных случаев
    let comparison = 0;
    switch (sortField.value) {
      case 'privacy':
        comparison = a.privacy.localeCompare(b.privacy);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'members':
        comparison = (a.user?.length || 0) - (b.user?.length || 0);
        break;
    }
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
  
  return result;
});

// Получаем количество заявок для конкретной команды
const getPendingMembersCount = (team: TeamDto): number => {
  return team.user?.filter(u => u.status === UserAccountStatus.pending).length || 0;
};

// Количество заявок для выбранной команды (в диалоге)
const pendingMembersCount = computed(() => {
  if (!selectedTeam.value) return 0;
  return getPendingMembersCount(selectedTeam.value);
});

// Метод для открытия диалога с заявками
const openPendingRequests = (team: TeamDto) => {
  const pendingUsers = team.user?.filter(u => u.status === UserAccountStatus.pending) || [];
  pendingRequestsDialog.value?.open(pendingUsers, team.name, team.id);
};

// Получаем уникальных участников команды (без дублирования)
const getUniqueMembers = (team: TeamDto): SecuredUser[] => {
  const members = new Map<number, SecuredUser>();
  
  // Добавляем владельца как участника, если он есть
  if (team.user_owner) {
    members.set(team.user_owner.id, team.user_owner);
  }
  
  // Добавляем тимлида как участника, если он есть и это не владелец
  if (team.user_leader && team.user_leader.id !== team.user_owner?.id) {
    members.set(team.user_leader.id, team.user_leader);
  }
  
  // Добавляем обычных участников, исключая дубли
  if (team.user) {
    team.user.forEach(user => {
      if (user && !members.has(user.id) && user.status !== UserAccountStatus.pending) {
        members.set(user.id, user);
      }
    });
  }
  
  return Array.from(members.values());
};

// Получаем количество уникальных участников
const getUniqueMembersCount = (team: TeamDto | null): number => {
  if (!team) return 0;
  return getUniqueMembers(team).length;
};

// Получаем обычных участников (без владельца и тимлида)
const regularMembers = computed(() => {
  if (!selectedTeam.value) return [];
  
  const uniqueMembers = getUniqueMembers(selectedTeam.value);
  const ownerId = selectedTeam.value.user_owner?.id;
  const leaderId = selectedTeam.value.user_leader?.id;
  
  return uniqueMembers.filter(user => {
    return user.id !== ownerId && user.id !== leaderId && user.status !== UserAccountStatus.pending;
  });
});

// Обновляем вычисляемое свойство для счетчика участников
const memberCount = computed(() => {
  return getUniqueMembersCount(selectedTeam.value);
});

// Вычисляемое свойство для проверки, что владелец - это тимлид
const isLeaderAlsoOwner = computed(() => {
  return selectedTeam.value?.user_owner?.id === selectedTeam.value?.user_leader?.id;
});

const formatPhone = (phone?: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
};

const getStatusWeight = (status: StatusTeam): number => {
  switch (status) {
    case StatusTeam.searchProject: return 1;    // Поиск работы
    case StatusTeam.joinProject: return 2;      // Подана на проект
    case StatusTeam.inProgress: return 3;       // В процессе работы
    case StatusTeam.delete: return 4;           // На удалении
    default: return 0;
  }
};

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


const toggleSort = (field: SortField) => {
  if (sortField.value === field) {
    // Если уже сортируем по этому полю, меняем направление
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
  } else {
    // Если новое поле, устанавливаем его и направление по умолчанию
    sortField.value = field;
    sortDirection.value = 'asc';
  }
};

const getStatusColor = (status: StatusTeam) => {
  switch (status) {
    case StatusTeam.inProgress: return 'positive';
    case StatusTeam.searchProject: return 'info';
    case StatusTeam.joinProject: return 'warning';
    case StatusTeam.delete: return 'negative';
    default: return 'grey';
  }
};

const handleJoinTeamClick = (team: TeamDto | null) => {
  if (!team) return;

  const currentUser = mainStore.getCurrentUser();
  
  // Проверка на уже состоящего в команде
  if (team.user.some(u => u.id === currentUser.id)) {
    $q.notify({
      message: 'Вы уже состоите в этой команде',
      color: 'warning',
      position: 'top'
    });
    return;
  }

  // Проверка на приватность команды
  if (team.privacy === PrivacyTeam.close) {
    $q.notify({
      message: 'Эта команда закрыта для вступления. Обратитесь к владельцу команды.',
      color: 'negative',
      position: 'top'
    });
    return;
  }

  // Проверка на статус команды
  if (team.status === StatusTeam.delete) {
    $q.notify({
      message: 'Невозможно вступить в команду, которая помечена на удаление',
      color: 'negative',
      position: 'top'
    });
    return;
  }

  // Если все проверки пройдены, показываем диалог подтверждения
  confirmJoinTeam(team);
};

// Подтверждение вступления в команду
const confirmJoinTeam = (team: TeamDto) => {
  $q.dialog({
    title: 'Подтверждение вступления',
    message: `Вы уверены, что хотите подать заявку на вступление в команду "${team.name}"?`,
    persistent: true,
    ok: {
      label: 'Подать',
      color: 'positive',
      flat: true
    },
    cancel: {
      label: 'Отмена',
      color: 'primary',
    }
  }).onOk(async () => {
    await handleJoinTeam(team.id);
  });
};

// Обработчик вступления в команду
const handleJoinTeam = async (teamId: number) => {
  try {
    const currentUserId = mainStore.getCurrentUser().id;
    const team = teams.value.find(t => t.id === teamId);
    
    if (!team) {
      $q.notify({ message: 'Команда не найдена', color: 'negative' });
      return;
    }

    // 1. Обновляем пользователя, устанавливая team_id и status юзера
    await updateUser(currentUserId, { team: teamId, status: UserAccountStatus.pending });
    
    // 2. Обновляем данные в хранилище
    mainStore.updateTeamData(teamId);
    
    $q.notify({
      message: 'Вы успешно подали заявку на вступление в команду',
      color: 'positive'
    });
    
    showTeamDetails.value = false;
    await loadTeams(); // Перезагружаем список команд
  } catch (error) {
    console.error('Ошибка при подачи заявки на вступление в команду:', error);
    $q.notify({
      message: 'Ошибка при подачи заявки на вступление в команду',
      color: 'negative'
    });
  }
};

// Проверяем, является ли текущий пользователь участником команды
const isCurrentUserMember = (team: TeamDto) => {
  const currentUserId = mainStore.getCurrentUser().id;
  return team.user?.some(u => u.id === currentUserId) || 
         team.user_leader?.id === currentUserId ||
         team.user_owner?.id === currentUserId;
};

// Проверяем, является ли текущий пользователь владельцем команды
const isCurrentUserOwner = (team: TeamDto) => {
  return mainStore.getCurrentUser().id === team.user_owner?.id;
};

const isPendingMember = () => {
  return mainStore.getCurrentUser().status == UserAccountStatus.pending;
};

// Подтверждение выхода из команды
const confirmLeaveTeam = (team: TeamDto) => {
  const currentUser = mainStore.getCurrentUser();
  
  // Особый случай для тимлида
  if (team.user_leader?.id === currentUser.id) {
    handleLeaderLeave(team);
    return;
  }

  // Стандартный диалог для обычных участников
  $q.dialog({
    title: 'Подтверждение выхода',
    message: `Вы уверены, что хотите покинуть команду "${team.name}"?`,
    persistent: true,
    ok: {
      label: 'Покинуть',
      color: 'orange',
      flat: true
    },
    cancel: {
      label: 'Отмена',
      color: 'primary',
    }
  }).onOk(async () => {
    await completeLeaveTeam(team.id);
  });
};

const handleLeaderLeave = async (team: TeamDto) => {
  const currentUserId = mainStore.getCurrentUser().id;
  const remainingMembers = team.user.filter(u => 
    u.id !== currentUserId && u.id !== team.user_owner?.id
  );

  // Сценарий 1: Есть другие участники кроме тимлида
  if (remainingMembers.length > 0) {
    $q.dialog({
      title: 'Завещайте роль тимлида',
      message: 'Выберите нового тимлида из участников команды:',
      options: {
        type: 'radio',
        model: remainingMembers[0].id.toString(),
        items: remainingMembers.map(member => ({
          label: `${member.firstname} ${member.lastname}`,
          value: member.id
        }))
      },
      persistent: true,
      ok: {
        label: 'Покинуть команду',
        color: 'negative'
      },
      cancel: {
        label: 'Остаться',
        color: 'primary'
      },
    }).onOk(async (newLeaderId) => {
      try {
        // Обновляем тимлида в команде
        await updateTeams(team.id, { user_leader: parseInt(newLeaderId) });
        // Продолжаем выход из команды
        await completeLeaveTeam(team.id);
      } catch (error) {
        console.error('Ошибка при передаче роли тимлида:', error);
      }
    });
  } 
  // Сценарий 2: Тимлид - последний участник
  else {
    $q.dialog({
      title: 'Последний участник',
      html: true,
      message: 'Вы последний участник команды. <br>После вашего ухода команда останется без тимлида.',
      persistent: true,
      ok: {
        label: 'Покинуть команду',
        color: 'negative'
      },
      cancel: {
        label: 'Остаться',
        color: 'primary'
      }
    }).onOk(async () => {
      await completeLeaveTeam(team.id);
      await updateTeams(team.id, {user_leader: null, status: StatusTeam.delete});
    });
  }
};

// Метод выхода из команды
const completeLeaveTeam = async (teamId: number) => {
  const currentUserId = mainStore.getCurrentUser().id;
  
  try {
    // 1. Обновляем пользователя (убираем team_id)
    await updateUser(currentUserId, { team: null });
    
    // 2. Получаем все портфолио пользователя через API
    const userPortfolios = await getAllPortfolio();

    // 3. Находим активную запись о вступлении
    const activePortfolio = userPortfolios.find(
      p => p.team?.id === teamId && p.status === UserCommandStatus.inTeam
    );

    if (activePortfolio) {
      // Обновляем запись о вступлении - меняем статус на "исключен"
      await updatePortfolio(activePortfolio.id, {
        status: UserCommandStatus.expelled,
      });
    } else {
      console.log('Обновление не удалось... или запись не найдена)');
      // Создаем новую запись об исключении (без записи о вступлении)
      await createPortfolio({
        status: UserCommandStatus.expelled,
        team: teamId,
        user: currentUserId,
        entryDate: new Date(), 
        exclusionDate: new Date(),
      });
    }

    // 4. Обновляем данные
    mainStore.updateTeamData(teamId);
    await loadTeams();
    
    $q.notify({
      message: 'Вы успешно покинули команду',
      color: 'positive'
    });
    
    showTeamDetails.value = false;
  } catch (error) {
    console.error('Ошибка при выходе из команды:', error);
    $q.notify({
      message: 'Ошибка при выходе из команды',
      color: 'negative'
    });
  }
  window.location.reload();
};

// Добавляем массив для хранения ID раскрытых команд
const expandedTeams = ref<number[]>([]);

// Функция для переключения отображения описания
const toggleTeamDescription = (teamId: number) => {
  const index = expandedTeams.value.indexOf(teamId);
  if (index === -1) {
    expandedTeams.value.push(teamId);
  } else {
    expandedTeams.value.splice(index, 1);
  }
};

// Загрузка команд из базы данных
const loadTeams = async () => {
  try {
    const data = await getAll(); // Загружаем команды из API
    if (data) {
      teams.value = data;
    }
  } catch (error) {
    console.error('Ошибка при загрузке команд:', error);
  }
};

// Загружаем команды при монтировании компонента
onMounted(() => {
  loadTeams();
});

// Пагинация
const itemsPerPage = 4;
const currentPage = ref(1);
const totalPages = computed(() => Math.ceil(teams.value.length / itemsPerPage));
const paginatedTeams = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage;
  return filteredTeams.value.slice(start, start + itemsPerPage);
});
// Логика для открытия деталей команды
const showTeamDetails = ref(false);
const selectedTeam = ref<TeamDto | null>(null);

const openTeamDetails = (team: TeamDto) => {
  selectedTeam.value = team;
  showTeamDetails.value = true;
};

// Функция подтверждения удаления с двойным подтверждением для владельца
const confirmDeleteTeam = (team: TeamDto) => {
  const currentUser = mainStore.getCurrentUser(); // Получаем текущего пользователя
  const isOwner = currentUser.id === team.user_owner?.id;
  
  if (isOwner) {
    // Двойное подтверждение для владельца
    $q.dialog({
      title: 'Важное подтверждение',
      message: `Вы являетесь владельцем команды "${team.name}". Удаление команды приведет к безвозвратному удалению всех данных и их дальнейшее отоброжение в интерфейсе сайта станет невозможным. <br><br>Вы точно хотите продолжить?`,
      html: true,
      persistent: true,
      ok: {
        label: 'Да, я понимаю последствия',
        color: 'negative', 
        flat: true
      },
      cancel: {
        label: 'Отмена',
        color: 'positive',
      }
    }).onOk(() => {
      showFinalConfirmation(team);
    });
  } else {
    showFinalConfirmation(team);
  }
};

// Финальное подтверждение удаления
const showFinalConfirmation = (team: TeamDto) => {
  $q.dialog({
    title: 'Подтверждение удаления',
    message: `Вы уверены, что хотите удалить команду "${team.name}"?`,
    persistent: true,
    ok: {
      label: 'Удалить',
      color: 'negative',
      flat: true
    },
    cancel: {
      label: 'Отмена',
      color: 'positive',
    }
  }).onOk(async () => {
    await deleteTeam(team.id);
  });
};

// Функция удаления команды
const deleteTeam = async (teamId: number) => {
  try {
    const teamToDelete = teams.value.find(t => t.id === teamId);
    if (!teamToDelete) {
      $q.notify({ message: 'Команда не найдена', color: 'negative' });
      return;
    }

    // 1. Получаем всех участников команды
    const teamMembers = [
      teamToDelete.user_owner,
      ...teamToDelete.user,
      ...(teamToDelete.user_leader ? [teamToDelete.user_leader] : [])
    ].filter((member, index, arr) => 
      member && arr.findIndex(m => m?.id === member.id) === index
    );

    // 2. Обновляем портфолио каждого участника
    if (teamMembers.length > 0) {
      try {
        const allPortfolios = await getAllPortfolio();
        
        for (const member of teamMembers) {
          if (!member) continue;
          
          // Находим активные записи портфолио пользователя в этой команде
          const userPortfolios = allPortfolios.filter(
            p => p.user?.id === member.id && 
                 p.team?.id === teamId && 
                 p.status === UserCommandStatus.inTeam
          );

          // Обновляем каждую запись
          for (const portfolio of userPortfolios) {
            await updatePortfolio(portfolio.id, {
              status: UserCommandStatus.expelled,
              team: null,
            });
          }
        }
      } catch (error) {
        console.error('Ошибка обновления портфолио:', error);
        $q.notify({
          message: 'Команда будет удалена, но не удалось обновить все записи портфолио',
          color: 'warning'
        });
      }
    }

    // Удаление команды
    await remove(teamId);
    teams.value = teams.value.filter(t => t.id !== teamId);

    // Обновление проекта (если есть)
    if (teamToDelete.project?.id) {
      try {
        const updateData = {
          status: StatusProject.searchTeam
        };
        
        console.log('Обновление проекта:', {
          projectId: teamToDelete.project.id,
          data: updateData
        });
        
        await updateProject(teamToDelete.project.id, updateData);
        
        // Локальное обновление - исправленная версия
        teams.value.forEach(t => {
  if (t.project?.id === teamToDelete.project?.id && t.project) {
    t.project = {
      id: t.project.id,
      name: t.project.name,
      problem: t.project.problem,
      solution: t.project.solution,
      result: t.project.result,
      resource: t.project.resource,
      stack: [...t.project.stack],
      status: StatusProject.searchTeam,
      startProject: new Date(t.project.startProject),
      stopProject: new Date(t.project.stopProject),
      maxUsers: t.project.maxUsers,
      customer: t.project.customer,
      initiator: {...t.project.initiator},
      teams: [...t.project.teams]
    } as ProjectDto;
  }
});
      } catch (error) {
        console.error('Ошибка обновления проекта:', error);
        $q.notify({
          message: 'Команда удалена, но статус проекта не обновлен',
          color: 'warning'
        });
      }
    }

    $q.notify({ message: 'Команда удалена', color: 'positive' });
    showTeamDetails.value = false;
  } catch (error) {
    console.error('Ошибка удаления:', error);
    $q.notify({ message: 'Ошибка удаления команды', color: 'negative' });
  } finally {
    loadTeams();
  }
};

// Логика для создания команды
const createTeamDialog = ref();

const openCreateTeamDialog = () => {
  createTeamDialog.value.openDialog();
}

const addTeam = (newTeam: TeamDto) => {
  teams.value.push(newTeam);
}

// Добавляем ссылку на диалог редактирования
const editTeamDialog = ref();

// Метод для открытия диалога редактирования
const openEditTeamDialog = (team: TeamDto) => {
  if (!team) return;
  editTeamDialog.value.openDialog(team);
  showTeamDetails.value = false;
};

// Метод для обновления списка команд после редактирования
const updateTeam = async (updatedTeam: TeamDto) => {
  try {
    // Находим индекс обновляемой команды в массиве
    const index = teams.value.findIndex(t => t.id === updatedTeam.id);
    
    if (index !== -1) {
      // Создаем новый массив с обновленной командой
      teams.value = [
        ...teams.value.slice(0, index),
        updatedTeam,
        ...teams.value.slice(index + 1)
      ];
    }
    
    // Показываем уведомление об успешном обновлении
    $q.notify({
      message: 'Команда успешно обновлена',
      color: 'positive'
    });
    
    // Перезагружаем список команд для синхронизации
    await loadTeams();
  } catch (error) {
    console.error('Ошибка обновления команды:', error);
    $q.notify({
      message: 'Ошибка обновления команды',
      color: 'negative'
    });
  }
};

</script>

<style scoped>

/* Общие стили для адаптивности */
.sorting-header .row {
  min-width: 100%;
  overflow-x: auto; /* Добавляем горизонтальный скролл при необходимости */
}

/* Стили для текста с обрезанием */
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
}

.competencies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.team-description {
  white-space: pre-line;
  line-height: 1.6;
  padding: 8px 0;
}

.team-description-section {
  padding: 16px;
  background-color: #f9f9f9;
}

.text-subtitle2 {
  font-weight: 500;
  color: #555;
}

.sorting {
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
}

.sort-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rotate-90 {
  transform: rotate(270deg);
  transition: transform 0.2s ease;
}

.rotate-270 {
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

/* Стили для диалога выбора нового тимлида */
.q-dialog__inner--radio .q-radio__label {
  padding: 8px;
  font-size: 1rem;
}

/* Подсветка выбранного участника */
.q-item--active {
  background-color: rgba(25, 118, 210, 0.1);
}

.join-btn {
  margin-left: 8px;
  pointer-events: auto;
  opacity: 1 !important; /* Обеспечиваем постоянную видимость */
}
.q-btn--disabled.join-btn {
  opacity: 0.7 !important;
}

.team-owner,
.member-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.team-owner:hover,
.member-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.member-item.leader {
  background-color: rgba(113, 176, 240, 0.05); /* Легкий голубой фон для тимлида */
}

.member-item.owner {
  background-color: rgba(107, 238, 225, 0.05); /* Легкий зеленый фон для владельца */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.empty-state .q-icon {
  margin-bottom: 10px;
}

.projects-container {
  width: 80%;
  margin: 10px auto 0;
}

.owner-label::after {
  content: " ";
  white-space: pre;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.project-title {
  font-size: 50px; /* Уменьшенный размер */
  font-weight: 60;
  margin: 0;
  color: #333;
  padding-top: 25px;
}

.create-btn {
  align-self: flex-start; /* Выравнивание кнопки по левому краю */
  width: auto;
  padding: px 16px;
}

.projects-container {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
}

.search-and-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-box {
  max-width: 500px;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
}

.filter-label {
  font-size: 1.1rem; /* Увеличиваем размер шрифта */
  font-weight: 600;  /* Делаем шрифт полужирным */
  color: #333;       /* Темно-серый цвет для лучшей читаемости */
  margin-bottom: 8px; /* Увеличиваем отступ снизу */
}

.filters {
  display: flex;
  gap: 16px; /* Отступ между фильтрами */
  flex-wrap: wrap;
}

.filters .q-btn-toggle {
  min-width: 300px; /* Минимальная ширина переключателей */
  border-radius: 18px;
}

.filter {
  display: flex;
  gap: 16px; /* Отступ между фильтрами */
  flex-wrap: wrap;
}

.filter .q-btn-toggle {
  min-width: 300px; /* Минимальная ширина переключателей */
  width: 800px;
  border-radius: 18px;
  margin-bottom: 30px;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.team-info {
  display: flex;
  flex-direction: column;
}

.team-number {
  font-size: 0.9rem;
  color: #666;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 0.8em;
}

.active-sort {
  font-weight: bold;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.team-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.team-card-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-width: 100%;
  cursor: pointer; /* Добавляем указатель при наведении */
}

.team-card-content > * {
  pointer-events: auto;
}

.team-actions > * {
  pointer-events: auto !important;
}

.open-btn, .join-btn {
  pointer-events: auto;
}

/* Общие стили для ячеек с данными */
.team-members-count,
.privacy-chip-container,
.status-chip-container {
  display: flex;
  justify-content: center; /* Центрирование по горизонтали */
  align-items: center; /* Центрирование по вертикали */
  height: 100%; /* Занимает всю высоту строки */
}

/* Название команды - занимает свою колонку */
.team-name {
  flex: 3;
  font-size: 1.1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

/* Основные изменения для кнопок действий */
.team-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

/* Стили для кнопок в карточке */
.team-actions .q-btn {
  min-width: auto;
  padding: 0 8px;
}

.sort-btn {
  padding: 0 4px;
  min-width: auto;
}

/* Количество участников - своя колонка */
.team-members-count {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Стили для чипов */
.privacy-chip, .status-chip {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Чипы приватности и статуса - свои колонки */
.privacy-chip,
.status-chip {
  margin: 0 auto; /* Автоматические отступы для центрирования */
  display: flex;
  justify-content: center;
}

.privacy-chip-container,
.status-chip-container {
  flex: 2;
}

/* Добавляем отступ для кнопки "Открыть" чтобы она не срабатывала при клике на карточку */
.open-btn {
  margin-left: 8px;
  pointer-events: auto; /* Разрешаем события мыши для кнопки */
}

/* Запрещаем события мыши для остальных элементов при клике */
.team-card-content > *:not(.open-btn) {
  pointer-events: none;
}

/* Разрешаем события для всей карточки */
.team-card-content {
  pointer-events: auto;
}

.single-team-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.team-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.team-description-section {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 0 0 8px 8px;
}

/* Увеличение размера иконки */
.q-icon--large {
  font-size: 24px; /* Размер иконки */
}

/* Стили для диалога с деталями команды */
.team-details-card {
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background-color: #e9e9e9;
}

.team-header {
  padding: 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  
  .close-btn {
    color: white;
  }
}

.team-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.team-layout {
  display: flex;
  gap: 20px;
  flex: 1; /* Растягиваем layout на всю доступную высоту */
  min-height: 0; /* Важно для корректного скролла */
  align-items: stretch;
}

.left-column {
  width: 300px;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Карточки с одинаковой высотой */
.info-card, .section-card {
  display: flex;
  flex-direction: column;
}

.section-card .q-card__section, 
.info-card .q-card__section {
  flex: 1; /* Растягиваем секции карточек */
}

.avatar-section {  
  .team-name {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .team-status {
    display: flex;
    justify-content: center;
  }
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-weight: 500;
  width: 100px;
  color: #555;
  font-size: 13px;
}

.info-value {
  flex: 1;
  padding: 0 8px;
  font-size: 13px;
}

.section-card {
  flex: 0 0 auto;
}

.team-status strong {
  margin-right: 4px;
}

.user-info {
  margin-left: 4px;
}

.team-owner {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.team-heading {
  font-size: 24px;
  margin-top: 0;
  margin-bottom: 8px;
}

.team-description {
  margin: 8px 0;
}

.team-members {
  margin: 8px 0;
}

.member-list {
  list-style: none;
  padding-left: 0;
  margin-top: 8px;
}

.member-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: white;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  &.owner {
    background-color: rgba(107, 238, 225, 0.1);
    border-left: 3px solid teal;
  }
  
  &.leader {
    background-color: rgba(113, 176, 240, 0.1);
    border-left: 3px solid var(--q-primary);
  }
}


.member-info {
  .member-name {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .member-email, .member-phone {
    font-size: 12px;
    color: #666;
  }
}

.members-list {
  max-height: 300px;
  overflow-y: auto;
}

.member-name {
  font-weight: 500;
}

.member-item.owner {
  padding-left: 20px;
  border-radius: 4px;
}

.member-email {
  color: #666;
  font-size: 0.9em;
  margin-top: 2px;
}

.team-status {
  display: flex;
  align-items: center;
  margin-top: 16px;
}

.team-details-card .q-btn.negative {
  margin-right: auto; /* Размещаем слева */
}

/* Стиль для команд на удалении */
.team-card.status-delete {
  opacity: 0.6;
  background-color: #f5f5f5;
  color: #726f6f;
}

/* При наведении возвращаем обычный вид */
.team-card.status-delete:hover {
  opacity: 1;
  background-color: white;
  color: inherit;
}

/* Делаем кнопки менее заметными для команд на удалении */
.team-card.status-delete .q-btn {
  opacity: 0.6;
}

/* При наведении возвращаем обычный вид кнопкам */
.team-card.status-delete:hover .q-btn {
  opacity: 1;
}

/* Адаптивные стили для мобильных устройств */
@media (max-width: 800px) {
  .team-card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sort-btn span {
    display: none;
  }

  .sort-btn .q-icon {
    margin: 0;
  }

  .team-name, .team-members-count, 
  .privacy-chip-container, .status-chip-container {
    flex: 1 1 50%;
    margin-bottom: 8px;
  }
  
  .team-actions {
    flex: 1 1 100%;
    justify-content: center;
  }
  
  .team-members-count {
    margin-right: 0;
  }
  .team-layout {
    flex-direction: column;
  }
  
  .left-column {
    width: 100%;
  }
  
  .right-column {
    width: 100%;
  }
}
/* Базовые переменные для светлой темы */
:root {
  --bg-color: #ffffff;
  --text-color: #121212;
  --card-bg: #f5f5f5;
  --border-color: #e0e0e0;
  --hover-bg: #eeeeee;
  --active-bg: #e0e0e0;
  --disabled-bg: #f5f5f5;
  --chip-bg: #e0e0e0;
}

/* Основные стили, использующие переменные */
.projects-container {
  background-color: var(--bg-color);
  color: var(--text-color);
}

.team-card {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}
/* Общие стили для адаптивности */
.sorting-header .row {
  min-width: 100%;
  overflow-x: auto; /* Добавляем горизонтальный скролл при необходимости */
}

/* Стили для текста с обрезанием */
.text-ellipsis {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: inline-block;
  max-width: 100%;
}

.competencies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.team-description {
  white-space: pre-line;
  line-height: 1.6;
  padding: 8px 0;
}

.team-description-section {
  padding: 16px;
  background-color: #f9f9f9;
}

.text-subtitle2 {
  font-weight: 500;
  color: #555;
}

.sorting {
  background-color: #f5f5f5;
  padding: 8px 12px;
  border-radius: 4px;
}

.sort-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.rotate-90 {
  transform: rotate(270deg);
  transition: transform 0.2s ease;
}

.rotate-270 {
  transform: rotate(90deg);
  transition: transform 0.2s ease;
}

/* Стили для диалога выбора нового тимлида */
.q-dialog__inner--radio .q-radio__label {
  padding: 8px;
  font-size: 1rem;
}

/* Подсветка выбранного участника */
.q-item--active {
  background-color: rgba(25, 118, 210, 0.1);
}

.join-btn {
  margin-left: 8px;
  pointer-events: auto;
  opacity: 1 !important; /* Обеспечиваем постоянную видимость */
}
.q-btn--disabled.join-btn {
  opacity: 0.7 !important;
}

.team-owner,
.member-item {
  cursor: pointer;
  transition: background-color 0.2s;
}

.team-owner:hover,
.member-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.member-item.leader {
  background-color: rgba(113, 176, 240, 0.05); /* Легкий голубой фон для тимлида */
}

.member-item.owner {
  background-color: rgba(107, 238, 225, 0.05); /* Легкий зеленый фон для владельца */
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.empty-state .q-icon {
  margin-bottom: 10px;
}

.projects-container {
  width: 80%;
  margin: 10px auto 0;
}

.owner-label::after {
  content: " ";
  white-space: pre;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.project-title {
  font-size: 50px; /* Уменьшенный размер */
  font-weight: 60;
  margin: 0;
  color: #333;
  padding-top: 25px;
}

.create-btn {
  align-self: flex-start; /* Выравнивание кнопки по левому краю */
  width: auto;
  padding: px 16px;
}

.projects-container {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
}

.search-and-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-box {
  max-width: 500px;
  margin-bottom: 20px;
}

.search-input {
  width: 100%;
}

.filter-label {
  font-size: 1.1rem; /* Увеличиваем размер шрифта */
  font-weight: 600;  /* Делаем шрифт полужирным */
  color: #333;       /* Темно-серый цвет для лучшей читаемости */
  margin-bottom: 8px; /* Увеличиваем отступ снизу */
}

.filters {
  display: flex;
  gap: 16px; /* Отступ между фильтрами */
  flex-wrap: wrap;
}

.filters .q-btn-toggle {
  min-width: 300px; /* Минимальная ширина переключателей */
  border-radius: 18px;
}

.filter {
  display: flex;
  gap: 16px; /* Отступ между фильтрами */
  flex-wrap: wrap;
}

.filter .q-btn-toggle {
  min-width: 300px; /* Минимальная ширина переключателей */
  width: 800px;
  border-radius: 18px;
  margin-bottom: 30px;
}

.teams-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.team-info {
  display: flex;
  flex-direction: column;
}

.team-number {
  font-size: 0.9rem;
  color: #666;
}

.sort-indicator {
  margin-left: 4px;
  font-size: 0.8em;
}

.active-sort {
  font-weight: bold;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.team-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.team-card-content {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  min-width: 100%;
  cursor: pointer; /* Добавляем указатель при наведении */
}

.team-card-content > * {
  pointer-events: auto;
}

.team-actions > * {
  pointer-events: auto !important;
}

.open-btn, .join-btn {
  pointer-events: auto;
}

/* Общие стили для ячеек с данными */
.team-members-count,
.privacy-chip-container,
.status-chip-container {
  display: flex;
  justify-content: center; /* Центрирование по горизонтали */
  align-items: center; /* Центрирование по вертикали */
  height: 100%; /* Занимает всю высоту строки */
}

/* Название команды - занимает свою колонку */
.team-name {
  flex: 3;
  font-size: 1.1rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 8px;
}

/* Основные изменения для кнопок действий */
.team-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-left: auto;
}

/* Стили для кнопок в карточке */
.team-actions .q-btn {
  min-width: auto;
  padding: 0 8px;
}

.sort-btn {
  padding: 0 4px;
  min-width: auto;
}

/* Количество участников - своя колонка */
.team-members-count {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Стили для чипов */
.privacy-chip, .status-chip {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Чипы приватности и статуса - свои колонки */
.privacy-chip,
.status-chip {
  margin: 0 auto; /* Автоматические отступы для центрирования */
  display: flex;
  justify-content: center;
}

.privacy-chip-container,
.status-chip-container {
  flex: 2;
}

/* Добавляем отступ для кнопки "Открыть" чтобы она не срабатывала при клике на карточку */
.open-btn {
  margin-left: 8px;
  pointer-events: auto; /* Разрешаем события мыши для кнопки */
}

/* Запрещаем события мыши для остальных элементов при клике */
.team-card-content > *:not(.open-btn) {
  pointer-events: none;
}

/* Разрешаем события для всей карточки */
.team-card-content {
  pointer-events: auto;
}

.single-team-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
}

.team-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.team-description-section {
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 0 0 8px 8px;
}

/* Увеличение размера иконки */
.q-icon--large {
  font-size: 24px; /* Размер иконки */
}

/* Стили для диалога с деталями команды */
.team-details-card {
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background-color: #e9e9e9;
}

.team-header {
  padding: 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  
  .close-btn {
    color: white;
  }
}

.team-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.team-layout {
  display: flex;
  gap: 20px;
  flex: 1; /* Растягиваем layout на всю доступную высоту */
  min-height: 0; /* Важно для корректного скролла */
  align-items: stretch;
}

.left-column {
  width: 300px;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Карточки с одинаковой высотой */
.info-card, .section-card {
  display: flex;
  flex-direction: column;
}

.section-card .q-card__section, 
.info-card .q-card__section {
  flex: 1; /* Растягиваем секции карточек */
}

.avatar-section {  
  .team-name {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 8px;
  }
  
  .team-status {
    display: flex;
    justify-content: center;
  }
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-weight: 500;
  width: 100px;
  color: #555;
  font-size: 13px;
}

.info-value {
  flex: 1;
  padding: 0 8px;
  font-size: 13px;
}

.section-card {
  flex: 0 0 auto;
}

.team-status strong {
  margin-right: 4px;
}

.user-info {
  margin-left: 4px;
}

.team-owner {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.team-heading {
  font-size: 24px;
  margin-top: 0;
  margin-bottom: 8px;
}

.team-description {
  margin: 8px 0;
}

.team-members {
  margin: 8px 0;
}

.member-list {
  list-style: none;
  padding-left: 0;
  margin-top: 8px;
}

.member-item {
  padding: 12px;
  border-radius: 6px;
  margin-bottom: 8px;
  background: white;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  &.owner {
    background-color: rgba(107, 238, 225, 0.1);
    border-left: 3px solid teal;
  }
  
  &.leader {
    background-color: rgba(113, 176, 240, 0.1);
    border-left: 3px solid var(--q-primary);
  }
}


.member-info {
  .member-name {
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .member-email, .member-phone {
    font-size: 12px;
    color: #666;
  }
}

.members-list {
  max-height: 300px;
  overflow-y: auto;
}

.member-name {
  font-weight: 500;
}

.member-item.owner {
  padding-left: 20px;
  border-radius: 4px;
}

.member-email {
  color: #666;
  font-size: 0.9em;
  margin-top: 2px;
}

.team-status {
  display: flex;
  align-items: center;
  margin-top: 16px;
}

.team-details-card .q-btn.negative {
  margin-right: auto; /* Размещаем слева */
}

/* Стиль для команд на удалении */
.team-card.status-delete {
  opacity: 0.6;
  background-color: #f5f5f5;
  color: #726f6f;
}

/* При наведении возвращаем обычный вид */
.team-card.status-delete:hover {
  opacity: 1;
  background-color: white;
  color: inherit;
}

/* Делаем кнопки менее заметными для команд на удалении */
.team-card.status-delete .q-btn {
  opacity: 0.6;
}

/* При наведении возвращаем обычный вид кнопкам */
.team-card.status-delete:hover .q-btn {
  opacity: 1;
}

/* Адаптивные стили для мобильных устройств */
@media (max-width: 800px) {
  .team-card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    flex-wrap: wrap;
  }

  .sort-btn span {
    display: none;
  }

  .sort-btn .q-icon {
    margin: 0;
  }

  .team-name, .team-members-count, 
  .privacy-chip-container, .status-chip-container {
    flex: 1 1 50%;
    margin-bottom: 8px;
  }
  
  .team-actions {
    flex: 1 1 100%;
    justify-content: center;
  }
  
  .team-members-count {
    margin-right: 0;
  }
  .team-layout {
    flex-direction: column;
  }
  
  .left-column {
    width: 100%;
  }
  
  .right-column {
    width: 100%;
  }
}
.body--dark {
  /* Основные цвета */
  --bg-color: #121212;
  --text-color: #e0e0e0;
  --card-bg: #1e1e1e;
  --border-color: #333;
  --hover-bg: #2a2a2a;
  --active-bg: #333;
  --disabled-bg: #252525;
  --chip-bg: #333;
  
  /* Переопределяем стили для темной темы */
  background-color: var(--bg-color);
  color: var(--text-color);
}

/* Стили для карточек в темной теме */
.body--dark .team-card {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

.body--dark .team-card:hover {
  background-color: var(--hover-bg);
}

.body--dark .team-description-section {
  background-color: var(--card-bg);
}

/* Стили для диалога в темной теме */
.body--dark .team-details-card {
  background-color: var(--card-bg);
}

.body--dark .info-card,
.body--dark .competencies-card,
.body--dark .description-card,
.body--dark .members-card {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

/* Стили для текста */
.body--dark .text-subtitle2 {
  color: #aaa;
}

/* Стили для чипов */
.body--dark .q-chip {
  background-color: var(--chip-bg);
}

/* Стили для списка участников */
.body--dark .member-item {
  background-color: var(--card-bg);
}

.body--dark .member-item:hover {
  background-color: var(--hover-bg);
}

/* Стили для кнопок */
.body--dark .q-btn.flat {
  color: var(--text-color);
}

/* Стили для пустого состояния */
.body--dark .empty-state {
  color: #aaa;
}

/* Стили для статуса "на удалении" */
.body--dark .team-card.status-delete {
  background-color: #2a2a2a;
  color: #aaa;
}

.body--dark .team-card.status-delete:hover {
  background-color: #333;
  color: var(--text-color);
}

/* Стили для поиска и фильтров */
.body--dark .q-field--outlined .q-field__control {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

.body--dark .q-field--outlined .q-field__control:hover {
  border-color: #555;
}

.body--dark .q-btn-toggle {
  background-color: var(--card-bg);
}

/* Стили для пагинации */
.body--dark .q-pagination__content .q-btn {
  color: var(--text-color);
}

.body--dark .q-pagination__content .q-btn.active {
  background-color: var(--active-bg);
}

/* Стили для disabled элементов */
.body--dark .q-btn--disabled {
  background-color: var(--disabled-bg) !important;
  color: #666 !important;
}
/* Темная тема с черными фонами и белым текстом */
.body--dark {
  /* Цветовая палитра */
  --bg-color: #000000;               /* Чистый черный для основного фона */
  --card-bg: #121212;                /* Темно-серый для карточек */
  --darker-bg: #0a0a0a;              /* Еще темнее для акцентных элементов */
  --border-color: #333333;           /* Границы элементов */
  --text-color: #ffffff;             /* Основной белый текст */
  --text-secondary: #e0e0e0;         /* Вторичный текст */
  --text-muted: #b0b0b0;             /* Неактивный текст */
  
  /* Применение к странице */
  background-color: var(--bg-color);
  color: var(--text-color);
}
.q-page
  {
    background-color:var(--bg-color);
  }
/* Заголовки и подзаголовки */
.body--dark .project-title,
.body--dark .text-h4,
.body--dark .text-h5,
.body--dark .text-h6,
.body--dark .text-subtitle1,
.body--dark .text-subtitle2,
.body--dark .filter-label {
  color: #ffffff !important;         /* Явно белый цвет для всех заголовков */
}

/* Карточки команд */
.body--dark .team-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
}

.body--dark .team-card:hover {
  background-color: #1a1a1a;
}

/* Диалог профиля команды */
.body--dark .team-details-card {
  background-color: var(--bg-color);
}

.body--dark .team-header {
  background-color: #121212 !important; /* Темный фон для хедера диалога */
}

.body--dark .info-card,
.body--dark .competencies-card,
.body--dark .description-card,
.body--dark .members-card {
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
}

/* Элементы форм */
.body--dark .q-field--outlined .q-field__control {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

.body--dark .q-field--outlined .q-field__control:hover {
  border-color: #444;
}

/* Кнопки и переключатели */
.body--dark .q-btn-toggle {
  background-color: var(--card-bg);
}

.body--dark .q-btn.flat {
  color: var(--text-color);
}

/* Списки */
.body--dark .member-item {
  background-color: var(--card-bg);
}

.body--dark .member-item:hover {
  background-color: #1e1e1e;
}

/* Чипы */
.body--dark .q-chip {
  background-color: #333;
  color: white;
}

/* Состояния */
.body--dark .team-card.status-delete {
  background-color: #1a1a1a;
  color: #aaa;
}

.body--dark .team-card.status-delete:hover {
  background-color: #222;
}

/* Пустое состояние */
.body--dark .empty-state {
  color: var(--text-secondary);
}

/* Особые элементы */
.body--dark .team-description-section {
  background-color: var(--darker-bg);
  border-top: 1px solid var(--border-color);
}

.body--dark .q-separator {
  background-color: var(--border-color);
}

/* Аватарки */
.body--dark .q-avatar {
  color: white !important;
}

/* Пагинация */
.body--dark .q-pagination__content .q-btn {
  color: var(--text-color);
}

.body--dark .q-pagination__content .q-btn.active {
  background-color: #333;
}
.body--dark .team-details-card .q-card__actions {
  background-color: #121212 !important; /* Темный фон вместо белого */
  border-top: 1px solid #333 !important; /* Граница сверху */
}

.body--dark .team-details-card .q-btn {
  color: #ffffff !important; /* Белый текст кнопок */
}

.body--dark .team-details-card .q-btn.flat {
  background-color: transparent !important;
}

.body--dark .team-details-card .q-btn.flat:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Дополнительно: стили для текста в диалоге */
.body--dark .team-details-card .text-primary {
  color: #4fc3f7 !important; /* Голубой вместо стандартного primary */
}

.body--dark .team-details-card .text-body1,
.body--dark .team-details-card .text-body2 {
  color: #e0e0e0 !important; /* Светло-серый для основного текста */
}
</style>