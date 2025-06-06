<template>
  <q-page class="flex flex-column">
    <div class="projects-container">
      <div class="header-section">
        <h2 class="project-title">Идеи</h2>
        <q-btn
          v-if="canCreateIdea"
          label="Создать идею"
          color="primary"
          @click="showCreateDialog = true"
          class="create-btn q-mb-md"
        />
      </div>

      <div class="search-and-filters q-mb-md">
        <q-input
          v-model="searchQuery"
          placeholder="Поиск по названию"
          outlined
          dense
          class="q-mb-md"
          clearable
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>

        <div class="filters">
          <q-chip
            v-for="filter in availableFilters"
            :key="filter.label"
            :label="filter.label"
            :color="filter.active ? 'primary' : 'grey-5'"
            text-color="white"
            clickable
            @click="toggleFilter(filter)"
          />
        </div>
      </div>

      <q-inner-loading :showing="ideaStore.isLoading">
        <q-spinner-gears size="50px" color="primary" />
      </q-inner-loading>

      <q-banner v-if="ideaStore.error" class="bg-negative text-white q-mb-md">
        {{ ideaStore.error }}
      </q-banner>

      <div class="ideas-list">
        <q-card
          v-for="idea in filteredIdeas"
          :key="idea.id"
          class="q-mb-sm idea-card"
          flat
          bordered
        >
          <q-card-section class="idea-card-content">
            <div class="idea-name">
              {{ idea.name }}
            </div>
            <div class="idea-actions">
              <q-chip
                :color="getStatusColor(idea.status)"
                text-color="white"
                size="sm"
                class="status-chip"
              >
                {{ getStatusLabel(idea.status) }}
              </q-chip>
              <q-btn
                color="primary"
                :label="expandedIdeas.includes(idea.id) ? 'Закрыть' : 'Открыть'"
                @click.stop="toggleIdeaDetails(idea.id)"
                class="open-btn"
              />
              <q-btn
                v-if="canEditIdea(idea)"
                icon="edit"
                flat
                dense
                @click.stop="openEditDialog(idea)"
                class="q-ml-sm"
              />
              <q-btn
                v-if="canDeleteIdea(idea)"
                icon="delete"
                flat
                dense
                @click.stop="confirmDeleteIdea(idea.id)"
                class="q-ml-sm"
              />
            </div>
          </q-card-section>

          <q-slide-transition>
            <div v-show="expandedIdeas.includes(idea.id)">
              <q-separator />
              <div class="row">
                <q-card-section class="idea-details-section col-8">
                  <div class="text-subtitle2 q-mb-sm">
                    <strong>Создал:</strong> {{ idea.initiator.firstname }} {{ idea.initiator.lastname }}
                  </div>
                  <div class="text-subtitle2 q-mb-sm">
                    <strong>Дата создания:</strong> {{ formatDate(idea.createdAt.toString()) }}
                  </div>
                  <div class="text-subtitle2 q-mb-sm">
                    <strong>Проблема:</strong> {{ idea.problem }}
                  </div>
                  <div class="text-subtitle2 q-mb-sm">
                    <strong>Решение:</strong> {{ idea.solution }}
                  </div>
                  <div class="text-subtitle2 q-mb-sm">
                    <strong>Ожидаемый результат:</strong> {{ idea.result }}
                  </div>
                  <div class="text-subtitle2 q-mb-sm">
                    <strong>Необходимые ресурсы:</strong> {{ idea.resource }}
                  </div>
                  
                  <div class="action-buttons q-mt-md">
                    <q-btn 
                      v-if="idea.status === StatusIdea.draft && canSubmitIdea(idea)"
                      label="Отправить на проверку" 
                      color="primary" 
                      @click="confirmSubmitIdea(idea)"
                      class="q-mr-sm"
                    />
                    <q-btn 
                      v-if="canSendForRework(idea)"
                      icon="edit" 
                      label="Отправить на доработку"
                      color="warning"
                      @click="confirmSendForRework(idea)"
                      :loading="isSendingForRework === idea.id"
                      class="q-mr-sm"
                    />
                    <q-btn 
                      v-if="canApproveIdea(idea)"
                      icon="thumb_up" 
                      label="Одобрить идею"
                      color="positive"
                      @click="confirmApproveIdea(idea)"
                      :loading="isApproving === idea.id"
                      class="q-mr-sm"
                    />
                    <q-btn 
                      v-if="canEndorseIdea(idea)"
                      icon="thumb_up" 
                      label="Утвердить идею"
                      color="positive"
                      @click="confirmEndorseIdea(idea)"
                      :loading="isEndorsing === idea.id"
                    />
                    <q-btn 
  v-if="canCreateProjectFromIdea(idea)"
  icon="add" 
  label="Создать проект из идеи" 
  color="primary"
  @click="createProjectFromIdea(idea)"
  class="q-mr-sm"
