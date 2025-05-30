<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card class="profile-card">
      <q-card-section class="profile-header bg-primary text-white">
        <div class="row items-center justify-between">
          <div class="text-h4">Профиль пользователя</div>
          <q-btn 
            icon="close" 
            flat 
            round 
            dense 
            v-close-popup 
            @click="closeDialog"
            class="close-btn"
          />
        </div>
      </q-card-section>

      <q-card-section class="profile-content q-pa-lg">
        <div v-if="isLoading" class="text-center q-pa-md">
          <q-spinner size="xl" color="primary" />
          <div class="q-mt-md">Загрузка профиля...</div>
        </div>

        <div v-else-if="error" class="text-center q-pa-md text-negative">
          <q-icon name="error" size="xl" />
          <div class="q-mt-md">{{ error }}</div>
          <q-btn 
            color="primary" 
            label="Повторить" 
            @click="loadProfile" 
            class="q-mt-sm"
          />
        </div>

        <div v-else-if="userProfile" class="profile-layout">
          <div class="left-column">
            <div class="avatar-section">
              <q-avatar size="120px" class="profile-avatar">
                <img :src="avatarImage" v-if="avatarImage">
                <q-icon v-else name="person" size="80px" color="grey-6" />
              </q-avatar>
              <div class="user-name">
                {{ userProfile.firstname }} {{ userProfile.lastname }}
              </div>
              <div class="user-email text-grey">
                {{ userProfile.email }}
              </div>
            </div>

            <q-card class="info-card q-mt-md">
              <q-card-section>
                <div class="text-h6">Основная информация</div>
                <q-separator class="q-my-sm" />

                <div class="info-row">
                  <span class="info-label">Имя:</span>
                  <span class="info-value">{{ userProfile.firstname }}</span>
                </div>

                <div class="info-row">
                  <span class="info-label">Фамилия:</span>
                  <span class="info-value">{{ userProfile.lastname }}</span>
                </div>

                <div class="info-row">
                  <span class="info-label">Группа:</span>
                  <span class="info-value">{{ userProfile.group || 'Не указана' }}</span>
                </div>

                <div class="info-row">
                  <span class="info-label">Телефон:</span>
                  <span class="info-value">{{ formatPhone(userProfile.telephone) || 'Не указан' }}</span>
                </div>

                <div class="info-row">
                  <span class="info-label">Дата регистрации:</span>
                  <span class="info-value">{{ formatDate(userProfile.createdAt) }}</span>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <div class="right-column">
            <q-card class="section-card">
              <q-card-section>
                <div class="text-h6">Роли</div>
                <q-separator class="q-my-sm" />
                <div class="q-gutter-sm">
                  <q-chip 
                    v-for="(role, index) in formattedRoles" 
                    :key="index"
                    color="primary" 
                    text-color="white"
                    icon="badge"
                    size="md"
                  >
                    {{ role }}
                  </q-chip>
                </div>
              </q-card-section>
            </q-card>

            <q-card class="section-card q-mt-md">
              <q-card-section>
                <div class="text-h6">Компетенции</div>
                <q-separator class="q-my-sm" />
                
                <div class="q-gutter-sm">
                  <q-chip 
                    v-for="(comp, index) in userProfile.competence" 
                    :key="index"
                    color="accent" 
                    text-color="white"
                    icon="code"
                    size="md"
                  >
                    {{ comp }}
                  </q-chip>
                  <span v-if="!userProfile.competence?.length" class="text-grey">
                    Компетенции не указаны
                  </span>
                </div>
              </q-card-section>
            </q-card>

            <q-card class="section-card q-mt-md">
              <q-card-section>
                <div class="text-h6">Идеи</div>
                <q-separator class="q-my-sm" />

                <div v-if="isIdeasLoading" class="text-center q-pa-md">
                  <q-spinner size="md" color="primary" />
                  <div>Загрузка идей...</div>
                </div>

                <div v-else-if="ideasError" class="text-center q-pa-md text-negative">
                  <q-icon name="error" size="md" />
                  <div class="q-mt-md">{{ ideasError }}</div>
                </div>

                <q-table
                  v-else
                  :rows="ideas"
                  :columns="ideaColumns"
                  row-key="id"
                  flat
                  bordered
                  hide-pagination
                  class="portfolio-table"
                >
                  <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                      <q-badge 
                        :color="getIdeaStatusColor(props.row.status)"
                        :label="formatIdeaStatus(props.row.status)" 
                      />
                    </q-td>
                  </template>

                  <template v-slot:body-cell-createdAt="props">
                    <q-td :props="props">
                      <div>{{ formatDate(props.row.createdAt) }}</div>
                    </q-td>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>

            <q-card v-if="sortedPortfolio.length" class="section-card q-mt-md">
              <q-card-section>
                <div class="text-h6">Портфолио</div>
                <q-separator class="q-my-sm" />

                <div v-if="isPortfolioLoading" class="text-center q-pa-md">
                  <q-spinner size="md" color="primary" />
                  <div>Загрузка истории команд...</div>
                </div>

                <q-table
                  v-else
                  :rows="sortedPortfolio"
                  :columns="portfolioColumns"
                  row-key="id"
                  flat
                  bordered
                  hide-pagination
                  class="portfolio-table"
                >
                  <template v-slot:body-cell-team="props">
                    <q-td :props="props">
                      <div class="text-weight-medium">
                        {{ props.row.team?.name || 'Команда удалена' }}
                        <q-badge 
                          v-if="props.row.team?.exists === false" 
                          color="negative" 
                          class="q-ml-xs"
                        >
                          Удалена
                        </q-badge>
                      </div>
                      <div class="text-caption text-grey">
                        {{ getRoleInTeam(props.row.team) }}
                      </div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-status="props">
                    <q-td :props="props">
                      <q-badge 
                        :color="getStatusBadgeColor(props.row)"
                        :label="getStatusText(props.row)" 
                      />
                    </q-td>
                  </template>

                  <template v-slot:body-cell-entryDate="props">
                    <q-td :props="props">
                      <div>{{ formatDate(props.row.entryDate) }}</div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-exitDate="props">
                    <q-td :props="props">
                      <div v-if="props.row.recordStatus === UserCommandStatus.expelled && props.row.exclusionDate">
                        {{ formatDate(props.row.exclusionDate) }}
                      </div>
                      <div v-else class="text-black">
                        -
                      </div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-recordStatus="props">
                    <q-td :props="props">
                      <q-badge 
                        :color="props.row.recordStatus === UserCommandStatus.inTeam ? 'positive' : 'grey'"
                        :label="formatRecordStatus(props.row.recordStatus)" 
                      />
                    </q-td>
                  </template>
                </q-table>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div v-else class="text-center q-pa-md text-grey">
          <q-icon name="person_off" size="xl" />
          <div class="q-mt-md">Данные профиля недоступны</div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfileStore } from 'src/stores/profile-store';
