<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="create-team-dialog">
      <q-card-section>
        <div class="text-h6">Создать новую команду</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit">
          <!-- Название команды -->
          <q-input
            v-model="newTeam.name"
            label="Название команды"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
          />

          <!-- Описание -->
          <q-input
            v-model="newTeam.description"
            label="Описание"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
          />

          <!-- Приватность -->
          <q-select
            v-model="newTeam.privacy"
            label="Приватность"
            :options="privacyOptions"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
            emit-value
            map-options
          />

          <!-- Статус -->
          <q-select
            v-model="newTeam.status"
            label="Статус"
            :options="statusOptions"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
            emit-value
            map-options
            :disable="!!newTeam.project" 
          />
          
          <!-- Тимлид (выбирается из участников) -->
          <q-select
            v-model="newTeam.user_leader"
            label="Тимлид"
            :options="newTeam.user.length ? userOptions.filter(u => newTeam.user.includes(u.id)) : []"
            outlined
            option-value="id"
            option-label="fullName"
            emit-value
            map-options
            :disable="!newTeam.user.length"
            clearable
            class="q-mb-md"
          />

          <!-- Проект -->
          <q-select
            v-model="newTeam.project"
            label="Проект (необязательно)"
            :options="projectOptions"
            outlined
            option-value="id"
            option-label="name"
            emit-value
            map-options
            @update:model-value="handleProjectChange"
            clearable
          />

          <!-- Участники команды -->
          <q-btn 
            label="Добавить участников" 
            color="primary" 
            @click="openMemberDialog"
            class="q-mt-md q-mb-md"
          />
          <!-- Новое модальное окно для управления участниками -->
          <q-dialog v-model="showMemberDialog" persistent>
            <q-card class="member-management-dialog">
              <q-card-section>
                <div class="text-h6">Добавление участников команды</div>
              </q-card-section>

              <q-card-section>
                <!-- Поиск пользователей -->
                <q-input
                  v-model="searchQuery"
                  label="Поиск пользователей"
                  outlined
                  clearable
                  class="q-mb-md"
                >
                  <template v-slot:append>
                    <q-icon name="search" />
                  </template>
                </q-input>

                <!-- Список пользователей -->
                <q-list bordered separator class="scroll" style="max-height: 400px;">
                  <q-item 
                    v-for="user in filteredAllUsers"
                    :key="user.id"
                    clickable
                    :disable="user.inTeam"
                    @click="toggleTeamMember(user)"
                  >
                    <q-item-section avatar>
                      <q-icon 
                        :name="isCurrentMember(user) ? 'person' : 'block'"
                        :color="getUserIconColor(user)"
                      />
                    </q-item-section>
                    
                    <q-item-section>
                      <q-item-label>{{ user.fullName }}</q-item-label>
                      <q-item-label caption>
                        {{ user.email }}
                        <span v-if="user.inTeam" class="text-negative">
                          (Уже в другой команде)
                        </span>
                      </q-item-label>
                    </q-item-section>

                    <q-item-section side>
                      <q-icon 
                        name="check_circle" 
                        color="positive"
                        v-if="isCurrentMember(user)"
                      />
                    </q-item-section>
                  </q-item>
                </q-list>
              </q-card-section>

              <q-card-actions align="right">
                <q-btn flat label="Готово" color="primary" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <q-card-actions align="right">
            <q-btn flat label="Отмена" color="negative" v-close-popup />
            <q-btn type="submit" label="Создать" color="primary" :loading="loading" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useQuasar } from 'quasar';
import { CreateTeamDto, PrivacyTeam, StatusTeam, Role, StatusProject, UpdateProjectDto, UserCommandStatus } from '../../../../backend/src/common/types';
import { create as createTeam } from 'src/api/team.api';
import { getAll as getAllUsers } from 'src/api/users.api';
import { getAll as getAllProjects, update as updateProject } from 'src/api/project.api';
import { useMainStore } from 'src/stores/main-store';
import { create as createPortfolio } from 'src/api/portfolio.api';


const $q = useQuasar();
const emit = defineEmits(['create']);
const showDialog = ref(false);
const loading = ref(false);
const mainStore = useMainStore();
const showMemberDialog = ref(false);
const searchQuery = ref('');
const tempSelectedUserIds = ref<number[]>([]);

