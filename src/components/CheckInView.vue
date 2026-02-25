<template>
  <div class="checkin-container">
    <div class="checkin-header">
      <button @click="goBack" class="btn-back">← Atrás</button>
      <h2 v-if="habit">{{ habit.name }} - Check-ins</h2>
      <div style="width: 60px"></div>
    </div>

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-else-if="habit" class="checkin-content">
      <!-- Controles de mes/año -->
      <div class="month-controls">
        <button @click="previousMonth" class="btn-nav">← Anterior</button>
        <h3>{{ monthYearDisplay }}</h3>
        <button @click="nextMonth" class="btn-nav">Siguiente →</button>
      </div>

      <!-- Calendario de check-ins -->
      <div class="calendar">
        <!-- Encabezado de días de la semana -->
        <div class="calendar-header">
          <div v-for="day in daysOfWeek" :key="day" class="day-name">
            {{ day }}
          </div>
        </div>

        <!-- Días del mes -->
        <div class="calendar-days">
          <button
            v-for="day in daysInMonth"
            :key="day"
            :class="[
              'calendar-day',
              getCheckInForDay(day)?.completed ? 'completed' : 'incomplete',
              isToday(day) ? 'today' : '',
              !isDayAllowed(day) ? 'future' : '',
            ]"
            :disabled="!isDayAllowed(day)"
            @click="toggleDay(day)"
          >
            <span class="day-number">{{ day }}</span>
            <span v-if="getCheckInForDay(day)" class="day-status">
              {{ getCheckInForDay(day)?.completed ? '✓' : '✗' }}
            </span>
          </button>
        </div>
      </div>

      <!-- Estadísticas del mes -->
      <div class="month-stats">
        <div class="stat">
          <span class="stat-label">Completados:</span>
          <span class="stat-value completed">{{ monthCompleted }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Incompletos:</span>
          <span class="stat-value incomplete">{{ monthIncomplete }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Tasa de éxito:</span>
          <span class="stat-value">{{ monthSuccessRate }}%</span>
        </div>
      </div>

      <!-- Notas de la sesión (distracción) -->
      <div class="notes-section">
        <h3>Notas de hoy</h3>
        <textarea
          v-model="sessionNotes"
          placeholder="Anota cualquier pensamiento o distracción relacionado con este hábito..."
          class="notes-input"
        ></textarea>
        <button @click="saveSessionNotes" class="btn btn-secondary">Guardar Notas</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHabits } from '../composables/useHabits';
import { useCheckIn } from '../composables/useCheckIn';
import { useAuth } from '../composables/useAuth';
import { distractionService } from '../services/firestoreService';
import type { Habit } from '../types';

const router = useRouter();
const route = useRoute();
const { getHabitById } = useHabits();
const { checkIns, loadCheckIns, createCheckIn, getCheckInForDate, loading } = useCheckIn();
const { currentUser } = useAuth();

const habitId = ref<string | null>(route.params.id as string);
const habit = ref<Habit | null>(null);
const currentMonth = ref(new Date());
const sessionNotes = ref('');
const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];

const monthYearDisplay = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  };
  return currentMonth.value.toLocaleDateString('es-ES', options);
});

const daysInMonth = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysCount = lastDay.getDate();

  // Obtener el día de la semana del primer día (0 = domingo)
  const startingDayOfWeek = firstDay.getDay();

  // Array de números para los días (incluyendo espacios antes del primer día)
  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(0);
  }
  for (let i = 1; i <= daysCount; i++) {
    days.push(i);
  }
  return days;
});

