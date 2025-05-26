<template>
  <q-dialog v-model="showDialog" persistent>
    <q-card style="min-width: 500px">
      <q-card-section class="bg-primary text-white">
        <div class="text-h6">Заявки на вступление в команду "{{ teamName }}"</div>
      </q-card-section>

      <q-card-section>
        <q-list bordered separator v-if="pendingUsers.length > 0">
          <q-item v-for="user in pendingUsers" :key="user.id">
            <q-item-section avatar>
              <q-avatar color="primary" text-color="white">
                {{ user.firstname[0] }}{{ user.lastname[0] }}
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ user.firstname }} {{ user.lastname }}</q-item-label>
              <q-item-label caption>
                {{ user.group }} • Статус: {{ translateStatus(user.status) }}
              </q-item-label>
            </q-item-section>

            <q-item-section side>
              <div class="row q-gutter-sm">
                <q-btn 
                  round 
                  color="positive" 
                  icon="check" 
                  @click="approveRequest(user.id)"
                />
                <q-btn 
                  round 
                  color="negative" 
                  icon="close" 
                  @click="rejectRequest(user.id)"
                />
              </div>
            </q-item-section>
          </q-item>
        </q-list>

        <div v-else class="text-center q-pa-md text-grey-6">
          Нет заявок на вступление
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Закрыть" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue';
import {update as updateUser} from '../api/users.api';
import {create as createPortfolio} from '../api/portfolio.api';
import { UserAccountStatus } from '../../../backend/src/common/types';
import { UserCommandStatus } from '../../../backend/src/common/types';

const showDialog = ref(false);
const pendingUsers = ref([]);
const teamName = ref('');
const teamId = ref('');

const translateStatus = (status) => {
  const statusMap = {
    [UserAccountStatus.pending]: 'Ожидает',
    [UserAccountStatus.active]: 'Активен',
    [UserAccountStatus.inactive]: 'Неактивен'
  };
  return statusMap[status] || status;
};

const approveRequest = async (userId) => {
    try {
    await updateUser(userId, {
      status: UserAccountStatus.active
    });
    await createPortfolio({
        status: UserCommandStatus.inTeam,
        team: teamId.value,
        user: userId,
        entryDate: new Date(), 
    });
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== userId);
    } catch (error) {
        console.error('Ошибка подтверждения заявки:', error);
  }
};

const rejectRequest = async (userId) => {
try {
    await updateUser(userId, {
      status: UserAccountStatus.active,
      team: null,
    });
    pendingUsers.value = pendingUsers.value.filter(u => u.id !== userId);
  } catch (error) {
    console.error('Ошибка отклонения заявки:', error);
  }
};

defineExpose({
  open: (users, name, id) => {
    pendingUsers.value = users || [];
    teamName.value = name || '';
    teamId.value = id || null;
    showDialog.value = true;
  }
});
</script>