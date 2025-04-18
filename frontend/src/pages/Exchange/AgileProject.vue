<template>
    <q-dialog v-model="showDialog" maximized>
      <q-card class="full-height">
        <q-card-section class="row items-center q-pb-none">
          <div class="text-h6">{{ project?.name }} - Agile доска</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
  
        <q-card-section class="q-pt-none full-height">
          <div class="row full-height">
            <!-- Боковая панель спринтов -->
            <div class="col-2 q-pr-md">
              <q-scroll-area class="full-height">
                <q-list bordered separator>
                  <q-item-label header>Спринты</q-item-label>
                  <q-item 
                    v-for="sprint in sprints" 
                    :key="sprint.id"
                    clickable
                    v-ripple
                    :active="activeSprint === sprint.id"
                    @click="activeSprint = sprint.id"
                  >
                    <q-item-section>
                      <q-item-label>Sprint {{ sprint.id }}</q-item-label>
                      <q-item-label caption>{{ sprint.date }}</q-item-label>
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-scroll-area>
            </div>
  
            <!-- Основные колонки -->
            <div class="col-10">
              <div class="row q-col-gutter-xs full-height">
                <!-- Колонка Бэклог -->
                <div class="col">
                  <q-card class="full-height column">
                    <q-card-section class="bg-blue-1 q-pa-sm">
                      <div class="text-subtitle1 text-center">Бэклог</div>
                    </q-card-section>
                    
                    <q-scroll-area class="col">
                      <div class="q-pa-sm column q-gutter-y-xs">
                        <q-card 
                          v-for="(task, index) in backlogTasks" 
                          :key="'backlog-'+index"
                          class="cursor-pointer"
                          draggable
                          @dragstart="startDrag($event, 'backlog', index)"
                          @drop="onDrop($event, 'backlog')"
                          @dragover.prevent
                          @dragenter.prevent
                        >
                          <q-card-section class="q-pa-sm">
                            <div>{{ task.text }}</div>
                            <div v-if="task.tags" class="q-mt-xs">
                              <q-badge 
                                v-for="(tag, i) in task.tags" 
                                :key="i"
                                :color="getTagColor(tag)"
                                class="q-mr-xs"
                              >
                                {{ tag }}
                              </q-badge>
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                    </q-scroll-area>
                    
                    <q-card-section class="q-pa-sm">
                      <q-input 
                        v-model="newBacklogTask" 
                        placeholder="+ Add task" 
                        dense
                        borderless
                        @keyup.enter="addTask('backlog')"
                      >
                        <template v-slot:append>
                          <q-btn 
                            icon="add" 
                            size="sm" 
                            dense 
                            flat 
                            round
                            @click="addTask('backlog')"
                          />
                        </template>
                      </q-input>
                    </q-card-section>
                  </q-card>
                </div>
  
                <!-- Колонка Бэклог спринта -->
                <div class="col">
                  <q-card class="full-height column">
                    <q-card-section class="bg-green-1 q-pa-sm">
                      <div class="text-subtitle1 text-center">Бэклог спринта</div>
                    </q-card-section>
                    
                    <q-scroll-area class="col">
                      <div class="q-pa-sm column q-gutter-y-xs">
                        <q-card 
                          v-for="(task, index) in sprintTasks" 
                          :key="'sprint-'+index"
                          class="cursor-pointer"
                          draggable
                          @dragstart="startDrag($event, 'sprint', index)"
                          @drop="onDrop($event, 'sprint')"
                          @dragover.prevent
                          @dragenter.prevent
                        >
                          <q-card-section class="q-pa-sm">
                            <div>{{ task.text }}</div>
                            <div v-if="task.tags" class="q-mt-xs">
                              <q-badge 
                                v-for="(tag, i) in task.tags" 
                                :key="i"
                                :color="getTagColor(tag)"
                                class="q-mr-xs"
                              >
                                {{ tag }}
                              </q-badge>
                            </div>
                            <div v-if="task.progress" class="text-caption text-grey q-mt-xs">
                              {{ task.progress }}
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                    </q-scroll-area>
                    
                    <q-card-section class="q-pa-sm">
                      <q-input 
                        v-model="newSprintTask" 
                        placeholder="+ Add task" 
                        dense
                        borderless
                        @keyup.enter="addTask('sprint')"
                      >
                        <template v-slot:append>
                          <q-btn 
                            icon="add" 
                            size="sm" 
                            dense 
                            flat 
                            round
                            @click="addTask('sprint')"
                          />
                        </template>
                      </q-input>
                    </q-card-section>
                  </q-card>
                </div>
  
                <!-- Колонка В процессе -->
                <div class="col">
                  <q-card class="full-height column">
                    <q-card-section class="bg-orange-1 q-pa-sm">
                      <div class="text-subtitle1 text-center">В процессе</div>
                    </q-card-section>
                    
                    <q-scroll-area class="col">
                      <div class="q-pa-sm column q-gutter-y-xs">
                        <q-card 
                          v-for="(task, index) in inProgressTasks" 
                          :key="'progress-'+index"
                          class="cursor-pointer"
                          draggable
                          @dragstart="startDrag($event, 'progress', index)"
                          @drop="onDrop($event, 'progress')"
                          @dragover.prevent
                          @dragenter.prevent
                        >
                          <q-card-section class="q-pa-sm">
                            <div>{{ task.text }}</div>
                            <div v-if="task.tags" class="q-mt-xs">
                              <q-badge 
                                v-for="(tag, i) in task.tags" 
                                :key="i"
                                :color="getTagColor(tag)"
                                class="q-mr-xs"
                              >
                                {{ tag }}
                              </q-badge>
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                    </q-scroll-area>
                    
                    <q-card-section class="q-pa-sm">
                      <q-input 
                        v-model="newProgressTask" 
                        placeholder="+ Add task" 
                        dense
                        borderless
                        @keyup.enter="addTask('progress')"
                      >
                        <template v-slot:append>
                          <q-btn 
                            icon="add" 
                            size="sm" 
                            dense 
                            flat 
                            round
                            @click="addTask('progress')"
                          />
                        </template>
                      </q-input>
                    </q-card-section>
                  </q-card>
                </div>
  
                <!-- Колонка Завершено -->
                <div class="col">
                  <q-card class="full-height column">
                    <q-card-section class="bg-grey-3 q-pa-sm">
                      <div class="text-subtitle1 text-center">Завершено</div>
                    </q-card-section>
                    
                    <q-scroll-area class="col">
                      <div class="q-pa-sm column q-gutter-y-xs">
                        <q-card 
                          v-for="(task, index) in doneTasks" 
                          :key="'done-'+index"
                          class="cursor-pointer"
                          draggable
                          @dragstart="startDrag($event, 'done', index)"
                          @drop="onDrop($event, 'done')"
                          @dragover.prevent
                          @dragenter.prevent
                        >
                          <q-card-section class="q-pa-sm">
                            <div>{{ task.text }}</div>
                            <div v-if="task.tags" class="q-mt-xs">
                              <q-badge 
                                v-for="(tag, i) in task.tags" 
                                :key="i"
                                :color="getTagColor(tag)"
                                class="q-mr-xs"
                              >
                                {{ tag }}
                              </q-badge>
                            </div>
                            <div v-if="task.progress" class="text-caption text-grey q-mt-xs">
                              {{ task.progress }}
                            </div>
                          </q-card-section>
                        </q-card>
                      </div>
                    </q-scroll-area>
                    
                    <q-card-section class="q-pa-sm">
                      <q-input 
                        v-model="newDoneTask" 
                        placeholder="+ Add task" 
                        dense
                        borderless
                        @keyup.enter="addTask('done')"
                      >
                        <template v-slot:append>
                          <q-btn 
                            icon="add" 
                            size="sm" 
                            dense 
                            flat 
                            round
                            @click="addTask('done')"
                          />
                        </template>
                      </q-input>
                    </q-card-section>
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
  import { ref } from 'vue';
  import type { ProjectDto } from '../../../../backend/src/common/types';
  
  // Типы
  type TagName = 'Frontend' | 'Функционал' | 'Красота' | 'Формальность' | 'Прочее';
  
  interface Task {
    text: string;
    tags?: TagName[];
    progress?: string;
  }
  
  interface Sprint {
    id: number;
    date: string;
  }
  
  // Состояние
  const showDialog = ref(false);
  const project = ref<ProjectDto | null>(null);
  const activeSprint = ref(1);
  
  const sprints = ref<Sprint[]>([
    { id: 1, date: '01.05 - 14.05' },
    { id: 2, date: '15.05 - 28.05' },
    { id: 3, date: '29.05 - 11.06' },
    { id: 4, date: '12.06 - 25.06' },
    { id: 5, date: '26.06 - 09.07' },
    { id: 6, date: '10.07 - 23.07' },
    { id: 7, date: '24.07 - 06.08' },
    { id: 8, date: '07.08 - 20.08' }
  ]);
  
  const tagColors: Record<TagName, string> = {
    'Frontend': 'blue',
    'Функционал': 'green',
    'Красота': 'pink',
    'Формальность': 'grey',
    'Прочее': 'orange'
  };
  
  const getTagColor = (tag: string): string => {
    return tagColors[tag as TagName] || 'grey';
  };
  
  // Задачи
  const backlogTasks = ref<Task[]>([
    { 
      text: 'Создать цепочки статусов для всех объектов', 
      tags: ['Функционал', 'Прочее'] 
    },
    { 
      text: 'Расписать все права и возможности ролей', 
      tags: ['Функционал'] 
    }
  ]);
  
  const sprintTasks = ref<Task[]>([
    { 
      text: 'Оформление Биржи', 
      tags: ['Прочее'],
      progress: '1/1'
    },
    { 
      text: 'Фикс идей', 
      tags: ['Прочее'],
      progress: '1/2'
    }
  ]);
  
  const inProgressTasks = ref<Task[]>([
    { 
      text: 'Проверка заявок на проект', 
      tags: ['Frontend', 'Красота'] 
    }
  ]);
  
  const doneTasks = ref<Task[]>([
    { 
      text: 'Функционал профиля', 
      tags: ['Frontend'],
      progress: '1/0'
    },
    { 
      text: 'Оформление команд', 
      tags: ['Прочее', 'Красота'],
      progress: '1/0'
    }
  ]);
  
  // Новые задачи
  const newBacklogTask = ref('');
  const newSprintTask = ref('');
  const newProgressTask = ref('');
  const newDoneTask = ref('');
  
  // Перетаскивание
  const draggedItem = ref<{
    column: string,
    index: number
  } | null>(null);
  
  const open = (projectData: ProjectDto) => {
    project.value = projectData;
    showDialog.value = true;
  };
  
  const addTask = (column: string) => {
    let text = '';
    let tasks: Task[] = [];
    
    switch(column) {
      case 'backlog':
        text = newBacklogTask.value;
        tasks = backlogTasks.value;
        break;
      case 'sprint':
        text = newSprintTask.value;
        tasks = sprintTasks.value;
        break;
      case 'progress':
        text = newProgressTask.value;
        tasks = inProgressTasks.value;
        break;
      case 'done':
        text = newDoneTask.value;
        tasks = doneTasks.value;
        break;
    }
    
    if (text.trim()) {
      tasks.push({ text });
      switch(column) {
        case 'backlog': newBacklogTask.value = ''; break;
        case 'sprint': newSprintTask.value = ''; break;
        case 'progress': newProgressTask.value = ''; break;
        case 'done': newDoneTask.value = ''; break;
      }
    }
  };
  
  const startDrag = (event: DragEvent, column: string, index: number) => {
    draggedItem.value = { column, index };
    event.dataTransfer?.setData('text/plain', '');
  };
  
  const onDrop = (event: DragEvent, targetColumn: string) => {
    if (!draggedItem.value) return;
    
    const { column, index } = draggedItem.value;
    let task: Task | undefined;
    
    // Удаляем задачу из исходной колонки
    switch(column) {
      case 'backlog': 
        task = backlogTasks.value.splice(index, 1)[0]; 
        break;
      case 'sprint': 
        task = sprintTasks.value.splice(index, 1)[0]; 
        break;
      case 'progress': 
        task = inProgressTasks.value.splice(index, 1)[0]; 
        break;
      case 'done': 
        task = doneTasks.value.splice(index, 1)[0]; 
        break;
    }
    
    // Добавляем задачу в целевую колонку
    if (task) {
      switch(targetColumn) {
        case 'backlog': backlogTasks.value.push(task); break;
        case 'sprint': sprintTasks.value.push(task); break;
        case 'progress': inProgressTasks.value.push(task); break;
        case 'done': doneTasks.value.push(task); break;
      }
    }
    
    draggedItem.value = null;
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
  
  .q-badge {
    font-size: 0.7em;
    padding: 2px 5px;
  }
  </style>