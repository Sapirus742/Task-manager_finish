<template>
  <q-dialog 
    v-model="showDialog"
    @update:model-value="val => !val && closeDialog()"
  >
    <q-card class="create-project-dialog bg-grey-2 q-pa-md">
      <q-card-section>
        <div class="dialog-title text-h6 text-primary">Создание нового проекта</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <div class="row q-col-gutter-md">
            <!-- Первая колонка -->
            <div class="col-md-6 col-12">
              <!-- Название проекта -->
              <q-input
                v-model="newProject.name"
                label="Название проекта"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
              />

              <!-- Проблема -->
              <q-input
                v-model="newProject.problem"
                label="Проблема"
                type="textarea"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
                autogrow
              />

              <!-- Решение -->
              <q-input
                v-model="newProject.solution"
                label="Решение"
                type="textarea"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
                autogrow
              />
            </div>

            <!-- Вторая колонка -->
            <div class="col-md-6 col-12">
              <!-- Результат -->
              <q-input
                v-model="newProject.result"
                label="Результат"
                type="textarea"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
                autogrow
              />

              <!-- Ресурсы -->
              <q-input
                v-model="newProject.resource"
                label="Ресурсы"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
              />

              <!-- Стек технологий -->
              <q-select
                v-model="newProject.stack"
                label="Стек технологий"
                :options="competenceOptions"
                multiple
                use-chips
                :rules="[(val) => val.length > 0 || 'Выберите хотя бы одну технологию']"
                outlined
                dense
              />
            </div>
          </div>

          <div class="row q-col-gutter-md">
            <div class="col-md-6 col-12">
              <!-- Статус проекта -->
              <q-select
                v-model="newProject.status"
                label="Статус проекта"
                :options="statusOptions"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
                map-options
                emit-value
              />

              <!-- Дата начала проекта -->
              <q-input
                v-model="startProjectString"
                label="Дата начала проекта"
                type="date"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
              />
            </div>

            <div class="col-md-6 col-12">
              <!-- Дата окончания проекта -->
              <q-input
                v-model="stopProjectString"
                label="Дата окончания проекта"
                type="date"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
              />

              <!-- Максимальное количество участников -->
              <q-input
                v-model="newProject.maxUsers"
                label="Максимальное количество участников"
                type="number"
                :rules="[
                  (val) => !!val || 'Поле обязательно',
                  (val) => val > 0 || 'Должно быть больше 0'
                ]"
                outlined
                dense
              />
            </div>
          </div>

          <!-- Заказчик (половина ширины) -->
          <div class="row q-col-gutter-md">
            <div class="col-md-6 col-12">
              <q-input
                v-model="newProject.customer"
                label="Заказчик"
                :rules="[(val) => !!val || 'Поле обязательно']"
                outlined
                dense
              />
            </div>
            <div class="col-md-6 col-12"></div>
          </div>

          <!-- Кнопки -->
          <q-card-actions align="right">
            <q-btn 
              flat 
              label="Отмена" 
              color="negative" 
              v-close-popup
              @click="closeDialog"
            />
            <q-btn type="submit" label="Создать" color="primary" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Competencies, CreateProjectDto, StatusProject } from '../../../../backend/src/common/types';
import { create } from 'src/api/project.api';
import { useMainStore } from 'src/stores/main-store';

const emit = defineEmits(['create']);

const showDialog = ref(false);
const mainStore = useMainStore();

const newProject = ref<CreateProjectDto>({
  name: '',
  problem: '',
  solution: '',
  result: '',
  resource: '',
  stack: [],
  status: StatusProject.searchTeam,
  startProject: new Date(),
  stopProject: new Date(),
  maxUsers: '',
  customer: '',
  initiator: mainStore.userId,
});

// Строковые представления дат
const startProjectString = computed({
  get: () => newProject.value.startProject.toISOString().split('T')[0],
  set: (value) => {
    newProject.value.startProject = new Date(value);
  },
});

const stopProjectString = computed({
  get: () => newProject.value.stopProject.toISOString().split('T')[0],
  set: (value) => {
    newProject.value.stopProject = new Date(value);
  },
});

const competenceOptions = Object.values(Competencies).flat();
const statusOptions = [
  { label: 'Черновик', value: StatusProject.draft },
  { label: 'Поиск команды', value: StatusProject.searchTeam },
  { label: 'Отбор команды', value: StatusProject.selectionTeam },
  { label: 'Команда найдена', value: StatusProject.teamFound },
];

const resetForm = () => {
  newProject.value = {
    name: '',
    problem: '',
    solution: '',
    result: '',
    resource: '',
    stack: [],
    status: StatusProject.searchTeam,
    startProject: new Date(),
    stopProject: new Date(),
    maxUsers: '',
    customer: '',
    initiator: mainStore.userId,
  };
};

const openDialog = () => {
  showDialog.value = true;
};

const closeDialog = () => {
  resetForm();
  showDialog.value = false;
};

const onSubmit = async () => {
  try {
    if (
      !newProject.value.name ||
      !newProject.value.problem ||
      !newProject.value.solution ||
      !newProject.value.result ||
      !newProject.value.resource ||
      newProject.value.stack.length === 0 ||
      !newProject.value.maxUsers ||
      !newProject.value.customer ||
      !newProject.value.status
    ) {
      console.error('Заполните все обязательные поля');
      return;
    }

    const projectData: CreateProjectDto = {
      ...newProject.value,
    };

    const createdProject = await create(projectData);
    if (createdProject) {
      emit('create', createdProject);
      closeDialog();
    }
  } catch (error) {
    console.error('Ошибка при создании проекта:', error);
  }
};

defineExpose({
  openDialog,
  closeDialog,
});
</script>

<style scoped>
.create-project-dialog {
  width: 800px;
  max-width: 90vw;
}
.dialog-title {
  text-align: center;
  width: 100%;
}
.q-field--with-textarea .q-field__control {
  min-height: 100px;
}
.row + .row {
  margin-top: 16px;
}
</style>