/>
                  </div>

                  <q-banner 
                    v-if="isApprovedByCurrentUser(idea)"
                    class="bg-positive text-white q-mt-sm"
                  >
                    Вы уже одобрили эту идею
                  </q-banner>

                  <div v-if="mainStore.isAdmin()" class="text-subtitle2 q-mb-sm">
                    <strong v-if="idea.approved && idea.approved.length > 0">Одобрили:</strong>
                    <template v-for="userId in getUniqueApprovedUsers(idea)" :key="userId">
                      <q-chip size="sm" color="primary" class="q-mx-xs">
                        {{ getUserName(userId) }}
                        <q-tooltip v-if="userId === mainStore.userId">Вы одобрили</q-tooltip>
                      </q-chip>
                      <q-chip 
                        v-if="idea.status === StatusIdea.approved" 
                        color="blue" 
                        text-color="white"
                      >
                        Одобрений: {{ idea.approved?.length || 0 }}/3
                      </q-chip>
                    </template>
                  </div>
                </q-card-section>

                <q-card-section class="col-4 comment-container" v-if="canViewCommentsSection(idea)">
                  <div class="comment-header">
                    <h3>Комментарии</h3>
                    <q-btn 
                      v-if="canAddComment(idea)"
                      label="Добавить комментарий" 
                      color="primary" 
                      @click="openCommentDialog(idea.id)"
                      size="sm"
                    />
                  </div>
                  
                  <div class="comment-section">
                    <div v-if="commentStore.isLoading" class="text-center q-my-md">
                      <q-spinner size="2em" />
                    </div>
                    
                    <div v-else>
                      <div 
                        v-for="comment in commentStore.comments" 
                        :key="comment.id" 
                        class="comment-item q-mb-sm"
                      >
                        <div class="comment-content">
                          <div class="comment-text">{{ comment.comment }}</div>
                          <div class="comment-meta">
                            <span>{{ comment.users.firstname }} {{ comment.users.lastname }}</span>
                            <span>{{ formatDate(comment.createdAt.toString()) }}</span>
                          </div>
                        </div>
                        <div class="comment-actions" v-if="canEditComment(comment)">
                          <q-btn 
                            icon="edit" 
                            flat 
                            dense 
                            size="sm"
                            @click="openEditCommentDialog(comment)"
                          />
                          <q-btn 
                            icon="delete" 
                            flat 
                            dense 
                            size="sm"
                            @click="confirmDeleteComment(comment.id)"
                          />
                        </div>
                      </div>
                      
                      <div v-if="commentStore.comments.length === 0" class="text-grey q-mt-md">
                        Нет комментариев
                      </div>
                    </div>
                  </div>
                </q-card-section>
              </div>
            </div>
          </q-slide-transition>
        </q-card>
      </div>

      <div v-if="filteredIdeas.length === 0 && !ideaStore.isLoading" class="empty-state">
        <q-icon name="info" size="xl" />
        <p>Нет идей.</p>
      </div>
    </div>

    <q-dialog v-model="showCreateDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Создать новую идею</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleCreateIdea">
            <q-input
              v-model="newIdea.name"
              label="Название идеи"
              class="q-mb-md"
              outlined
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="newIdea.problem"
              label="Проблема"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="newIdea.solution"
              label="Решение"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="newIdea.result"
              label="Ожидаемый результат"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="newIdea.resource"
              label="Необходимые ресурсы"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn 
            type="submit" 
            label="Создать" 
            color="primary" 
            @click="handleCreateIdea" 
            :loading="ideaStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showEditDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Редактировать идею</div>
        </q-card-section>

        <q-card-section>
          <q-form @submit="handleUpdateIdea">
            <q-input
              v-model="editIdea.name"
              label="Название идеи"
              class="q-mb-md"
              outlined
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="editIdea.problem"
              label="Проблема"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="editIdea.solution"
              label="Решение"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="editIdea.result"
              label="Ожидаемый результат"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-input
              v-model="editIdea.resource"
              label="Необходимые ресурсы"
              class="q-mb-md"
              outlined
              type="textarea"
              :rules="[val => !!val || 'Обязательное поле']"
              required
            />
            <q-select
              v-if="canChangeStatus"
              v-model="editIdea.status"
              :options="statusOptions"
              label="Статус"
              outlined
              class="q-mb-md"
            />
          </q-form>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Отмена" color="primary" v-close-popup />
          <q-btn 
            type="submit" 
            label="Сохранить" 
            color="primary" 
            @click="handleUpdateIdea" 
            :loading="ideaStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showCommentDialog">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">
            {{ isEditingComment ? 'Редактировать' : 'Добавить' }} комментарий
          </div>
        </q-card-section>
        
        <q-card-section>
          <q-input
            v-model="currentComment.comment"
            type="textarea"
            outlined
            autogrow
            label="Текст комментария"
            :rules="[val => !!val || 'Обязательное поле']"
          />
        </q-card-section>
        
        <q-card-actions align="right">
          <q-btn flat label="Отмена" v-close-popup />
          <q-btn 
            color="primary" 
            :label="isEditingComment ? 'Сохранить' : 'Добавить'"
            @click="handleSaveComment"
            :loading="commentStore.isLoading"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
      <CreateProjectDialog 
    ref="createProjectDialog"
    @create="handleProjectCreated"
  />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import CreateProjectDialog from '../Project/CreateProjectDialog.vue';
