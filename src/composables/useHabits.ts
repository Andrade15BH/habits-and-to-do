import { ref, computed } from 'vue';
import { habitService, categoryService, checkInService } from '../services/firestoreService';
import type { Habit, Category } from '../types';
import { useAuth } from './useAuth';

interface HabitsState {
  habits: Habit[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const state = ref<HabitsState>({
  habits: [],
  categories: [],
  loading: false,
  error: null,
});

export function useHabits() {
  const { currentUser } = useAuth();
  const habits = computed(() => state.value.habits);
  const categories = computed(() => state.value.categories);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);

  const loadHabits = async () => {
    if (!currentUser.value) return;
    state.value.loading = true;
    state.value.error = null;
    try {
      const fetchedHabits = await habitService.getUserHabits(currentUser.value.uid);
      state.value.habits = fetchedHabits;
    } catch (err: any) {
      state.value.error = err.message || 'Error al cargar hábitos';
      console.error('Error loading habits:', err);
    } finally {
      state.value.loading = false;
    }
  };

  const loadCategories = async () => {
    if (!currentUser.value) return;
    state.value.loading = true;
    state.value.error = null;
    try {
      const fetchedCategories = await categoryService.getUserCategories(
        currentUser.value.uid
      );
      state.value.categories = fetchedCategories;
    } catch (err: any) {
      state.value.error = err.message || 'Error al cargar categorías';
      console.error('Error loading categories:', err);
    } finally {
      state.value.loading = false;
    }
  };

  const createHabit = async (habitData: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!currentUser.value) return;
    state.value.loading = true;
    state.value.error = null;
    console.log('Creating habit with data:', currentUser.value.uid, habitData);
    try {
      const habitId = await habitService.createHabit(currentUser.value.uid, habitData);
      await loadHabits();
      return habitId;
    } catch (err: any) {
      state.value.error = err.message || 'Error al crear hábito';
      console.error('Error creating habit:', err);
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const updateHabit = async (habitId: string, data: Partial<Habit>) => {
    state.value.loading = true;
    state.value.error = null;
    try {
      await habitService.updateHabit(habitId, data);
      await loadHabits();
    } catch (err: any) {
      state.value.error = err.message || 'Error al actualizar hábito';
      console.error('Error updating habit:', err);
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const deleteHabit = async (habitId: string) => {
    state.value.loading = true;
    state.value.error = null;
    try {
      await habitService.deleteHabit(habitId);
      await loadHabits();
    } catch (err: any) {
      state.value.error = err.message || 'Error al eliminar hábito';
      console.error('Error deleting habit:', err);
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const createCategory = async (categoryData: Omit<Category, 'id' | 'userId' | 'createdAt'>) => {
    if (!currentUser.value) return;
    state.value.loading = true;
    state.value.error = null;
    try {
      await categoryService.createCategory(currentUser.value.uid, categoryData);
      await loadCategories();
    } catch (err: any) {
      state.value.error = err.message || 'Error al crear categoría';
      console.error('Error creating category:', err);
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const getHabitById = async (habitId: string): Promise<Habit | null> => {
    try {
      return await habitService.getHabit(habitId);
    } catch (err: any) {
      state.value.error = err.message || 'Error al obtener hábito';
      console.error('Error getting habit:', err);
      return null;
    }
  };

  return {
    habits,
    categories,
    loading,
    error,
    loadHabits,
    loadCategories,
    createHabit,
    updateHabit,
    deleteHabit,
    createCategory,
    getHabitById,
  };
}
