<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card class="edit-team-dialog">
      <q-card-section>
        <div class="text-h4">Редактирование команды</div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="onSubmit">
          <!-- Название команды -->
          <q-input
            v-model="editedTeam.name"
            label="Название команды"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
            :readonly="!canEditLeader"
          />

          <!-- Описание -->
          <q-input
            v-model="editedTeam.description"
            label="Описание"
            :rules="[(val) => !!val || 'Поле обязательно']"
            outlined
            :readonly="!canEditLeader"
          />

          <!-- Приватность -->
          <div class="relative-position tooltip-wrapper">
            <q-select
              v-model="editedTeam.privacy"
              label="Приватность"
              :options="privacyOptions"
              :rules="[(val) => !!val || 'Поле обязательно']"
              outlined
              emit-value
              map-options
            />
          </div>

          <!-- Статус команды -->
          <div class="relative-position tooltip-wrapper">
            <q-select
              v-model="editedTeam.status"
              label="Статус команды"
              :options="statusOptions"
              :rules="[(val) => !!val || 'Поле обязательно']"
              outlined
              emit-value
              map-options
              :disable="!!editedTeam.project && editedTeam.status !== StatusTeam.inProgress"
              @update:model-value="handleStatusChange"
            >
              <template v-slot:selected-item="scope">
                <span v-if="scope.opt">{{ scope.opt.label }}</span>
                <span v-else>Не выбран</span>
              </template>
              <q-tooltip 
                v-if="!!editedTeam.project && editedTeam.status !== StatusTeam.inProgress"
                anchor="top middle"
                self="bottom middle"
                class="custom-tooltip"
              >
                Статус можно изменить только после принятия команды на проект
              </q-tooltip>
            </q-select>
          </div>

          <!-- Участники команды -->
          <q-select
            v-model="editedTeam.members"
            label="Участники команды"
            multiple
            use-chips
            :options="allUsers"
            option-label="fullName"
            emit-value
            map-options
            outlined 
            class="members-select" 
            @update:model-value="handleMemberSelection"
          >
            <template v-slot:option="scope">
              <q-item v-bind="scope.itemProps">
                <q-item-section avatar v-if="isUserInOtherTeam(scope.opt)">
                  <q-icon 
                    name="block" 
                    :color="editedTeam.members.some(m => m.id === scope.opt.id) ? 'positive' : 'negative'"
                  />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.fullName }}</q-item-label>
                  <q-item-label caption>
                    {{ scope.opt.email }}
                    <span v-if="isUserInOtherTeam(scope.opt)" class="text-negative">
                      <template v-if="editedTeam.members.some(m => m.id === scope.opt.id)">
                        (Уже в этой команде)
                      </template>
                      <template v-else>
                        (Уже в другой команде)
                      </template>
                    </span>
                  </q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-select>

          <!-- Тимлид -->
          <div class="relative-position tooltip-wrapper">
            <q-select
              v-model="editedTeam.leader"
              label="Тимлид"
              :options="editedTeam.members"
              :rules="[(val) => editedTeam.status === StatusTeam.delete || !!val || 'Необходимо выбрать тимлида']"
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
              <q-tooltip 
                v-if="editedTeam.status === StatusTeam.delete"
                anchor="top middle"
                self="bottom middle"
                class="custom-tooltip"
              >
                Для команд на удалении выбор тимлида не обязателен
              </q-tooltip>
            </q-select>
          </div>

          <!-- Проект -->
          <div class="relative-position tooltip-wrapper">
            <q-select
              v-model="editedTeam.project"
              label="Проект"
              :options="filteredProjectOptions"
              outlined
              option-label="name"
              emit-value
              map-options
              clearable
              :readonly="!canEditProject || editedTeam.status === StatusTeam.delete"
              @update:model-value="handleProjectChange"
              :display-value="editedTeam.project?.name || 'Не выбран'"
            >
              <template v-slot:selected-item="scope">
                <span v-if="scope.opt">{{ scope.opt.name }}</span>
                <span v-else>Не выбран</span>
              </template>
              <q-tooltip 
                v-if="!canEditProject || editedTeam.status === StatusTeam.delete"
                anchor="top middle"
                self="bottom middle"
                class="custom-tooltip"
              >
                <span v-if="editedTeam.status === StatusTeam.delete">
                  Нельзя изменить проект для команды на удалении
                </span>
                <span v-else-if="!canEditFull && editedTeam.leader?.id !== mainStore.userId">
                  Недостаточно прав для изменения
                </span>
                <span v-else-if="editedTeam.project && editedTeam.status === StatusTeam.inProgress">
                  Нельзя отвязать команду от проекта после принятия
                </span>
              </q-tooltip>
            </q-select>
          </div>

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
import { ref, computed } from 'vue';
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
  get as getUser,
} from 'src/api/users.api';
import { 
  getAll as getAllProjects, 
  update as updateProjectApi,
} from 'src/api/project.api';
import {useMainStore} from 'src/stores/main-store';

const $q = useQuasar();
const emit = defineEmits(['update']);
const showDialog = ref(false);
const loading = ref(false);
const mainStore = useMainStore();

