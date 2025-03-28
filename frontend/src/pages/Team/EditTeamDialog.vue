<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="edit-team-dialog">
      <q-card-section>
        <div class="text-h6">Редактировать команду</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit">
          <!-- Название команды -->
          <q-input
            v-model="editedTeam.name"
            label="Название команды"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
          />

          <!-- Описание -->
          <q-input
            v-model="editedTeam.description"
            label="Описание"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
          />

          <!-- Приватность -->
          <q-select
            v-model="editedTeam.privacy"
            label="Приватность"
            :options="privacyOptions"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
            emit-value
            map-options
          />

          <!-- Статус команды -->
          <q-select
            v-model="editedTeam.status"
            label="Статус команды"
            :options="statusOptions"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
            emit-value
            map-options
            :disable="!!editedTeam.project"
          />

          <!-- Участники команды -->
          <q-select
  v-model="editedTeam.members"
  label="Участники команды"
  multiple
  use-chips
  :options="userOptions"
  :rules="[(val) => val.length > 0 || 'Добавьте хотя бы одного участника']"
  outlined
  option-label="fullName"
  emit-value
  map-options
  @filter="filterUsers"
  @update:model-value="updateLeaderOptions"
/>

          <!-- Тимлид -->
          <q-select
  v-model="editedTeam.leader"
  label="Тимлид"
  :options="leaderOptions"
  :rules="[(val) => !!val || 'Необходимо выбрать тимлида']"
  outlined
  option-label="fullName"
  emit-value
  map-options
>
  <template v-slot:option="scope">
    <q-item v-bind="scope.itemProps">
      <q-item-section avatar>
        <q-icon name="star" :color="scope.opt.id === editedTeam.leader?.id ? 'amber' : 'transparent'"/>
      </q-item-section>
      <q-item-section>
        <q-item-label>{{ scope.opt.fullName }}</q-item-label>
        <q-item-label caption>{{ scope.opt.email }}</q-item-label>
      </q-item-section>
    </q-item>
  </template>
</q-select>

          <!-- Проект -->
          <q-select
  v-model="editedTeam.project"
  label="Проект"
  :options="filteredProjectOptions"
  outlined
  option-label="name"
  emit-value
  map-options
  clearable
  @update:model-value="handleProjectChange"
  :display-value="editedTeam.project?.name || 'Не выбран'"
>
  <template v-slot:selected-item="scope">
    <span v-if="scope.opt">{{ scope.opt.name }}</span>
    <span v-else>Не выбран</span>
  </template>
</q-select>

          <q-card-actions align="right">
            <q-btn flat label="Отмена" color="negative" v-close-popup />
            <q-btn type="submit" label="Сохранить" color="primary" :loading="loading" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed} from 'vue';
import { useQuasar } from 'quasar';
import { 
  PrivacyTeam, 
  StatusTeam,
  StatusProject,
  Role,
  TeamDto,
} from '../../../../backend/src/common/types';
import { update as updateTeam } from 'src/api/team.api';
import { 
  getAll as getAllUsers, 
} from 'src/api/users.api';
import { 
  getAll as getAllProjects, 
  update as UpdateProject,
} from 'src/api/project.api';

const $q = useQuasar();
const emit = defineEmits(['update']);
const showDialog = ref(false);
const loading = ref(false);

interface TeamMember {
  id: number;
  fullName: string;
  email?: string;
}

interface ProjectOption {
  id: number;
  name: string;
  status: StatusProject;
}

const editedTeam = ref({
  id: 0,
  name: '',
  description: '',
  privacy: PrivacyTeam.open,
  status: StatusTeam.searchProject,
  members: [] as TeamMember[],
  leader: null as TeamMember | null,
  project: null as ProjectOption | null,
  originalProjectState: null as ProjectOption | null, // Добавляем поле для хранения исходного состояния
  user_owner: 0,
});

const leaderOptions = ref<TeamMember[]>([]);

const updateLeaderOptions = (): void => {
  leaderOptions.value = [...editedTeam.value.members];
  
  // Сбрасываем тимлида, если он больше не в списке участников
  if (editedTeam.value.leader && 
      !editedTeam.value.members.some(m => m.id === editedTeam.value.leader?.id)) {
    editedTeam.value.leader = null;
  }
};

const privacyOptions = [
  { label: 'Открытая', value: PrivacyTeam.open },
  { label: 'Закрытая', value: PrivacyTeam.close }
];

const statusOptions = computed(() => {
  if (editedTeam.value.project) {
    return [
      { label: 'В процессе работы', value: StatusTeam.inProgress }
    ];
  }
  return [
    { label: 'Поиск проекта', value: StatusTeam.searchProject },
    { label: 'В процессе работы', value: StatusTeam.inProgress },
    { label: 'На удалении', value: StatusTeam.delete }
  ];
});


const allUsers = ref<TeamMember[]>([]);
const userOptions = ref<TeamMember[]>([]);
const allProjects = ref<ProjectOption[]>([]);