import { useMainStore } from 'src/stores/main-store';
import { useIdeaStore } from 'src/stores/idea-store';
import { useCommentStore } from 'src/stores/comment-store';
import { StatusIdea, type IdeaDto, type CommentDto, type UpdateIdeaDto, ProjectDto} from '../../../../backend/src/common/types';
import { useQuasar } from 'quasar';


const $q = useQuasar();
const mainStore = useMainStore();
const ideaStore = useIdeaStore();
const commentStore = useCommentStore();

interface Filter {
  label: string;
  value: StatusIdea | 'my' | null;
  active: boolean;
}

interface NewIdeaForm {
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
}

interface EditIdeaForm {
  id: number;
  name: string;
  problem: string;
  solution: string;
  result: string;
  resource: string;
  status: StatusIdea;
}

interface CommentForm {
  id?: number;
  comment: string;
  ideaId?: number;
}

onMounted(async () => {
  await ideaStore.fetchIdeas();
});

const searchQuery = ref('');
const expandedIdeas = ref<number[]>([]);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const showCommentDialog = ref(false);
const isEditingComment = ref(false);
const isApproving = ref<number | null>(null);
const isEndorsing = ref<number | null>(null);

const createProjectDialog = ref();

const createProjectFromIdea = (idea: IdeaDto) => {
  createProjectDialog.value.openDialogWithIdeaData(idea);
};

const handleProjectCreated = async (newProject: ProjectDto) => {
  try {
    // Находим ID текущей открытой идеи (последней в expandedIdeas)
    const currentIdeaId = expandedIdeas.value[expandedIdeas.value.length - 1];
    
    if (currentIdeaId) {
      // Используем существующий метод updateIdea для изменения статуса
      await ideaStore.updateIdea(currentIdeaId, {
        status: StatusIdea.implemented
      });
      
      // Обновляем список идей
      await ideaStore.fetchIdeas();
    }
    console.log('Создан проект:', newProject); // Пример использования
  
    $q.notify({
      type: 'positive',
      message: 'Проект успешно создан из идеи! Статус идеи изменен на "Реализована"'
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Проект создан, но не удалось изменить статус идеи'
    });
  }
};

