<template>
  <q-dialog 
    v-model="showDialog"
    @update:model-value="val => !val && closeDialog()"
  >
    <q-card class="project-details-card">
      <q-card-section>
        <div class="project-header">
          <div class="project-title-wrapper">
            <h2 
              v-if="editingField !== 'name'"
              class="text-h5 text-weight-bold q-mb-sm project-title editable"
              @click="canEdit && startEditing('name', project?.name || '')"
            >
              {{ project?.name }}
            </h2>
            <q-input
              v-else
              v-model="tempValue"
              class="editing-field"
              outlined
              dense
              @blur="stopEditing"
              @keyup.enter="stopEditing"
            />
            <q-badge 
              :color="getStatusColor(project?.status)" 
              class="status-badge"
            >
              {{ getStatusLabel(project?.status) }}
            </q-badge>
          </div>

          <div class="project-meta">
            <div class="initiator-section"
                 @click="project?.initiator?.id && openUserProfile(project.initiator.id)">
              <q-icon name="person" size="sm" class="q-mr-xs" />
              <span class="text-weight-medium"> Инициатор:&nbsp;</span>
              <span>{{ project?.initiator?.firstname }} {{ project?.initiator?.lastname }}</span>
            </div>

            <div class="date-section">
              <q-icon name="event" size="sm" class="q-mr-xs" />
              <span v-if="editingField !== 'startProject' && editingField !== 'stopProject'">
                <span 
                  class="editable"
                  @click="canEdit && startEditing('startProject', formatDate(project?.startProject))"
                >
                  {{ formatDate(project?.startProject) }}
                </span>
                —
                <span 
                  class="editable"
                  @click="canEdit && startEditing('stopProject', formatDate(project?.stopProject))"
                >
                  {{ formatDate(project?.stopProject) }}
                </span>
              </span>
              <div v-else class="row q-gutter-sm">
                <q-date 
                  v-if="editingField === 'startProject'"
                  v-model="tempValue"
                  mask="YYYY-MM-DD"
                  @update:model-value="stopEditing"
                />
                <q-date 
                  v-if="editingField === 'stopProject'"
                  v-model="tempValue"
                  mask="YYYY-MM-DD"
                  @update:model-value="stopEditing"
                />
              </div>
            </div>
          </div>
        </div>

        <q-tabs 
          v-model="tab" 
          dense
          class="q-mt-md"
          active-color="primary"
          indicator-color="primary"
          align="left"
        >
          <q-tab name="description" label="Описание" />
          <q-tab name="team" label="Команда" />
          <q-tab name="details" label="Детали" />
        </q-tabs>

        <q-separator />

        <div class="panels-container">
          <q-tab-panels v-model="tab" animated>
            <!-- Вкладка Описание -->
            <q-tab-panel name="description">
              <div class="description-section">
                <div class="detail-block">
                  <h3 class="section-title">Проблема</h3>
                  <div
                    v-if="editingField !== 'problem'"
                    class="section-content editable"
                    @click="canEdit && startEditing('problem', project?.problem || '')"
                    v-html="project?.problem || 'Не указана'"
                  ></div>
                  <q-input
                    v-else
                    v-model="tempValue"
                    type="textarea"
                    autogrow
                    outlined
                    dense
                    @blur="stopEditing"
                    @keyup.enter="stopEditing"
                  />
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Решение</h3>
                  <div
                    v-if="editingField !== 'solution'"
                    class="section-content editable"
                    @click="canEdit && startEditing('solution', project?.solution || '')"
                    v-html="project?.solution || 'Не указано'"
                  ></div>
                  <q-input
                    v-else
                    v-model="tempValue"
                    type="textarea"
                    autogrow
                    outlined
                    dense
                    @blur="stopEditing"
                    @keyup.enter="stopEditing"
                  />
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Ожидаемый результат</h3>
                  <div
                    v-if="editingField !== 'result'"
                    class="section-content editable"
                    @click="canEdit && startEditing('result', project?.result || '')"
                    v-html="project?.result || 'Не указан'"
                  ></div>
                  <q-input
                    v-else
                    v-model="tempValue"
                    type="textarea"
                    autogrow
                    outlined
                    dense
                    @blur="stopEditing"
                    @keyup.enter="stopEditing"
                  />
                </div>
              </div>
            </q-tab-panel>

            <!-- Вкладка Команда -->
            <q-tab-panel name="team">
              <div class="team-section">
                <h3 class="section-title q-mb-md">Заявки от команд</h3>
                
                <template v-if="teamStore.isLoading">
                  <div class="loading-state">
                    <q-spinner color="primary" size="3em" />
                    <div>Загрузка данных о командах...</div>
                  </div>
                </template>
                
                <template v-else>
                  <q-list bordered separator v-if="pendingTeams.length > 0" class="team-list">
                    <q-item
                      v-for="team in pendingTeams"
                      :key="team.id"
                      clickable
                      class="pending-team-item"
                      @click="openTeamDetailsDialog(team)"
                    >
                      <q-item-section>
                        <q-item-label class="team-name">{{ team.name }}</q-item-label>
                        <q-item-label caption class="team-description">{{ team.description }}</q-item-label>
                      </q-item-section>
                      
                      <q-item-section side v-if="canApproveTeam">
                        <q-btn 
                          label="Выбрать" 
                          color="positive" 
                          size="sm"
                          @click.stop="approveTeam(team)"
                        />
                      </q-item-section>
                    </q-item>
                  </q-list>
                  
                  <template v-if="currentTeam && project?.status === StatusProject.teamFound">
                    <div class="current-team-section">
                      <h4 class="section-title">Текущая команда проекта</h4>
                      
                      <div class="detail-block q-mb-md">
                        <div class="team-meta">
                          <q-icon name="groups" class="q-mr-sm" />
                          <span class="text-weight-medium">Название:</span>
                          <span>{{ currentTeam.name }}</span>
                        </div>
                        
                        <div class="team-tags q-mt-sm">
                          <q-chip size="sm" :color="currentTeam.privacy === 'Close' ? 'negative' : 'positive'" text-color="white">
                            {{ currentTeam.privacy === 'Close' ? 'Закрытая' : 'Открытая' }}
                          </q-chip>
                          <q-chip size="sm" color="info" text-color="white">
                            {{ currentTeam.status }}
                          </q-chip>
                        </div>
                      </div>
                      
                      <div class="detail-block" v-if="currentTeam.description">
                        <h4 class="section-title">Описание команды</h4>
                        <p class="section-content">{{ currentTeam.description }}</p>
                      </div>

                      <q-btn
                        label="Просмотреть команду"
                        color="primary"
                        @click="openTeamDetailsDialog(currentTeam)"
                        class="q-mt-md"
                      />
                    </div>
                  </template>
                  
                  <div v-else-if="pendingTeams.length === 0" class="empty-state">
                    <q-icon name="info" size="sm" />
                    <span>Нет заявок от команд</span>
                  </div>

                  <q-btn
                    v-if="(canApplyToProject || mainStore.isAdmin() || mainStore.isDirectorate()) && PrSt"
                    label="Подать заявку на проект"
                    color="primary"
                    @click="applyToProject"
                    class="q-ml-sm"
                  />   
                </template>
              </div>
            </q-tab-panel>

            <!-- Вкладка Детали -->
            <q-tab-panel name="details">
              <div class="details-section">
                <div class="detail-block">
                  <h3 class="section-title">Технологии</h3>
                  <div class="tech-stack">
                    <template v-if="project?.stack?.length">
                      <q-chip 
                        v-for="tech in project.stack" 
                        :key="tech" 
                        color="primary" 
                        text-color="white" 
                        size="sm"
                        class="tech-tag"
                      >
                        {{ tech }}
                      </q-chip>
                    </template>
                    <span v-else class="text-grey">Не указаны</span>
                  </div>
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Ресурсы</h3>
                  <div
                    v-if="editingField !== 'resource'"
                    class="section-content editable"
                    @click="canEdit && startEditing('resource', project?.resource || '')"
                    v-html="project?.resource || 'Не указаны'"
                  ></div>
                  <q-input
                    v-else
                    v-model="tempValue"
                    type="textarea"
                    autogrow
                    outlined
                    dense
                    @blur="stopEditing"
                    @keyup.enter="stopEditing"
                  />
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Заказчик</h3>
                  <div
                    v-if="editingField !== 'customer'"
                    class="section-content editable"
                    @click="canEdit && startEditing('customer', project?.customer || '')"
                    v-html="project?.customer || 'Не указан'"
                  ></div>
                  <q-input
                    v-else
                    v-model="tempValue"
                    type="textarea"
                    outlined
                    dense
                    @blur="stopEditing"
                    @keyup.enter="stopEditing"
                  />
                </div>
                
                <div class="detail-block">
                  <h3 class="section-title">Участники</h3>
                  <div
                    v-if="editingField !== 'maxUsers'"
                    class="section-content editable"
                    @click="canEdit && startEditing('maxUsers', project?.maxUsers || '')"
                    v-html="project?.maxUsers || 'Не указано'"
                  ></div>
                  <q-input
                    v-else
                    v-model="tempValue"
                    type="number"
                    outlined
                    dense
                    @blur="stopEditing"
                    @keyup.enter="stopEditing"
                  />
                </div>
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </div>
      </q-card-section>

      <q-card-actions class="footer-actions">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Диалог подтверждения выбора команды -->
  <q-dialog v-model="showConfirmDialog" persistent>
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">Подтверждение выбора команды</div>
      </q-card-section>

      <q-card-section>
        <p>Вы собираетесь выбрать команду <strong>"{{ selectedTeamForApproval?.name }}"</strong> для проекта.</p>
        
        <template v-if="mismatchReasons.length > 0">
          <div class="text-negative q-mt-md">
            <p><strong>Обратите внимание:</strong></p>
            <ul>
              <li v-for="(reason, index) in mismatchReasons" :key="index">
                {{ reason }}
              </li>
            </ul>
          </div>
          
          <p class="q-mt-md">Вы уверены, что хотите выбрать эту команду, несмотря на несоответствие?</p>
        </template>
        <template v-else>
          <p class="q-mt-md">Вы уверены, что хотите выбрать эту команду?</p>
        </template>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="primary" v-close-popup />
        <q-btn 
          flat 
          label="Подтвердить выбор" 
          color="positive" 
          @click="confirmTeamApproval"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Диалог просмотра команды -->
  <q-dialog v-model="showTeamDetails" persistent>
    <q-card class="team-details-card glossy-card" v-if="selectedTeam" style="max-width: 800px; width: 100%">
        <q-card-section class="team-header bg-primary text-white">
          <div class="row items-center justify-between">
            <div class="text-h4 text-weight-bold">Профиль команды</div>
            <q-btn 
              icon="close" 
              flat 
              round 
              dense 
              v-close-popup 
              class="close-btn"
            />
          </div>
        </q-card-section>

        <q-card-section class="team-content q-pa-lg">
          <div v-if="selectedTeam" class="single-column-layout">
            <!-- Основная информация в красивом контейнере -->
            <div class="info-container q-mb-md">
              <div class="row q-col-gutter-md">
                <!-- Блок с основной информацией -->
                <div class="col-md-6 col-sm-12">
                  <q-card class="info-card elevated-card" flat bordered>
                    <q-card-section>
                      <div class="text-h5 text-primary q-mb-md">Основная информация</div>
                      
                      <div class="info-grid q-gutter-y-md">
                        <div class="info-item">
                          <q-icon name="lock" size="sm" class="q-mr-sm"/>
                          <span class="text-weight-medium">Приватность:</span>
                          <q-chip
                            :color="selectedTeam.privacy === PrivacyTeam.close ? 'deep-orange' : 'teal'"
                            text-color="white"
                            size="md"
                            class="q-ml-sm"
                          >
                            {{ selectedTeam.privacy === PrivacyTeam.close ? 'Закрытая' : 'Открытая' }}
                          </q-chip>
                        </div>

                        <div class="info-item">
                          <q-icon name="flag" size="sm" class="q-mr-sm"/>
                          <span class="text-weight-medium">Статус:</span>
                          <q-chip
                            :color="getTeamStatusColor(selectedTeam.status)"
                            text-color="white"
                            size="md"
                            class="q-ml-sm"
                          >
                            {{ selectedTeam.status }}
                          </q-chip>
                        </div>

                        <div class="info-item">
                          <q-icon name="people" size="sm" class="q-mr-sm"/>
                          <span class="text-weight-medium">Участников:</span>
                          <span class="text-h6 text-primary q-ml-sm">{{ getUniqueMembersCount(selectedTeam) }}</span>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>

                <!-- Блок с компетенциями -->
                <div class="col-md-6 col-sm-12" v-if="getTeamCompetencies(selectedTeam).length > 0">
                  <q-card class="competencies-card elevated-card" flat bordered>
                    <q-card-section>
                      <div class="text-h5 text-primary q-mb-md">Компетенции</div>
                      <div class="competencies-container q-gutter-sm">
                        <q-chip
                          v-for="(competency, index) in getTeamCompetencies(selectedTeam)"
                          :key="index"
                          color="accent"
                          text-color="white"
                          size="md"
                          class="shadow-1"
                        >
                          <q-avatar color="white" text-color="accent" size="sm" class="q-mr-sm">
                            {{ competency[0] }}
                          </q-avatar>
                          {{ competency }}
                        </q-chip>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </div>

            <!-- Описание команды -->
            <q-card class="description-card elevated-card q-mb-md" flat bordered>
              <q-card-section>
                <div class="text-h5 text-primary q-mb-sm">О команде</div>
                <q-separator color="primary" class="q-mb-md"/>
                <div class="team-description" :class="{ 'text-grey-6': !selectedTeam.description }">
                  {{ selectedTeam.description || 'Команда пока не добавила описание' }}
                </div>
              </q-card-section>
            </q-card>

            <!-- Участники команды -->
            <q-card class="members-card elevated-card" flat bordered>
              <q-card-section>
                <div class="text-h5 text-primary">Участники</div>
                <q-separator color="primary" class="q-mb-md"/>

                <div class="members-list q-gutter-y-md">
                  <!-- Владелец -->
                  <div v-if="selectedTeam.user_owner" class="member-item owner row items-center q-pa-sm rounded-borders"
                      @click="openUserProfile(selectedTeam.user_owner.id)">
                    <q-avatar size="lg" class="q-mr-md" color="teal" text-color="white">
                      {{ selectedTeam.user_owner.firstname[0] }}{{ selectedTeam.user_owner.lastname[0] }}
                    </q-avatar>
                    <div class="member-info column">
                      <div class="member-name text-h6">
                        {{ selectedTeam.user_owner.firstname }} {{ selectedTeam.user_owner.lastname }}
                        <q-badge color="teal" class="q-ml-sm">Владелец</q-badge>
                        <q-badge v-if="isLeaderAlsoOwner(selectedTeam)" color="primary" class="q-ml-sm">Тимлид</q-badge>
                      </div>
                      <div class="member-contacts row q-gutter-x-md q-mt-xs">
                        <div v-if="selectedTeam.user_owner.email" class="member-contact row items-center">
                          <q-icon name="email" size="sm" class="q-mr-xs"/>
                          <span>{{ selectedTeam.user_owner.email }}</span>
                        </div>
                        <div v-if="selectedTeam.user_owner.telephone" class="member-contact row items-center">
                          <q-icon name="phone" size="sm" class="q-mr-xs"/>
                          <span>{{ formatPhone(selectedTeam.user_owner.telephone) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Тимлид (если не владелец) -->
                  <div v-if="selectedTeam.user_leader && !isLeaderAlsoOwner(selectedTeam)" 
                      class="member-item leader row items-center q-pa-sm rounded-borders"
                      @click="openUserProfile(selectedTeam.user_leader.id)">
                    <q-avatar size="lg" class="q-mr-md" color="primary" text-color="white">
                      {{ selectedTeam.user_leader.firstname[0] }}{{ selectedTeam.user_leader.lastname[0] }}
                    </q-avatar>
                    <div class="member-info column">
                      <div class="member-name text-h6">
                        {{ selectedTeam.user_leader.firstname }} {{ selectedTeam.user_leader.lastname }}
                        <q-badge color="primary" class="q-ml-sm">Тимлид</q-badge>
                      </div>
                      <div class="member-contacts row q-gutter-x-md q-mt-xs">
                        <div v-if="selectedTeam.user_leader.email" class="member-contact row items-center">
                          <q-icon name="email" size="sm" class="q-mr-xs"/>
                          <span>{{ selectedTeam.user_leader.email }}</span>
                        </div>
                        <div v-if="selectedTeam.user_leader.telephone" class="member-contact row items-center">
                          <q-icon name="phone" size="sm" class="q-mr-xs"/>
                          <span>{{ formatPhone(selectedTeam.user_leader.telephone) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Обычные участники -->
                  <div v-for="user in getRegularMembers(selectedTeam)" 
                      :key="user.id" 
                      class="member-item row items-center q-pa-sm rounded-borders"
                      @click.stop="openUserProfile(user.id)">
                    <q-avatar size="lg" class="q-mr-md" color="grey-4" text-color="dark">
                      {{ user.firstname[0] }}{{ user.lastname[0] }}
                    </q-avatar>
                    <div class="member-info column">
                      <div class="member-name text-subtitle1">
                        {{ user.firstname }} {{ user.lastname }}
                      </div>
                      <div class="member-contacts row q-gutter-x-md q-mt-xs">
                        <div v-if="user.email" class="member-contact row items-center">
                          <q-icon name="email" size="sm" class="q-mr-xs"/>
                          <span>{{ user.email }}</span>
                        </div>
                        <div v-if="user.telephone" class="member-contact row items-center">
                          <q-icon name="phone" size="sm" class="q-mr-xs"/>
                          <span>{{ formatPhone(user.telephone) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Пустое состояние -->
                  <div v-if="selectedTeam.user.length === 0 && 
                            (!selectedTeam.user_owner || !selectedTeam.user_leader)" 
                      class="empty-state text-grey-6 text-center q-pa-lg">
                    <q-icon name="people_outline" size="xl"/>
                    <div class="text-h6 q-mt-sm">Нет участников</div>
                  </div>
                </div>
              </q-card-section>
            </q-card>
          </div>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md bg-grey-1"> 
          <q-btn flat label="Закрыть" color="grey" v-close-popup icon="close"/>
        </q-card-actions>
      </q-card>
  </q-dialog>

  <q-dialog v-model="showTeamSelectionDialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section>
        <div class="text-h6">Выберите команду для подачи заявки</div>
      </q-card-section>

      <q-card-section>
        <q-list bordered separator>
          <q-item 
            v-for="team in userOwnedTeams" 
            :key="team.id"
            clickable
            :disable="!isTeamAvailableForApplication(team)"
            @click="selectTeamForApplication(team)"
          >
            <q-item-section>
              <q-item-label>{{ team.name }}</q-item-label>
              <q-item-label caption>
                <span :class="getTeamStatusClass(team)">
                  {{ getTeamStatusText(team) }}
                </span>
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <q-icon 
                :name="isTeamAvailableForApplication(team) ? 'check_circle' : 'block'" 
                :color="isTeamAvailableForApplication(team) ? 'positive' : 'negative'"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Отмена" color="negative" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  
  <teleport to="body">
    <UserProfileOpen 
      v-if="selectedUserId" 
      :key="selectedUserId"
      :userId="selectedUserId" 
      v-model="isProfileOpen"
    />
  </teleport>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import { StatusProject, StatusTeam,  PrivacyTeam, UserAccountStatus } from '../../../../backend/src/common/types';
import type { ProjectDto, TeamDto, UpdateProjectDto } from '../../../../backend/src/common/types';
import { useTeamStore } from 'src/stores/team-store';
import { useQuasar } from 'quasar';
import { useMainStore } from 'src/stores/main-store';
import { update as updateTeam, get as getTeam} from 'src/api/team.api'; 
import { update as updateProject, get as getProject} from 'src/api/project.api'; 
import UserProfileOpen from 'src/pages/UserProfileOpen.vue';

const $q = useQuasar();
const showDialog = ref(false);
const project = ref<ProjectDto>();
const tab = ref('description');
const maxHeight = ref(0);
const teamStore = useTeamStore();
const mainStore = useMainStore();

// Редактирование "на лету"

const tempValue = ref<string>('');

const canEdit = computed(() => {
  if (!project.value || !mainStore.userId) return false;
  return project.value.initiator.id === mainStore.userId || 
         mainStore.isAdmin() || 
         mainStore.isDirectorate();
});

type EditableProjectFields = keyof UpdateProjectDto;
const editingField = ref<EditableProjectFields | null>(null);

const startEditing = (field: EditableProjectFields, value: string) => {
  if (!canEdit.value) return;
  editingField.value = field;
  tempValue.value = value;
};

const stopEditing = async () => {
  if (!editingField.value || !project.value) return;

  try {
    const updateData: Partial<UpdateProjectDto> = {}; // Use Partial to make all fields optional
    
    // Special handling for date fields
    if (editingField.value === 'startProject' || editingField.value === 'stopProject') {
      updateData[editingField.value] = new Date(tempValue.value);
    } else {
      // For other fields, we need to ensure the type matches
      const field = editingField.value as Exclude<EditableProjectFields, 'startProject' | 'stopProject'>;
      (updateData as Record<string, string | number>)[field] = tempValue.value;
    }

    if (project.value.id) {
      const updatedProject = await updateProject(project.value.id, updateData);
      if (updatedProject) {
        project.value = updatedProject;
      }
    }
  } catch (error) {
    console.error('Ошибка при обновлении проекта:', error);
    $q.notify({
      message: 'Ошибка при сохранении изменений',
      color: 'negative'
    });
  } finally {
    editingField.value = null;
    tempValue.value = '';
  }
};

const selectedUserId = ref<number | null>(null);
const isProfileOpen = ref(false);

const showTeamSelectionDialog = ref(false);
const selectedTeamForApplication = ref<TeamDto | null>(null);

const openUserProfile = (userId: number) => {
  selectedUserId.value = userId;
  isProfileOpen.value = true;
};

const showConfirmDialog = ref(false);
const selectedTeamForApproval = ref<TeamDto | null>(null);
const mismatchReasons = ref<string[]>([]);

const showTeamDetails = ref(false);
const selectedTeam = ref<TeamDto | null>(null);

const currentTeam = computed<TeamDto | null>(() => {
  if (teamStore.currentTeam) return teamStore.currentTeam;
  return project.value?.teams?.[0] || null;
});

const getStatusLabel = (status?: string) => {
  switch (status) {
    case StatusProject.searchTeam: return 'Поиск команды';
    case StatusProject.teamFound: return 'Команда найдена';
    case StatusProject.selectionTeam: return 'Отбор команды';
    case StatusProject.draft: return 'Черновик';
    default: return status || 'Неизвестно';
  }
};

const getTeamStatusColor = (status: StatusTeam) => {
  switch (status) {
    case StatusTeam.inProgress: return 'positive';
    case StatusTeam.searchProject: return 'info';
    case StatusTeam.joinProject: return 'warning';
    case StatusTeam.delete: return 'negative';
    default: return 'grey';
  }
};

const isLeaderAlsoOwner = (team: TeamDto): boolean => {
  if (!team.user_leader || !team.user_owner) return false;
  return team.user_leader.id === team.user_owner.id;
};

const formatPhone = (phone?: string): string => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1,3})(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
  }
  return phone;
};

const getTeamCompetencies = (team: TeamDto): string[] => {
  const competencies = new Set<string>();
  
  if (team.user_owner?.competence?.length) {
    team.user_owner.competence.forEach(c => competencies.add(c));
  }
  
  if (team.user_leader?.competence?.length) {
    team.user_leader.competence.forEach(c => competencies.add(c));
  }
  
  team.user?.forEach(member => {
    if (member.competence?.length) {
      member.competence.forEach(c => competencies.add(c));
    }
  });
  
  return Array.from(competencies);
};

const getUniqueMembersCount = (team: TeamDto): number => {
  const members = new Set<number>();
  if (team.user_owner?.id) members.add(team.user_owner.id);
  if (team.user_leader?.id) members.add(team.user_leader.id);
  team.user?.forEach(user => { if (user?.id && user.status !== UserAccountStatus.pending) members.add(user.id); });
  return members.size;
};

const pendingTeams = computed(() => {
  if (!project.value?.teams) return [];
  return project.value.teams.filter(t => {
    return t.status === StatusTeam.joinProject && 
           t.user && t.user_owner;
  });
});

const canApproveTeam = computed(() => {
  return project.value?.initiator.id === mainStore.userId;
});

const openTeamDetailsDialog = (team: TeamDto) => {
  selectedTeam.value = team;
  showTeamDetails.value = true;
};

const userOwnedTeams = computed(() => {
  const currentUser = mainStore.getCurrentUser();
  return currentUser.team_owner || [];
});

const isTeamAvailableForApplication = (team: TeamDto): boolean => {
  return (
    !team.project && 
    team.status !== StatusTeam.delete &&
    team.status === StatusTeam.searchProject
  );
};

const getTeamStatusText = (team: TeamDto): string => {
  if (team.project) {
    return `Уже привязана к проекту: ${team.project.name}`;
  }
  if (team.status === StatusTeam.delete) {
    return 'На удалении';
  }
  if (team.status === StatusTeam.inProgress) {
    return 'Уже работает над проектом';
  }
  if (team.status === StatusTeam.joinProject) {
    return 'Уже подана на другой проект';
  }
  return 'Доступна для подачи';
};

const getTeamStatusClass = (team: TeamDto): string => {
  if (!isTeamAvailableForApplication(team)) {
    return 'text-negative';
  }
  return 'text-positive';
};

const selectTeamForApplication = (team: TeamDto) => {
  if (!isTeamAvailableForApplication(team)) return;
  
  selectedTeamForApplication.value = team;
  showTeamSelectionDialog.value = false;
  confirmTeamApplication(team);
};

const confirmTeamApplication = async (team: TeamDto) => {
  const confirmed = await new Promise<boolean>((resolve) => {
    $q.dialog({
      title: 'Подтверждение подачи заявки',
      message: `Вы уверены, что хотите подать команду "${team.name}" на проект "${project.value?.name}"?`,
      persistent: true,
      ok: {
        label: 'Подать заявку',
        color: 'primary',
        flat: true
      },
      cancel: {
        label: 'Отмена',
        color: 'negative',
      }
    }).onOk(() => resolve(true)).onCancel(() => resolve(false));
  });

  if (!confirmed) return;

  try {
    await updateTeam(team.id, {
      project: project.value?.id,
      status: StatusTeam.joinProject
    });

    if (project.value?.id) {
      await updateProject(project.value.id, {
        status: StatusProject.selectionTeam
      });
    }

    $q.notify({
      message: 'Заявка успешно подана!',
      color: 'positive'
    });

    if (project.value?.id) {
      const updatedProject = await getProject(project.value.id);
      if (updatedProject) {
        project.value = updatedProject;
      }
    }

    if (teamStore.fetchTeam) {
      await teamStore.fetchTeam(team.id);
    }

  } catch (error) {
    console.error('Ошибка подачи заявки:', error);
    $q.notify({
      message: 'Ошибка подачи заявки',
      color: 'negative'
    });
  }
};

const PrSt = computed(() => {
  return project.value?.status === StatusProject.searchTeam;
});

const canApplyToProject = computed(() => {
  if (!project.value || project.value.status !== StatusProject.searchTeam) {
    return false;
  }

  const currentUser = mainStore.getCurrentUser();
  if (!currentUser.team_leader?.id) return false;
  if (!currentUser.team?.id) return false;
  console.log(currentUser.team_leader.id )

  const isTeamLeader = currentUser.team_leader.id === currentUser.team.id;
  const isAlreadyApplied = project.value.teams?.some(t => t.id === currentUser.team?.id);

  return (isTeamLeader && !isAlreadyApplied);
});

const applyToProject = async () => {
  if (!project.value) return;

  try {
    const currentUser = mainStore.getCurrentUser();

    if (currentUser.team_owner && currentUser.team_owner.length > 0) {
      showTeamSelectionDialog.value = true;
      return;
    }

    const currentTeam = currentUser.team;
    if (!currentTeam) {
      throw new Error('Команда не найдена');
    }

    const teamDetails = await getTeam(currentTeam.id);
    if (!teamDetails) {
      throw new Error('Не удалось загрузить данные команды');
    }

    if (teamDetails.user_leader?.id !== currentUser.id) {
      throw new Error('Только лидер команды может подавать заявки');
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      $q.dialog({
        title: 'Подтверждение подачи заявки',
        message: `Вы уверены, что хотите подать команду "${currentTeam.name}" на проект "${project.value?.name}"?`,
        persistent: true,
        ok: {
          label: 'Подать заявку',
          color: 'primary',
          flat: true
        },
        cancel: {
          label: 'Отмена',
          color: 'negative',
        }
      }).onOk(() => resolve(true)).onCancel(() => resolve(false));
    });

    if (!confirmed) return;

    await updateTeam(currentTeam.id, {
      project: project.value.id,
      status: StatusTeam.joinProject
    });

    await updateProject(project.value.id, {
      status: StatusProject.selectionTeam
    });

    $q.notify({
      message: 'Заявка успешно подана!',
      color: 'positive'
    });

    const updatedProject = await getProject(project.value.id);
    if (updatedProject) {
      project.value = updatedProject;
    }

    if (teamStore.fetchTeam) {
      await teamStore.fetchTeam(currentTeam.id);
    }

  } catch (error) {
    console.error('Ошибка подачи заявки:', error);
    $q.notify({
      message: 'Ошибка подачи заявки',
      color: 'negative'
    });
  }
};

const approveTeam = async (team: TeamDto) => {
  selectedTeamForApproval.value = team;
  mismatchReasons.value = [];
  
  if (project.value) {
    if (project.value.stack && project.value.stack.length > 0) {
      const teamTechs = getTeamCompetencies(team);
      const missingTechs = project.value.stack.filter(tech => 
        !teamTechs.includes(tech)
      );
      
      if (missingTechs.length > 0) {
        mismatchReasons.value.push(
          `Команда не имеет следующих требуемых технологий: ${missingTechs.join(', ')}`
        );
      }
    }
    
    if (project.value.maxUsers) {
      const maxUsers = parseInt(project.value.maxUsers);
      const teamSize = getUniqueMembersCount(team) || 0;
      
      if (!isNaN(maxUsers) && teamSize > maxUsers) {
        mismatchReasons.value.push(
          `В команде ${teamSize} участника (-ов), что превышает максимально допустимое количество (${maxUsers})`
        );
      }
    }
  }
  
  showConfirmDialog.value = true;
};

const confirmTeamApproval = async () => {
  if (!selectedTeamForApproval.value?.id || !project.value?.id) return;
  
  try {
    const otherTeams = project.value?.teams?.filter(t => 
      t.id !== selectedTeamForApproval.value?.id
    ) || [];
    
    await updateTeam(selectedTeamForApproval.value.id, { 
      status: StatusTeam.inProgress 
    });
    
    await Promise.all(otherTeams.map(async team => {
      try {
        await updateTeam(team.id, {
          status: StatusTeam.searchProject,
          project: null
        });
      } catch (error) {
        console.error(`Ошибка обновления команды ${team.id}:`, error);
      }
    }));
    
    await updateProject(project.value.id, {
      status: StatusProject.teamFound
    });
    
    await teamStore.fetchTeamByProject(project.value.id);
    
    $q.notify({
      message: 'Команда успешно выбрана для проекта',
      color: 'positive'
    });
    
    showConfirmDialog.value = false;
    
    setTimeout(() => {
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('Ошибка выбора команды:', error);
    $q.notify({
      message: 'Ошибка выбора команды',
      color: 'negative'
    });
  }
};

const getRegularMembers = (team: TeamDto) => {
  if (!team?.user) return [];
  return team.user.filter(member => {
    const isOwner = member.id === team.user_owner?.id;
    const isLeader = team.user_leader && member.id === team.user_leader.id;
    const isPending = member.status === UserAccountStatus.pending;
    return !isOwner && !isLeader && !isPending;
  });
};

const getStatusColor = (status?: string) => {
  switch (status) {
    case StatusProject.searchTeam: return 'orange';
    case StatusProject.teamFound: return 'green';
    case StatusProject.selectionTeam: return 'blue';
    case StatusProject.draft: return 'grey';
    default: return 'grey';
  }
};

const formatDate = (date?: Date) => {
  if (!date) return 'Не указана';
  const d = new Date(date);
  return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth()+1).toString().padStart(2, '0')}.${d.getFullYear()}`;
};

const calculateMaxHeight = () => {
  nextTick(() => {
    const panels = document.querySelectorAll('.panel-content');
    let max = 0;
    panels.forEach(panel => {
      max = Math.max(max, panel.scrollHeight);
    });
    maxHeight.value = max;
  });
};

const closeDialog = () => {
  showDialog.value = false;
};

const open = async (projectData: ProjectDto) => {
  project.value = { ...projectData }; 
  
  if (teamStore.clearCurrentTeam) {
    teamStore.clearCurrentTeam();
  }
  
  if (projectData.id) {
    try {
      const updatedProject = await getProject(projectData.id);
      if (updatedProject) {
        project.value = updatedProject;
        
        if (updatedProject.teams?.length) {
          const teamsWithDetails = await Promise.all(
            updatedProject.teams.map(async t => {
              try {
                const teamDetails = await teamStore.fetchTeam(t.id);
                return teamDetails || t;
              } catch {
                return t;
              }
            })
          );
          project.value.teams = teamsWithDetails;
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
      $q.notify({
        type: 'negative',
        message: 'Ошибка загрузки данных проекта'
      });
    }
  }

  showDialog.value = true;
  calculateMaxHeight();
};

defineExpose({ open });
</script>

<style scoped>
.project-details-card {
  width: 800px;
  max-width: 90vw;
  display: flex;
  flex-direction: column;
}

.project-header {
  margin-bottom: 16px;
  color:var("--bg-color");
}

.project-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.project-title {
  margin: 0;
  line-height: 1.3;
}

.status-badge {
  font-size: 0.75rem;
  padding: 4px 8px;
  border-radius: 4px;
}

.project-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 0.9rem;
  color: #555;
}

.initiator-section,
.date-section {
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: color 0.2s;
}

.initiator-section:hover {
  color: #1976d2;
}

.panels-container {
  min-height: 400px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 0;
}

.detail-block {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
}

.detail-block:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-color: #bdbdbd;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 8px;
  color: #333;
}

.section-content {
  font-size: 0.95rem;
  color: #555;
  line-height: 1.5;
  margin-bottom: 0;
}

.tech-stack {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tech-tag {
  font-size: 0.8rem;
}

.team-list {
  border-radius: 8px;
  overflow: hidden;
}

.pending-team-item {
  transition: background-color 0.2s;
}

.pending-team-item:hover {
  background-color: #f5f5f5;
}

.team-name {
  font-weight: 500;
}

.team-description {
  font-size: 0.9rem;
  color: #666;
}

.current-team-section {
  margin-top: 24px;
}

.team-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.team-tags {
  display: flex;
  gap: 8px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  color: #666;
}

.empty-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.footer-actions {
  border-top: 1px solid #e0e0e0;
  padding: 12px 16px;
  display: flex;
  justify-content: flex-end;
}

/* Team details dialog styles */
.team-details-card {
  width: 600px;
  max-width: 90vw;
}

.team-heading {
  font-size: 1.5rem;
  margin-bottom: 16px;
}

.team-description {
  padding: 8px;
  background-color:var(--card-bg);
  color:var(--text-color);
  border-radius: 4px;
}

.team-owner {
  display: flex;
  align-items: center;
  padding: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-radius: 4px;
}

.team-owner:hover {
  background-color: #f5f5f5;
}

.team-label {
  display: flex;
  align-items: center;
  font-size: 1.1rem;
  margin-bottom: 8px;
}

.members-container {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
}

.member-item {
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.member-item:hover {
  background-color: #f5f5f5;
}

.member-item.owner {
  background-color: rgba(0, 150, 136, 0.05);
  border-left: 3px solid #009688;
}

.member-item.leader {
  background-color: rgba(25, 118, 210, 0.05);
  border-left: 3px solid #1976d2;
}

.member-info {
  display: flex;
  flex-direction: column;
}

.member-name {
  font-weight: 500;
}

.member-email {
  color: #666;
  font-size: 0.9em;
}

.competencies-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Inline editing styles */
.editable {
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.editable:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.editing-field {
  margin-top: 8px;
}

/* For dark theme */
.body--dark .editable:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

@media (max-width: 600px) {
  .project-meta {
    flex-direction: column;
    gap: 8px;
  }
  
  .panels-container {
    min-height: 300px;
    max-height: 50vh;
  }
  
  .detail-block {
    padding: 12px;
  }
}

/* Dark theme styles */
.body--dark .project-details-card,
.body--dark .team-details-card {
  background-color: #121212;
  color: #ffffff;
}

.body--dark .project-header,
.body--dark .team-header {
  background-color: #121212 !important;
  color: #ffffff;
}

.body--dark .detail-block {
  background-color: #1e1e1e;
  border-color: #333;
  color: #ffffff;
}

.body--dark .section-title {
  color: #ffffff;
}

.body--dark .section-content {
  color: #b0b0b0;
}

.body--dark .team-list {
  background-color: #1e1e1e;
}

.body--dark .pending-team-item {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .pending-team-item:hover {
  background-color: #2a2a2a;
}

.body--dark .empty-state {
  background-color: #1e1e1e;
  color: #b0b0b0;
}

.body--dark .footer-actions {
  background-color: #121212 !important;
  border-top-color: #333 !important;
}

.body--dark .q-card__actions {
  background-color: #121212 !important;
}

.body--dark .q-btn.flat {
  color: #ffffff;
}

.body--dark .q-btn.flat:hover {
  background-color: rgba(255, 255, 255, 0.1) !important;
}

.body--dark .q-tabs {
  color: #ffffff;
}

.body--dark .q-tab--active {
  color: var(--q-primary);
}

.body--dark .q-chip {
  background-color: #333;
  color: white;
}

.body--dark .member-item {
  background-color: #1e1e1e;
  color: #ffffff;
}

.body--dark .member-item:hover {
  background-color: #2a2a2a;
}

.body--dark .member-item.owner {
  background-color: rgba(0, 150, 136, 0.1);
  border-left: 3px solid #009688;
}

.body--dark .member-item.leader {
  background-color: rgba(25, 118, 210, 0.1);
  border-left: 3px solid #1976d2;
}

.body--dark .member-email {
  color: #b0b0b0;
}

.body--dark .q-avatar {
  color: white !important;
}

/* Scrollbar styles */
.panels-container,
.members-list,
.team-list {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.panels-container::-webkit-scrollbar,
.members-list::-webkit-scrollbar,
.team-list::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.panels-container::-webkit-scrollbar-track,
.members-list::-webkit-scrollbar-track,
.team-list::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
  border-radius: 4px;
}

.panels-container::-webkit-scrollbar-thumb,
.members-list::-webkit-scrollbar-thumb,
.team-list::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: 4px;
}

.panels-container::-webkit-scrollbar-thumb:hover,
.members-list::-webkit-scrollbar-thumb:hover,
.team-list::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
}

.body--light {
  --scrollbar-track: #f1f1f1;
  --scrollbar-thumb: #c1c1c1;
  --scrollbar-thumb-hover: #a8a8a8;
}

.body--dark {
  --scrollbar-track: #2a2a2a;
  --scrollbar-thumb: #555555;
  --scrollbar-thumb-hover: #6e6e6e;
}

.body--dark .panels-container,
.body--dark .members-list,
.body--dark .team-list {
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.body--dark .project-details-card,
.body--dark .team-details-card {
  --scrollbar-track: #1e1e1e;
  --scrollbar-thumb: #444444;
  --scrollbar-thumb-hover: #5a5a5a;
}

.body--dark .q-card-section {
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

.body--dark .q-card-section::-webkit-scrollbar-track {
  background: var(--scrollbar-track);
}

.body--dark .q-card-section::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
}
</style>