<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card class="full-height">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ project?.name }} - Agile доска</div>
        <q-space />
        <q-btn icon="close"  flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none full-height">
        <div class="row full-height">
          <div class="col-12">
            <div class="row q-col-gutter-xs full-height">
              <!-- Колонка Бэклог -->
              <div class="col">
                <q-card 
                  class="full-height column"
                  @drop="onDrop($event, TypeAgile.backlog)"
                  @dragover.prevent
                  @dragenter.prevent
                >
                  <q-card-section class="bg-blue-1 q-pa-sm row items-center justify-between">
                    <div class="text-subtitle1">Бэклог</div>
                    <q-btn 
                      icon="add" 
                      size="sm" 
                      dense 
                      flat 
                      round
                      @click="addEmptyTask(TypeAgile.backlog)"
                    />
                  </q-card-section>
                  
                  <q-scroll-area class="col">
                    <div class="q-pa-sm column q-gutter-y-xs">
                      <q-card 
                        v-for="task in backlogTasks" 
                        :key="'backlog-'+task.id"
                        class="cursor-pointer"
                        draggable="true"
                        @dragstart="startDrag($event, task)"
                        @dragend="onDragEnd"
                      >
                        <q-card-section class="q-pa-sm row items-start">
                          <div class="col">
                            <q-input
                              v-model="task.name"
                              borderless
                              dense
                              autogrow
                              placeholder="Введите задачу..."
                              @blur="updateTask(task)"
                            />
                            <div class="text-caption text-grey q-mt-xs">
                              <q-icon name="schedule" size="xs" />
                              {{ formatDate(task.createdAt) }}
                            </div>
                          </div>
                          <q-btn
                            icon="delete"
                            size="sm"
                            flat
                            round
                            dense
                            color="negative"
                            class="q-ml-sm"
                            @click.stop="confirmDeleteTask(task)"
                          />
                        </q-card-section>
                      </q-card>
                    </div>
                  </q-scroll-area>
                </q-card>
              </div>

              <!-- Колонка Бэклог спринта -->
              <div class="col">
                <q-card 
                  class="full-height column"
                  @drop="onDrop($event, TypeAgile.sprintBacklog)"
                  @dragover.prevent
                  @dragenter.prevent
                >
                  <q-card-section class="bg-orange-1 q-pa-sm row items-center justify-between">
                    <div class="text-subtitle1">Бэклог спринта</div>
                    <q-btn 
                      icon="add" 
                      size="sm" 
                      dense 
                      flat 
                      round
                      @click="addEmptyTask(TypeAgile.sprintBacklog)"
                    />
                  </q-card-section>
                  
                  <q-scroll-area class="col">
                    <div class="q-pa-sm column q-gutter-y-xs">
                      <q-card 
                        v-for="task in sprintBacklogTasks" 
                        :key="'sprint-'+task.id"
                        class="cursor-pointer"
                        draggable="true"
                        @dragstart="startDrag($event, task)"
                        @dragend="onDragEnd"
                      >
                        <q-card-section class="q-pa-sm row items-start">
                          <div class="col">
                            <q-input
                              v-model="task.name"
                              borderless
                              dense
                              autogrow
                              placeholder="Введите задачу..."
                              @blur="updateTask(task)"
                            />
                            <div class="text-caption text-grey q-mt-xs">
                              <q-icon name="schedule" size="xs" />
                              {{ formatDate(task.createdAt) }}
                            </div>
                          </div>
                          <q-btn
                            icon="delete"
                            size="sm"
                            flat
                            round
                            dense
                            color="negative"
                            class="q-ml-sm"
                            @click.stop="confirmDeleteTask(task)"
                          />
                        </q-card-section>
                      </q-card>
                    </div>
                  </q-scroll-area>
                </q-card>
              </div>

              <!-- Колонка В процессе -->
              <div class="col">
                <q-card 
                  class="full-height column"
                  @drop="onDrop($event, TypeAgile.inProgress)"
                  @dragover.prevent
                  @dragenter.prevent
                >
                  <q-card-section class="bg-yellow-1 q-pa-sm row items-center justify-between">
                    <div class="text-subtitle1">В процессе</div>
                    <q-btn 
                      icon="add" 
                      size="sm" 
                      dense 
                      flat 
                      round
                      @click="addEmptyTask(TypeAgile.inProgress)"
                    />
                  </q-card-section>
                  
                  <q-scroll-area class="col">
                    <div class="q-pa-sm column q-gutter-y-xs">
                      <q-card 
                        v-for="task in inProgressTasks" 
                        :key="'progress-'+task.id"
                        class="cursor-pointer"
                        draggable="true"
                        @dragstart="startDrag($event, task)"
                        @dragend="onDragEnd"
                      >
                        <q-card-section class="q-pa-sm row items-start">
                          <div class="col">
                            <q-input
                              v-model="task.name"
                              borderless
                              dense
                              autogrow
                              placeholder="Введите задачу..."
                              @blur="updateTask(task)"
                            />
                            <div class="text-caption text-grey q-mt-xs">
                              <q-icon name="schedule" size="xs" />
                              {{ formatDate(task.createdAt) }}
                            </div>
                          </div>
                          <q-btn
                            icon="delete"
                            size="sm"
                            flat
                            round
                            dense
                            color="negative"
                            class="q-ml-sm"
                            @click.stop="confirmDeleteTask(task)"
                          />
                        </q-card-section>
                      </q-card>
                    </div>
                  </q-scroll-area>
                </q-card>
              </div>

              <!-- Колонка Завершено -->
              <div class="col">
                <q-card 
                  class="full-height column"
                  @drop="onDrop($event, TypeAgile.completed)"
                  @dragover.prevent
                  @dragenter.prevent
                >
                  <q-card-section class="bg-green-1 q-pa-sm row items-center justify-between">
                    <div class="text-subtitle1">Завершено</div>
                    <q-btn 
                      icon="add" 
                      size="sm" 
                      dense 
                      flat 
                      round
                      @click="addEmptyTask(TypeAgile.completed)"
                    />
                  </q-card-section>
                  
                  <q-scroll-area class="col">
                    <div class="q-pa-sm column q-gutter-y-xs">
                      <q-card 
                        v-for="task in completedTasks" 
                        :key="'done-'+task.id"
                        class="cursor-pointer"
                        draggable="true"
                        @dragstart="startDrag($event, task)"
                        @dragend="onDragEnd"
                      >
                        <q-card-section class="q-pa-sm row items-start">
                          <div class="col">
                            <q-input
                              v-model="task.name"
                              borderless
                              dense
                              autogrow
                              placeholder="Введите задачу..."
                              @blur="updateTask(task)"
                            />
                            <div class="text-caption text-grey q-mt-xs">
                              <q-icon name="schedule" size="xs" />
                              {{ formatDate(task.createdAt) }}
                            </div>
                          </div>
                          <q-btn
                            icon="delete"
                            size="sm"
                            flat
                            round
                            dense
                            color="negative"
                            class="q-ml-sm"
                            @click.stop="confirmDeleteTask(task)"
                          />
                        </q-card-section>
                      </q-card>
                    </div>
                  </q-scroll-area>
                </q-card>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAgileStore } from 'src/stores/agile-store';
