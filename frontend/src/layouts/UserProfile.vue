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

      <q-card-section class="profile-content q-pa-lg">
        <!-- Диалог редактирования -->
        <q-dialog v-model="editDialog" persistent>
          <q-card style="min-width: 350px">
            <q-card-section>
              <div class="text-h6">Редактировать {{ editFieldLabel }}</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input
                v-if="editFieldName === 'telephone'"
                v-model="editValue"
                dense
                autofocus
                type="tel"
                :rules="[val => !!val || 'Обязательное поле']"
                mask="+7(###)-###-##-##"
                unmasked-value
              />
              <q-input
                v-else-if="editFieldName === 'email'"
                v-model="editValue"
                dense
                autofocus
                type="email"
                :rules="[val => !!val || 'Обязательное поле']"
              />
              <q-input
                v-else
                v-model="editValue"
                dense
                autofocus
                type="text"
                :rules="[val => !!val || 'Обязательное поле']"
              />
            </q-card-section>

            <q-card-actions align="right" class="text-primary">
              <q-btn flat label="Отмена" v-close-popup />
              <q-btn 
                flat 
                label="Сохранить" 
                @click="saveField" 
                :loading="isSaving"
                :disable="!editValue"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Диалог редактирования компетенций -->
        <q-dialog v-model="competencesDialog" persistent>
          <q-card style="min-width: 500px; max-width: 800px">
            <q-card-section>
              <div class="text-h6">Редактировать компетенции</div>
            </q-card-section>

            <q-card-section class="q-pt-none">
              <q-input
                v-model="competenceSearch"
                dense
                placeholder="Поиск компетенций..."
                class="q-mb-md"
              >
                <template v-slot:append>
                  <q-icon name="search" />
                </template>
              </q-input>

              <q-tabs
                v-model="activeCompetenceTab"
                dense
                class="text-grey"
                active-color="primary"
                indicator-color="primary"
                align="justify"
                narrow-indicator
              >
                <q-tab 
                  v-for="group in competenceGroups" 
                  :key="group" 
                  :name="group" 
                  :label="formatGroupName(group)"
                />
              </q-tabs>

              <q-separator />

              <q-tab-panels v-model="activeCompetenceTab" animated>
                <q-tab-panel 
                  v-for="group in competenceGroups" 
                  :key="group" 
                  :name="group"
                  class="q-pa-none"
                >
                  <div class="competence-panel">
                    <q-chip 
                      v-for="competence in filteredCompetences(group)"
                      :key="competence"
                      clickable
                      :color="selectedCompetences.includes(competence) ? 'primary' : 'grey-3'"
                      :text-color="selectedCompetences.includes(competence) ? 'white' : 'black'"
                      @click="toggleCompetence(competence)"
                      class="q-ma-xs"
                    >
                      {{ competence }}
                      <q-icon 
                        v-if="selectedCompetences.includes(competence)" 
                        name="check" 
                        class="q-ml-xs"
                      />
                    </q-chip>
                  </div>
                </q-tab-panel>
              </q-tab-panels>
            </q-card-section>

            <q-card-actions align="right" class="text-primary">
              <q-btn flat label="Отмена" v-close-popup />
              <q-btn 
                flat 
                label="Сохранить" 
                @click="saveCompetences" 
                :loading="isSavingCompetences"
                color="primary"
              />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Уведомления -->
        <q-banner v-if="successMessage" class="bg-positive text-white q-mb-md">
          {{ successMessage }}
          <template v-slot:action>
            <q-btn flat color="white" label="Закрыть" @click="successMessage = ''"/>
          </template>
        </q-banner>

        <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md">
          {{ errorMessage }}
          <template v-slot:action>
            <q-btn flat color="white" label="Закрыть" @click="errorMessage = ''"/>
          </template>
        </q-banner>

        <!-- Основное содержимое -->
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
          <!-- Левая колонка - Аватар и основная информация -->
          <div class="left-column">
            <!-- Аватар пользователя -->
            <div class="avatar-section">
              <q-avatar size="120px" class="profile-avatar">
                <q-icon name="person" size="80px" color="grey-6" />
              </q-avatar>
              <div class="user-name">
                {{ userProfile.firstname }} {{ userProfile.lastname }}
              </div>
              <div class="user-email text-grey">
                {{ userProfile.email }}
              </div>
            </div>

            <!-- Основная информация -->
            <q-card class="info-card q-mt-md">
              <q-card-section>
                <div class="text-h6">Основная информация</div>
                <q-separator class="q-my-sm" />

                <div class="info-row">
                  <span class="info-label">Имя:</span>
                  <span class="info-value">{{ userProfile.firstname }}</span>
                  <q-btn flat dense icon="edit" class="edit-btn" @click="editField('firstname')"/>
                </div>

                <div class="info-row">
                  <span class="info-label">Фамилия:</span>
                  <span class="info-value">{{ userProfile.lastname }}</span>
                  <q-btn flat dense icon="edit" class="edit-btn" @click="editField('lastname')"/>
                </div>

                <div class="info-row">
                  <span class="info-label">Группа:</span>
                  <span class="info-value">{{ userProfile.group || 'Не указана' }}</span>
                  <q-btn flat dense icon="edit" class="edit-btn" @click="editField('group')"/>
                </div>

                <div class="info-row">
                  <span class="info-label">Телефон:</span>
                  <span class="info-value">{{ formatPhone(userProfile.telephone) || 'Не указан' }}</span>
                  <q-btn flat dense icon="edit" class="edit-btn" @click="editField('telephone')"/>
                </div>

                <div class="info-row">
                  <span class="info-label">Дата регистрации:</span>
                  <span class="info-value">{{ formatDate(userProfile.createdAt) }}</span>
                </div>
              </q-card-section>
            </q-card>
          </div>

          <!-- Правая колонка - Роли, компетенции, портфолио -->
          <div class="right-column">
            <!-- Роли -->
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

            <!-- Компетенции -->
            <q-card class="section-card q-mt-md">
              <q-card-section>
                <div class="row items-center justify-between">
                  <div class="text-h6">Компетенции</div>
                  <q-btn 
                    flat 
                    dense 
                    icon="edit" 
                    class="edit-btn" 
                    @click="editCompetences"
                  />
                </div>
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

            <!-- Портфолио -->
            <q-card v-if="sortedPortfolio.length" class="section-card q-mt-md">
              <q-card-section>
                <div class="text-h6">Портфолио</div>
                <q-separator class="q-my-sm" />

                <div v-if="isPortfolioLoading" class="text-center q-pa-md">
                  <q-spinner size="md" color="primary" />
                  <div>Загрузка истории команд...</div>
                </div>

                <div v-else-if="sortedPortfolio.length === 0" class="text-grey q-pa-md text-center">
                  Нет данных об участии в командах
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
                  <template v-slot:body-cell-team="props: { row: PortfolioTableRow }">
                    <q-td :props="props">
                      <div class="text-weight-medium">{{ props.row.team.name }}</div>
                      <div class="text-caption text-grey">
                        {{ getRoleInTeam(props.row.team) }}
                      </div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-entryDate="props: { row: PortfolioTableRow }">
                    <q-td :props="props">
                      <div>{{ formatDate(props.row.entryDate) }}</div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-exitDate="props: { row: PortfolioTableRow }">
                    <q-td :props="props">
                      <div v-if="props.row.recordStatus === UserCommandStatus.expelled && props.row.exclusionDate">
                        {{ formatDate(props.row.exclusionDate) }}
                      </div>
                      <div v-else class="text-black">
                        -
                      </div>
                    </q-td>
                  </template>

                  <template v-slot:body-cell-recordStatus="props: { row: PortfolioTableRow }">
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
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useProfileStore } from 'src/stores/profile-store';
import { useMainStore } from 'src/stores/main-store';
import { 
  Role,
  StatusTeam,
  Competencies,
  UserCommandStatus,
  type Competence,
  type CompetenceGroup
} from '../../../backend/src/common/types';
import { update } from '../api/users.api';
import { QTableProps } from 'quasar';
import {getAll as PortfolioGetAll} from '../api/portfolio.api'

