<template>
  <div class="calendar-container">
    <div class="calendar-header">
      <button @click="previousMonth" class="btn-nav">← Anterior</button>
      <h2>{{ monthYearDisplay }}</h2>
      <button @click="nextMonth" class="btn-nav">Siguiente →</button>
    </div>

    <!-- Filtro de hábitos -->
    <div class="filters">
      <label>
        <input type="checkbox" v-model="showAllHabits" /> Mostrar todos los hábitos
      </label>
      <div v-if="!showAllHabits && habits.length > 0" class="habit-filters">
        <label v-for="habit in habits" :key="habit.id" class="habit-filter">
          <input
            type="checkbox"
            :value="habit.id"
            :checked="filteredHabitIds.includes(habit.id)"
            @change="toggleHabitFilter"
          />
          <span class="filter-label" :style="{ borderLeftColor: habit.color }">
            {{ habit.name }}
          </span>
        </label>
      </div>
    </div>

    <!-- Calendario -->
    <div class="calendar">
      <!-- Encabezado de días -->
      <div class="calendar-weekdays">
        <div v-for="day in daysOfWeek" :key="day" class="weekday">{{ day }}</div>
      </div>

      <!-- Días del calendario -->
      <div class="calendar-grid">
        <div
          v-for="day in calendarDays"
          :key="`${day.date}-${day.dayOfWeek}`"
          :class="['calendar-cell', { empty: !day.date, today: day.isToday }]"
        >
          <div v-if="day.date" class="cell-content">
            <div class="cell-date">{{ day.date }}</div>

            <!-- Mostrar hábitos programados para este día -->
            <div
              v-for="habit in getHabitsForDay(day.date, day.dayOfWeek)"
              :key="habit.id"
              :class="['habit-dot', getCheckInStatus(habit.id, day.date)]"
              :style="{ backgroundColor: habit.color }"
              :title="habit.name"
              @click="openHabitCheckIn(habit.id)"
            >
              <span class="dot-label">{{ habit.name.substring(0, 1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Leyenda -->
    <div class="legend">
      <div class="legend-item">
        <div class="legend-color completed"></div>
        <span>Completado</span>
      </div>
      <div class="legend-item">
        <div class="legend-color incomplete"></div>
        <span>Incompleto</span>
      </div>
      <div class="legend-item">
        <div class="legend-color pending"></div>
        <span>Pendiente</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useHabits } from '../composables/useHabits';
import { useCheckIn } from '../composables/useCheckIn';
import type { Habit } from '../types';

const router = useRouter();
const { habits, loadHabits } = useHabits();
const { checkIns, loadCheckIns, getCheckInForDate } = useCheckIn();

const currentMonth = ref(new Date());
const showAllHabits = ref(true);
const filteredHabitIds = ref<string[]>([]);
const loadedHabitsCheckIns = ref<{ [habitId: string]: boolean }>({});

const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];

const monthYearDisplay = computed(() => {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  };
  return currentMonth.value.toLocaleDateString('es-ES', options);
});

interface CalendarDay {
  date: number | null;
  dayOfWeek: number;
  isToday: boolean;
}

const calendarDays = computed(() => {
  const year = currentMonth.value.getFullYear();
  const month = currentMonth.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysCount = lastDay.getDate();

  const startingDayOfWeek = firstDay.getDay();
  const days: CalendarDay[] = [];

  // Días vacíos al inicio
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push({ date: null, dayOfWeek: i, isToday: false });
  }

  // Días del mes
  const today = new Date();
  for (let i = 1; i <= daysCount; i++) {
    const isToday =
      i === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear();
    days.push({
      date: i,
      dayOfWeek: (startingDayOfWeek + i - 1) % 7,
      isToday,
    });
  }

  return days;
});

const getDateString = (day: number): string => {
  const year = currentMonth.value.getFullYear();
  const month = String(currentMonth.value.getMonth() + 1).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  return `${year}-${month}-${dayStr}`;
};