import { TypeAgile } from '../../../../backend/src/common/types';
import type { AgileDto, ProjectDto } from '../../../../backend/src/common/types';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const agileStore = useAgileStore();

const showDialog = ref(false);
const project = ref<ProjectDto | null>(null);
const draggedTask = ref<AgileDto | null>(null);
const isDragging = ref(false);

const backlogTasks = computed(() => 
  agileStore.tasks.filter(task => task.type === TypeAgile.backlog)
);

const sprintBacklogTasks = computed(() => 
  agileStore.tasks.filter(task => task.type === TypeAgile.sprintBacklog)
);

const inProgressTasks = computed(() => 
  agileStore.tasks.filter(task => task.type === TypeAgile.inProgress)
);

const completedTasks = computed(() => 
  agileStore.tasks.filter(task => task.type === TypeAgile.completed)
);

const open = async (projectData: ProjectDto) => {
  project.value = projectData;
  showDialog.value = true;
  try {
    await agileStore.fetchTasksByProject(projectData.id);
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при загрузке задач',
    });
  }
};

type AgileColumnType = 
  | TypeAgile.backlog 
  | TypeAgile.sprintBacklog 
  | TypeAgile.inProgress 
  | TypeAgile.completed;

const addEmptyTask = async (type: AgileColumnType) => {
  if (!project.value) return;
  
  try {
    await agileStore.createTask({
      name: 'Новая задача',
      type,
      project: project.value.id
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при создании задачи',
    });
  }
};

