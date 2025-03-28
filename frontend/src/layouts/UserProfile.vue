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
        <div class="row q-col-gutter-lg">
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
                    {{ currentUser.firstname }} {{ currentUser.lastname }}
                  </div>
                  <div class="text-subtitle1 text-grey">
                    {{ currentUser.email }}
                  </div>
                </div>

                <q-separator class="full-width" />

                <div class="full-width">
                  <div class="text-caption text-grey">Группа</div>
                  <div class="text-h6">
                    {{ currentUser.group || 'Не указана' }}
                  </div>
                </div>

                <div class="full-width">
                  <div class="text-caption text-grey">Телефон</div>
                  <div class="text-h6">
                    {{ currentUser.telephone || 'Не указан' }}
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
              v-if="currentUser.competence?.length" 
              class="detail-card q-pa-md q-mb-md"
            >
              <div class="text-h6">Компетенции</div>
              <q-separator class="q-my-sm" />
              <div class="q-gutter-sm">
                <q-chip 
                  v-for="(comp, index) in currentUser.competence" 
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
              v-if="currentUser.portfolio?.length" 
              class="detail-card q-pa-md"
            >
              <div class="text-h6">История команд</div>
              <q-separator class="q-my-sm" />
              <div class="q-gutter-y-md">
                <q-expansion-item
                  v-for="(item, index) in currentUser.portfolio"
                  :key="index"
                  :label="item.team.name"
                  :caption="formatPortfolioStatus(item.status)"
                  class="portfolio-item"
                  header-class="portfolio-header"
                >
                  <template v-slot:header>
                    <q-item-section>
                      <div class="row items-center">
                        <q-icon name="groups" class="q-mr-sm" />
                        <div class="text-weight-medium">{{ item.team.name }}</div>
                      </div>
                    </q-item-section>
                    <q-item-section side>
                      <q-badge 
                        :color="getStatusColor(item.status)"
                        :label="formatPortfolioStatus(item.status)"
                      />
                    </q-item-section>
                  </template>

                  <div class="q-pa-sm">
                    <div class="row q-col-gutter-md">
                      <div class="col-6">
                        <div class="text-caption text-grey">Дата вступления</div>
                        <div>{{ formatDate(item.entryDate) }}</div>
                      </div>
                      <div class="col-6" v-if="item.exclusionDate">
                        <div class="text-caption text-grey">Дата исключения</div>
                        <div>{{ formatDate(item.exclusionDate) }}</div>
                      </div>
                    </div>

                    <div v-if="item.team.project" class="q-mt-sm">
                      <div class="text-caption text-grey">Проект</div>
                      <div class="text-weight-medium">
                        {{ item.team.project.name }}
                      </div>
                    </div>

                    <div v-if="item.team.description" class="q-mt-sm">
                      <div class="text-caption text-grey">Описание команды</div>
                      <div>{{ item.team.description }}</div>
                    </div>
                  </div>
                </q-expansion-item>
              </div>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMainStore } from 'src/stores/main-store';
import { UserCommandStatus } from '../../../backend/src/common/types';

const isOpen = ref(false);
const mainStore = useMainStore();

const currentUser = computed(() => mainStore.getCurrentUser());

const formattedRoles = computed(() => {
  if (!currentUser.value?.roles) return [];
  const roleNames: Record<string, string> = {
    admin: 'Администратор',
    user: 'Студент',
    customer: 'Заказчик',
    expert: 'Эксперт',
    directorate: 'Дирекция ВШЦТ'
  };
  return currentUser.value.roles.map(role => roleNames[role] || role);
});

const formatPortfolioStatus = (status: UserCommandStatus) => {
  const statusMap = {
    [UserCommandStatus.inTeam]: 'Активен',
    [UserCommandStatus.expelled]: 'Исключен'
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: UserCommandStatus) => {
  return status === UserCommandStatus.inTeam ? 'positive' : 'negative';
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const open = () => {
  isOpen.value = true;
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
  overflow: hidden;
  border: 1px solid rgba(0, 0, 0, 0.12);

  .portfolio-header {
    background-color: rgba(0, 0, 0, 0.02);
    min-height: 56px;
  }

  &:not(:last-child) {
    margin-bottom: 8px;
  }
}

.q-chip {
  font-size: 14px;
}
</style>