import { ref, computed } from 'vue';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
} from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

const state = ref<AuthState>({
  user: null,
  loading: true,
  error: null,
});

// Inicializar el estado de autenticación
onAuthStateChanged(auth, (user) => {
  state.value.user = user;
  state.value.loading = false;
});

export function useAuth() {
  const currentUser = computed(() => state.value.user);
  const isAuthenticated = computed(() => !!state.value.user);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);

  const register = async (email: string, password: string) => {
    state.value.error = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      state.value.user = userCredential.user;
      return userCredential.user;
    } catch (err: any) {
      state.value.error = err.message || 'Error al registrarse';
      throw err;
    }
  };

  const login = async (email: string, password: string) => {
    state.value.error = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      state.value.user = userCredential.user;
      return userCredential.user;
    } catch (err: any) {
      state.value.error = err.message || 'Error al iniciar sesión';
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    state.value.error = null;
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      state.value.user = userCredential.user;
      return userCredential.user;
    } catch (err: any) {
      state.value.error = err.message || 'Error al iniciar sesión con Google';
      throw err;
    }
  };

  const logout = async () => {
    state.value.error = null;
    try {
      await signOut(auth);
      state.value.user = null;
    } catch (err: any) {
      state.value.error = err.message || 'Error al cerrar sesión';
      throw err;
    }
  };

  return {
    currentUser,
    isAuthenticated,
    loading,
    error,
    register,
    login,
    loginWithGoogle,
    logout,
  };
}
