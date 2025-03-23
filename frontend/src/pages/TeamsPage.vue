<template>
  <q-page class="flex flex-column">
    <div class="projects-container">
      <div class="header">
        <h1 class="project-title">Команды</h1>
        <!-- Кнопка "Создать команду" для ролей admin, customer, directorate -->
        <q-btn
          v-if="canCreateTeam"
          label="Создать команду"
          color="primary"
          @click="openCreateTeamDialog"
          class="q-mb-md"
        />
      </div>

      <!-- фильтры -->
      <div class="filters q-mb-md">
    
        <!-- Фильтры: открытая и закрытая команды -->
        <div class="filters">
          <q-btn
            v-for="filter in filters"
            :key="filter.label"
            :label="filter.label"
            :color="filter.active ? 'primary' : 'grey'"
            @click="toggleFilter(filter)"
            class="q-mr-sm"
          />
        </div>
      </div>

      <!-- Список команд -->
      <div class="teams-list">
        <q-card
          v-for="(team, index) in paginatedTeams"
          :key="team.id"
          class="q-mb-sm"
          flat
          bordered
          :style="{ borderRadius: '10px', border: '1px solid #ddd' }"
        >
          <q-card-section>
            <div class="flex justify-between items-center">
              <div class="flex items-center">
                <div class="text-h6">#{{ index + 1 }} {{ team.name }}</div>

                <!-- Кнопка "Вступить" (отображается только для admin и user и только для открытых команд) -->
                <q-btn
                  v-if="canJoinTeam && team.privacy === 'open'"
                  color="positive"
                  label="Вступить"
                  @click="joinTeam(team.id)"
                  class="q-ml-sm"
                />
              </div>
              <div class="flex items-center">
                <!-- Иконка с количеством участников (увеличена) -->
                <q-icon name="people" class="q-icon--large q-mr-sm" />
                <span class="q-mr-md text-h6">{{ team.user.length }}</span>

                <!-- Статус приватности -->
                <q-chip
                  :color="team.privacy === 'close' ? 'negative' : 'positive'"
                  text-color="white"
                  size="sm"
                >
                  {{ team.privacy === 'close' ? 'Закрытая' : 'Открытая' }}
                </q-chip>

                <!-- Кнопка "Открыть" -->
                <q-btn
                  color="primary"
                  label="Открыть"
                  @click="toggleTeamDetails(team.id)"
                  class="q-ml-sm"
                />

              </div>
            </div>
          </q-card-section>

          <!-- Подробная информация о команде -->
          <q-slide-transition>
            <div v-if="openedTeams.includes(team.id)">
              <q-separator />
              <q-card-section>
                <div class="text-subtitle2 q-mb-sm">
                  <strong>Создал:</strong> {{ team.user_owner }}
                </div>
                <div class="text-subtitle2 q-mb-sm">
                  <strong>Описание:</strong> {{ team.description }}
                </div>
                <div class="text-subtitle2 q-mb-sm">
                  <strong>Участники:</strong> {{ team.user.join(', ') }}
                </div>
                <div class="text-subtitle2">
                  <strong>Статус:</strong> {{ team.status }}
                </div>
              </q-card-section>
            </div>
          </q-slide-transition>
        </q-card>
      </div>

      <!-- Пагинация -->
      <q-pagination
        v-model="currentPage"
        :max="totalPages"
        :input="true"
        class="q-mt-md"
      />

      <!-- Пустое состояние -->
      <div v-if="teams.length === 0" class="empty-state">
        <q-icon name="info" size="xl" />
        <p>Нет команд.</p>
      </div>
    </div>

  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import { useMainStore } from 'src/stores/main-store';
import { getAll, create, remove, update } from 'src/api/team.api';
import {get} from 'src/api/users.api'

// Хранилище
const mainStore = useMainStore();
const { firstname, lastname, userId, roles } = storeToRefs(mainStore);

interface Team {
  id: number;
  name: string;
  description: string;
  privacy: string;
  status: string;
  user_leader: string;
  portfolio: string;
  user_owner: number;
  user: number[];
  project: number;
  //markedForDel: boolean;
}

// Команды
const teams = ref<Team[]>([]);

// Указываем тип для openedTeams
const openedTeams = ref<number[]>([]); // Массив чисел (ID команд)

// Фильтры
const filters = ref([
  { label: 'Все категории', active: true },
  { label: 'Открыта', active: false },
  { label: 'Закрыта', active: false },
]);

// Переключение фильтров
const toggleFilter = (filter: { label: string }) => {
  filters.value.forEach((f) => (f.active = f.label === filter.label));
};

// Загрузка команд из базы данных
const loadTeams = async () => {
  try {
    const data = await getAll(); // Загружаем команды из API
    if (data) {
      teams.value = data.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        privacy: team.privacy,
        status: team.status,
        user_leader: number,
        user: team.user.map(user => user.id), // Массив ID пользователей
        portfolio: team.portfolio.map(portfolio => portfolio.id).join(", "),
        user_owner: team.user_owner,
        //markedForDel: team.markedForDel || false,
        project: team.project ? team.project.name : null,
      }));
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
  const end = start + itemsPerPage;
  return teams.value.slice(start, end);
});

// Логика для открытия/закрытия деталей команды
const toggleTeamDetails = (teamId: number) => {
  if (openedTeams.value.includes(teamId)) {
    openedTeams.value = openedTeams.value.filter((id) => id !== teamId);
  } else {
    openedTeams.value.push(teamId);
  }
};

//const joinTeam = async (teamId: number) => {


// Логика для создания команды
const createTeamDialog = ref();

const openCreateTeamDialog = () => {
  createTeamDialog.value.openDialog();
}

const addTeam = (newTeam: Team) => {
  teams.value.push(newTeam);
}

// Проверка, может ли пользователь создавать команды
const canCreateTeam = computed(() => {
  return mainStore.isAdmin() || mainStore.isCustomer() || mainStore.isDirectorate();
});

// Проверка, может ли пользователь видеть кнопку "Вступить"
const canJoinTeam = computed(() => {
  return mainStore.isAdmin() || mainStore.isUser();
});

</script>

<style scoped>
.projects-container {
  width: 80%;
  margin: 10px auto 0;
}

.header {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 10px;
}

.project-title {
  font-size: 40px;
  margin: 0;
  font-family: 'Roboto', sans-serif;
  font-weight: 500;
  color: #333;
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
  max-width: 60vw;
  margin: 0 auto;
  padding: 0;
}

/* Увеличение размера иконки */
.q-icon--large {
  font-size: 24px; /* Размер иконки */
}
</style>