import { 
  Role,
  StatusTeam,
  UserCommandStatus,
  StatusIdea,
  IdeaDto
} from '../../../backend/src/common/types';
import { QTableProps } from 'quasar';
import { getAll as PortfolioGetAll } from '../api/portfolio.api';
import { getAll as IdeaGetAll } from '../api/idea.api';
 
const props = defineProps({
  userId: {
    type: Number,
    required: true
  },
  modelValue: { // Добавляем modelValue для v-model
    type: Boolean,
    default: false
  }
});
const emit = defineEmits([
  'update:modelValue', // Исправляем название события
  'update:userId'
]);


const isOpen = ref(props.modelValue);
const isPortfolioLoading = ref(false);
const profileStore = useProfileStore();
//const $q = useQuasar();
const ideas = ref<IdeaDto[]>([]);
const isIdeasLoading = ref(false);
const ideasError = ref<string | null>(null);
const { userProfile, isLoading, error } = storeToRefs(profileStore);

const avatarImage = ref<string>('');

const getRandomAvatar = () => {
  const avatarCount = 3;
  const randomNum = Math.floor(Math.random() * avatarCount) + 1;
  return `/ava/${randomNum}.png`;
};

interface PortfolioTableRow {
  id: number;
  team: {
    id: number | null;
    name: string | null;
    status?: StatusTeam | null;
    user_leader?: { id: number } | null;
    user_owner?: { id: number } | null;
    exists?: boolean;
  } | null;
  entryDate: Date;
  exclusionDate?: Date | null;
  recordStatus: UserCommandStatus;
  userStatusInTeam?: 'active' | 'expelled' | 'team_deleted';
}

const getStatusBadgeColor = (row: PortfolioTableRow) => {
  if (row.userStatusInTeam === 'team_deleted') return 'negative';
  if (row.userStatusInTeam === 'expelled') return 'grey';
  if (row.recordStatus === UserCommandStatus.inTeam) return 'positive';
  return 'grey';
};

const getStatusText = (row: PortfolioTableRow) => {
  if (row.userStatusInTeam === 'team_deleted') return 'Команда удалена';
  if (row.userStatusInTeam === 'expelled') return 'Исключен';
  if (row.recordStatus === UserCommandStatus.inTeam) return 'В команде';
  return 'Исключен';
};

const ideaColumns: QTableProps['columns'] = [
  {
    name: 'name',
    required: true,
    label: 'Название идеи',
    align: 'left',
    field: (row: IdeaDto) => row.name
  },
  {
    name: 'createdAt',
    label: 'Дата создания',
    align: 'center',
    field: (row: IdeaDto) => row.createdAt
  },
  {
    name: 'status',
    label: 'Статус',
    align: 'center',
    field: (row: IdeaDto) => row.status
  }
];