const newTeam = ref<CreateTeamDto>({
  name: '',
  description: '',
  privacy: PrivacyTeam.open,
  status: StatusTeam.searchProject,
  user_leader: undefined,
  user: [],
  project: null, // изменено с 0 на null
  user_owner: mainStore.userId,
});

interface TeamMember {
  id: number;
  fullName: string;
  email?: string;
  inTeam: boolean;
}

const privacyOptions = [
  { label: 'Открытая', value: PrivacyTeam.open },
  { label: 'Закрытая', value: PrivacyTeam.close }
];

// Открытие диалога управления участниками
const openMemberDialog = () => {
  tempSelectedUserIds.value = [...newTeam.value.user];
  showMemberDialog.value = true;
};

// Фильтрация пользователей для поиска
const filteredAllUsers = computed(() => {
  const query = searchQuery.value?.toLowerCase() || '';
  return userOptions.value.filter(user => 
    user.fullName.toLowerCase().includes(query) ||
    (user.email && user.email.toLowerCase().includes(query))
  );
});

// Проверка, что пользователь уже выбран
const isCurrentMember = (user: TeamMember) => {
  return tempSelectedUserIds.value.includes(user.id);
};

// Добавление/удаление пользователя из временного списка
const toggleTeamMember = (user: TeamMember) => {
  if (user.inTeam) return;

  if (isCurrentMember(user)) {
    tempSelectedUserIds.value = tempSelectedUserIds.value.filter(id => id !== user.id);
  } else {
    tempSelectedUserIds.value = [...tempSelectedUserIds.value, user.id];
  }
};

// Получение цвета иконки пользователя
const getUserIconColor = (user: TeamMember) => {
  if (isCurrentMember(user)) return 'positive';
  if (user.inTeam) return 'negative';
  return 'primary';
};

// Сохранение изменений при закрытии диалога
watch(tempSelectedUserIds, (newUsers, oldUsers) => {
  const addedUsers = newUsers.filter(userId => !oldUsers.includes(userId));
  if (addedUsers.length > 0) {
    const usersInOtherTeams = userOptions.value
      .filter(user => addedUsers.includes(user.id) && user.inTeam);
    
    if (usersInOtherTeams.length > 0) {
      // Удаляем пользователей, которые уже в других командах
      tempSelectedUserIds.value = newUsers.filter(userId => 
        !usersInOtherTeams.some(u => u.id === userId)
      );
      // Показываем сообщение об ошибке
      $q.notify({
        message: `Пользователь ${usersInOtherTeams[0].fullName} уже состоит в другой команде`,
        color: 'negative',
        position: 'top'
      });
    }
  }
  // Обновляем участников команды
  newTeam.value.user = tempSelectedUserIds.value;
  // Обновляем лидера команды
  if (newTeam.value.user.length === 0) {
    newTeam.value.user_leader = undefined;
  } else if (newTeam.value.user_leader === undefined || !newTeam.value.user.includes(newTeam.value.user_leader)) {
    newTeam.value.user_leader = newTeam.value.user[0];
  }
}, { deep: true });

// Добавляем вычисляемое свойство для статуса
const statusOptions = computed(() => {
  if (newTeam.value.project) {
    // Если проект выбран, оставляем только "Подана на проект"
    return [
      { label: 'Подана на проект', value: StatusTeam.joinProject }
    ];
  }
  // Если проект не выбран, показываем все варианты
  return [
    { label: 'Поиск проекта', value: StatusTeam.searchProject },
    { label: 'В процессе работы', value: StatusTeam.inProgress },
  ];
});

// Обработчик изменения проекта
const handleProjectChange = (projectId: number | null) => {
  if (projectId) {
    newTeam.value.status = StatusTeam.joinProject;
  } else {
    newTeam.value.status = StatusTeam.searchProject;
  }
};

const userOptions = ref<TeamMember[]>([]);
const projectOptions = ref<Array<{id: number, name: string}>>([]);

