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
        <div class="row items-center">
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
        >
          <q-card-section class="team-card-content row items-center">
            <!-- Название команды -->
            <div class="col-md-3 col-sm-6 col-xs-12 team-name">
              {{ team.name }}
            </div>
            
            <!-- Количество участников -->
            <div class="col-md-2 col-sm-4 col-xs-6 team-members-count">
              <q-icon name="people" class="q-mr-xs" />
              {{ team.user.length }}
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
                <div class="text-body2">
                  {{ team.description || 'Описание отсутствует' }}
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
    <q-dialog v-model="showTeamDetails">
    <q-card v-if="selectedTeam" class="team-details-card">
      <q-card-section>
        <h2 class="team-heading"><strong>{{ selectedTeam?.name }}</strong></h2>
        <p class="team-description"> <strong>Описание:</strong>&nbsp;{{ selectedTeam?.description }}</p>

        <!-- Владелец команды -->
        <div class="team-owner q-mb-md" v-if="selectedTeam?.user_owner">
          <q-icon name="person" class="q-mr-sm" />
          <strong>Создал: </strong> 
          <span class="user-info">
            {{ selectedTeam.user_owner?.firstname }} {{ selectedTeam.user_owner?.lastname }}
            <template v-if="selectedTeam.user_owner?.email">
              ({{ selectedTeam.user_owner.email }})
            </template>
          </span>
        </div>

        <!-- Участники команды -->
        <div class="team-members" v-if="selectedTeam?.user">
          <q-icon name="people" class="q-mr-sm" />
          <strong>Команда:</strong>
          <ul class="member-list">
            <!-- Владелец -->
            <li class="member-item owner" v-if="selectedTeam.user_owner">
              <div class="member-info">
                <span class="member-name">
                  {{ selectedTeam.user_owner?.firstname }} {{ selectedTeam.user_owner?.lastname }}
                  <q-badge color="teal" class="q-ml-sm">Владелец</q-badge>
                </span>
                <span class="member-email" v-if="selectedTeam.user_owner?.email">
                  <strong style="color: black">email: </strong> {{ selectedTeam.user_owner.email }}
                </span>
              </div>
            </li>

            <!-- Тимлид (если не владелец) -->
            <li 
              v-if="selectedTeam.user_leader && selectedTeam.user_leader.id !== selectedTeam.user_owner?.id"
              class="member-item leader"
            >
              <div class="member-info">
                <span class="member-name">
                  {{ selectedTeam.user_leader?.firstname }} {{ selectedTeam.user_leader?.lastname }}
                  <q-badge color="primary" class="q-ml-sm">Тимлид</q-badge>
                </span>
                <span class="member-email" v-if="selectedTeam.user_leader?.email">
                  <strong style="color: black">email: </strong> {{ selectedTeam.user_leader.email }}
                </span>
              </div>
            </li>

            <!-- Остальные участники -->
            <template v-if="selectedTeam.user?.length">
              <li 
                v-for="user in getRegularMembers(selectedTeam)" 
                :key="user.id" 
                class="member-item"
                :class="{ leader: selectedTeam.user_leader?.id === user?.id }"
              >
                <div class="member-info">
                  <span class="member-name">
                    {{ user?.firstname }} {{ user?.lastname }}
                    <q-badge 
                      v-if="selectedTeam.user_leader?.id === user?.id" 
                      color="primary" 
                      class="q-ml-sm"
                    >
                      Тимлид
                    </q-badge>
                  </span>
                  <span class="member-email" v-if="user?.email">
                    <strong style="color: black">email: </strong> {{ user.email }}
                  </span>
                </div>
              </li>
            </template>
          </ul>
        </div>

        <!-- Статус команды -->
        <div class="team-status q-mt-md">
          <q-icon name="info" class="q-mr-sm" />
          <strong>Статус:</strong>&nbsp;{{ selectedTeam?.status }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn 
          v-if="mainStore.canEditTeam(selectedTeam)"
          flat 
          label="Редактировать" 
          color="primary" 
          @click="openEditTeamDialog(selectedTeam)" 
        />

        <q-btn 
          v-if="isCurrentUserMember(selectedTeam) && !isCurrentUserOwner(selectedTeam)"
          flat
          label="Покинуть команду"
          color="orange"
          @click="confirmLeaveTeam(selectedTeam)"
        />

        <q-btn 
          v-if="selectedTeam && mainStore.canJoinTeam(selectedTeam)"
          flat
          label="Вступить"
          color="positive"
          @click="handleJoinTeamClick(selectedTeam)"
        />

        <q-btn 
          v-if="mainStore.canDeleteTeam(selectedTeam)"
          flat 
          label="Удалить" 
          :color="mainStore.getCurrentUser().id === selectedTeam.user_owner?.id ? 'deep-orange' : 'negative'" 
          @click="confirmDeleteTeam(selectedTeam)"
          :icon="mainStore.getCurrentUser().id === selectedTeam.user_owner?.id ? 'warning' : undefined"
        />
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

    <!-- Диалог создания команды -->
    <CreateTeamDialog ref="createTeamDialog" @create="addTeam" />
  </q-page>
  <EditTeamDialog ref="editTeamDialog" @update="updateTeam" />
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
import { TeamDto, PrivacyTeam, StatusProject, ProjectDto, StatusTeam} from '../../../../backend/src/common/types'; // Добавляем StatusProject
import { useQuasar } from 'quasar';

// Хранилище
const mainStore = useMainStore();

// Инициализируем Quasar
const $q = useQuasar();

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

// Фильтрация и сортировка команд
const filteredTeams = computed(() => {
  let result = [...teams.value];
  
  // Фильтр по приватности
  if (activeFilter.value !== 'all') {
    result = result.filter(team => team.privacy === activeFilter.value);
  }
  
  // Фильтр по статусу - важно сравнивать с enum значениями
  if (statusFilter.value !== 'all') {
    result = result.filter(team => team.status === statusFilter.value);
  }
  
  // Сортировка
  result.sort((a, b) => {
    let comparison = 0;
    switch (sortField.value) {
      case 'privacy':
        comparison = a.privacy.localeCompare(b.privacy);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'members':
        comparison = (a.user?.length || 0) - (b.user?.length || 0);
        break;
    }
    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
  
  return result;
});


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

  // Проверка на наличие другой команды
  if (currentUser.team) {
    $q.notify({
      message: 'Вы уже состоите в другой команде. Покиньте текущую команду перед вступлением в новую.',
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
    message: `Вы уверены, что хотите вступить в команду "${team.name}"?`,
    persistent: true,
    ok: {
      label: 'Вступить',
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

    // Обновляем пользователя, устанавливая team_id
    await updateUser(currentUserId, { team: teamId });
    
    // Обновляем данные в хранилище
    mainStore.updateTeamData(teamId);
    
    $q.notify({
      message: 'Вы успешно вступили в команду',
      color: 'positive'
    });
    
    showTeamDetails.value = false;
    await loadTeams(); // Перезагружаем список команд
  } catch (error) {
    console.error('Ошибка при вступлении в команду:', error);
    $q.notify({
      message: 'Ошибка при вступлении в команду',
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
      await updateTeams(team.id, {user_leader: null});
    });
  }
};

const completeLeaveTeam = async (teamId: number) => {
  const currentUserId = mainStore.getCurrentUser().id;
  const team = teams.value.find(t => t.id === teamId);

  if (!team) {
      $q.notify({ message: 'Команда не найдена', color: 'negative' });
      return;
    }
  
  try {
    // Обновляем пользователя
    await updateUser(currentUserId, { team: null });
    
    // Обновляем список команд
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
  window.location.reload()
};

const getRegularMembers = (team: TeamDto) => {
  if (!team?.user || !team?.user_owner) return [];
  return team.user.filter(u => 
    u?.id !== team.user_owner?.id && 
    (!team.user_leader || u?.id !== team.user_leader?.id)
  );
};

// Добавляем массив для хранения ID раскрытых команд
const expandedTeams = ref<number[]>([]);

// Функция для переключения отображения описания
/*const toggleTeamDescription = (teamId: number) => {
  const index = expandedTeams.value.indexOf(teamId);
  if (index === -1) {
    expandedTeams.value.push(teamId);
  } else {
    expandedTeams.value.splice(index, 1);
  }
};*/

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
      message: `Вы являетесь владельцем команды "${team.name}". Удаление команды приведет к безвозвратному удалению всех данных. <br><br>Вы точно хотите продолжить?`,
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

/* Количество участников - своя колонка */
.team-members-count {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Чипы приватности и статуса - свои колонки */
.privacy-chip,
.status-chip {
  margin: 0 auto; /* Автоматические отступы для центрирования */
  display: inline-flex;
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
  width: 600px;
  max-width: 90%;
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
  padding-left: 20px;
  border-bottom: 1px solid #eee;
}

.member-info {
  display: flex;
  flex-direction: column;
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

/* Адаптивные стили для мобильных устройств */
@media (max-width: 600px) {
  .team-card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .team-actions {
    width: 100%;
    justify-content: space-between;
  }
  
  .team-members-count {
    margin-right: 0;
  }
}
</style>