const newIdea = ref<NewIdeaForm>({
  name: '',
  problem: '',
  solution: '',
  result: '',
  resource: '',
});

const editIdea = ref<EditIdeaForm>({
  id: 0,
  name: '',
  problem: '',
  solution: '',
  result: '',
  resource: '',
  status: StatusIdea.new,
});

const currentComment = ref<CommentForm>({ comment: '' });

const availableFilters = computed<Filter[]>(() => {
  const baseFilters: Filter[] = [
    { label: 'Мои', value: 'my', active: activeFilter.value === 'my' },
    { label: 'Опубликованные', value: StatusIdea.published, active: activeFilter.value === StatusIdea.published }
  ];

  if (mainStore.isExpert()) {
    return [
      ...baseFilters,
      { label: 'Утверждённые', value: StatusIdea.endorsed, active: activeFilter.value === StatusIdea.endorsed }
    ];
  }

  if (mainStore.isAdmin() || mainStore.isDirectorate()) {
    return [
      ...baseFilters,
      { label: 'Новые', value: StatusIdea.new, active: activeFilter.value === StatusIdea.new },
      { label: 'Черновики', value: StatusIdea.draft, active: activeFilter.value === StatusIdea.draft },
      { label: 'Утверждённые', value: StatusIdea.endorsed, active: activeFilter.value === StatusIdea.endorsed },
      { label: 'Одобренные', value: StatusIdea.approved, active: activeFilter.value === StatusIdea.approved },
      { label: 'Реализованные', value: StatusIdea.implemented, active: activeFilter.value === StatusIdea.implemented },
      { label: 'На удалении', value: StatusIdea.fordeletion, active: activeFilter.value === StatusIdea.fordeletion }
    ];
  }

  return baseFilters;
});

const activeFilter = ref<StatusIdea | 'my' | null>(null);

const toggleFilter = (filter: Filter) => {
  activeFilter.value = filter.value;
};