const formatIdeaStatus = (status: StatusIdea): string => {
  const statusMap = {
    [StatusIdea.draft]: 'Черновик',
    [StatusIdea.new]: 'Новая',
    [StatusIdea.approved]: 'Одобрена',
    [StatusIdea.endorsed]: 'Утверждена',
    [StatusIdea.published]: 'Опубликована',
    [StatusIdea.implemented]: 'Реализована',
    [StatusIdea.fordeletion]: 'На удалении'
  };
  return statusMap[status] || status;
};

const getIdeaStatusColor = (status: StatusIdea): string => {
  const statusColors = {
    [StatusIdea.draft]: 'grey',
    [StatusIdea.new]: 'blue',
    [StatusIdea.approved]: 'teal',
    [StatusIdea.endorsed]: 'green',
    [StatusIdea.published]: 'purple',
    [StatusIdea.implemented]: 'positive',
    [StatusIdea.fordeletion]: 'negative'
  };
  return statusColors[status] || 'grey';
};

const loadIdeas = async () => {
  try {
    isIdeasLoading.value = true;
    ideasError.value = null;
    const allIdeas = await IdeaGetAll();
    ideas.value = allIdeas.filter(idea => 
      idea.initiator.id === props.userId
    );
  } catch (error) {
    ideasError.value = 'Не удалось загрузить идеи';
    console.error('Ошибка загрузки идей:', error);
  } finally {
    isIdeasLoading.value = false;
  }
};

const portfolioColumns: QTableProps['columns'] = [
  {
    name: 'team',
    required: true,
    label: 'Команда',
    align: 'left',
    field: (row: PortfolioTableRow) => {
      if (!row.team) return 'Команда удалена';
      return row.team.exists === false ? 'Команда удалена' : row.team.name || 'Команда без названия';
    }
  },
  {
    name: 'entryDate',
    label: 'Дата вступления',
    align: 'center',
    field: (row: PortfolioTableRow) => row.entryDate
  },
  {
    name: 'exitDate',
    label: 'Дата исключения',
    align: 'center',
    field: (row: PortfolioTableRow) => {
      if (row.userStatusInTeam === 'team_deleted') return 'Команда удалена';
      return row.exclusionDate || (row.team?.exists === false ? 'Команда удалена' : '-');
    }
  },
  {
    name: 'status',
    label: 'Статус',
    align: 'center',
    field: (row: PortfolioTableRow) => {
      if (row.userStatusInTeam === 'team_deleted') return 'Команда удалена';
      if (row.userStatusInTeam === 'expelled') return 'Исключен';
      if (row.team?.exists === false) return 'Команда удалена';
      return row.recordStatus === UserCommandStatus.inTeam ? 'В команде' : 'Исключен';
    }
  }
];

const formatRecordStatus = (status: UserCommandStatus): string => {
  const statusMap = {
    [UserCommandStatus.inTeam]: 'В команде',
    [UserCommandStatus.expelled]: 'Исключен',
    [UserCommandStatus.team_deleted]: 'Команда удалена',
  };
  return statusMap[status] || status;
};

const formatPhone = (phone?: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
};

const formattedRoles = computed(() => {
  if (!userProfile.value?.roles) return [];
  const roleNames: Record<Role, string> = {
    [Role.admin]: 'Администратор',
    [Role.user]: 'Студент',
    [Role.customer]: 'Заказчик',
    [Role.expert]: 'Эксперт',
    [Role.directorate]: 'Дирекция ВШЦТ'
  };
  return userProfile.value.roles.map((role: Role) => roleNames[role] || role);
});

const sortedPortfolio = computed(() => {
  if (!userProfile.value?.portfolio) return [];
  
  return userProfile.value.portfolio
    .map(item => {
      const teamExists = item.team?.status !== StatusTeam.delete;
      
      let userStatus: 'active' | 'expelled' | 'team_deleted' = 'active';
      if (item.status === UserCommandStatus.expelled) {
        userStatus = 'expelled';
      } else if (!teamExists) {
        userStatus = 'team_deleted';
      }

      return {
        id: item.id,
        team: item.team ? {
          id: item.team.id,
          name: item.team.name,
          status: item.team.status,
          user_leader: item.team.user_leader,
          user_owner: item.team.user_owner,
          exists: teamExists
        } : null,
        entryDate: new Date(item.entryDate),
        exclusionDate: item.exclusionDate ? new Date(item.exclusionDate) : undefined,
        recordStatus: item.status,
        userStatusInTeam: userStatus
      };
    })
    .sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime());
});

