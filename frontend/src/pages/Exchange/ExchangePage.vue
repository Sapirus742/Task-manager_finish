<template>
  <q-page class="row">
    <!-- Боковая панель бирж -->
    <q-drawer
      v-model="leftDrawerOpen"
      color=white
      bordered
      :width="300"
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
              <q-card-section @click="openProjectDetails(project)" style="cursor: pointer;">
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

              <q-card-actions align="right" class="absolute-bottom-right q-pa-md">
  <AgileProjectButton
    :project="project"
    :visible="true"
    :loading="agileButtonStates[project.id]?.loading ?? false"
    @click="openAgileProject(project)"
    class="q-mr-sm"
  />
  <q-btn
    flat
    round
    dense
    icon="delete"
    color="negative"
    @click.stop="confirmRemoveProject(project)"
    v-if="canEditExchange(activeExchange)"
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
    <q-dialog 
  v-model="showCreateDialog"
  @hide="resetCreateForm"
>
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
            <q-card-actions align="right">
              <q-btn flat label="Отмена" color="primary" v-close-popup />
              <q-btn type="submit" label="Создать" color="primary" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Диалог добавления проектов -->
    <q-dialog v-model="showAddProjectsDialog" @update:model-value="val => !val && (selectedProjects = [])">
  <q-card style="min-width: 600px">
    <q-card-section>
      <div class="text-h6">Добавить проекты в биржу</div>
      <div class="text-caption text-grey">
        Отображаются только проекты, не добавленные ни в одну биржу
      </div>
    </q-card-section>

    <q-card-section>
      <q-list bordered separator v-if="availableProjects.length">
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
      
      <div v-else class="text-center q-pa-md">
        <q-icon name="info" size="xl" color="grey" />
        <div class="text-h6 q-mt-md">Нет доступных проектов для добавления</div>
      </div>
    </q-card-section>

    <q-card-actions align="right">
      <q-btn flat label="Отмена" color="primary" v-close-popup />
      <q-btn 
        label="Добавить" 
        color="primary" 
        @click="addProjectsToExchange"
        :disable="selectedProjects.length === 0"
      />
    </q-card-actions>
  </q-card>
</q-dialog>

    <!-- AgileProject компонент -->
    <AgileProject ref="agileProject" />

    <!-- Диалог деталей проекта -->
    <ProjectDetailsDialog ref="projectDetailsDialog" />
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue';
import { useExchangeStore } from 'src/stores/exchange-store';
import { useProjectStore } from 'src/stores/project-store';
import { useMainStore } from 'src/stores/main-store';
import { useQuasar } from 'quasar';
import { CreateExchangeDto, ExchangeDto, ProjectDto, StatusProject } from '../../../../backend/src/common/types';
import AgileProject from 'src/pages/Exchange/AgileProject.vue';
import AgileProjectButton from 'src/pages/Exchange/AgileProjectButton.vue';
import ProjectDetailsDialog from 'src/pages/Project/ProjectDetailsDialog.vue';

const exchangeStore = useExchangeStore();
const projectStore = useProjectStore();
const mainStore = useMainStore();
const $q = useQuasar();

// Состояние
const leftDrawerOpen = ref(true);
const showCreateDialog = ref(false);
const showAddProjectsDialog = ref(false);
const activeExchange = ref<ExchangeDto | null>(null);
const selectedProjects = ref<number[]>([]);
const projectDetailsDialog = ref();
const agileProject = ref();

const newExchange = ref<Omit<CreateExchangeDto, 'startExchange' | 'stopExchange'> & {
  startExchange: string;
  stopExchange: string;
}>({
  name: '',
  startExchange: new Date().toISOString().split('T')[0],
  stopExchange: new Date().toISOString().split('T')[0],
});

const agileButtonStates = reactive<Record<number, { visible: boolean; loading: boolean }>>({});

// Методы
const openProjectDetails = (project: ProjectDto) => {
  projectDetailsDialog.value?.open(project);
};

const resetCreateForm = () => {
  newExchange.value = {
    name: '',
    startExchange: new Date().toISOString().split('T')[0],
    stopExchange: new Date().toISOString().split('T')[0]
  };
};

const openAgileProject = (project: ProjectDto | undefined) => {
  if (!project) return;
  agileProject.value?.open(project);
};

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



