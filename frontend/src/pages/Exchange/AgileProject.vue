<template>
  <q-dialog v-model="showDialog" maximized>
    <q-card class="full-height">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Agile доска проекта</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="q-pt-none full-height">
        <div class="row full-height q-col-gutter-md">
          <div 
            v-for="column in columns" 
            :key="column.status" 
            class="col"
          >
            <q-card class="full-height column">
              <q-card-section class="q-pa-sm" :class="column.headerClass">
                <div class="text-subtitle1 text-center">
                  {{ column.title }}
                  <q-btn
                    round
                    dense
                    flat
                    icon="add"
                    size="sm"
                    @click="openCreateAgileDialog(column.status)"
                  />
                </div>
              </q-card-section>
              
              <q-scroll-area class="col">
                <div class="q-pa-sm column q-gutter-y-sm">
                  <q-card
                    v-for="agileItem in getAgileItemsByStatus(column.status)"
                    :key="agileItem.id"
                    class="cursor-pointer"
                    draggable
                    @dragstart="startDrag($event, agileItem)"
                    @drop="onDrop($event, column.status)"
                    @dragover.prevent
                    @dragenter.prevent
                  >
                    <q-card-section class="q-pa-sm">
                      <div class="text-weight-bold">{{ agileItem.name }}</div>
                      <div class="text-caption q-mt-xs">
                        <q-icon name="comment" />
                        {{ getMessageCount(agileItem.id) }} сообщений
                      </div>
                    </q-card-section>

                    <q-card-actions align="right">
                      <q-btn
                        flat
                        round
                        dense
                        icon="edit"
                        @click.stop="openEditAgileDialog(agileItem)"
                      />
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        @click.stop="confirmDeleteAgile(agileItem.id)"
                      />
                      <q-btn
                        flat
                        round
                        dense
                        icon="chat"
                        @click.stop="openMessagesPanel(agileItem)"
                      />
                    </q-card-actions>
                  </q-card>
                </div>
              </q-scroll-area>
            </q-card>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model="showAgileDialog">
    <q-card style="min-width: 400px">
      <q-card-section>
        <div class="text-h6">
          {{ editingAgile ? 'Редактировать тему' : 'Новая тема' }}
        </div>
      </q-card-section>

      <q-card-section>
        <q-form @submit.prevent="submitAgileForm">
          <q-input
            v-model="agileForm.name"
            label="Название темы"
            :rules="[val => !!val || 'Обязательное поле']"
            class="q-mb-sm"
          />
          <q-select
            v-model="agileForm.status"
            :options="statusOptions"
            label="Статус"
            emit-value
            map-options
            class="q-mb-sm"
          />
          <q-input
            v-model="agileForm.description"
            label="Описание"
            type="textarea"
            autogrow
            class="q-mb-sm"
          />
          <q-card-actions align="right">
            <q-btn flat label="Отмена" color="primary" v-close-popup />
            <q-btn type="submit" label="Сохранить" color="primary" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-drawer v-model="showMessagesPanel" side="right" bordered :width="400">
    <q-scroll-area class="fit">
      <q-card flat>
        <q-card-section>
          <div class="text-h6">{{ currentAgileItem?.name }}</div>
          <div class="text-caption">{{ currentAgileItem?.description }}</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="q-pa-md">
            <div v-for="message in messages" :key="message.id" class="q-mb-md">
              <q-card flat bordered>
                <q-card-section>
                  <div class="text-caption">{{ message.authorName }} • {{ formatDate(message.createdAt.toString()) }}</div>
                  <div class="q-mt-sm">{{ message.content }}</div>
                </q-card-section>
              </q-card>
            </div>

            <q-input
              v-model="newMessage"
              placeholder="Написать сообщение..."
              type="textarea"
              autogrow
              @keyup.enter="sendMessage"
            >
              <template v-slot:after>
                <q-btn
                  round
                  dense
                  flat
                  icon="send"
                  @click="sendMessage"
                />
              </template>
            </q-input>
          </div>
        </q-card-section>
      </q-card>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAgileStore } from 'src/stores/agile.store';
import { useMessageStore } from 'src/stores/message.store';
import { useQuasar } from 'quasar';
import { AgileDto, CreateAgileDto, TypeAgile  } from '../../../../backend/src/common/types';

const $q = useQuasar();
const agileStore = useAgileStore();
const messageStore = useMessageStore();

