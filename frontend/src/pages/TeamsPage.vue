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

      <!-- Фильтры -->
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

      <!-- Список команд -->
      <div class="teams-list">
        <q-card
          v-for="(team, index) in paginatedTeams"
          :key="team.id"
          class="q-mb-sm team-card"
        >
          <q-card-section>
            <div class="flex justify-between items-center">
              <div class="flex items-center">
                <div class="text-h6">#{{ (currentPage - 1) * itemsPerPage + index + 1 }} {{ team.name }}</div>
              </div>
              <div class="flex items-center">
                <q-icon name="people" class="q-mr-sm" />
                <span class="q-mr-md">{{ team.user.length }} участников</span>
                <q-chip
                  :color="team.privacy === PrivacyTeam.close ? 'negative' : 'positive'"
                  text-color="white"
                >
                  {{ team.privacy === PrivacyTeam.close ? 'Закрытая' : 'Открытая' }}
                </q-chip>
                <q-btn
                  color="primary"
                  label="Открыть"
                  @click="openTeamDetails(team)"
                  class="q-ml-sm"
                />
              </div>
            </div>
          </q-card-section>
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
        <p class="team-description">{{ selectedTeam?.description }}</p>

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
                  <q-badge 
                    v-if="selectedTeam.user_leader?.id === selectedTeam.user_owner?.id" 
                    color="primary" 
                    class="q-ml-sm"
                  >
                    Тимлид
                  </q-badge>
                </span>
                <span class="member-email" v-if="selectedTeam.user_owner?.email">
                  <strong style = "color: black">email: </strong> {{ selectedTeam.user_owner.email }}
                </span>
              </div>
            </li>

            <!-- Остальные участники -->
            <template v-if="selectedTeam.user?.length">
              <li 
                v-for="user in getRegularMembers(selectedTeam)" 
                :key="user.id" 
                class="member-item"
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
                    <strong style = "color: black">email: </strong> {{ user.email }}
                  </span>
                </div>
              </li>
            </template>
          </ul>
        </div>

        <!-- Статус команды -->
        <div class="team-status q-mt-md">
          <q-icon name="info" class="q-mr-sm" />
          <strong>Статус:</strong> {{ selectedTeam?.status }}
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn 
          v-if="canDeleteTeam(selectedTeam)"
          flat 
          label="Удалить" 
          color="negative" 
          @click="confirmDeleteTeam(selectedTeam)" 
        />
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

    <!-- Диалог создания команды -->
    <CreateTeamDialog ref="createTeamDialog" @create="addTeam" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMainStore } from 'src/stores/main-store';
import { getAll, remove } from 'src/api/team.api';
import CreateTeamDialog from './CreateTeamDialog.vue';
import { TeamDto, PrivacyTeam } from '../../../backend/src/common/types';
import { useQuasar } from 'quasar';

// Хранилище
const mainStore = useMainStore();

// Инициализируем Quasar
const $q = useQuasar();

// Команды
const teams = ref<TeamDto[]>([]);

// Объявляем activeFilter с типом
const activeFilter = ref<string | PrivacyTeam>('all');

// Фильтрация команд
const filteredTeams = computed(() => {
  if (activeFilter.value === 'all') return teams.value;
  return teams.value.filter(team => team.privacy === activeFilter.value);
});

const getRegularMembers = (team: TeamDto) => {
  if (!team?.user || !team?.user_owner) return [];
  return team.user.filter(u => u?.id !== team.user_owner?.id);
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

// Функция проверки прав на удаление
const canDeleteTeam = (team: TeamDto) => {
  return mainStore.isAdmin() || team.user_owner.id === mainStore.userId;
};

// Функция подтверждения удаления
const confirmDeleteTeam = (team: TeamDto) => {
  $q.dialog({
    title: 'Подтверждение удаления',
    message: `Вы уверены, что хотите удалить команду "${team.name}"?`,
    persistent: true,
    ok: {
      label: 'Удалить',
      color: 'negative'
    },
    cancel: {
      label: 'Отмена',
      color: 'primary',
      flat: true
    }
  }).onOk(async () => {
    await deleteTeam(team.id);
  });
};

// Функция удаления команды
const deleteTeam = async (teamId: number) => {
  try {
    const deletedTeam = await remove(teamId);
    if (deletedTeam) {
      // Удаляем команду из списка
      teams.value = teams.value.filter(t => t.id !== teamId);
      // Закрываем диалог
      showTeamDetails.value = false;
      $q.notify({
        message: 'Команда успешно удалена',
        color: 'positive',
        position: 'top'
      });
    }
  } catch (error) {
    console.error('Ошибка при удалении команды:', error);
    $q.notify({
      message: 'Ошибка при удалении команды',
      color: 'negative',
      position: 'top'
    });
  }
  window.location.reload();
};

// Логика для создания команды
const createTeamDialog = ref();

const openCreateTeamDialog = () => {
  createTeamDialog.value.openDialog();
}

const addTeam = (newTeam: TeamDto) => {
  teams.value.push(newTeam);
}
</script>

<style scoped>

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

.filters {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.teams-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1200px;
  margin-bottom: 20px;
}

.team-card {
  border-radius: 8px;
  transition: transform 0.2s;
}

.team-card:hover {
  transform: translateY(-2px);
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

@media (max-width: 600px) {
  .teams-list {
    grid-template-columns: 1fr;
  }
}
</style>