const availableProjects = computed(() => {
  // Получаем все ID проектов, которые уже есть в любой бирже
  const allExchangedProjectIds = new Set(
    exchangeStore.exchanges.flatMap(ex => 
      ex.projects ? ex.projects.map(p => p.id) : []
    )
  );
  
  // Фильтруем проекты, оставляя только те, которых нет ни в одной бирже
  return projectStore.projects.filter(p => 
    p && !allExchangedProjectIds.has(p.id)
  );
});

const canCreateExchange = computed(() => {
  return mainStore.isAdmin() || mainStore.isDirectorate();
});

const canEditExchange = (exchange: ExchangeDto) => {
  return mainStore.isAdmin() || mainStore.isDirectorate() ||
         (mainStore.isDirectorate() && exchange.projects.some(p => p.initiator.id === mainStore.userId));
};

const formatDateRange = (start: Date, end: Date) => {
  return `${new Date(start).toLocaleDateString()} - ${new Date(end).toLocaleDateString()}`;
};

const setActiveExchange = (exchange: ExchangeDto) => {
  activeExchange.value = exchange;
};

// Хук жизненного цикла
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
    cancel: {label: 'Отмена'},
    persistent: true,
  }).onOk(async () => {
    try {
      // Удаляем биржу
      await exchangeStore.deleteExchange(exchange.id);
      
      // Обновляем список бирж
      await exchangeStore.fetchAllExchanges();
      
      // Если удалили активную биржу, сбрасываем активную
      if (activeExchange.value?.id === exchange.id) {
        activeExchange.value = null;
        // Автоматически выбираем первую биржу из списка, если есть
        if (exchangeStore.exchanges.length > 0) {
          activeExchange.value = exchangeStore.exchanges[0];
        }
      }
      
      $q.notify({
        type: 'positive',
        message: 'Биржа успешно удалена',
      });
      
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при удалении биржи',
      });
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
    
    // Закрываем диалог
    showCreateDialog.value = false;
    
    // Сбрасываем форму
    newExchange.value = { 
      name: '', 
      startExchange: new Date().toISOString().split('T')[0],
      stopExchange: new Date().toISOString().split('T')[0]
    };
    
    // Обновляем список бирж
    await exchangeStore.fetchAllExchanges();
    
    // Устанавливаем новую биржу как активную
    if (newExchangeItem) {
      activeExchange.value = newExchangeItem;
    }
    
    $q.notify({
      type: 'positive',
      message: 'Биржа успешно создана',
    });
    
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при создании биржи',
    });
  }
};

const confirmRemoveProject = (project: ProjectDto) => {
  if (!activeExchange.value) return;

  $q.dialog({
    title: 'Подтверждение удаления',
    message: `Вы уверены, что хотите удалить проект "${project.name}" из биржи?`,
    cancel: {label: 'Отмена'},
    persistent: true
  }).onOk(async () => {
    try {
      if (activeExchange.value) {
        // Удаляем проект локально из activeExchange
        const updatedProjects = activeExchange.value.projects.filter(p => p.id !== project.id);
        const updatedExchange = {
          ...activeExchange.value,
          projects: updatedProjects
        };

        // Обновляем локальный стейт
        activeExchange.value = updatedExchange;
        exchangeStore.exchanges = exchangeStore.exchanges.map(ex =>
          ex.id === updatedExchange.id ? updatedExchange : ex
        );

        // Отправляем изменения на сервер
        await exchangeStore.removeProjectFromExchange(activeExchange.value.id, project.id);

        $q.notify({
          type: 'positive',
          message: 'Проект успешно удален из биржи'
        });
      }
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при удалении проекта из биржи'
      });
    }
  });
};


