import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      // Добавляем перенаправление с корневого пути на биржу
      { path: '', redirect: '/marketplace' }, // Перенаправление на /marketplace по умолчанию
      { path: 'teams', component: () => import('pages/Team/TeamsPage.vue') },
      { path: 'ideas', component: () => import('pages/Idei/IdeiPage.vue') },
      { path: 'marketplace', component: () => import('pages/Exchange/ExchangePage.vue') },
      { path: 'admin', component: () => import('pages/AdminPage.vue')},
      { path: 'projects', component: () => import('pages/Project/IndexPage.vue') },
      { path: 'users', component: () => import('pages/UsersPage.vue') },
      { path: 'users/:id', component: () => import('pages/UserEditPage.vue') },
      { path: 'tasks', component: () => import('pages/TasksPage.vue') },
    ],
  },
  {
    path: '/login',
    component: () => import('layouts/ServiceLayout.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }],
  },
  {
    path: '/signup',
    component: () => import('layouts/ServiceLayout.vue'),
    children: [{ path: '', component: () => import('pages/SignupPage.vue') }],
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;