const loadUsers = async () => {
  try {
    const users = await getAllUsers();
    if (users) {
      userOptions.value = users
        .filter(user => user.roles.includes(Role.user))
        .map(user => ({
          id: user.id,
          fullName: `${user.firstname} ${user.lastname} (${user.email})`,
          email: user.email,
          inTeam: user.team !== null // Добавляем флаг, что пользователь уже в команде
        } as TeamMember ));
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
      projectOptions.value = projects
      .filter(project => 
        project.status === StatusProject.searchTeam || 
        project.status === StatusProject.selectionTeam
      )
        .map(project => ({
          id: project.id,
          name: project.name
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
};

watch(() => newTeam.value.user, (newUsers, oldUsers) => {
  // Находим только что добавленных пользователей
  const addedUsers = newUsers.filter(userId => !oldUsers.includes(userId));
  
  if (addedUsers.length > 0) {
    const usersInOtherTeams = userOptions.value
      .filter(user => addedUsers.includes(user.id) && user.inTeam);
    
    if (usersInOtherTeams.length > 0) {
      // Удаляем пользователей, которые уже в других командах
      newTeam.value.user = newUsers.filter(userId => 
        !usersInOtherTeams.some(u => u.id === userId)
      );
      
      // Показываем сообщение об ошибке
      $q.notify({
        message: `Пользователь ${usersInOtherTeams[0].fullName} уже состоит в другой команде`,
        color: 'negative',
        position: 'top'
      });
    }
  }
  
  // Обновляем лидера команды
  if (newUsers.length === 0) {
    newTeam.value.user_leader = undefined;
  } else if (newTeam.value.user_leader === undefined || !newUsers.includes(newTeam.value.user_leader)) {
    newTeam.value.user_leader = newUsers[0];
  }
}, { deep: true });

const openDialog = async () => {
  showDialog.value = true;
  await Promise.all([loadUsers(), loadProjects()]);
  newTeam.value = {
    name: '',
    description: '',
    privacy: PrivacyTeam.open,
    status: StatusTeam.searchProject,
    user_leader: undefined,
    user: [],
    project: null,
    user_owner: mainStore.userId,
  };
};

const closeDialog = () => {
  showDialog.value = false;
};

const onSubmit = async () => {
  try {
    loading.value = true;
    
    // Обновленная валидация (без проверки проекта)
    if (!newTeam.value.name || !newTeam.value.description) {
      $q.notify({
        message: 'Заполните все обязательные поля',
        color: 'warning',
        position: 'top'
      });
      console.log('Point 1')
      return;
    }

    const teamData = {
      ...newTeam.value,
      user: [...newTeam.value.user],
      user_leader: newTeam.value.user_leader ? Number(newTeam.value.user_leader) : undefined,
      project: newTeam.value.project ? Number(newTeam.value.project) : null, // обработка null
    };

    // Создаем команду
    const createdTeam = await createTeam(teamData);
    if (createdTeam) {
      // Создаем записи в портфолио для всех участников команды
      try {
        for (const userId of teamData.user) {
          await createPortfolio({
            user: userId,
            team: createdTeam.id,
            status: UserCommandStatus.inTeam,
          });
          console.log('Point 2')
        }
      } catch (error) {
        console.error('Ошибка создания записей портфолио:', error);
        $q.notify({
          message: 'Команда создана, но не удалось создать записи портфолио',
          color: 'warning',
          position: 'top'
        });
      }

      // Обновляем проект только если он был выбран
      if (teamData.project) {
        $q.notify({
          message: newTeam.value.project
            ? 'Заявка на проект отправлена'
            : 'Команда успешно создана',
          color: 'positive',
          position: 'top',
        });
        const currentProject = projectOptions.value.find(p => p.id === teamData.project);
        if (currentProject) {
          const updateData: UpdateProjectDto = {
            ...currentProject,
            status: StatusProject.selectionTeam
          };
          await updateProject(teamData.project, updateData);
        }
      }
      console.log('Point 3')
      
      $q.notify({
        message: 'Команда успешно создана',
        color: 'positive',
        position: 'top'
      });
      emit('create', createdTeam);
      closeDialog();
    }
  } catch (error) {
    console.error('Ошибка создания команды:', error);
    $q.notify({
      message: 'Ошибка создания команды',
      color: 'negative',
      position: 'top'
    });
  } finally {
    loading.value = false;
  }
};

defineExpose({
  openDialog,
  closeDialog,
});
</script>

<style scoped>
.create-team-dialog {
  width: 500px;
  max-width: 90%;
}
</style>