const filteredIdeas = computed(() => {
  let filtered = ideaStore.ideas;
  
  // Применяем фильтр по статусу только если выбран не "Мои"
  if (activeFilter.value !== 'my') {
    const allowedStatuses = availableFilters.value
      .filter(filter => filter.active)
      .map(filter => filter.value);
    
    const defaultStatuses = availableFilters.value.map(f => f.value);

    filtered = filtered.filter(idea => {
      return (allowedStatuses.length > 0 ? allowedStatuses : defaultStatuses)
        .includes(idea.status);
    });
  }

  // Фильтр "Мои" теперь показывает все идеи пользователя независимо от статуса
  if (activeFilter.value === 'my') {
    filtered = filtered.filter(idea => idea.initiator.id === mainStore.userId);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(idea => 
      idea.name.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const getStatusColor = (status: StatusIdea) => {
  const statusColors = {
    [StatusIdea.draft]: 'grey',
    [StatusIdea.new]: 'grey',
    [StatusIdea.endorsed]: 'green',
    [StatusIdea.approved]: 'teal',
    [StatusIdea.published]: 'green',
    [StatusIdea.implemented]: 'purple',
    [StatusIdea.fordeletion]: 'grey',
  };
  return statusColors[status] || 'grey';
};

const getStatusLabel = (status: StatusIdea) => {
  const statusLabels = {
    [StatusIdea.draft]: 'Черновик',
    [StatusIdea.new]: 'Новая',
    [StatusIdea.endorsed]: 'Утверждена',
    [StatusIdea.approved]: 'Одобрена',
    [StatusIdea.published]: 'Опубликована',
    [StatusIdea.implemented]: 'Реализована',
    [StatusIdea.fordeletion]: 'На удаление',
  };
  return statusLabels[status] || status;
};

const getUniqueApprovedUsers = (idea: IdeaDto): number[] => {
  if (!idea?.approved) return [];
  return [...new Set(idea.approved.filter(id => id !== null && id !== undefined))];
};

const getUserName = (userId: number): string => {
  if (userId === mainStore.userId) {
    return `${mainStore.firstname} ${mainStore.lastname}`;
  }
  return `Пользователь #${userId}`;
};

const isApprovedByCurrentUser = (idea: IdeaDto): boolean => {
  return idea.approved?.includes(mainStore.userId) || false;
};

const toggleIdeaDetails = async (ideaId: number) => {
  // Если открываем новую идею, закрываем все остальные
  if (!expandedIdeas.value.includes(ideaId)) {
    expandedIdeas.value = [ideaId];
    await commentStore.fetchComments(ideaId);
  } else {
    // Если закрываем текущую идею
    const index = expandedIdeas.value.indexOf(ideaId);
    if (index > -1) {
      expandedIdeas.value.splice(index, 1);
    }
  }
};



const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const handleCreateIdea = async () => {
  try {
    await ideaStore.createIdea({
      name: newIdea.value.name,
      problem: newIdea.value.problem,
      solution: newIdea.value.solution,
      result: newIdea.value.result,
      resource: newIdea.value.resource,
    });
    showCreateDialog.value = false;
    newIdea.value = { name: '', problem: '', solution: '', result: '', resource: '' };
    await ideaStore.fetchIdeas();
    $q.notify({ type: 'positive', message: 'Идея успешно создана!' });
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка при создании идеи' });
  }
};

const openEditDialog = (idea: IdeaDto) => {
  editIdea.value = {
    id: idea.id,
    name: idea.name,
    problem: idea.problem,
    solution: idea.solution,
    result: idea.result,
    resource: idea.resource,
    status: idea.status,
  };
  showEditDialog.value = true;
};

const handleUpdateIdea = async () => {
  try {
    const statusValue = typeof editIdea.value.status === 'object' 
      ? (editIdea.value.status as { label: string; value: StatusIdea }).value
      : editIdea.value.status;

    await ideaStore.updateIdea(editIdea.value.id, {
      name: editIdea.value.name,
      problem: editIdea.value.problem,
      solution: editIdea.value.solution,
      result: editIdea.value.result,
      resource: editIdea.value.resource,
      status: statusValue,
    });
    showEditDialog.value = false;
    await ideaStore.fetchIdeas();
    $q.notify({ type: 'positive', message: 'Идея успешно обновлена!' });
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка при обновлении идеи' });
  }
};

const confirmDeleteIdea = (id: number) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите удалить эту идею?',
    cancel: {label: 'Отмена'},
    persistent: true,
  }).onOk(async () => {
    try {
      await ideaStore.deleteIdea(id);
      await ideaStore.fetchIdeas();
      $q.notify({ type: 'positive', message: 'Идея успешно удалена!' });
    } catch {
      $q.notify({ type: 'negative', message: 'Ошибка при удалении идеи' });
    }
  });
};

const confirmSubmitIdea = (idea: IdeaDto) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите отправить идею на проверку? После отправки вы не сможете редактировать идею до рассмотрения.',
    cancel: {label: 'Отмена'},
    persistent: true,
  }).onOk(async () => {
    try {
      const updateData: UpdateIdeaDto = {
        name: idea.name,
        problem: idea.problem,
        solution: idea.solution,
        result: idea.result,
        resource: idea.resource,
        status: StatusIdea.new,
        stack: idea.stack,
      };
      
      await ideaStore.updateIdea(idea.id, updateData);
      $q.notify({ type: 'positive', message: 'Идея отправлена на проверку!' });
      await ideaStore.fetchIdeas();
    } catch {
      $q.notify({ type: 'negative', message: 'Ошибка при отправке идеи' });
    }
  });
};

const openCommentDialog = (ideaId: number) => {
  currentComment.value = { comment: '', ideaId };
  isEditingComment.value = false;
  showCommentDialog.value = true;
};

const openEditCommentDialog = (comment: CommentDto) => {
  currentComment.value = {
    id: comment.id,
    comment: comment.comment,
    ideaId: comment.idea.id
  };
  isEditingComment.value = true;
  showCommentDialog.value = true;
};

