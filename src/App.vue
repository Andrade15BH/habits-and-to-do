<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth';

const router = useRouter();
const { currentUser, logout } = useAuth();

const handleLogout = async () => {
  try {
    await logout();
    router.push('/login');
  } catch (err) {
    console.error('Error al cerrar sesión:', err);
  }
};
</script>

<template>
  <div id="app" class="app-container">
    <!-- Header con usuario y logout -->
    <header class="app-header" v-if="$route.path !== '/login' && $route.path !== '/register'">
      <div class="header-content">
        <h1 class="app-title">📅 Mis Hábitos</h1>
        <div class="user-section">
          <span v-if="currentUser" class="user-email">{{ currentUser.email }}</span>
          <button @click="handleLogout" class="btn-logout">Salir</button>
        </div>
      </div>
    </header>

    <!-- Contenedor de rutas -->
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.app-title {
  font-size: 1.5rem;
  color: #333;
  margin: 0;
}

.user-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-email {
  color: #666;
  font-size: 0.9rem;
}

.btn-logout {
  padding: 0.5rem 1rem;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn-logout:hover {
  background: #e53e3e;
}

.app-main {
  flex: 1;
  padding: 2rem 1rem;
}
</style>