const filteredProjectOptions = computed(() => {
  return allProjects.value.filter(project => 
    project.status === StatusProject.searchTeam || 
    project.id === editedTeam.value.project?.id
  );
});

const filterUsers = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    if (val === '') {
      userOptions.value = [...allUsers.value];
    } else {
      const needle = val.toLowerCase();
      userOptions.value = allUsers.value.filter(user => 
        user.fullName.toLowerCase().includes(needle)
      );
    }
  });
};

const loadUsers = async () => {
  try {
    const users = await getAllUsers();
    if (users) {
      allUsers.value = users
        .filter(user => user.roles.includes(Role.user))
        .map(user => ({
          id: user.id,
          fullName: `${user.firstname} ${user.lastname}`,
          email: user.email
        }));
      // Инициализируем userOptions всеми пользователями при загрузке
      userOptions.value = [...allUsers.value];
    }
  } catch (error) {
    console.error('Ошибка загрузки пользователей:', error);
    $q.notify({
      message: 'Ошибка загрузки пользователей',
      color: 'negative',
      position: 'top'
    });
  }
};

const loadProjects = async () => {
  try {
    const projects = await getAllProjects();
    if (projects) {
      allProjects.value = projects.map(project => ({
        id: project.id,
        name: project.name,
        status: project.status
      }));
    }
  } catch (error) {
    console.error('Ошибка загрузки проектов:', error);
    $q.notify({
      message: 'Ошибка загрузки проектов',
      color: 'negative',
      position: 'top'
    });
  }
  console.log('Project options:', filteredProjectOptions.value);
};

const handleProjectChange = (selectedProject: ProjectOption | null) => {
  if (selectedProject) {
    editedTeam.value.project = {
      id: selectedProject.id,
      name: selectedProject.name,
      status: selectedProject.status
    };
  } else {
    editedTeam.value.project = null;
  }
  editedTeam.value.status = selectedProject ? StatusTeam.inProgress : StatusTeam.searchProject;
  console.log('Selected project:', selectedProject);
};

const openDialog = async (team: TeamDto) => {
  showDialog.value = true;
  await Promise.all([loadUsers(), loadProjects()]);
  
  const initialProjectState = team.project ? {
    id: team.project.id,
    name: team.project.name,
    status: team.project.status
  } : null;

  editedTeam.value = {
    id: team.id,
    name: team.name,
    description: team.description,
    privacy: team.privacy,
    status: team.status,
    members: team.user.map(u => ({
      id: u.id,
      fullName: `${u.firstname} ${u.lastname}`,
      email: u.email
    })),
    leader: team.user_leader ? {
      id: team.user_leader.id,
      fullName: `${team.user_leader.firstname} ${team.user_leader.lastname}`,
      email: team.user_leader.email
    } : null,
    project: initialProjectState,
    originalProjectState: initialProjectState, // Сохраняем исходное состояние
    user_owner: team.user_owner.id
  };

  updateLeaderOptions();
};

const onSubmit = async () => {
  try {
    loading.value = true;
    
    // Сохраняем исходное состояние проекта
    const originalProjectBeforeEdit = editedTeam.value.originalProjectState;
    const currentProject = editedTeam.value.project;
    
    console.log('Original project:', originalProjectBeforeEdit?.id);
    console.log('Current project:', currentProject?.id);

    // 1. Обновляем статусы проектов
    if (originalProjectBeforeEdit?.id !== currentProject?.id) {
      // Если был старый проект - возвращаем ему searchTeam
      if (originalProjectBeforeEdit?.id) {
        console.log('Returning previous project to searchTeam status');
        await UpdateProject(originalProjectBeforeEdit.id, { 
          status: StatusProject.searchTeam 
        });
      }
      
      // Если есть новый проект - устанавливаем teamFound
      if (currentProject?.id) {
        console.log('Setting new project to teamFound status');
        await UpdateProject(currentProject.id, { 
          status: StatusProject.teamFound 
        });
      }
    }

    // 2. Обновляем саму команду
    const updateData = {
      name: editedTeam.value.name,
      description: editedTeam.value.description,
      privacy: editedTeam.value.privacy,
      status: editedTeam.value.status,
      user_leader: editedTeam.value.leader?.id || null,
      user: editedTeam.value.members.map(m => m.id),
      project: currentProject?.id || null,
      user_owner: editedTeam.value.user_owner
    };
    
    console.log('Saving team with:', updateData);
    const updatedTeam = await updateTeam(editedTeam.value.id, updateData);
    
    // 3. Обновляем UI
    emit('update', updatedTeam);
    closeDialog();
    $q.notify({ message: 'Изменения сохранены', color: 'positive' });
    
  } catch (error) {
    console.error('Save error:', error);
    $q.notify({ 
      message: 'Ошибка сохранения изменений', 
      color: 'negative',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};


const closeDialog = () => {
  showDialog.value = false;
};

defineExpose({
  openDialog,
  closeDialog,
});
</script>

<style scoped>
.edit-team-dialog {
  width: 600px;
  max-width: 90%;
}

.q-chip {
  max-width: 200px;
}
</style>