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

          <!-- Тимлид -->
          <div class="relative-position tooltip-wrapper">
            <q-select
              v-model="editedTeam.leader"
              label="Тимлид"
              :options="editedTeam.members"
              outlined
              option-label="fullName"
              emit-value 
              map-options
              class="q-mb-md"
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
              :options="groupedProjectOptions"
              outlined
              option-label="name"
              option-value="value"
              emit-value
              map-options
              clearable
              :readonly="!canEditProject || editedTeam.status === StatusTeam.delete"
              @update:model-value="handleProjectChange"
              :display-value="editedTeam.project?.name || 'Не выбран'"
            >
              <template v-slot:option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label 
                      :class="{
                        'text-weight-bold': scope.opt.header, 
                        'text-grey': scope.opt.disabled,
                        'q-pl-md': !scope.opt.header
                      }"
                    >
                      {{ scope.opt.label }}
                    </q-item-label>
                  </q-item-section>
                </q-item>
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

          <!-- Участники команды -->
          <q-btn 
            label="Управление участниками команды" 
            color="primary" 
            @click="openMemberDialog"
            class="q-mt-md q-mb-md"
          />

          <q-dialog v-model="showMemberDialog" persistent>
            <q-card class="member-management-dialog">
              <q-card-section>
                <div class="text-h6">Управление участниками команды</div>
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
                    :disable="shouldDisableUser(user)"
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
                        <span v-if="showUnavailableWarning(user)" class="text-negative">
                          {{ getUserUnavailableReason(user) }}
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
            <q-btn type="submit" label="Сохранить" color="primary" :loading="loading" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { 
  PrivacyTeam, 
  StatusTeam,
  StatusProject,
  Role,
  TeamDto,
} from '../../../../backend/src/common/types';
import { update as updateTeam, get as getTeam } from 'src/api/team.api';
import { 
  getAll as getAllUsers, 
  get as getUser,
} from 'src/api/users.api';
import {
  getAll as getAllEx,
  } from 'src/api/exchange.api'
import {
  update as updateProjectApi,
} from 'src/api/project.api';
import {useMainStore} from 'src/stores/main-store';
import { useProjectStore } from 'src/stores/project-store';
import { 
  getAll as getAllPortfolio,
  update as updatePortfolio,
  create as createPortfolio,
} from 'src/api/portfolio.api';
import { UserCommandStatus, ExchangeDto, ProjectDto } from '../../../../backend/src/common/types';

const $q = useQuasar();
const emit = defineEmits(['update']);
const showDialog = ref(false);
const loading = ref(false);
const mainStore = useMainStore();
const projectStore = useProjectStore();
const allExchanges = ref<{id: number; name: string; projects: ProjectOption[]}[]>([]);
const showMemberDialog = ref(false);
const searchQuery = ref('');
const tempMembers = ref<TeamMember[]>([]);

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

// Открытие диалога управления участниками
const openMemberDialog = () => {
  tempMembers.value = [...editedTeam.value.members];
  showMemberDialog.value = true;
};

// Фильтрация пользователей для поиска
const filteredAllUsers = computed(() => {
  const query = searchQuery.value?.toLowerCase() || '';
  return allUsers.value.filter(user => 
    user.fullName.toLowerCase().includes(query) ||
    user.email?.toLowerCase().includes(query)
  );
});

// Проверка, что пользователь уже в команде
const isCurrentMember = (user: TeamMember) => {
  return tempMembers.value.some(m => m.id === user.id);
};

// Проверка, что пользователь в другой команде
const isInOtherTeam = (user: TeamMember) => {
  return user.inTeam && !isCurrentMember(user);
};

// Проверка, что пользователь недоступен для добавления
const shouldDisableUser = (user: TeamMember) => {
  return isInOtherTeam(user);
};

// Показывать ли предупреждение о недоступности
const showUnavailableWarning = (user: TeamMember) => {
  return isInOtherTeam(user);
};

// Получение причины недоступности пользователя
const getUserUnavailableReason = (user: TeamMember) => {
  if (isInOtherTeam(user)) {
    return 'Уже в другой команде';
  }
  return '';
};

// Проверка, что пользователь недоступен для добавления
const isUserUnavailable = (user: TeamMember) => {
  return user.inTeam && !isCurrentMember(user);
};

// Получение цвета иконки пользователя
const getUserIconColor = (user: TeamMember) => {
  if (isCurrentMember(user)) return 'positive';
  if (isUserUnavailable(user)) return 'negative';
  return 'primary';
};

