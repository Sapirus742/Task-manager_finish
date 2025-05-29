<template>
    <q-page padding>
      <div class="q-pa-md">
        <q-table
          title="Управление ролями пользователей"
          :rows="users"
          :columns="columns"
          row-key="id"
          :loading="loading"
          :filter="filter"
          :pagination="pagination"
        >
          <template v-slot:top-right>
            <q-input
              v-model="filter"
              outlined
              dense
              placeholder="Поиск пользователей..."
            >
              <template v-slot:append>
                <q-icon name="search" />
              </template>
            </q-input>
          </template>
  
          <template v-slot:body-cell-roles="props">
            <q-td :props="props">
              <div class="q-gutter-sm">
                <q-checkbox
                  v-for="role in allRoles"
                  :key="role"
                  v-model="props.row.roles"
                  :val="role"
                  :label="formatRole(role)"
                  @update:model-value="updateUserRoles(props.row)"
                />
              </div>
            </q-td>
          </template>
        </q-table>
      </div>
    </q-page>
</template>
  
<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useQuasar, QTableProps } from 'quasar';
  import { Role } from '../../../backend/src/common/types';
  import { getAll as getAllUsers, update} from 'src/api/users.api';
  
  const $q = useQuasar();
  
  interface UserWithRoles {
    id: number;
    email: string;
    firstname: string;
    lastname: string;
    roles: Role[];
  }
  
  const users = ref<UserWithRoles[]>([]);
  const loading = ref(false);
  const filter = ref('');
  
  const allRoles = Object.values(Role);
  const pagination = {
    sortBy: 'email',
    rowsPerPage: 10
  };
  
  const columns: QTableProps['columns'] = [
  {
    name: 'email',
    required: true,
    label: 'Email',
    align: 'left' as const,
    field: (row: UserWithRoles) => row.email,
    sortable: true
  },
  {
    name: 'name',
    label: 'Имя',
    align: 'left' as const,
    field: (row: UserWithRoles) => `${row.firstname} ${row.lastname}`,
    sortable: true
  },
  {
    name: 'roles',
    label: 'Роли',
    align: 'left' as const,
    field: (row: UserWithRoles) => row.roles.map(formatRole).join(', ')
  },
];
  
  const formatRole = (role: Role): string => {
    const roleNames = {
      [Role.admin]: 'Админ',
      [Role.user]: 'Студент',
      [Role.customer]: 'Заказчик',
      [Role.expert]: 'Эксперт',
      [Role.directorate]: 'Дирекция'
    };
    return roleNames[role] || role;
  };
  
  const loadUsers = async () => {
    try {
      loading.value = true;
      const data = await getAllUsers();
      users.value = data.map(user => ({
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        roles: [...user.roles] // Создаем копию массива ролей
      }));
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Не удалось загрузить пользователей',
        caption: (error as Error).message
      });
    } finally {
      loading.value = false;
    }
  };
  
  const updateUserRoles = async (user: UserWithRoles) => {
    try {
      loading.value = true;
      const payload = {
        roles: user.roles
      };
      await update(user.id, payload);
      $q.notify({
        type: 'positive',
        message: 'Роли пользователя обновлены',
        timeout: 2000
      });
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: 'Ошибка при обновлении ролей',
        caption: (error as Error).message
      });
      // Восстанавливаем предыдущее состояние
      await loadUsers();
    } finally {
      loading.value = false;
    }
  };
  
  onMounted(() => {
    loadUsers();
  });
</script>
  
<style scoped>
  .q-table {
    min-height: 500px;
  }
  .q-page
  {
    background-color:var(--bg-color);
  }
</style>