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
            v-for="filter in filters"
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
                label="Открыть"
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
                  
                  <!-- Новая секция для отправки на проверку -->
                  <div class="submit-section q-mt-md" v-if="idea.status === StatusIdea.draft && canSubmitIdea(idea)">
                    <q-btn 
                      label="Отправить на проверку" 
                      color="primary" 
                      @click="confirmSubmitIdea(idea)"
                      class="q-mt-sm"
                    />
                  </div>

                  <!-- Блок одобрения -->
<div class="approve-section q-mt-md">
  <!-- Кнопка одобрения (показывается только если можно одобрить и пользователь еще не одобрил) -->
  <q-btn 
  v-if="canApproveIdea(idea)"
  icon="thumb_up" 
  label="Одобрить идею"
  color="positive"
  class="q-mt-sm"
  @click="confirmApproveIdea(idea)"
  :loading="isApproving === idea.id"
/>
  
  <!-- Сообщение для уже одобривших -->
  <q-banner 
    v-if="isApprovedByCurrentUser(idea)"
    class="bg-positive text-white q-mt-sm"
  >
    Вы уже одобрили эту идею
  </q-banner>

  <!-- Отображение одобрений для админов -->
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
</div>
                </q-card-section>

                <!-- Секция комментариев -->
                <q-card-section class="comment-section col-4">
                  <div class="comment-header">
                    <h3>Комментарии</h3>
                    <q-btn 
                      label="Добавить комментарий" 
                      color="primary" 
                      @click="openCommentDialog(idea.id)"
                      size="sm"
                    />
                  </div>
                          
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
                      <div class="comment-actions" v-if="canEditComment(comment) || canApproveIdea(idea)">
                        
                        <q-btn 
                          v-if="canEditComment(comment)"
                          icon="edit" 
                          flat 
                          dense 
                          size="sm"
                          @click="openEditCommentDialog(comment)"
                        />
                        <q-btn 
                          v-if="canEditComment(comment)"
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
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMainStore } from 'src/stores/main-store';
import { useIdeaStore } from 'src/stores/idea-store';
import { useCommentStore } from 'src/stores/comment-store';
import { StatusIdea, type IdeaDto, type CommentDto, type UpdateIdeaDto } from '../../../../backend/src/common/types';
import { useQuasar } from 'quasar';

const $q = useQuasar();
const mainStore = useMainStore();
const ideaStore = useIdeaStore();
const commentStore = useCommentStore();

interface Filter {
  label: string;
  value: StatusIdea | null;
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

const filters = ref<Filter[]>([
  { label: 'Все', value: null, active: true },
  { label: 'Черновик', value: StatusIdea.draft, active: false },
  { label: 'Новая', value: StatusIdea.new, active: false },
  { label: 'Утверждена', value: StatusIdea.approved, active: false },
  { label: 'Одобрена', value: StatusIdea.endorsed, active: false },
  { label: 'Опубликована', value: StatusIdea.published, active: false },
  { label: 'Реализована', value: StatusIdea.implemented, active: false }, 
]);



const toggleFilter = (filter: Filter) => {
  filters.value.forEach((f) => (f.active = f === filter));
};

const filteredIdeas = computed(() => {
  const activeFilter = filters.value.find((f) => f.active);
  let filtered = ideaStore.ideas;

  if (activeFilter?.value) {
    filtered = filtered.filter((idea) => idea.status === activeFilter.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter((idea) =>
      idea.name.toLowerCase().includes(query)
    );
  }

  return filtered;
});

const getStatusColor = (status: StatusIdea) => {
  const statusColors = {
    [StatusIdea.draft]: 'grey',
    [StatusIdea.new]: 'grey',
    [StatusIdea.approved]: 'teal',
    [StatusIdea.endorsed]: 'green',
    [StatusIdea.published]: 'green',
    [StatusIdea.implemented]: 'purple',
  };
  return statusColors[status] || 'grey';
};

const getStatusLabel = (status: StatusIdea) => {
  const statusLabels = {
    [StatusIdea.draft]: 'Черновик',
    [StatusIdea.new]: 'Новая',
    [StatusIdea.approved]: 'Одобрена',
    [StatusIdea.endorsed]: 'Подтверждена',
    [StatusIdea.published]: 'Опубликована',
    [StatusIdea.implemented]: 'Реализована',
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
  const index = expandedIdeas.value.indexOf(ideaId);
  if (index > -1) {
    expandedIdeas.value.splice(index, 1);
  } else {
    expandedIdeas.value.push(ideaId);
    await commentStore.fetchComments(ideaId);
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
    cancel: true,
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
    cancel: true,
    persistent: true,
  }).onOk(async () => {
    try {
      // Создаем объект только с теми полями, которые можно обновлять
      const updateData: UpdateIdeaDto = {
        name: idea.name,
        problem: idea.problem,
        solution: idea.solution,
        result: idea.result,
        resource: idea.resource,
        status: StatusIdea.new, // Меняем статус на "Новая"
        stack: idea.stack,
      };
      
      await ideaStore.updateIdea(idea.id, updateData);
      $q.notify({ type: 'positive', message: 'Идея отправлена на проверку!' });
      await ideaStore.fetchIdeas(); // Обновляем список идей
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

const handleSaveComment = async () => {
  if (!currentComment.value.ideaId) return;
  
  try {
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
  } catch {
    $q.notify({ type: 'negative', message: 'Ошибка сохранения комментария' });
  }
};

const confirmDeleteComment = (id: number) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Удалить комментарий?',
    cancel: true
  }).onOk(async () => {
    try {
      await commentStore.deleteComment(id);
      const ideaId = expandedIdeas.value[expandedIdeas.value.length - 1];
      await commentStore.fetchComments(ideaId);
      $q.notify({ type: 'positive', message: 'Комментарий удалён' });
    } catch {
      $q.notify({ type: 'negative', message: 'Ошибка удаления' });
    }
  });
};


const canCreateIdea = computed(() => {
  return mainStore.isAdmin() || mainStore.isCustomer() || mainStore.isDirectorate() || mainStore.isExpert()|| mainStore.isUser();
});

const canEditIdea = (idea: IdeaDto) => {
  return mainStore.isAdmin() || 
        (mainStore.userId === idea.initiator.id && 
         (idea.status === StatusIdea.draft || idea.status === StatusIdea.new));
};

const canDeleteIdea = (idea: IdeaDto) => {
  return mainStore.isAdmin() || 
        (mainStore.userId === idea.initiator.id && idea.status !== StatusIdea.published);
};

const canEditComment = (comment: CommentDto) => {
  return mainStore.isAdmin() || comment.users.id === mainStore.userId;
};

const canApproveIdea = (idea: IdeaDto) => {
  const hasRights = mainStore.isAdmin() || mainStore.isDirectorate() || mainStore.isExpert();
  const isApprovedStatus = idea.status === StatusIdea.approved;
  const underLimit = !idea.approved || idea.approved.length < 3;
  const notApprovedYet = !isApprovedByCurrentUser(idea);
  
  return hasRights && isApprovedStatus && underLimit && notApprovedYet;
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
      const result = await ideaStore.approveIdea(idea.id, mainStore.userId);
      
      if (result?.status === StatusIdea.endorsed) {
        $q.notify({
          type: 'positive',
          message: 'Идея получила 3 одобрения! Статус изменен на Endorsed'
        });
      } else {
        $q.notify({
          type: 'positive',
          message: 'Идея одобрена!'
        });
      }
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Ошибка при одобрении'
      });
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
  border-left: 1px solid #eee;
  padding: 16px;
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
}
</style>