<template>
  <q-page class="row items-center justify-evenly">
    <q-card flat bordered class="my-card" style="width: 420px;">
      <q-card-section>
        <div class="text-h4 text-center q-mb-sm custom-font">Регистрация</div>
        <div class="text-h8 text-center q-mb-sm custom-font">
          Введите данные для регистрации
        </div>
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-input
          v-model="login"
          label="Логин"
          dense
          outlined
          class="q-mb-sm custom-font"
          placeholder="example@example.com"
          :rules="[val => !!val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Введите корректный email']"
          no-error-icon
        />
        <q-input
          v-model="firstname"
          label="Имя"
          dense
          outlined
          class="q-mb-sm custom-font"
          :rules="[val => !!val && /^[а-яА-ЯёЁa-zA-Z]+$/.test(val) || 'Только буквы']"
          no-error-icon
        />
        <q-input
          v-model="lastname"
          label="Фамилия"
          dense
          outlined
          class="q-mb-sm custom-font"
          :rules="[val => !!val && /^[а-яА-ЯёЁa-zA-Z]+$/.test(val) || 'Только буквы']"
          no-error-icon
        />
        <q-input
          :type="isPwdVisible ? 'text' : 'password'"
          v-model="password"
          label="Пароль"
          dense
          outlined
          class="q-mb-sm custom-font"
          placeholder="********"
          :rules="[val => !!val && /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/.test(val) || 'Пароль должен содержать хотя бы одну букву, одну цифру и быть не менее 8 символов']"
          no-error-icon
        >
          <template v-slot:append>
            <q-icon
              v-if="password"
              :name="isPwdVisible ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="isPwdVisible = !isPwdVisible"
            />
          </template>
        </q-input>
        <q-input
          :type="isPwdVisible ? 'text' : 'password'"
          v-model="confirmPassword"
          label="Подтверждение пароля"
          dense
          outlined
          class="q-mb-sm custom-font1"
          placeholder="********"
          :rules="[val => val === password || 'Пароли не совпадают']"
          no-error-icon
        />
      </q-card-section>

      <q-card-actions align="center">
        <q-btn
          color="primary"
          label="Зарегистрироваться"
          @click="onSignUp"
          class="full-width q-mb-sm custom-font bold-button"
          :disable="!isFormValid"
        />
      </q-card-actions>

      <q-card-section class="text-center">
        <q-btn
          color="secondary"
          label="Назад"
          flat
          @click="onReturn"
          class="full-width custom-font bold-button"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import * as api from 'src/api/auth.api';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const $q = useQuasar();

const login = ref('');
const password = ref('');
const confirmPassword = ref('');
const firstname = ref('');
const lastname = ref('');
const isPwdVisible = ref(false);

const isFormValid = computed(() => {
  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;
  return (
    login.value &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(login.value) &&
    password.value &&
    passwordRegex.test(password.value) &&
    confirmPassword.value === password.value &&
    /^[а-яА-ЯёЁa-zA-Z]+$/.test(firstname.value) &&
    /^[а-яА-ЯёЁa-zA-Z]+$/.test(lastname.value)
  );
});

const onReturn = () => {
  router.push({ path: '/login' });
};

const onSignUp = async () => {
  if (!isFormValid.value) {
    $q.notify({
      message: 'Ошибка валидации',
      caption: 'Пожалуйста, проверьте введенные данные.',
      color: 'red',
      icon: 'error',
    });
    return;
  }

  try {
    const response = await api.signup({
      username: login.value,
      password: password.value,
      firstname: firstname.value,
      lastname: lastname.value,
    });

    if (response && response.success) {
      $q.notify({
        message: 'Пользователь успешно создан',
        caption: 'Можете войти в систему',
        color: 'green',
        icon: 'verified',
      });

      setTimeout(() => {
        router.push({ path: '/login' });
      }, 2000);
    } else {
      $q.notify({
        message: 'Создать пользователя не удалось',
        caption: 'Возможно, пользователь с таким логином уже существует. Попробуйте другой.',
        color: 'red',
        icon: 'error',
      });
    }
  } catch (error) {
    console.error('Ошибка регистрации:', error);
    $q.notify({
      message: 'Ошибка регистрации',
      caption: 'Попробуйте позже или обратитесь к администратору.',
      color: 'red',
      icon: 'error',
    });
  }
};
</script>

<style scoped>
.q-page {
  background: linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(148, 210, 255) 60%, rgb(1, 69, 255) 100%);
  background-attachment: fixed;
  min-height: 100vh;
  width: 100%;
  animation: gradientShift 15s ease infinite;
  background-size: 200% 200%;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.my-card {
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 120, 255, 0.15);
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(5px);
  border: 1px solid rgb(255, 255, 255);
}


.gradient-background {
  background: linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(227, 250, 253) 50%, #b2ebf2 100%);
  width: 100%;
  min-height: 100vh;
}

.full-width {
  width: 100%;
}

.bold-button {
  font-weight: bold;
  border-radius: 20px;
}



.q-field__messages {
  margin-bottom: 0;
}

/* Стили для кнопок */
.q-btn--primary {
  background: linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(78, 195, 253) 100%);
  border-radius: 8px;
  border-color:rgb(0, 0, 0);
  color: white;
}

.q-btn--primary:hover {
  background: linear-gradient(135deg, #29b6f6 0%,rgb(78, 195, 253) 100%);
}

.q-btn--secondary {
  color:rgb(6, 116, 172);
}

.q-btn--secondary:hover {
  color: #039be5;
  background: rgba(145, 210, 240, 0.97);
}

/* Стили для полей ввода */
.q-field--outlined .q-field__control {
  border-radius: 8px;
  border-color:rgb(0, 225, 255);
}

.q-field--outlined:hover .q-field__control {
  border-color: #4fc3f7;
}

.q-field--outlined .q-field__control:before {
  border-color: #b2ebf2;
}
</style>

<style>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&display=swap');

.custom-font {
  font-family: 'Playfair+Display', sans-serif;
}

.custom-font1 {
  position: relative;
  top: 12px;
}
body {
  font-family: 'Playfair+Display', sans-serif;
  margin: 0;
  background-attachment: fixed;
  background: transparent !important; 
}
/* Темная тема */
.body--dark .q-page {
  background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%);
}

.body--dark .my-card {
  background: rgba(30, 30, 30, 0.9);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.body--dark .q-card__section,
.body--dark .custom-font {
  color: #e0e0e0;
}

.body--dark .q-field__label {
  color: #b0bec5 !important;
}

.body--dark .q-field__native,
.body--dark .q-field__input {
  color: #ffffff !important;
}

/* Анимация градиента (общая) */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Кнопки (адаптивные под тему) */
.q-btn--primary {
  border-radius: 8px;
}

.body--light .q-btn--primary {
  background: linear-gradient(135deg, #0088cc 0%, #00aaff 100%);
  color: white;
}

.body--dark .q-btn--primary {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
}

.q-btn--secondary {
  border-radius: 8px;
}

.body--light .q-btn--secondary {
  color: #0066cc;
}

.body--dark .q-btn--secondary {
  color: #81d4fa;
}

/* Поля ввода (адаптивные) */
.q-field--outlined .q-field__control {
  border-radius: 8px;
}

.body--light .q-field--outlined .q-field__control {
  border-color: #0088cc;
}

.body--dark .q-field--outlined .q-field__control {
  border-color: rgba(255, 255, 255, 0.2);
}

/* Важно: это гарантирует, что фон не перекроет стили Quasar */
</style>