const canEditFull = computed(() => {
  return mainStore.isAdmin() || editedTeam.value.user_owner === mainStore.userId;
});
const canEditLeader = computed(() => {
  return  canEditFull.value || 
  (editedTeam.value.leader?.id === mainStore.userId && editedTeam.value.leader !== null);
});
const canEditProject = computed(() => {
  // Разрешаем редактирование проекта если:
  // 1. Админ или владелец команды
  // 2. Лидер команды И команда не привязана к проекту ИЛИ привязана но статус "Подана на проект"
  return canEditFull.value || 
         (editedTeam.value.leader?.id === mainStore.userId && 
          (!editedTeam.value.project || 
           editedTeam.value.status === StatusTeam.joinProject));
});

interface TeamMember {
  id: number;
  fullName: string;
  email?: string;
  inTeam: boolean;
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
  originalProjectState: null as ProjectOption | null,
  user_owner: 0,
});

const previousStatus = ref<StatusTeam | null>(null);

const allUsers = ref<TeamMember[]>([]);
const allProjects = ref<ProjectOption[]>([]);

const privacyOptions = [
  { label: 'Открытая', value: PrivacyTeam.open },
  { label: 'Закрытая', value: PrivacyTeam.close }
];

const statusOptions = computed(() => {
  if (editedTeam.value.project) {
    // Если команда привязана к проекту
    if (editedTeam.value.status === StatusTeam.inProgress) {
      // Если команда уже принята (в процессе работы)
      return [
        { label: 'В процессе работы', value: StatusTeam.inProgress }
      ];
    } else {
      // Если команда только подана на проект
      return [
        { label: 'Подана на проект', value: StatusTeam.joinProject }
      ];
    }
  }
  // Если команда не привязана к проекту
  return [
    { label: 'Поиск проекта', value: StatusTeam.searchProject },
    { label: 'В процессе работы', value: StatusTeam.inProgress },
    { label: 'На удалении', value: StatusTeam.delete }
  ];
});

const handleStatusChange = async (newStatus: StatusTeam) => {
  if (newStatus === StatusTeam.delete) {
    try {
      const confirmed = await new Promise<boolean>((resolve) => {
        $q.dialog({
          html: true,
          title: 'Подтверждение',
          message: 'Вы действительно хотите пометить команду на удаление?<br>Через некоторое время все данные о команде безвозвратно удалятся!',
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
        }).onOk(() => resolve(true)).onCancel(() => resolve(false));
      });

      if (!confirmed) {
        editedTeam.value.status = previousStatus.value || StatusTeam.searchProject;
        return;
      }
    } catch {
      editedTeam.value.status = previousStatus.value || StatusTeam.searchProject;
      return;
    }
  }
  previousStatus.value = newStatus;
};

const filteredProjectOptions = computed(() => {
  return allProjects.value.filter(project => 
    project.status === StatusProject.searchTeam || 
    project.id === editedTeam.value.project?.id
  );
});

const isUserInOtherTeam = (user: TeamMember): boolean => {
  // Возвращаем true, если пользователь в другой команде ИЛИ если он уже в текущей команде
  return user.inTeam || editedTeam.value.members.some(m => m.id === user.id);
};

const handleMemberSelection = async (newMembers: TeamMember[]) => {
  // Находим пользователей, которые уже в команде
  const alreadyInTeam = newMembers.filter(newMember => 
    editedTeam.value.members.some(m => m.id === newMember.id)
  );

  // Если пытаемся добавить тех, кто уже в команде - просто игнорируем
  if (alreadyInTeam.length > 0) {
    return;
  }

  // Остальная логика проверки пользователей в других командах
  const invalidMembers = newMembers.filter(member => 
    member.inTeam && !editedTeam.value.members.some(m => m.id === member.id)
  );

  if (invalidMembers.length > 0) {
    // Откатываем выбор
    editedTeam.value.members = newMembers.filter(member => 
      !invalidMembers.some(u => u.id === member.id)
    );
    
    // Показываем сообщение об ошибке
    $q.notify({
      message: `Пользователь ${invalidMembers[0].fullName} уже состоит в команде`,
      color: 'negative',
      position: 'top',
      timeout: 3000
    });
    return;
  }

  // Обновляем список лидеров
  if (editedTeam.value.leader && 
      !newMembers.some(m => m.id === editedTeam.value.leader?.id)) {
    editedTeam.value.leader = null;
  }
};

