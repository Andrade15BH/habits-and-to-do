<template>
  <div class="auth-container">
    <div class="auth-card">
      <h1>Iniciar Sesión</h1>
      
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label for="email">Correo Electrónico</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            required
          />
        </div>

        <div class="form-group">
          <label for="password">Contraseña</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="tu contraseña"
            required
          />
        </div>

        <button type="submit" :disabled="loading" class="btn btn-primary">
          {{ loading ? 'Cargando...' : 'Iniciar Sesión' }}
        </button>
      </form>

      <div class="divider">O</div>

      <button @click="handleGoogleLogin" :disabled="loading" class="btn btn-google">
        <span>🔐 Iniciar con Google</span>
      </button>

      <p v-if="error" class="error-message">{{ error }}</p>

      <p class="auth-link">
        ¿No tienes cuenta?
        <router-link to="/register">Registrate aquí</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';

const router = useRouter();
const { login, loginWithGoogle, loading, error } = useAuth();

const email = ref('');
const password = ref('');

const handleLogin = async () => {
  try {
    await login(email.value, password.value);
    router.push('/');
  } catch (err) {
    // Error es manejado por el composable
  }
};

const handleGoogleLogin = async () => {
  try {
    await loginWithGoogle();
    router.push('/');
  } catch (err) {
    // Error es manejado por el composable
  }
};
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.auth-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 400px;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  width: 100%;
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #667eea;
  color: white;
  margin-top: 1rem;
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-google {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  margin-top: 1rem;
}

.btn-google:hover:not(:disabled) {
  background: #efefef;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #999;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: 4px;
  margin-top: 1rem;
  font-size: 0.9rem;
}

.auth-link {
  text-align: center;
  margin-top: 1.5rem;
  color: #666;
}

.auth-link a {
  color: #667eea;
  text-decoration: none;
  font-weight: 600;
}

.auth-link a:hover {
  text-decoration: underline;
}
</style>
