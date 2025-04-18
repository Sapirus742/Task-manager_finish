<template>
  <q-page class="row">
    <!-- Боковая панель бирж -->
    <q-drawer
      v-model="leftDrawerOpen"
      bordered
      :width="300"
      class="bg-grey-2"
    >
      <q-scroll-area class="fit">
        <q-list padding>
          <q-item-label header class="text-weight-bold">
            Биржи проектов
            <q-btn
              round
              dense
              flat
              icon="add"
              @click="showCreateDialog = true"
              v-if="canCreateExchange"
            />
          </q-item-label>

          <q-item
            v-for="exchange in exchanges"
            :key="exchange.id"
            clickable
            v-ripple
            :active="activeExchange?.id === exchange.id"
            @click="setActiveExchange(exchange)"
          >
            <q-item-section>
              <q-item-label>{{ exchange.name }}</q-item-label>
              <q-item-label caption>
                {{ formatDateRange(exchange.startExchange, exchange.stopExchange) }}
              </q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                @click.stop="confirmDelete(exchange)"
                v-if="canEditExchange(exchange)"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <!-- Основное содержимое с проектами -->
    <div class="col q-pa-md">
      <template v-if="activeExchange">
        <div class="row items-center q-mb-md">
          <h2 class="text-h4 q-my-none">{{ activeExchange.name }}</h2>
          <q-chip class="q-ml-md" color="primary" text-color="white">
            {{ activeExchange.projects.length }} проектов
          </q-chip>
          <q-space />
          <q-btn
            color="primary"
            icon="add"
            label="Добавить проекты"
            @click="showAddProjectsDialog = true"
            v-if="canEditExchange(activeExchange)"
          />
        </div>

        <q-separator class="q-mb-md" />

        <div v-if="activeExchange.projects.length" class="row q-col-gutter-md">
          <div
            v-for="project in activeExchange.projects"
            :key="project.id"
            class="col-12 col-md-6 col-lg-4"
          >
            <q-card class="project-card">
              <q-card-section>
                <div class="text-h6">{{ project.name }}</div>
                <div class="text-caption text-grey q-mt-sm">
                  {{ project.customer }}
                </div>
                <q-chip
                  v-for="(tech, index) in project.stack.slice(0, 3)"
                  :key="index"
                  dense
                  color="primary"
                  text-color="white"
                  class="q-mr-xs q-mt-xs"
                >
                  {{ tech }}
                </q-chip>
                <q-chip
                  v-if="project.stack.length > 3"
                  dense
                  color="grey"
                  text-color="white"
                  class="q-mr-xs q-mt-xs"
                >
                  +{{ project.stack.length - 3 }}
                </q-chip>
              </q-card-section>

              <q-card-actions align="right">
                <AgileProjectButton
                v-if="agileButtonStates[project.id]"
                :project="project"
                :visible="agileButtonStates[project.id]?.visible ?? false"
                :loading="agileButtonStates[project.id]?.loading ?? false"
                @click="openAgileProject(project)"
              />
              </q-card-actions>
            </q-card>
          </div>
        </div>

        <div v-else class="text-center q-pa-lg">
          <q-icon name="info" size="xl" color="grey" />
          <div class="text-h6 q-mt-md">Нет проектов в этой бирже</div>
          <q-btn
            color="primary"
            label="Добавить проекты"
            @click="showAddProjectsDialog = true"
            v-if="canEditExchange(activeExchange)"
            class="q-mt-md"
          />
        </div>
      </template>

      <div v-else class="text-center q-pa-lg">
        <q-icon name="info" size="xl" color="grey" />
        <div class="text-h6 q-mt-md">Выберите биржу для просмотра проектов</div>
      </div>
    </div>

    <!-- Диалог создания биржи -->
    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Создать новую биржу</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit.prevent="onCreateSubmit">
            <q-input
              v-model="newExchange.name"
              label="Название"
              :rules="[val => !!val || 'Обязательное поле']"
              class="q-mb-sm"
            />
            
            <q-input
              v-model="startDateString"
              label="Дата начала"
              type="date"
              class="q-mb-sm"
            />
            <q-input
              v-model="stopDateString"
              label="Дата окончания"
              type="date"
              class="q-mb-sm"
            />
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Диалог добавления проектов -->
    <q-dialog v-model="showAddProjectsDialog" persistent>
      <q-card style="min-width: 600px">
        <q-card-section>
          <div class="text-h6">Добавить проекты в биржу</div>
        </q-card-section>

        <q-card-section>
          <q-list bordered separator>
            <q-item v-for="project in availableProjects" :key="project.id">
              <q-item-section>
                <q-item-label>{{ project.name }}</q-item-label>
                <q-item-label caption>
                  {{ project.customer }}
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-checkbox v-model="selectedProjects" :val="project.id" />
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn label="Добавить" color="primary" @click="addProjectsToExchange" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- AgileProject компонент -->
    <AgileProject ref="agileProject" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch, reactive } from 'vue';
