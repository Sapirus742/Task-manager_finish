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
                mask="+#(###)-###-##-##"
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

            <!-- Идеи -->
            <q-card class="section-card q-mt-md">
              <q-card-section>
                <div class="row items-center justify-between">
                  <div class="text-h6">Идеи</div>
                </div>
                <q-separator class="q-my-sm" />

                <div v-if="isIdeasLoading" class="text-center q-pa-md">
                  <q-spinner size="md" color="primary" />
                  <div>Загрузка идей...</div>
                </div>

                <div v-else-if="ideasError" class="text-center q-pa-md text-negative">
                  <q-icon name="error" size="md" />
                  <div class="q-mt-md">{{ ideasError }}</div>
                </div>

                <div v-else-if="!ideas.length" class="text-grey q-pa-md text-center">
                  Нет данных об идеях
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
                  <template v-slot:body-cell-status="props: { row: IdeaDto }">
                    <q-td :props="props">
                      <q-badge 
                        :color="getIdeaStatusColor(props.row.status)"
                        :label="formatIdeaStatus(props.row.status)" 
                      />
                    </q-td>
                  </template>

                  <template v-slot:body-cell-createdAt="props: { row: IdeaDto }">
                    <q-td :props="props">
                      <div>{{ formatDate(props.row.createdAt) }}</div>
                    </q-td>
                  </template>

                </q-table>
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

                <template v-slot:body-cell-status="props: { row: PortfolioTableRow }">
                  <q-td :props="props">
                    <q-badge 
                      :color="getStatusBadgeColor(props.row)"
                      :label="getStatusText(props.row)" 
                    />
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
import { computed, ref} from 'vue';
import { storeToRefs } from 'pinia';
import { useProfileStore } from 'src/stores/profile-store';
import { useMainStore } from 'src/stores/main-store';
import { 
  Role,
  StatusTeam,
  Competencies,
  UserCommandStatus,
  StatusIdea,
  IdeaDto,
  type Competence,
  type CompetenceGroup
} from '../../../backend/src/common/types';
import { update } from '../api/users.api';
import { QTableProps, useQuasar  } from 'quasar';
import {getAll as PortfolioGetAll} from '../api/portfolio.api';
import {getAll as IdeaGetAll} from '../api/idea.api';

const isOpen = ref(false);
const isPortfolioLoading = ref(false);
const mainStore = useMainStore();
const profileStore = useProfileStore();
const $q = useQuasar();
const ideas = ref<IdeaDto[]>([]);
const isIdeasLoading = ref(false);
const ideasError = ref<string | null>(null);

const { userProfile, isLoading, error } = storeToRefs(profileStore);

// Аватар
const avatarImage = ref<string>('');

// Функция для получения аватара на основе ролей
const getAvatarByRoles = (roles: Role[]): string => {
  if (roles.includes(Role.admin) || roles.includes(Role.directorate)) {
    return '/ava/2.png'; // Аватар для админов и дирекции
  }
  if (roles.includes(Role.expert) || roles.includes(Role.customer)) {
    return '/ava/3.png'; // Аватар для экспертов и заказчиков
  }
  return '/ava/1.png'; // Аватар для обычных пользователей
};

interface PortfolioTableRow {
  id: number;
  team: {
    id: number | null;
    name: string | null;
    status?: StatusTeam | null;
    user_leader?: { id: number } | null;
    user_owner?: { id: number } | null;
    exists?: boolean; // Флаг существования команды
  } | null;
  entryDate: Date;
  exclusionDate?: Date | null;
  recordStatus: UserCommandStatus;
  userStatusInTeam?: 'active' | 'expelled' | 'team_deleted'; // Дополнительный статус
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

// Колонки для таблицы идей
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

// Функция форматирования статуса
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

// Функция для цвета статуса
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

// Метод для загрузки идей
const loadIdeas = async () => {
  try {
    isIdeasLoading.value = true;
    ideasError.value = null;
    
    // Загружаем все идеи и фильтруем по текущему пользователю
    const allIdeas = await IdeaGetAll();
    ideas.value = allIdeas.filter(idea => 
      idea.initiator.id === mainStore.userId
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

type EditableField = 'email' | 'firstname' | 'lastname' | 'group' | 'telephone';

// Редактирование полей
const editDialog = ref(false);
const editFieldName = ref<EditableField>('email');
const editFieldLabel = ref('');
const editValue = ref('');
const isSaving = ref(false);
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

  if (editFieldName.value === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editValue.value.trim())) {
      $q.notify({
        type: 'negative',
        message: 'Введите корректный email (например: user@example.com)',
        position: 'top'
      });
      return;
    }
  }

  isSaving.value = true;

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
      
      $q.notify({
        type: 'positive',
        message: 'Данные успешно обновлены',
        position: 'top',
        timeout: 2000
      });
      editDialog.value = false;
    }
  } catch (err) {
    console.error('Ошибка при обновлении:', err);
    $q.notify({
      type: 'negative',
      message: 'Не удалось обновить данные. Пожалуйста, попробуйте позже.',
      position: 'top'
    });
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

  try {
    const updateData = {
      competence: selectedCompetences.value
    };

    const updatedUser = await update(userProfile.value.id, updateData);
    
    if (updatedUser && userProfile.value) {
      userProfile.value.competence = selectedCompetences.value;
      $q.notify({
        type: 'positive',
        message: 'Компетенции успешно обновлены',
        position: 'top',
        timeout: 2000
      });
      competencesDialog.value = false;
    }
  } catch (err) {
    console.error('Ошибка при обновлении компетенций:', err);
    $q.notify({
      type: 'negative',
      message: 'Не удалось обновить компетенции. Пожалуйста, попробуйте позже.',
      position: 'top'
    });
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

      // Устанавливаем аватар на основе ролей
      if (userProfile.value?.roles) {
        avatarImage.value = getAvatarByRoles(userProfile.value.roles);
      }
      
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

      // 5. Загружаем идеи
      console.log('Загрузка идей пользователя...');
      await loadIdeas();
      
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
  background: white;
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

.edit-btn {
  color: var(--q-primary);
  padding: 4px;
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

.competence-panel {
  max-height: 200px;
  overflow-y: auto;
  padding: 6px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
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
</style>