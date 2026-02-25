import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('../components/Login.vue') },
  { path: '/register', component: () => import('../components/Register.vue') },
  {
    path: '/',
    component: () => import('../components/HabitsList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/habits',
    component: () => import('../components/HabitsList.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/calendar',
    component: () => import('../components/HabitCalendar.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/notifications',
    component: () => import('../components/NotificationSettings.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/habits/new',
    component: () => import('../components/HabitForm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/habits/:id',
    component: () => import('../components/HabitForm.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/habits/:id/checkin',
    component: () => import('../components/CheckInView.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/habits/:id/stats',
    component: () => import('../components/HabitStats.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/habits/:id/timer',
    component: () => import('../components/TimerView.vue'),
    meta: { requiresAuth: true },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Guard de navegación para proteger rutas autenticadas
router.beforeEach((to, from, next) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading.value) {
    // Esperar a que se cargue el estado de autenticación
    setTimeout(() => {
      router.beforeEach((to, from, next) => {
        const { isAuthenticated } = useAuth();
        const requiresAuth = to.meta?.requiresAuth;

        if (requiresAuth && !isAuthenticated.value) {
          next('/login');
        } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated.value) {
          next('/');
        } else {
          next();
        }
      });
      next();
    }, 100);
  } else {
    const requiresAuth = to.meta.requiresAuth;

    if (requiresAuth && !isAuthenticated.value) {
      next('/login');
    } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated.value) {
      next('/');
    } else {
      next();
    }
  }
});

export default router;