import { useExchangeStore } from 'src/stores/exchange-store';
import { useProjectStore } from 'src/stores/project-store';
import { useMainStore } from 'src/stores/main-store';
import { useQuasar } from 'quasar';
import { CreateExchangeDto, ExchangeDto, ProjectDto, StatusProject, StatusTeam } from '../../../../backend/src/common/types';
import AgileProject from 'src/pages/Exchange/AgileProject.vue';
import AgileProjectButton from 'src/pages/Exchange/AgileProjectButton.vue';
import { useTeamStore } from 'src/stores/team-store';

const exchangeStore = useExchangeStore();
const projectStore = useProjectStore();
const mainStore = useMainStore();
const teamStore = useTeamStore();
const $q = useQuasar();

// Состояние
const leftDrawerOpen = ref(true);
const showCreateDialog = ref(false);
const showAddProjectsDialog = ref(false);
const activeExchange = ref<ExchangeDto | null>(null);
const selectedProjects = ref<number[]>([]);

const newExchange = ref<Omit<CreateExchangeDto, 'startExchange' | 'stopExchange'> & {
  startExchange: string;
  stopExchange: string;
}>({
  name: '',
  startExchange: new Date().toISOString().split('T')[0],
  stopExchange: new Date().toISOString().split('T')[0],
});

const openAgileProject = (project: ProjectDto | undefined) => {
  if (!project) return;
  agileProject.value?.open(project);
};

const agileButtonStates = reactive<Record<number, { visible: boolean; loading: boolean }>>({});
// Проверка доступа к Agile доске
const checkAgileButtonVisibility = async (project: ProjectDto) => {
  if (!agileButtonStates[project.id]) {
    agileButtonStates[project.id] = { visible: false, loading: true };
  } else {
    agileButtonStates[project.id].loading = true;
  }
  
  try {
    // Доступ для админа и дирекции
    if (mainStore.isAdmin() || mainStore.isDirectorate()) {
      agileButtonStates[project.id].visible = true;
      return;
    }

    // Проверка что пользователь является заказчиком проекта
    if (mainStore.isCustomer() && project.initiator?.id === mainStore.userId) {
      agileButtonStates[project.id].visible = true;
      return;
    }

    // Проверка что проект в статусе teamFound
    if (project.status !== StatusProject.teamFound) {
      agileButtonStates[project.id].visible = false;
      return;
    }

    // Загружаем команду проекта
    const team = await teamStore.fetchTeamByProject(project.id);
    if (!team) {
      agileButtonStates[project.id].visible = false;
      return;
    }
    
    // Проверка статуса команды
    if (team.status !== StatusTeam.inProgress) {
      agileButtonStates[project.id].visible = false;
      return;
    }

    // Проверка что пользователь участник команды
    const userId = mainStore.userId;
    agileButtonStates[project.id].visible = (
      (team.user_owner && team.user_owner.id === userId) ||
      (team.user_leader && team.user_leader.id === userId) ||
      (team.user && team.user.some(member => member.id === userId))
    );
  } catch (error) {
    console.error('Error checking team access:', error);
    agileButtonStates[project.id].visible = false;
  } finally {
    agileButtonStates[project.id].loading = false;
  }
};

// Реакция на изменение пользователя или команды
watch(() => mainStore.userId, () => {
  if (activeExchange.value?.projects) {
    activeExchange.value.projects.forEach(project => {
      checkAgileButtonVisibility(project);
    });
  }
});

watch(() => teamStore.currentTeam, () => {
  if (activeExchange.value?.projects) {
    activeExchange.value.projects.forEach(project => {
      checkAgileButtonVisibility(project);
    });
  }
}, { deep: true });

// При монтировании компонента или изменении проектов
watch(() => activeExchange.value?.projects, (projects) => {
  if (projects) {
    projects.forEach(project => {
      checkAgileButtonVisibility(project);
    });
  }
}, { immediate: true });