const getDateString = (day: number): string => {
  const year = currentMonth.value.getFullYear();
  const month = String(currentMonth.value.getMonth() + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

const getCheckInForDay = (day: number) => {
  if (day === 0) return null;
  return getCheckInForDate(getDateString(day));
};

const isToday = (day: number): boolean => {
  if (day === 0) return false;
  const today = new Date();
  return (
    day === today.getDate() &&
    currentMonth.value.getMonth() === today.getMonth() &&
    currentMonth.value.getFullYear() === today.getFullYear()
  );
};

const isDayAllowed = (day: number): boolean => {
  if (day === 0) return false;
  const selectedDate = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    day
  );
  return selectedDate <= new Date();
};

const toggleDay = async (day: number) => {
  if (!habitId.value || day === 0 || !isDayAllowed(day)) return;

  const dateString = getDateString(day);
  const existingCheckIn = getCheckInForDate(dateString);
  const completed = !existingCheckIn?.completed || !existingCheckIn;

  try {
    await createCheckIn(habitId.value, dateString, completed);
  } catch (err) {
    console.error('Error toggling day:', err);
  }
};

const previousMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1
  );
};

const nextMonth = () => {
  const nextDate = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1
  );
  const today = new Date();
  if (nextDate <= today) {
    currentMonth.value = nextDate;
  }
};

const monthCompleted = computed(() => {
  return checkIns.value.filter((ci) => {
    const ciDate = new Date(ci.date);
    return (
      ci.completed &&
      ciDate.getMonth() === currentMonth.value.getMonth() &&
      ciDate.getFullYear() === currentMonth.value.getFullYear()
    );
  }).length;
});

const monthIncomplete = computed(() => {
  return checkIns.value.filter((ci) => {
    const ciDate = new Date(ci.date);
    return (
      !ci.completed &&
      ciDate.getMonth() === currentMonth.value.getMonth() &&
      ciDate.getFullYear() === currentMonth.value.getFullYear()
    );
  }).length;
});

const monthSuccessRate = computed(() => {
  const total = monthCompleted.value + monthIncomplete.value;
  return total === 0 ? 0 : Math.round((monthCompleted.value / total) * 100);
});

const saveSessionNotes = async () => {
  if (!habitId.value || !sessionNotes.value || !currentUser.value) return;

  try {
    await distractionService.createDistraction(
      currentUser.value.uid,
      habitId.value,
      sessionNotes.value
    );
    sessionNotes.value = '';
    alert('Notas guardadas exitosamente');
  } catch (err) {
    console.error('Error saving notes:', err);
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  if (habitId.value) {
    const loadedHabit = await getHabitById(habitId.value);
    habit.value = loadedHabit;
    await loadCheckIns(habitId.value);
  }
});
</script>

<style scoped>
.checkin-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.checkin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-back {
  padding: 0.5rem 1rem;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-back:hover {
  background: #d0d0d0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.checkin-content {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.month-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.month-controls h3 {
  color: #333;
  margin: 0;
  flex: 1;
  text-align: center;
}

.btn-nav {
  padding: 0.5rem 1rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-nav:hover {
  background: #5568d3;
}

.calendar {
  margin-bottom: 2rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
}

.calendar-header {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #f5f5f5;
  border-bottom: 1px solid #ddd;
}

.day-name {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #666;
}

.calendar-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.calendar-day {
  aspect-ratio: 1;
  border: 1px solid #eee;
  background: white;
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  border: none;
}

.calendar-day:hover:not(:disabled) {
  background: #f5f5f5;
}

.calendar-day.completed {
  background: #c6f6d5;
  color: #22543d;
}

.calendar-day.incomplete {
  background: #fed7d7;
  color: #742a2a;
}

.calendar-day.today {
  box-shadow: inset 0 0 0 2px #667eea;
}

.calendar-day.future {
  background: #f9f9f9;
  color: #999;
  cursor: not-allowed;
}

.calendar-day.future:hover {
  background: #f9f9f9;
}

.day-number {
  font-weight: 600;
}

.day-status {
  font-size: 0.7rem;
  margin-top: 2px;
}

.month-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
}

.stat-value.completed {
  color: #22863a;
}

.stat-value.incomplete {
  color: #cb2431;
}

.notes-section {
  border-top: 1px solid #eee;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
}

.notes-section h3 {
  color: #333;
  margin-top: 0;
}

.notes-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  box-sizing: border-box;
  margin-bottom: 1rem;
}

.notes-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>