// Добавление/удаление пользователя из временного списка
const toggleTeamMember = async (user: TeamMember) => {
  if (isInOtherTeam(user)) return;

  // Проверка для лидера
  if (editedTeam.value.leader?.id === user.id && isCurrentMember(user)) {
    try {
      const confirmed = await new Promise<boolean>((resolve) => {
        $q.dialog({
          title: 'Подтверждение',
          message: 'Вы собираетесь удалить себя из команды. После этого вы перестанете быть лидером. Продолжить?',
          persistent: true,
          ok: {
            label: 'Да',
            color: 'negative', 
            flat: true
          },
          cancel: {
            label: 'Отмена',
            color: 'primary',
          }
        }).onOk(() => resolve(true)).onCancel(() => resolve(false));
      });

      if (!confirmed) return;
    } catch {
      return;
    }
  }

  if (isCurrentMember(user)) {
    tempMembers.value = tempMembers.value.filter(m => m.id !== user.id);
  } else {
    tempMembers.value = [...tempMembers.value, user];
  }
};

// Сохранение изменений при закрытии диалога
watch(showMemberDialog, (newVal) => {
  if (!newVal) {
    editedTeam.value.members = [...tempMembers.value];
    
    // Обновляем лидера, если он был удален из команды
    if (editedTeam.value.leader && 
        !tempMembers.value.some(m => m.id === editedTeam.value.leader?.id)) {
      editedTeam.value.leader = null;
    }
  }
});

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

const groupedProjectOptions = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any[] = [];
  
  allExchanges.value.forEach((exchange: {id: number; name: string; projects: ProjectOption[]}) => {
    const validProjects = exchange.projects.filter((project: ProjectOption) => 
      (project.status === StatusProject.searchTeam || 
       project.status === StatusProject.selectionTeam) &&
      (!projectStore.projects.some((p: ProjectDto) => 
        p.id === project.id && 
        p.teams && 
        p.teams.length > 0 &&
        p.teams.some((t: TeamDto) => t.id !== editedTeam.value.id)
      )
    ));

    if (validProjects.length > 0) {
      // Добавляем заголовок биржи (только название)
      result.push({
        label: exchange.name,
        value: null,
        disabled: true,
        header: true
      });
      
      // Добавляем проекты (только название и значение)
      validProjects.forEach((project: ProjectOption) => {
        result.push({
          label: project.name,  // Только имя проекта
          value: project,       // Весь объект проекта как значение
          disabled: false,
          header: false
        });
      });
    }
  });

  return result;
});

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

const loadProjectsFromExchanges = async () => {
  try {
    const exchanges = await getAllEx();
    allExchanges.value = exchanges.map((exchange: ExchangeDto) => ({
      id: exchange.id,
      name: exchange.name,
      projects: (exchange.projects || []).map((project: ProjectDto) => ({
        id: project.id,
        name: project.name,
        status: project.status
      }))
    }));
    
    // Сохраняем плоский список проектов для других функций
    allProjects.value = allExchanges.value.flatMap(exchange => exchange.projects);
    
  } catch (error) {
    console.error('Ошибка загрузки проектов из бирж:', error);
    $q.notify({
      message: 'Ошибка загрузки проектов из бирж',
      color: 'negative',
      position: 'top'
    });
  }
};

const loadProjects = async () => {
  await loadProjectsFromExchanges();
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

    // Получаем текущий состав команды из API для сравнения
    const currentTeamData = await getTeam(editedTeam.value.id);
    const currentMembers = currentTeamData?.user || [];
    
    // Находим добавленных участников
    const addedMembers = editedTeam.value.members.filter(newMember => 
      !currentMembers.some(m => m.id === newMember.id)
    );
    
    // Находим удаленных участников
    const removedMembers = currentMembers.filter(oldMember => 
      !editedTeam.value.members.some(m => m.id === oldMember.id)
    );

    // Создаем записи в портфолио для новых участников
    if (addedMembers.length > 0) {
      try {
        for (const member of addedMembers) {
          await createPortfolio({
            user: member.id,
            team: editedTeam.value.id,
            status: UserCommandStatus.inTeam,
          });
        }
      } catch (error) {
        console.error('Ошибка создания записей портфолио:', error);
        throw new Error('Не удалось создать записи портфолио для новых участников');
      }
    }

    // Обновляем записи в портфолио для удаленных пользователей
    if (removedMembers.length > 0) {
      try {
        const allPortfolios = await getAllPortfolio();
        
        for (const member of removedMembers) {
          const activePortfolio = allPortfolios.find(
            p => p.team?.id === editedTeam.value.id && 
                 p.user?.id === member.id && 
                 p.status === UserCommandStatus.inTeam
          );

          if (activePortfolio) {
            await updatePortfolio(activePortfolio.id, {
              status: UserCommandStatus.expelled,
            });
          }
        }
      } catch (error) {
        console.error('Ошибка обновления портфолио:', error);
        throw new Error('Не удалось обновить записи портфолио для удаленных участников');
      }
    }
    
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