<template>
  <q-layout view="hHh Lpr fFf">
    <q-header elevated>
      <q-toolbar>
        <q-toolbar-title class="row items-center q-gutter-sm justify-left">
          <!-- Аватар без обработчика клика -->
          <q-avatar icon="account_circle" size="xl" />

          <!-- Имя и фамилия с обработчиком клика и стилями -->
          <span
            class="clickable-name"
            @click="openUserProfile"
          >
            {{ `${firstname} ${lastname}` }}
          </span>

          <!-- Роли 
          <span v-if="formattedRoles.length > 0">
            {{ formattedRoles.length > 1 ? ', ' : ' ' }}
            {{ formattedRoles.join(', ') }}
          </span>
          -->
        </q-toolbar-title>

        <div class="q-mr-md">
          <!-- Кнопка "Админка" только для администраторов -->
          <q-btn
            v-if="showAdminButton"
            flat
            label="Админка"
            @click="goToAdmin"
          />
          <!-- Кнопка "Проекты" отображается только для ролей admin, directorate, customer -->
          <q-btn
            v-if="showProjectsButton"
            flat
            label="Проекты"
            @click="goToProjects"
          />
          <q-btn flat label="Биржа" @click="goToMarketplace" />
          <q-btn flat label="Идеи" @click="goToIdeas" />
          <q-btn flat label="Команды" @click="goToTeams" />
        </div>

        <q-btn
          :icon="isDark ? 'light_mode' : 'dark_mode'"
          flat
          dense
          @click="toggleDarkMode"
        />
        <div></div>

        <div>
          <q-btn icon="logout" color="blue" dense unelevated round @click="onLogout" />
        </div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- Передаем formattedRoles в UserProfile -->
    <UserProfile ref="userProfile" :roles="formattedRoles" />
    <PendingRequestsDialog ref="pendingRequestsDialog" />
  </q-layout>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMainStore } from 'src/stores/main-store';
import { storeToRefs } from 'pinia';
import * as api from '../api/auth.api';
import { useRouter } from 'vue-router';
import UserProfile from './UserProfile.vue';
import { useQuasar } from 'quasar';
import PendingRequestsDialog from 'src/pages/PendingRequestsDialog.vue';

defineOptions({
  name: 'MainLayout',
});

const mainStore = useMainStore();
const router = useRouter();
const userProfile = ref();
const $q = useQuasar();

const isDark = ref($q.dark.isActive);
const toggleDarkMode = () => {
  $q.dark.toggle();
  isDark.value = $q.dark.isActive;
  localStorage.setItem('darkMode', String(isDark.value));
};

const pendingRequestsDialog = ref<InstanceType<typeof PendingRequestsDialog>>();

const checkPendingRequests = async () => {
  if (mainStore.team_leader) {
    const { hasRequests, teamName, pendingUsers } = await mainStore.hasPendingRequests();
    console.log(hasRequests, teamName, pendingUsers, mainStore.team_leader?.id)
    if (hasRequests) {
      $q.notify({
        message: `Имеются нерассмотренные заявки на вступление в команду "${teamName}"`,
        color: 'info',
        icon: 'people',
        timeout: 0, // Уведомление не исчезает автоматически
        actions: [
          {
            label: 'Просмотреть',
            color: 'white',
            handler: () => {
              // Открываем модальное окно с заявками
              pendingRequestsDialog.value?.open(pendingUsers, teamName, mainStore.team_leader?.id);
            }
          }
        ]
      });
    }
  }
};
checkPendingRequests();

let { firstname, lastname, roles } = storeToRefs(mainStore);

const formattedRoles = computed(() => {
  return roles.value.map((role) => {
    switch (role) {
      case 'admin':
        return 'Администратор';
      case 'customer':
        return 'Заказчик';
      case 'directorate':
        return 'Дирекция ВШЦТ';
      case 'expert':
        return 'Эксперт';
      case 'user':
        return 'Студент';
      default:
        return role;
    }
  });
});

// Показывать кнопку "Проекты" если есть хотя бы одна из ролей: admin, directorate, customer
const showProjectsButton = computed(() => {
  const allowedRoles = ['admin', 'directorate', 'customer'];
  return roles.value.some(role => allowedRoles.includes(role));
});

// Показывать кнопку "Админка" если роль: админ
const showAdminButton = computed(() => {
  const allowedRoles = ['admin', 'directorate'];
  return roles.value.some(role => allowedRoles.includes(role));
});

const onLogout = () => {
  api.logout();
  router.push({ path: '/login' });
};

const goToProjects = () => {
  router.push('/projects');
};

// Переход в админку
const goToAdmin = () => {
  router.push('/admin');
};

const goToMarketplace = () => {
  router.push('/marketplace');
};

const goToIdeas = () => {
  router.push('/ideas');
};

const goToTeams = () => {
  router.push('/teams');
};

const openUserProfile = () => {
  userProfile.value.open();
};
</script>

<style scoped>
.q-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.q-mr-md {
  margin-right: 16px;
}

/* Стили для кликабельного имени и фамилии */
.clickable-name {
  cursor: pointer;
  color: rgb(255, 255, 255); /* Черный цвет текста */
  transition: color 0.3s ease;
}

.clickable-name:hover {
  color: #1d0101; /* Цвет при наведении */
}
</style>