// Вычисляемые свойства
const startDateString = computed({
  get: () => newExchange.value.startExchange,
  set: (val) => newExchange.value.startExchange = val
});

const stopDateString = computed({
  get: () => newExchange.value.stopExchange,
  set: (val) => newExchange.value.stopExchange = val
});

const exchanges = computed(() => exchangeStore.exchanges);

// Обновленное вычисляемое свойство для доступных проектов с учетом проектов на других биржах
const availableProjects = computed(() => {
  // Получаем все проекты, которые уже на каких-то биржах
  const projectsOnExchanges = new Set(
    exchangeStore.exchanges.flatMap(ex => ex.projects.map(p => p.id))
  );
  
  return projectStore.projects.filter(p => 
    // Проект доступен если:
    // 1. Он еще не на какой-либо бирже
    !projectsOnExchanges.has(p.id) ||
    // ИЛИ 2. Он уже на текущей выбранной бирже (чтобы можно было убрать)
    (activeExchange.value?.projects.some(ep => ep.id === p.id))
  );
});

const canCreateExchange = computed(() => {
  return mainStore.isAdmin() || mainStore.isDirectorate();
});

const canEditExchange = (exchange: ExchangeDto) => {
  return mainStore.isDirectorate() || mainStore.isAdmin() ||
         (mainStore.isDirectorate() && exchange.projects.some(p => p.initiator.id === mainStore.userId));
};

const agileProject = ref();

const formatDateRange = (start: Date, end: Date) => {
  return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
};

const setActiveExchange = (exchange: ExchangeDto) => {
  activeExchange.value = exchange;
};

onMounted(async () => {
  await exchangeStore.fetchAllExchanges();
  await projectStore.fetchAllProjects();
  
  if (exchangeStore.exchanges.length > 0) {
    activeExchange.value = exchangeStore.exchanges[0];
  }
});

const confirmDelete = (exchange: ExchangeDto) => {
  $q.dialog({
    title: 'Подтверждение',
    message: `Вы уверены, что хотите удалить биржу "${exchange.name}"?`,
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    await exchangeStore.deleteExchange(exchange.id);
    $q.notify({
      type: 'positive',
      message: 'Биржа успешно удалена',
    });
    if (activeExchange.value?.id === exchange.id) {
      activeExchange.value = null;
    }
  });
};

const onCreateSubmit = async () => {
  try {
    const newExchangeItem = await exchangeStore.createExchange({
      name: newExchange.value.name,
      startExchange: new Date(newExchange.value.startExchange),
      stopExchange: new Date(newExchange.value.stopExchange)
    });
    
    showCreateDialog.value = false;
    $q.notify({
      type: 'positive',
      message: 'Биржа успешно создана',
    });
    
    newExchange.value = { 
      name: '', 
      startExchange: new Date().toISOString().split('T')[0],
      stopExchange: new Date().toISOString().split('T')[0]
    };
    
    if (newExchangeItem) {
      activeExchange.value = newExchangeItem;
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при создании биржи',
    });
  }
};

// Обновленный метод добавления проектов с проверкой на проекты, уже добавленные в другие биржи
const addProjectsToExchange = async () => {
  if (!activeExchange.value) return;
  
  try {
    // Фильтруем проекты, которые уже на других биржах
    const projectsToAdd = selectedProjects.value.filter(projectId => {
      const currentExchangeId = activeExchange.value?.id;
      if (!currentExchangeId) return false;
      
      const isOnOtherExchange = exchangeStore.exchanges.some(ex => 
        ex.id !== currentExchangeId && 
        ex.projects.some(p => p.id === projectId)
      );
      
      if (isOnOtherExchange) {
        $q.notify({
          type: 'warning',
          message: 'Некоторые проекты уже на других биржах и не были добавлены',
          timeout: 3000
        });
        return false;
      }
      return true;
    });

    if (projectsToAdd.length === 0) {
      $q.notify({
        type: 'negative',
        message: 'Нет проектов для добавления',
      });
      return;
    }

    await exchangeStore.updateExchange(activeExchange.value.id, {
      projects: [
        ...activeExchange.value.projects.map(p => p.id),
        ...projectsToAdd
      ]
    });
    
    showAddProjectsDialog.value = false;
    $q.notify({
      type: 'positive',
      message: 'Доступные проекты успешно добавлены в биржу',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при добавлении проектов',
    });
  }
};
</script>

<style scoped>
.project-card {
  height: 100%;
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-5px);
}
</style>