const canCreateProjectFromIdea = (idea: IdeaDto) => {
  return idea.status === StatusIdea.published && 
         (mainStore.isAdmin() || 
          mainStore.isDirectorate() || 
          mainStore.isCustomer());
};

const handleSaveComment = async () => {
  if (!currentComment.value.ideaId) return;
  
  try {
    const idea = ideaStore.ideas.find(i => i.id === currentComment.value.ideaId);
    if (!idea) throw new Error('Идея не найдена');
    
    if (!canAddComment(idea)) {
      throw new Error('У вас нет прав на добавление комментария');
    }
    
    if (isEditingComment.value && currentComment.value.id) {
      await commentStore.updateComment(
        currentComment.value.id,
        { comment: currentComment.value.comment }
      );
    } else {
      await commentStore.createComment({
        comment: currentComment.value.comment,
        idea: currentComment.value.ideaId,
        users: mainStore.userId
      });
    }
    
    showCommentDialog.value = false;
    await commentStore.fetchComments(currentComment.value.ideaId);
    $q.notify({ type: 'positive', message: 'Комментарий сохранён' });
  } catch (error) {
    $q.notify({ 
      type: 'negative', 
      message: error instanceof Error ? error.message : 'Ошибка сохранения комментария' 
    });
  }
};

const confirmDeleteComment = (id: number) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Удалить комментарий?',
    cancel: {label: 'Отмена'},
    persistent: true
  }).onOk(async () => {
    try {
      await commentStore.deleteComment(id);
      const ideaId = expandedIdeas.value[expandedIdeas.value.length - 1];
      if (ideaId) {
        await commentStore.fetchComments(ideaId);
      }
      $q.notify({ type: 'positive', message: 'Комментарий удалён' });
    } catch {
      $q.notify({ type: 'negative', message: 'Ошибка удаления' });
    }
  });
};

const canCreateIdea = computed(() => {
  return mainStore.isAdmin() || mainStore.isCustomer() || mainStore.isDirectorate() || mainStore.isExpert() || mainStore.isUser();
});

const canEditIdea = (idea: IdeaDto) => {
  return mainStore.isAdmin() || 
        (mainStore.userId === idea.initiator.id && 
         (idea.status === StatusIdea.draft || idea.status === StatusIdea.new));
};

const canDeleteIdea = (idea: IdeaDto) => {
  const { isAdmin, isDirectorate, isExpert, userId } = mainStore;

  if (isAdmin()) return true;
  if (userId === idea.initiator.id && idea.status === StatusIdea.draft) {
    return true;
  }
  if (isDirectorate() && idea.status === StatusIdea.new) {
    return true;
  }
  if (isExpert() && idea.status === StatusIdea.endorsed) {
    return true;
  }
  return false;
};

const canViewCommentsSection = (idea: IdeaDto) => {
  // Инициатор идеи видит комментарии на любом статусе
  if (idea.initiator.id === mainStore.userId) {
    return true;
  }
  
  // Эксперты видят комментарии на статусе "Утверждена"
  if (mainStore.isExpert() && idea.status === StatusIdea.endorsed) {
    return true;
  }
  
  // Дирекция видит комментарии на статусе "Новая"
  if (mainStore.isDirectorate() && idea.status === StatusIdea.new) {
    return true;
  }
  
  // Админы видят все комментарии
  if (mainStore.isAdmin()) {
    return true;
  }
  
  return false;
};

const canAddComment = (idea: IdeaDto) => {
  // Инициатор может комментировать на любом статусе
  if (idea.initiator.id === mainStore.userId) {
    return true;
  }
  
  // Эксперты могут комментировать "Утвержденные" идеи
  if (mainStore.isExpert() && idea.status === StatusIdea.endorsed) {
    return true;
  }
  
  // Дирекция может комментировать "Новые" идеи
  if (mainStore.isDirectorate() && idea.status === StatusIdea.new) {
    return true;
  }
  
  // Админы могут всегда
  if (mainStore.isAdmin()) {
    return true;
  }
  
  return false;
};