const isOpen = ref(false);
const isPortfolioLoading = ref(false);
const mainStore = useMainStore();
const profileStore = useProfileStore();

const { userProfile, isLoading, error } = storeToRefs(profileStore);

interface PortfolioTableRow {
  id: number;
  team: {
    id: number; // Добавляем обязательное поле
    name: string;
    status?: StatusTeam;
    user_leader?: { id: number };
    user_owner?: { id: number };
  };
  entryDate: Date;
  exclusionDate?: Date;
  recordStatus: UserCommandStatus;
}

const portfolioColumns: QTableProps['columns'] = [
  {
    name: 'team',
    required: true,
    label: 'Команда',
    align: 'left',
    field: (row: PortfolioTableRow) => row.team.name
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
    field: (row: PortfolioTableRow) => row.exclusionDate
  },
  {
    name: 'recordStatus',
    label: 'Статус',
    align: 'center',
    field: (row: PortfolioTableRow) => row.recordStatus
  }
];

const formatRecordStatus = (status: UserCommandStatus): string => {
  const statusMap = {
    [UserCommandStatus.inTeam]: 'В команде',
    [UserCommandStatus.expelled]: 'Исключен'
  };
  return statusMap[status] || status;
};

type EditableField = 'email' | 'firstname' | 'lastname' | 'group' | 'telephone';