const updateTask = async (task: AgileDto) => {
  try {
    await agileStore.updateTask(task.id, {
      name: task.name,
      type: task.type
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при обновлении задачи',
    });
  }
};

const confirmDeleteTask = (task: AgileDto) => {
  $q.dialog({
    title: 'Подтверждение удаления',
    message: `Вы уверены, что хотите удалить задачу "${task.name}"?`,
    cancel: {label: 'Отмена'},
    persistent: true,
  }).onOk(async () => {
    try {
      await agileStore.deleteTask(task.id);
      $q.notify({
        type: 'positive',
        message: 'Задача успешно удалена',
      });
    } catch {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при удалении задачи',
      });
    }
  });
};

const startDrag = (event: DragEvent, task: AgileDto) => {
  if (!event.dataTransfer) return;
  
  draggedTask.value = task;
  isDragging.value = true;
  event.dataTransfer.setData('text/plain', task.id.toString());
  event.dataTransfer.effectAllowed = 'move';
  
  // Добавляем класс к перетаскиваемому элементу
  const target = event.target as HTMLElement;
  if (target) {
    target.classList.add('dragging');
  }
};

const onDragEnd = (event: DragEvent) => {
  isDragging.value = false;
  const target = event.target as HTMLElement;
  if (target) {
    target.classList.remove('dragging');
  }
};

const onDrop = async (event: DragEvent, targetType: AgileColumnType) => {
  event.preventDefault();
  if (!draggedTask.value) return;

  try {
    // Обновляем тип задачи
    await agileStore.updateTask(draggedTask.value.id, {
      name: draggedTask.value.name,
      type: targetType
    });
    
    // Опционально: можно добавить визуальную обратную связь
    const target = event.currentTarget as HTMLElement;
    if (target) {
      target.classList.add('drop-success');
      setTimeout(() => target.classList.remove('drop-success'), 500);
    }
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при перемещении задачи',
    });
  } finally {
    draggedTask.value = null;
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString();
};

defineExpose({ open });
</script>

<style scoped>
.full-height {
  height: calc(100vh - 50px);
}

.q-card {
  min-width: 200px;
}

.q-scroll-area {
  height: calc(100% - 50px);
}

.cursor-pointer {
  cursor: grab;
}

.cursor-pointer:active {
  cursor: grabbing;
}

.q-card-section {
  position: relative;
}

.q-btn {
  position: absolute;
  right: 8px;
  top: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.q-card:hover .q-btn {
  opacity: 1;
}

/* Стили для перетаскивания */
.dragging {
  opacity: 0.5;
  transform: scale(0.98);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.drop-success {
  animation: pulse 0.5s;
}

@keyframes pulse {
  0% { background-color: rgba(76, 175, 80, 0.1); }
  100% { background-color: transparent; }
}

/* Подсветка колонки при перетаскивании */
.q-card[dragover] {
  background-color: rgba(0, 0, 0, 0.05);
}
.q-btn
{
  color:black;
  background:white;
}
.text-subtitle1
{
  color:black!important;
}
</style>