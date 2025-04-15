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

        <div v-else-if="userProfile" class="profile-info-container">
          <!-- Основная информация -->
          <div class="info-section">
            <div class="info-row">
              <span class="info-label">Почта:</span>
              <span class="info-value">{{ userProfile.email }}</span>
              <q-btn flat dense icon="edit" class="edit-btn" @click="editField('email')"/>
            </div>

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
          </div>

          <!-- Дополнительные разделы -->
          <div class="additional-sections">
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
                <div class="text-h6">История команд</div>
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
                      </div>
                    </q-card-section>
                  </q-expansion-item>
                </div>
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
  UserCommandStatus,
  StatusTeam,
  type TeamDto,
  Competencies,
  type Competence,
  type CompetenceGroup
} from '../../../backend/src/common/types';
import { update } from '../api/users.api';

const isOpen = ref(false);
const mainStore = useMainStore();
const profileStore = useProfileStore();

const { userProfile, isLoading, error } = storeToRefs(profileStore);

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
    [StatusTeam.delete]: 'Удалена',
    [StatusTeam.joinProject]: 'Подана на проект'
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
    console.log('[Profile] Загрузка профиля для пользователя ID:', mainStore.userId);
    profileStore.fetchUserProfile(mainStore.userId)
      .then(() => console.log('[Profile] Профиль успешно загружен'))
      .catch(err => console.error('[Profile] Ошибка загрузки профиля:', err));
  } else {
    console.warn('[Profile] Не удалось загрузить профиль: userId не установлен');
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

.profile-info-container {
  max-width: 800px;
  margin: 0 auto;
}

.info-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
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
  width: 180px;
  color: #555;
}

.info-value {
  flex: 1;
  padding: 0 10px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.edit-btn {
  color: var(--q-primary);
}

.section-card {
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.1);
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

.competence-panel {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}
</style>