<template>
  <q-dialog v-model="isOpen" maximized>
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

      <q-card-section class="profile-content">
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

        <div v-else-if="userProfile" class="row q-col-gutter-lg">
          <!-- Левая колонка - основная информация -->
          <div class="col-md-4 col-sm-12">
            <q-card class="info-card q-pa-md">
              <div class="column items-center q-gutter-md">
                <q-avatar 
                  icon="account_circle" 
                  size="120px" 
                  color="grey-3" 
                  text-color="primary"
                  class="avatar"
                />
                <div class="text-center">
                  <div class="text-h5 text-weight-bold">
                    {{ userProfile.firstname }} {{ userProfile.lastname }}
                  </div>
                  <div class="text-subtitle1 text-grey">
                    {{ userProfile.email }}
                  </div>
                </div>

                <q-separator class="full-width" />

                <div class="full-width">
                  <div class="text-caption text-grey">Группа</div>
                  <div class="text-h6">
                    {{ userProfile.group || 'Не указана' }}
                  </div>
                </div>

                <div class="full-width">
                  <div class="text-caption text-grey">Телефон</div>
                  <div class="text-h6">
                    {{ userProfile.telephone || 'Не указан' }}
                  </div>
                </div>
              </div>
            </q-card>
          </div>

          <!-- Правая колонка - детали -->
          <div class="col-md-8 col-sm-12">
            <!-- Роли -->
            <q-card class="detail-card q-pa-md q-mb-md">
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
            </q-card>

            <!-- Компетенции -->
            <q-card 
              v-if="userProfile.competence?.length" 
              class="detail-card q-pa-md q-mb-md"
            >
              <div class="text-h6">Компетенции</div>
              <q-separator class="q-my-sm" />
              <div class="q-gutter-sm">
                <q-chip 
                  v-for="(comp, index) in userProfile.competence" 
                  :key="index"
                  color="accent" 
                  text-color="white"
                  icon="code"
                >
                  {{ comp }}
                </q-chip>
              </div>
            </q-card>

            <!-- Портфолио -->
            <q-card 
              v-if="userProfile.portfolio?.length" 
              class="detail-card q-pa-md"
            >
              <div class="text-h6">История участия в командах</div>
              <q-separator class="q-my-sm" />
              
              <div class="q-gutter-y-md">
                <q-expansion-item
                  v-for="(item, index) in sortedPortfolio"
                  :key="index"
                  class="portfolio-item"
                  header-class="portfolio-header"
                >
                  <template v-slot:header>
                    <q-item-section avatar>
                      <q-avatar color="primary" text-color="white" icon="groups" />
                    </q-item-section>

                    <q-item-section>
                      <div class="row items-center">
                        <div class="text-weight-medium">{{ item.team.name }}</div>
                        <q-chip 
                          v-if="item.team.project"
                          size="sm"
                          color="info"
                          text-color="white"
                          class="q-ml-sm"
                        >
                          Проект: {{ item.team.project.name }}
                        </q-chip>
                      </div>
                      <div class="text-caption">
                        {{ formatDate(item.entryDate) }} - 
                        {{ item.exclusionDate ? formatDate(item.exclusionDate) : 'по настоящее время' }}
                      </div>
                    </q-item-section>

                    <q-item-section side>
                      <q-badge 
                        :color="getStatusColor(item.status)"
                        :label="formatPortfolioStatus(item.status)"
                      />
                    </q-item-section>
                  </template>

                  <q-card-section>
                    <div class="row q-col-gutter-md">
                      <div class="col-md-6">
                        <div class="text-caption text-grey">Роль в команде</div>
                        <div class="text-weight-medium">
                          {{ getRoleInTeam(item.team) }}
                        </div>
                      </div>

                      <div class="col-md-6">
                        <div class="text-caption text-grey">Статус команды</div>
                        <div>
                          <q-badge :color="getTeamStatusColor(item.team.status)">
                            {{ formatTeamStatus(item.team.status) }}
                          </q-badge>
                        </div>
                      </div>

                      <div class="col-12" v-if="item.team.description">
                        <div class="text-caption text-grey">Описание команды</div>
                        <div>{{ item.team.description }}</div>
                      </div>

                      <div class="col-12" v-if="item.team.project">
                        <div class="text-subtitle2 q-mt-md">Информация о проекте</div>
                        <div class="q-pl-md">
                          <div v-if="item.team.project.problem">
                            <div class="text-caption text-grey">Проблема</div>
                            <div>{{ item.team.project.problem }}</div>
                          </div>
                          <div v-if="item.team.project.solution" class="q-mt-sm">
                            <div class="text-caption text-grey">Решение</div>
                            <div>{{ item.team.project.solution }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </q-card-section>
                </q-expansion-item>
              </div>
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
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfileStore } from 'src/stores/profile-store';
import { useMainStore } from 'src/stores/main-store';
import { 
  UserCommandStatus, 
  Role,
  StatusTeam,
  type TeamDto
} from '../../../backend/src/common/types';

const isOpen = ref(false);
const mainStore = useMainStore();
const profileStore = useProfileStore();

const { userProfile, isLoading, error } = storeToRefs(profileStore);

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
  return [...userProfile.value.portfolio].sort((a, b) => 
    new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
  );
});

const getRoleInTeam = (team: TeamDto) => {
  if (!userProfile.value) return 'Участник';
  if (team.user_leader?.id === userProfile.value.id) return 'Лидер команды';
  if (team.user_owner?.id === userProfile.value.id) return 'Владелец команды';
  return 'Участник';
};

const formatPortfolioStatus = (status: UserCommandStatus) => {
  const statusMap = {
    [UserCommandStatus.inTeam]: 'Активен',
    [UserCommandStatus.expelled]: 'Исключен'
  };
  return statusMap[status] || status;
};

const formatTeamStatus = (status: StatusTeam) => {
  const statusMap = {
    [StatusTeam.searchProject]: 'Поиск проекта',
    [StatusTeam.inProgress]: 'В работе',
    [StatusTeam.delete]: 'Удалена'
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: UserCommandStatus) => {
  return status === UserCommandStatus.inTeam ? 'positive' : 'negative';
};

const getTeamStatusColor = (status: StatusTeam) => {
  switch(status) {
    case StatusTeam.inProgress: return 'positive';
    case StatusTeam.searchProject: return 'warning';
    case StatusTeam.delete: return 'negative';
    default: return 'grey';
  }
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const loadProfile = () => {
  if (mainStore.userId) {
    profileStore.fetchUserProfile(mainStore.userId);
  }
};

const open = () => {
  isOpen.value = true;
  loadProfile();
};

const closeDialog = () => {
  isOpen.value = false;
};

defineExpose({ open });
</script>

<style scoped lang="scss">
.profile-card {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.profile-header {
  padding: 20px;
  .close-btn {
    color: white;
  }
}

.profile-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.info-card {
  height: 100%;
  display: flex;
  flex-direction: column;
  .avatar {
    border: 3px solid var(--q-primary);
  }
}

.detail-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.portfolio-item {
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .portfolio-header {
    min-height: 64px;
    background-color: rgba(0, 0, 0, 0.02);
  }
}

.q-chip {
  font-size: 14px;
}
</style>