const getRoleInTeam = (team: { 
  id: number | null; 
  user_leader?: { id: number } | null; 
  user_owner?: { id: number } | null;
  exists?: boolean;
} | null) => {
  if (!userProfile.value || !team || team.exists === false) return 'Участник (команда удалена)';
  
  if (team.user_owner?.id === userProfile.value.id) {
    return 'Владелец команды';
  }
  if (team.user_leader?.id === userProfile.value.id) {
    return 'Лидер команды';
  }
  return 'Участник';
};

const formatDate = (date: Date | string) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const loadProfile = async () => {
  try {
    isLoading.value = true;
    error.value = '';
    avatarImage.value = getRandomAvatar();
    
    await profileStore.fetchUserProfile(props.userId);
    
    isPortfolioLoading.value = true;
    const allPortfolios = await PortfolioGetAll();
    const userPortfolios = allPortfolios.filter(
      p => p.user?.id === props.userId
    );
    
    if (userProfile.value) {
      userProfile.value.portfolio = userPortfolios;
    }
    
    await loadIdeas();
  } catch (err) {
    console.error('Ошибка загрузки профиля:', err);
    error.value = 'Не удалось загрузить данные профиля';
  } finally {
    isLoading.value = false;
    isPortfolioLoading.value = false;
  }
};

// Следим за изменениями userId
watch(() => props.userId, (newId) => {
  console.log('UserId changed:', newId);
});

// Следим за изменениями modelValue (v-model)
watch(() => props.modelValue, (newVal) => {
  console.log('ModelValue changed:', newVal);
  isOpen.value = newVal;
});

// Следим за isOpen
watch(isOpen, (newVal) => {
  console.log('isOpen changed:', newVal);
});

// Синхронизация с v-model
watch(isOpen, (val) => {
  emit('update:modelValue', val);
});

// Автоматическая загрузка профиля при открытии
watch(() => props.userId, (newVal) => {
  if (newVal && isOpen.value) {
    loadProfile();
  }
}, { immediate: true });

const open = () => {
  emit('update:userId', props.userId);
  isOpen.value = true;
  console.log(props.userId);
  loadProfile();
};

const closeDialog = () => {
  isOpen.value = false;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.profile-card {
  width: 90%;
  max-width: 1000px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background-color: #e9e9e9;
}

.profile-header {
  padding: 16px;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  .close-btn {
    color: white;
  }
}

.profile-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.profile-layout {
  display: flex;
  gap: 20px;
  max-width: 100%;
}

.left-column {
  width: 300px;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
}

.avatar-section {
  text-align: center;
  padding: 16px;
  background: var(--card-bg);
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  
  .profile-avatar {
    margin-bottom: 12px;
    background: #f5f5f5;
  }
  
  .user-name {
    font-size: 18px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .user-email {
    font-size: 13px;
  }
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(0,0,0,0.1);
  
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-weight: 500;
  width: 100px;
  color: #555;
  font-size: 13px;
}

.info-value {
  flex: 1;
  padding: 0 8px;
  font-size: 13px;
}

.section-card {
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.portfolio-table {
  width: 100%;
  font-size: 13px;
  
  :deep(.q-table__top) {
    padding: 8px;
  }
  
  :deep(.q-table__bottom) {
    padding: 8px;
  }
}

@media (max-width: 800px) {
  .profile-layout {
    flex-direction: column;
  }
  
  .left-column {
    width: 100%;
  }
  
  .profile-card {
    width: 95%;
    max-height: 85vh;
  }
  
  .info-label {
    width: 80px;
  }
}
/* Темная тема */
.body--dark .profile-card {
  background-color:rgb(0, 0, 0);
  color: #ffffff;
}

.body--dark .profile-header {
  background-color: #1e1e1e !important;
}

.body--dark .profile-content {
  background-color:rgb(0, 0, 0);
}

.body--dark .info-card,
.body--dark .section-card {
  background-color: #1e1e1e;
  border-color: #333;
}

.body--dark .info-label {
  color: #b0b0b0;
}

.body--dark .info-value {
  color: #ffffff;
}

.body--dark .user-email {
  color: #b0b0b0;
}

.body--dark .edit-btn {
  color: #4fc3f7 !important;
}

.body--dark .portfolio-table {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .q-table__grid-content .q-card {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .q-chip {
  color: #ffffff;
}

.body--dark .text-grey {
  color: #b0b0b0 !important;
}

.body--dark .q-tabs {
  color: #ffffff;
}

.body--dark .q-tab--active {
  color: var(--q-primary);
}

.body--dark .q-card__actions {
  background-color: #121212 !important;
  border-top: 1px solid #333 !important;
}

.body--dark .q-btn.flat {
  color: #ffffff;
}

.body--dark .q-btn.flat:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.body--dark .competence-panel {
  background-color: #1e1e1e;
}
.body--dark.left-column {
  width: 300px;
  flex-shrink: 0;
  background-color: #1e1e1e;
}
</style>