const addProjectsToExchange = async () => {
  if (!activeExchange.value || selectedProjects.value.length === 0) return;
  
  try {
    // Получаем выбранные проекты
    const projectsToAdd = projectStore.projects.filter(p => 
      selectedProjects.value.includes(p.id)
    );
    
    // Обновляем статус каждого проекта на "Search for team"
    await Promise.all(projectsToAdd.map(project => 
      projectStore.updateProject(project.id, {
        status: StatusProject.searchTeam
      })
    ));
    
    // Оптимизированное обновление - сразу добавляем проекты локально
    const updatedExchange = {
      ...activeExchange.value,
      projects: [
        ...activeExchange.value.projects,
        ...projectsToAdd
      ]
    };
    
    // Обновляем состояние без лишних запросов
    activeExchange.value = updatedExchange;
    exchangeStore.exchanges = exchangeStore.exchanges.map(ex => 
      ex.id === updatedExchange.id ? updatedExchange : ex
    );
    
    // Отправляем изменения на сервер
    await exchangeStore.updateExchange(activeExchange.value.id, {
      projects: updatedExchange.projects.map(p => p.id)
    });
    
    // Закрываем и очищаем
    showAddProjectsDialog.value = false;
    selectedProjects.value = [];
    
    $q.notify({
      type: 'positive',
      message: 'Проекты успешно добавлены'
    });
  } catch (error) {
    console.error('Ошибка при добавлении проектов:', error);
    $q.notify({
      type: 'negative',
      message: 'Ошибка при добавлении проектов'
    });
  }
};
</script>

<style scoped>
.project-card {
  height: 100%;
  transition: transform 0.2s;
  position: relative; /* Добавляем относительное позиционирование */
  padding-bottom: 50px; /* Оставляем место для кнопок */
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

/* Стили для кнопок в правом нижнем углу */
.q-card__actions.absolute-bottom-right {
  position: absolute;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9); /* Полупрозрачный фон */
  border-top-left-radius: 8px;
  padding: 8px !important;
}

/* Дополнительные стили для кнопок */
.q-btn {
  margin-left: 4px;
}

.q-card__actions.absolute-bottom-right {
  opacity: 0;
  transition: opacity 0.2s;
}

.project-card:hover .q-card__actions.absolute-bottom-right {
  opacity: 1;
}

.text-h6 {
  cursor: pointer;
  transition: color 0.2s;
}

.text-h6:hover {
  color: var(--q-primary);
}
/* Темная тема */
.q-page
  {
    background-color:var(--bg-color);
  }

.body--dark .q-drawer {
  background-color: #1e1e1e !important;
  border-right: 1px solid #333 !important;
}

.body--dark .q-item {
  color: #ffffff;
}

.body--dark .q-item--active {
  background-color: #333;
  color: var(--q-primary);
}

.body--dark .q-item-label {
  color: #ffffff;
}

.body--dark .q-item-label--caption {
  color: #b0b0b0;
}

.body--dark .project-card {
  background-color: #1e1e1e;
  border: 1px solid #333;
}

.body--dark .project-card:hover {
  box-shadow: 0 4px 8px rgba(255, 255, 255, 0.1);
}

.body--dark .text-caption {
  color: #b0b0b0 !important;
}

.body--dark .text-h6:hover {
  color: #4fc3f7 !important;
}

.body--dark .q-card__actions {
  background-color: #1e1e1e;
  border-top: 1px solid #333;
}

.body--dark .q-dialog__inner .q-card {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .q-dialog__inner .q-input {
  color: #ffffff;
}

.body--dark .q-dialog__inner .q-field__label {
  color: #b0b0b0;
}

.body--dark .q-dialog__inner .q-field__native {
  color: #ffffff;
}

.body--dark .q-list--bordered {
  border-color: #333;
}

.body--dark .q-item__section--side .q-btn {
  color: #ffffff;
}

.body--dark .q-separator {
  background-color: #333;
}

/* Стили для пустых состояний */
.body--dark .text-center .q-icon {
  color: #b0b0b0 !important;
}

.body--dark .text-center .text-h6 {
  color: #ffffff !important;
}

/* Стили для чипов */
.body--dark .q-chip {
  color:rgb(46, 46, 46);
}

/* Стили для кнопок */
.body--dark .q-btn {
  color: #ffffff;
}

.body--dark .q-btn--flat:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

/* Стили для полей ввода */
.body--dark .q-field--outlined .q-field__control {
  background-color: #1e1e1e;
  border-color: #333;
}

.body--dark .q-field--outlined .q-field__control:hover {
  border-color: #555;
}

/* Стили для чекбоксов */
.body--dark .q-checkbox__inner {
  color: #ffffff;
}

/* Стили для заголовков */
.body--dark .text-h4 {
  color: #ffffff;
}

/* Стили для уведомлений */
.body--dark .q-notification {
  background-color: #1e1e1e;
  color: #ffffff;
  border: 1px solid #333;
}
.body--dark.q-drawer
{
  background-color:black;
}
</style>