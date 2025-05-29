<template>

    <q-bar class="q-py-lg">
  
      <q-btn color="primary" @click="onNewClick">Создать</q-btn>
  
    </q-bar>
  
    <TIUUserDataTable :users="usersList" @user-click="onUserClick"></TIUUserDataTable>
  
  </template>
  
   
  
  <script setup lang="ts">
  
  import { onMounted, ref, Ref } from 'vue';
  
  import TIUUserDataTable from 'src/components/TIUUserDataTable.vue';
  
  import * as api from '../api/users.api';
  
  import { SecuredUser } from '../../../backend/src/common/types';
  
  import { useRouter } from 'vue-router';
  
   
  
  const router = useRouter();
  
   
  
  const usersList: Ref<SecuredUser[]> = ref([]);
  
   
  
  onMounted(async () => {
  
    usersList.value = await api.getAll();
  
    console.log(usersList.value);
  
  })
  
   
  
  const onUserClick = (row: SecuredUser) => {
  
    router.push({ path: `/users/${row.id}` })
  
  }
  
   
  
  const onNewClick = () => {
  
    router.push({ path: '/users/new' })
  
  }
  
   
  
  </script>

 <style scoped>
/* Добавить в конец файла */
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

.body--dark .q-bar {
  background-color: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
}

.body--dark .q-table {
  background-color: var(--card-bg);
  color: var(--text-color);
}

.body--dark .q-table__top,
.body--dark .q-table__bottom {
  background-color: var(--card-bg);
  color: var(--text-color);
}

.body--dark .q-table thead th {
  background-color: var(--card-bg);
  color: var(--text-color);
}

.body--dark .q-table tbody tr:hover {
  background-color: var(--hover-bg);
}

.body--dark .q-table tbody td {
  border-color: var(--border-color);
}
</style>