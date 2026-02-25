import { ref, computed } from 'vue';
import { checkInService } from '../services/firestoreService';
import type { HabitCheckIn } from '../types';
import { useAuth } from './useAuth';

interface CheckInState {
  checkIns: HabitCheckIn[];
  loading: boolean;
  error: string | null;
}

const state = ref<CheckInState>({
  checkIns: [],
  loading: false,
  error: null,
});

export function useCheckIn() {
  const { currentUser } = useAuth();
  const checkIns = computed(() => state.value.checkIns);
  const loading = computed(() => state.value.loading);
  const error = computed(() => state.value.error);

  const loadCheckIns = async (habitId: string) => {
    state.value.loading = true;
    state.value.error = null;
    try {
      const fetchedCheckIns = await checkInService.getHabitCheckIns(habitId);
      state.value.checkIns = fetchedCheckIns;
    } catch (err: any) {
      state.value.error = err.message || 'Error al cargar registros';
      console.error('Error loading check-ins:', err);
    } finally {
      state.value.loading = false;
    }
  };

  const createCheckIn = async (habitId: string, date: string, completed: boolean) => {
    if (!currentUser.value) return;

    state.value.loading = true;
    state.value.error = null;
    try {
      // Verificar si ya existe un check-in para este día
      const existingCheckIn = await checkInService.getDayCheckIn(habitId, date);

      if (existingCheckIn) {
        // Actualizar el existente
        await checkInService.updateCheckIn(existingCheckIn.id, { completed });
      } else {
        // Crear uno nuevo
        await checkInService.createCheckIn(currentUser.value.uid, habitId, {
          date,
          completed,
        });
      }

      await loadCheckIns(habitId);
    } catch (err: any) {
      state.value.error = err.message || 'Error al guardar check-in';
      console.error('Error creating check-in:', err);
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  const getCheckInForDate = (date: string): HabitCheckIn | undefined => {
    return state.value.checkIns.find((ci) => ci.date === date);
  };

  const getCheckInsInRange = async (
    habitId: string,
    startDate: string,
    endDate: string
  ): Promise<HabitCheckIn[]> => {
    state.value.loading = true;
    state.value.error = null;
    try {
      return await checkInService.getCheckInsInRange(habitId, startDate, endDate);
    } catch (err: any) {
      state.value.error = err.message || 'Error al cargar rango de registros';
      console.error('Error getting check-ins in range:', err);
      return [];
    } finally {
      state.value.loading = false;
    }
  };

  const deleteCheckIn = async (checkInId: string) => {
    state.value.loading = true;
    state.value.error = null;
    try {
      await checkInService.deleteCheckIn(checkInId);
    } catch (err: any) {
      state.value.error = err.message || 'Error al eliminar check-in';
      console.error('Error deleting check-in:', err);
      throw err;
    } finally {
      state.value.loading = false;
    }
  };

  return {
    checkIns,
    loading,
    error,
    loadCheckIns,
    createCheckIn,
    getCheckInForDate,
    getCheckInsInRange,
    deleteCheckIn,
  };
}