// Редактирование полей
const editDialog = ref(false);
const editFieldName = ref<EditableField>('email');
const editFieldLabel = ref('');
const editValue = ref('');
const isSaving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

// Редактирование компетенций
const competencesDialog = ref(false);
const competenceSearch = ref('');
const activeCompetenceTab = ref<CompetenceGroup>('LANGUAGES');
const selectedCompetences = ref<Competence[]>([]);
const isSavingCompetences = ref(false);

// Группы компетенций
const competenceGroups = Object.keys(Competencies) as CompetenceGroup[];

const editField = (field: EditableField) => {
  console.log('[Profile] Открытие редактора для поля:', field);
  editFieldName.value = field;
  editFieldLabel.value = getFieldLabel(field);
  errorMessage.value = '';
  
  if (field === 'telephone') {
    const originalPhone = userProfile.value?.telephone || '';
    editValue.value = originalPhone.replace(/[^0-9]/g, '');
    console.log('[Profile] Исходный телефон:', originalPhone, 'Очищенный:', editValue.value);
  } else {
    editValue.value = userProfile.value?.[field] || '';
    console.log('[Profile] Установка значения поля:', { field, value: editValue.value });
  }
  
  editDialog.value = true;
};

const getFieldLabel = (field: EditableField): string => {
  const labels: Record<EditableField, string> = {
    email: 'Почту',
    firstname: 'Имя',
    lastname: 'Фамилию',
    group: 'Группу',
    telephone: 'Телефон'
  };
  return labels[field];
};

const saveField = async () => {
  if (!userProfile.value || !editFieldName.value || !editValue.value.trim()) {
    return;
  }

  // Специальная проверка только для email
  if (editFieldName.value === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editValue.value.trim())) {
      errorMessage.value = 'Введите корректный email (например: user@example.com)';
      return;
    }
  }

  isSaving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    let valueToSave = editValue.value.trim();
    
    if (editFieldName.value === 'telephone') {
      valueToSave = valueToSave.replace(/[^0-9]/g, '');
    }

    const updateData = {
      [editFieldName.value]: valueToSave
    };

    const updatedUser = await update(userProfile.value.id, updateData);
    
    if (updatedUser) {
      if (userProfile.value) {
        userProfile.value = { ...userProfile.value, ...updateData };
      }
      
      if (editFieldName.value in mainStore) {
        mainStore.updateUserData(updateData);
      }
      
      successMessage.value = 'Данные успешно обновлены';
      editDialog.value = false;
    }
  } catch (err) {
    console.error('Ошибка при обновлении:', err);
    errorMessage.value = 'Не удалось обновить данные. Пожалуйста, попробуйте позже.';
  } finally {
    isSaving.value = false;
  }
};

// Форматирование названия группы компетенций
const formatGroupName = (group: CompetenceGroup): string => {
  const names: Record<CompetenceGroup, string> = {
    LANGUAGES: 'Языки',
    FRAMEWORKS: 'Фреймворки',
    DATABASES: 'Базы данных',
    DEVOPS: 'DevOps',
    TESTING: 'Тестирование',
    DESIGN: 'Дизайн',
    MOBILE: 'Мобильные'
  };
  return names[group] || group;
};

// Фильтрация компетенций по поиску и группе
const filteredCompetences = (group: CompetenceGroup): Competence[] => {
  const searchTerm = competenceSearch.value.toLowerCase();
  
  // Приводим тип к Competence[] и работаем с ним
  const groupCompetences = Array.from(Competencies[group]) as Competence[];
  
  return groupCompetences
    .filter((comp: Competence) => 
      comp.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: string, b: string) => a.localeCompare(b));
};

// Переключение выбора компетенции
const toggleCompetence = (competence: Competence) => {
  const index = selectedCompetences.value.indexOf(competence);
  if (index === -1) {
    selectedCompetences.value.push(competence);
  } else {
    selectedCompetences.value.splice(index, 1);
  }
};