const canEditComment = (comment: CommentDto) => {
  // Автор комментария может его редактировать
  if (comment.users.id === mainStore.userId) {
    return true;
  }
  
  // Инициатор идеи может редактировать любые комментарии в своей идее
  const idea = ideaStore.ideas.find(i => i.id === comment.idea.id);
  if (idea && idea.initiator.id === mainStore.userId) {
    return true;
  }
  
  // Админы могут редактировать любые комментарии
  if (mainStore.isAdmin()) {
    return true;
  }
  
  return false;
};

const canApproveIdea = (idea: IdeaDto) => {
  const hasRights = mainStore.isAdmin() || mainStore.isExpert();
  const isEndorsedStatus = idea.status === StatusIdea.endorsed;
  const underLimit = !idea.approved || idea.approved.length < 3;
  const notApprovedYet = !isApprovedByCurrentUser(idea);
  
  return hasRights && isEndorsedStatus && underLimit && notApprovedYet;
};

const confirmApproveIdea = (idea: IdeaDto) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы точно хотите одобрить эту идею?',
    persistent: true,
    ok: {
      label: 'Одобрить',
      color: 'positive'
    },
    cancel: {
      label: 'Отмена',
      color: 'negative'
    }
  }).onOk(async () => {
    try {
      const { shouldNotify } = await ideaStore.approveIdea(idea.id, mainStore.userId);
      
      if (shouldNotify) {
        $q.notify({
          type: 'positive',
          message: 'Идея получила 3 одобрения и была опубликована!'
        });
      }
    } catch (error) {
      // Ошибка уже обработана в хранилище
    }
  });
};

const canSubmitIdea = (idea: IdeaDto) => {
  return mainStore.userId === idea.initiator.id && idea.status === StatusIdea.draft;
};

const canChangeStatus = computed(() => {
  return mainStore.isAdmin() || mainStore.isDirectorate();
});

const statusOptions = computed(() => {
  return Object.values(StatusIdea).map(status => ({
    label: getStatusLabel(status),
    value: status,
  }));
});

const isSendingForRework = ref<number | null>(null);

const canSendForRework = (idea: IdeaDto) => {
  // Дирекция может отправить на доработку идеи со статусом "Новая"
  if (mainStore.isDirectorate() && idea.status === StatusIdea.new) {
    return true;
  }
  
  // Эксперты могут отправить на доработку идеи со статусом "Утверждена"
  if (mainStore.isExpert() && idea.status === StatusIdea.endorsed) {
    return true;
  }
  
  // Админы могут всегда
  if (mainStore.isAdmin()) {
    return true;
  }
  
  return false;
};

const confirmSendForRework = (idea: IdeaDto) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы точно хотите отправить идею на доработку? Статус изменится на "Черновик".',
    persistent: true,
    ok: {
      label: 'Отправить',
      color: 'warning'
    },
    cancel: {
      label: 'Отмена',
      color: 'negative'
    }
  }).onOk(async () => {
    isSendingForRework.value = idea.id;
    try {
      await ideaStore.updateIdea(idea.id, {
        status: StatusIdea.draft
      });
      $q.notify({
        type: 'positive',
        message: 'Идея отправлена на доработку!'
      });
      await ideaStore.fetchIdeas();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при отправке на доработку'
      });
    } finally {
      isSendingForRework.value = null;
    }
  });
};

const canEndorseIdea = (idea: IdeaDto) => {
  return mainStore.isDirectorate() && idea.status === StatusIdea.new;
};

const confirmEndorseIdea = (idea: IdeaDto) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы точно хотите утвердить эту идею?',
    cancel: {label: 'Отмена'},
    persistent: true,
  }).onOk(async () => {
    isEndorsing.value = idea.id;
    try {
      await ideaStore.endorseIdea(idea.id);
      $q.notify({ type: 'positive', message: 'Идея успешно утверждена!' });
      await ideaStore.fetchIdeas();
    } catch (error: unknown) {
      let message = 'Ошибка при утверждении идеи';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } };
        message = axiosError.response?.data?.message || message;
      }
      $q.notify({ type: 'negative', message });
    } finally {
      isEndorsing.value = null;
    }
  });
};
</script>