const props = defineProps<{
  projectId: number; // Получаем ID проекта через props
}>();

const currentProjectId = ref(props.projectId); // Инициализируем ref

const showDialog = ref(false);
const showAgileDialog = ref(false);
const showMessagesPanel = ref(false);
const editingAgile = ref(false);
const currentAgileItem = ref<AgileDto | null>(null);
const newMessage = ref('');

const columns = [
  { status: 'todo', title: 'To Do', headerClass: 'bg-blue-1' },
  { status: 'in_progress', title: 'In Progress', headerClass: 'bg-orange-1' },
  { status: 'done', title: 'Done', headerClass: 'bg-green-1' },
];

const statusOptions = columns.map(col => ({
  label: col.title,
  value: col.status
}));

const agileForm = ref({
  id: null as number | null,
  name: '',
  status: 'todo',
  description: ''
});

const messages = computed(() => messageStore.messages);

const open = () => {
  showDialog.value = true;
  agileStore.fetchAll();
};

const getAgileItemsByStatus = (status: string) => {
  return agileStore.agileItems.filter(item => item.status === status);
};

const getMessageCount = (agileId: number) => {
  return messageStore.messages.filter(msg => msg.agile.id === agileId).length;
};

const openCreateAgileDialog = (status: string) => {
  agileForm.value = {
    id: null,
    name: '',
    status,
    description: ''
  };
  editingAgile.value = false;
  showAgileDialog.value = true;
};

const openEditAgileDialog = (agileItem: AgileDto) => {
  agileForm.value = { 
    id: agileItem.id,
    name: agileItem.name,
    status: agileItem.status,
    description: agileItem.description || ''
  };
  editingAgile.value = true;
  showAgileDialog.value = true;
};

const submitAgileForm = async () => {
  try {
    if (editingAgile.value && agileForm.value.id) {
      await agileStore.updateItem(agileForm.value.id, {
        name: agileForm.value.name,
        status: agileForm.value.status,
        description: agileForm.value.description
      });
    } else {
      // Создаем объект, соответствующий CreateAgileDto
      const newAgile: CreateAgileDto = {
        name: agileForm.value.name,
        type: TypeAgile.backlog, // или другой тип из enum
        project: { id: currentProjectId.value },
        status: agileForm.value.status,
        description: agileForm.value.description
      };
      await agileStore.createItem(newAgile);
    }
    showAgileDialog.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при сохранении темы'
    });
  }
};

const confirmDeleteAgile = (id: number) => {
  $q.dialog({
    title: 'Подтверждение',
    message: 'Вы уверены, что хотите удалить эту тему?',
    cancel: true
  }).onOk(async () => {
    try {
      await agileStore.deleteItem(id);
      $q.notify({
        type: 'positive',
        message: 'Тема успешно удалена'
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при удалении темы'
      });
    }
  });
};

const openMessagesPanel = async (agileItem: AgileDto) => {
  currentAgileItem.value = agileItem;
  await messageStore.fetchMessages(agileItem.id);
  showMessagesPanel.value = true;
};

const sendMessage = async () => {
  if (!newMessage.value.trim() || !currentAgileItem.value?.id) return;
  
  try {
    await messageStore.createMessage({
      content: newMessage.value,
      agileId: currentAgileItem.value.id,
      authorName: 'Текущий пользователь'
    });
    
    newMessage.value = '';
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при отправке сообщения'
    });
  }
};

const startDrag = (event: DragEvent, item: AgileDto) => {
  event.dataTransfer?.setData('agileItem', JSON.stringify(item));
};

const onDrop = async (event: DragEvent, newStatus: string) => {
  const itemData = event.dataTransfer?.getData('agileItem');
  if (!itemData) return;
  
  try {
    const item = JSON.parse(itemData) as AgileDto;
    await agileStore.updateItem(item.id, { status: newStatus });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: 'Ошибка при перемещении темы'
    });
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

defineExpose({ open });
</script>

<style scoped>
.full-height {
  height: calc(100vh - 50px);
}

.q-card {
  min-width: 200px;
}

.q-scroll-area {
  height: calc(100% - 50px);
}

.cursor-pointer {
  cursor: grab;
}

.cursor-pointer:active {
  cursor: grabbing;
}

.q-drawer {
  width: 400px;
  max-width: 80vw;
}
</style>