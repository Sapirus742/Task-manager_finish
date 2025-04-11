<template>
    <q-page padding>
      <div class="q-mb-lg">
        <h2 class="text-h4 q-mb-md">Биржа проектов</h2>
        
        <q-btn
          color="primary"
          icon="add"
          label="Создать биржу"
          @click="showCreateDialog = true"
          v-if="canCreateExchange"
          class="q-mb-md"
        />
  
        <q-table
          :rows="exchanges"
          :columns="columns"
          row-key="id"
          :loading="isLoading"
          :pagination="{ rowsPerPage: 10 }"
        >
          <template v-slot:body-cell-actions="props">
            <q-td :props="props">
              <q-btn
                flat
                round
                color="primary"
                icon="visibility"
                @click="viewExchange(props.row)"
              />
              <q-btn
                flat
                round
                color="negative"
                icon="delete"
                @click="confirmDelete(props.row)"
                v-if="canEditExchange(props.row)"
              />
            </q-td>
          </template>
        </q-table>
      </div>
  
      <q-dialog v-model="showCreateDialog">
        <q-card style="min-width: 400px">
          <q-card-section>
            <div class="text-h6">Создать новую биржу</div>
          </q-card-section>
  
          <q-card-section>
            <q-form @submit="onCreateSubmit">
              <q-input
                v-model="newExchange.name"
                label="Название"
                :rules="[val => !!val || 'Обязательное поле']"
                class="q-mb-sm"
              />
              
              <q-input
                v-model="startDateString"
                label="Дата начала"
                type="date"
                class="q-mb-sm"
              />
  
              <q-input
                v-model="stopDateString"
                label="Дата окончания"
                type="date"
                class="q-mb-sm"
              />
  
              <q-card-actions align="right">
                <q-btn flat label="Отмена" color="primary" v-close-popup />
                <q-btn type="submit" label="Создать" color="primary" />
              </q-card-actions>
            </q-form>
          </q-card-section>
        </q-card>
      </q-dialog>
    </q-page>
  </template>
  
  <script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useExchangeStore } from 'src/stores/exchange-store';
  import { useMainStore } from 'src/stores/main-store';
  import { useQuasar } from 'quasar';
  import { CreateExchangeDto, ExchangeDto } from '../../../../backend/src/common/types';
  import { QTableColumn } from 'quasar';
  
  const exchangeStore = useExchangeStore();
  const mainStore = useMainStore();
  const $q = useQuasar();
  
  const showCreateDialog = ref(false);
  const newExchange = ref<Omit<CreateExchangeDto, 'startExchange' | 'stopExchange'> & {
    startExchange: string;
    stopExchange: string;
  }>({
    name: '',
    startExchange: new Date().toISOString().split('T')[0],
    stopExchange: new Date().toISOString().split('T')[0],
  });
  
  const startDateString = computed({
    get: () => newExchange.value.startExchange,
    set: (val) => newExchange.value.startExchange = val
  });
  
  const stopDateString = computed({
    get: () => newExchange.value.stopExchange,
    set: (val) => newExchange.value.stopExchange = val
  });
  
  const columns: QTableColumn[] = [
    { 
      name: 'id', 
      label: 'ID', 
      field: 'id', 
      align: 'left', 
      sortable: true 
    },
    { 
      name: 'name', 
      label: 'Название', 
      field: 'name', 
      align: 'left', 
      sortable: true 
    },
    { 
      name: 'startExchange', 
      label: 'Дата начала', 
      field: (row: ExchangeDto) => new Date(row.startExchange).toLocaleDateString(),
      align: 'left',
      sortable: true,
      sort: (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()
    },
    { 
      name: 'stopExchange', 
      label: 'Дата окончания', 
      field: (row: ExchangeDto) => new Date(row.stopExchange).toLocaleDateString(),
      align: 'left',
      sortable: true,
      sort: (a: string, b: string) => new Date(a).getTime() - new Date(b).getTime()
    },
    { 
      name: 'actions', 
      label: 'Действия', 
      align: 'right',
      field: ''
    }
  ];
  
  const exchanges = computed(() => exchangeStore.exchanges);
  const isLoading = computed(() => exchangeStore.isLoading);
  
  const canCreateExchange = computed(() => {
    return mainStore.isAdmin() || mainStore.isDirectorate();
  });
  
  const canEditExchange = (exchange: ExchangeDto) => {
    return mainStore.isAdmin() || 
           (mainStore.isDirectorate() && exchange.projects.some(p => p.initiator.id === mainStore.userId));
  };
  
  onMounted(async () => {
    await exchangeStore.fetchAllExchanges();
  });
  
  const viewExchange = (exchange: ExchangeDto) => {
    $q.notify(`Просмотр биржи: ${exchange.name}`);
  };
  
  const confirmDelete = (exchange: ExchangeDto) => {
    $q.dialog({
      title: 'Подтверждение',
      message: `Вы уверены, что хотите удалить биржу "${exchange.name}"?`,
      cancel: true,
      persistent: true,
    }).onOk(async () => {
      await exchangeStore.deleteExchange(exchange.id);
      $q.notify({
        type: 'positive',
        message: 'Биржа успешно удалена',
      });
    });
  };
  
  const onCreateSubmit = async () => {
    try {
      await exchangeStore.createExchange({
        name: newExchange.value.name,
        startExchange: new Date(newExchange.value.startExchange),
        stopExchange: new Date(newExchange.value.stopExchange)
      });
      showCreateDialog.value = false;
      $q.notify({
        type: 'positive',
        message: 'Биржа успешно создана',
      });
      newExchange.value = { 
        name: '', 
        startExchange: new Date().toISOString().split('T')[0],
        stopExchange: new Date().toISOString().split('T')[0]
      };
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при создании биржи',
      });
    }
  };
  </script>