<style scoped>
.projects-container {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  padding: 20px;
}

.header-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.project-title {
  font-size: 50px;
  font-weight: 60;
  margin: 0;
  color: #333;
  padding-top: 25px;
}

.create-btn {
  align-self: flex-start;
  width: auto;
  padding: 8px 16px;
}

.search-and-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filters {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.ideas-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.idea-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 8px;
}

.idea-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.idea-card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
}

.idea-name {
  font-size: 1.1rem;
  font-weight: 500;
  flex: 1;
}

.idea-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-chip {
  margin-right: 8px;
}

.open-btn {
  margin-left: 8px;
}

.idea-details-section {
  padding: 16px;
}

.comment-section {
  border-left: none; /* Убираем границу */
  padding: 16px;
}

.comment-section:not(:empty) {
  border-left: 1px solid #eee;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.comment-header h3 {
  margin: 0;
  font-size: 1.2rem;
}

.comment-item {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-radius: 4px;
  background: #f9f9f9;
}

.comment-content {
  flex-grow: 1;
}

.comment-text {
  margin-bottom: 4px;
  word-break: break-word;
}

.comment-meta {
  font-size: 0.8em;
  color: #666;
  display: flex;
  justify-content: space-between;
}

.comment-actions {
  margin-left: 8px;
  display: flex;
  gap: 4px;
  align-items: center;
}

.comment-actions .q-btn.positive {
  color: green;
}

.approve-section {
  border-top: 1px solid #eee;
  padding-top: 16px;
  margin-top: 16px;
}

.submit-section {
  border-top: 1px solid #eee;
  padding-top: 16px;
  margin-top: 16px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #666;
}

.empty-state .q-icon {
  margin-bottom: 10px;
}

.create-project-btn {
  margin-left: 8px;
}

.endorse-section {
  border-top: 1px solid #eee;
  padding-top: 16px;
  margin-top: 16px;
}

@media (max-width: 600px) {
  .idea-card-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .idea-actions {
    width: 100%;
    justify-content: space-between;
  }
  .action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 16px;
}

/* Для мобильных устройств */
@media (max-width: 600px) {
  .action-buttons {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-buttons .q-btn {
    width: 100%;
    justify-content: center;
  }
}
}
.body--dark {
  /* Основные цвета */
  --bg-color: #121212;
  --text-color: #e0e0e0;
  --card-bg: #1e1e1e;
  --border-color: #333;
  --hover-bg: #2a2a2a;
  --active-bg: #333;
  --disabled-bg: #252525;
  --chip-bg: #333;
  
  /* Применение к странице */
  background-color: var(--bg-color);
  color: var(--text-color);
}

.body--dark .project-title,
.body--dark .text-h6,
.body--dark .text-subtitle2 {
  color: var(--text-color) !important;
}

.body--dark .idea-card {
  background-color: var(--card-bg);
  border-color: var(--border-color);
}

.body--dark .idea-card:hover {
  background-color: var(--hover-bg);
}

.body--dark .idea-details-section,
.body--dark .comment-section {
  background-color: var(--card-bg);
  color: var(--text-color);
}

.body--dark .q-separator {
  background-color: var(--border-color);
}

.body--dark .comment-item {
  background-color: var(--darker-bg);
}

.body--dark .empty-state {
  color: var(--text-secondary);
}

.body--dark .q-dialog__inner .q-card {
  background-color: var(--card-bg);
  color: var(--text-color);
}

.body--dark .q-field--outlined .q-field__control {
  background-color: var(--card-bg);
  border-color: var(--border-color);
  color: var(--text-color);
}

.body--dark .q-field--outlined .q-field__control:hover {
  border-color: #555;
}

.body--dark .q-field__label {
  color: var(--text-color);
}

.body--dark .q-field__native,
.body--dark .q-field__input {
  color: var(--text-color);
}
.q-page
  {
    background-color:var(--bg-color);
  }
</style>