// Открытие диалога редактирования компетенций
const editCompetences = () => {
  selectedCompetences.value = [...(userProfile.value?.competence || [])];
  competenceSearch.value = '';
  activeCompetenceTab.value = 'LANGUAGES';
  competencesDialog.value = true;
};

// Сохранение компетенций
const saveCompetences = async () => {
  if (!userProfile.value) return;

  isSavingCompetences.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const updateData = {
      competence: selectedCompetences.value
    };

    const updatedUser = await update(userProfile.value.id, updateData);
    
    if (updatedUser && userProfile.value) {
      userProfile.value.competence = selectedCompetences.value;
      successMessage.value = 'Компетенции успешно обновлены';
      competencesDialog.value = false;
    }
  } catch (err) {
    console.error('Ошибка при обновлении компетенций:', err);
    errorMessage.value = 'Не удалось обновить компетенции. Пожалуйста, попробуйте позже.';
  } finally {
    isSavingCompetences.value = false;
  }
};

// Форматирование телефона
const formatPhone = (phone?: string) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
};

// Остальные функции
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
    .filter(item => item.team) // Фильтруем только записи с командами
    .map(item => ({
      id: item.id,
      team: {
        id: item.team.id,
        name: item.team.name || 'Команда без названия',
        status: item.team.status,
        user_leader: item.team.user_leader,
        user_owner: item.team.user_owner
      },
      entryDate: new Date(item.entryDate),
      exclusionDate: item.exclusionDate ? new Date(item.exclusionDate) : undefined,
      recordStatus: item.status // Используем статус из портфолио
    }))
    .sort((a, b) => b.entryDate.getTime() - a.entryDate.getTime());
});

const getRoleInTeam = (team: { id: number; user_leader?: { id: number }; user_owner?: { id: number } }) => {
  if (!userProfile.value) return 'Участник';
  
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
  console.log('Начало загрузки профиля...');
  if (mainStore.userId) {
    try {
      console.log('Загрузка данных профиля для userId:', mainStore.userId);
      isLoading.value = true;
      error.value = '';
      
      // 1. Загружаем профиль
      console.log('Загрузка профиля через profileStore...');
      await profileStore.fetchUserProfile(mainStore.userId);
      console.log('Профиль загружен:', userProfile.value);
      
      // 2. Загружаем все портфолио
      console.log('Загрузка всех портфолио...');
      isPortfolioLoading.value = true;
      const allPortfolios = await PortfolioGetAll();
      console.log('Все портфолио загружены:', allPortfolios);
      
      // 3. Фильтруем портфолио текущего пользователя
      console.log('Фильтрация портфолио для текущего пользователя...');
      const userPortfolios = allPortfolios.filter(
        p => p.user?.id === mainStore.userId
      );
      console.log('Отфильтрованные портфолио:', userPortfolios);
      
      if (userProfile.value) {
        userProfile.value.portfolio = userPortfolios;
        console.log('Обновлённый userProfile с портфолио:', userProfile.value);
      }
      
      // 4. Проверка данных перед отображением
      console.log('Проверка перед отображением:');
      console.log('userProfile существует:', !!userProfile.value);
      console.log('portfolio существует:', !!userProfile.value?.portfolio);
      console.log('Количество записей:', userProfile.value?.portfolio?.length || 0);
      
    } catch (err) {
      console.error('Ошибка загрузки профиля:', err);
      error.value = 'Не удалось загрузить данные профиля';
    } finally {
      isLoading.value = false;
      isPortfolioLoading.value = false;
      console.log('Загрузка завершена');
    }
  } else {
    console.warn('userId не установлен, пропускаем загрузку');
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

.profile-layout {
  display: flex;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.left-column {
  width: 350px;
  flex-shrink: 0;
}

.right-column {
  flex: 1;
  min-width: 0;
}

.avatar-section {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
  
  .profile-avatar {
    margin-bottom: 16px;
    background: #f5f5f5;
  }
  
  .user-name {
    font-size: 20px;
    font-weight: 500;
    margin-bottom: 4px;
  }
  
  .user-email {
    font-size: 14px;
  }
}

.info-card {
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
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
  width: 120px;
  color: #555;
}

.info-value {
  flex: 1;
  padding: 0 10px;
}

.edit-btn {
  color: var(--q-primary);
}

.section-card {
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
}

.portfolio-table {
  width: 100%;
}

.competence-panel {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .profile-layout {
    flex-direction: column;
  }
  
  .left-column {
    width: 100%;
  }
}
</style>