const loadUsers = async () => {
  try {
    const users = await getAllUsers();
    if (users) {
      allUsers.value = await Promise.all(
        users
          .filter(user => user.roles.includes(Role.user))
          .map(async user => {
            const userData = await getUser(user.id);
            return {
              id: user.id,
              fullName: `${user.firstname} ${user.lastname}`,
              email: user.email,
              inTeam: userData?.team?.id !== undefined && 
                     userData.team.id !== null && 
                     userData.team.id !== editedTeam.value.id
            };
          })
      );
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
};

const handleProjectChange = (selectedProject: ProjectOption | null) => {
  // Если статус "На удалении", запрещаем изменения
  if (editedTeam.value.status === StatusTeam.delete) {
    $q.notify({
      message: 'Нельзя изменить проект для команды на удалении',
      color: 'negative',
      position: 'top'
    });
    return;
  }

  // Если пытаемся отвязать проект, но команда уже принята
  if (!selectedProject && editedTeam.value.status === StatusTeam.inProgress && !mainStore.isAdmin) {
    $q.notify({
      message: 'Нельзя отвязать команду от проекта после принятия',
      color: 'negative',
      position: 'top'
    });
    return;
  }

  if (selectedProject) {
    editedTeam.value.project = {
      id: selectedProject.id,
      name: selectedProject.name,
      status: selectedProject.status
    };
    // Устанавливаем статус "Подана на проект" только если команда еще не в процессе работы
    if (editedTeam.value.status !== StatusTeam.inProgress) {
      editedTeam.value.status = StatusTeam.joinProject;
    }
  } else {
    editedTeam.value.project = null;
    // Если отвязываем от проекта, возвращаем статус "Поиск проекта"
    editedTeam.value.status = StatusTeam.searchProject;
  }
};

const openDialog = async (team: TeamDto) => {
  try {
    showDialog.value = true;
    await Promise.all([loadUsers(), loadProjects()]);
    
    const initialProjectState = team.project ? {
      id: team.project.id,
      name: team.project.name,
      status: team.project.status
    } : null;

    previousStatus.value = team.status;

    editedTeam.value = {
      id: team.id,
      name: team.name,
      description: team.description,
      privacy: team.privacy,
      status: team.status,
      members: await Promise.all(
        team.user.map(async u => {
          const userData = await getUser(u.id);
          return {
            id: u.id,
            fullName: `${u.firstname} ${u.lastname}`,
            email: u.email,
            inTeam: userData?.team?.id !== undefined && 
                   userData.team.id !== null && 
                   userData.team.id !== team.id
          };
        })
      ),
      leader: team.user_leader ? {
        id: team.user_leader.id,
        fullName: `${team.user_leader.firstname} ${team.user_leader.lastname}`,
        email: team.user_leader.email,
        inTeam: false
      } : null,
      project: initialProjectState,
      originalProjectState: initialProjectState,
      user_owner: team.user_owner.id
    };
    
  } catch (error) {
    console.error('Error opening dialog:', error);
    $q.notify({
      message: 'Ошибка загрузки данных команды',
      color: 'negative',
      position: 'top'
    });
    closeDialog();
  }
};

const onSubmit = async () => {
  try {
    // Проверяем участников в других командах
    const invalidMembers = editedTeam.value.members.filter(m => m.inTeam);
    if (invalidMembers.length > 0) {
      $q.notify({
        message: `Невозможно сохранить: ${invalidMembers[0].fullName} уже в команде`,
        color: 'negative',
        position: 'top'
      });
      return;
    }

    // Проверяем права на изменение проекта
    if (editedTeam.value.project !== editedTeam.value.originalProjectState && 
        !canEditProject.value) {
      $q.notify({
        message: 'Недостаточно прав для изменения проекта',
        color: 'negative',
        position: 'top'
      });
      return;
    }

    loading.value = true;
    
    const originalProjectBeforeEdit = editedTeam.value.originalProjectState;
    const currentProject = editedTeam.value.project;
    
    if (originalProjectBeforeEdit?.id !== currentProject?.id) {
      if (originalProjectBeforeEdit?.id) {
        await updateProjectApi(originalProjectBeforeEdit.id, { 
          status: StatusProject.searchTeam 
        });
      }
      
      if (currentProject?.id) {
        await updateProjectApi(currentProject.id, { 
          status: StatusProject.selectionTeam
        });
      }
    }

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
    
    const updatedTeam = await updateTeam(editedTeam.value.id, updateData);
    
    emit('update', updatedTeam);
    closeDialog();
    $q.notify({ 
      message: 'Изменения сохранены', 
      color: 'positive',
      timeout: 2000
    });
    
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

.dialog-header {
  text-align: center;
  padding: 20px;
}

.relative-position {
  position: relative;
  padding-bottom: 10px;
}

.tooltip-wrapper:hover .custom-tooltip {
  opacity: 1;
  transition: opacity 0.3s ease;
}

.custom-tooltip {
  font-size: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  background-color: #424242;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 300px;
  pointer-events: none;
}

.custom-tooltip .tooltip-content {
  line-height: 1.5;
  white-space: normal;
}

.q-field--readonly .q-field__control {
  background-color: #a86b6b;
  opacity: 1;
}

.edit-team-dialog {
  width: 600px;
  max-width: 90%;
}

/* Добавляем отступ после участников */
.members-select {
  margin-bottom: 20px;
}

/* Для кастомизации обводки */
.q-select.outlined {
  border-radius: 4px;
  border: 1px solid #ccc;
}

/* При фокусе */
.q-select.outlined.q-field--focused {
  border-color: #1976d2;
}

.q-chip {
  max-width: 200px;
}

.text-negative {
  color: #ff5252;
}

</style>