const getHabitsForDay = (day: number, dayOfWeek: number): Habit[] => {
  const habitsToShow = showAllHabits.value ? habits.value : habits.value.filter((h) =>
    filteredHabitIds.value.includes(h.id)
  );

  return habitsToShow.filter(
    (habit) =>
      habit.isActive &&
      habit.repeatDays.includes(dayOfWeek)
  );
};

const getCheckInStatus = (habitId: string, day: number): string => {
  const dateString = getDateString(day);
  let checkIn: any = null;

  // Buscar en el estado local
  if (loadedHabitsCheckIns.value[habitId]) {
    checkIn = checkIns.value.find((ci) => ci.habitId === habitId && ci.date === dateString);
  }

  if (!checkIn) return 'pending';
  return checkIn.completed ? 'completed' : 'incomplete';
};

const openHabitCheckIn = (habitId: string) => {
  router.push(`/habits/${habitId}/checkin`);
};

const previousMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() - 1
  );
};

const nextMonth = () => {
  currentMonth.value = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth() + 1
  );
};

const toggleHabitFilter = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const habitId = target.value;
  if (target.checked) {
    if (!filteredHabitIds.value.includes(habitId)) {
      filteredHabitIds.value.push(habitId);
    }
  } else {
    filteredHabitIds.value = filteredHabitIds.value.filter((id) => id !== habitId);
  }
};

onMounted(async () => {
  await loadHabits();

  // Cargar check-ins para todos los hábitos
  for (const habit of habits.value) {
    await loadCheckIns(habit.id);
    loadedHabitsCheckIns.value[habit.id] = true;
  }

  // Inicializar filtro con todos los hábitos
  filteredHabitIds.value = habits.value.map((h) => h.id);
});
</script>

<style scoped>
.calendar-container {
  max-width: 1000px;
  margin: 50px auto;
  padding: 0 1rem;
}

.calendar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.calendar-header h2 {
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

.filters {
  background: #212121;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.filters label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 1rem;
}

.filters input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.habit-filters {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 0.5rem;
  margin-top: 1rem;
}

.habit-filter {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  border-left: 3px solid;
}

.habit-filter input[type='checkbox'] {
  width: 16px;
  height: 16px;
}

.filter-label {
  font-size: 0.9rem;
  flex: 1;
}

.calendar {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.calendar-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  background: #212121;
  border-bottom: 2px solid #ddd;
}

.weekday {
  padding: 1rem;
  text-align: center;
  font-weight: 600;
  color: #ffffff;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0;
  border-collapse: collapse;
}

.calendar-cell {
  aspect-ratio: 1.2;
  border: 1px solid #eee;
  padding: 0.5rem;
  position: relative;
  background: #212121;
  min-height: 100px;
  overflow-y: auto;
}

.calendar-cell.empty {
  background: #f9f9f9;
}

.calendar-cell.today {
  background: #fffccc;
  box-shadow: inset 0 0 0 2px #726b43;
}

.cell-content {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.cell-date {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.9rem;
}

.habit-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: white;
  font-weight: 600;
  font-size: 0.7rem;
  cursor: pointer;
  transition: all 0.2s ease;
  opacity: 0.8;
}

.habit-dot:hover {
  opacity: 1;
  transform: scale(1.1);
}

.habit-dot.completed {
  opacity: 1;
}

.habit-dot.incomplete {
  filter: grayscale(100%);
  opacity: 0.5;
}

.habit-dot.pending {
  opacity: 0.3;
  border: 2px solid currentColor;
}

.dot-label {
  font-size: 0.65rem;
}

.legend {
  display: flex;
  gap: 2rem;
  margin-top: 2rem;
  padding: 1rem;
  background: #212121;;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  opacity: 0.8;
}

.legend-color.completed {
  background: #c6f6d5;
}

.legend-color.incomplete {
  background: #fed7d7;
}

.legend-color.pending {
  background: #e0e0e0;
}
</style>
