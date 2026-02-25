<template>
  <div class="stats-container">
    <div class="stats-header">
      <button @click="goBack" class="btn-back">← Atrás</button>
      <h2 v-if="habit">{{ habit.name }} - Estadísticas</h2>
      <button @click="togglePeriod" class="btn-period">{{ periodLabel }}</button>
    </div>

    <div v-if="loading" class="loading">Cargando estadísticas...</div>

    <div v-else-if="habit && stats" class="stats-content">
      <!-- Tarjetas de estadísticas principales -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value" style="color: #48bb78">{{ stats.totalDaysCompleted }}</div>
          <div class="stat-label">Días Completados</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #f56565">{{ stats.totalDaysIncomplete }}</div>
          <div class="stat-label">Días Incompletos</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #ed8936">{{ stats.completionRate }}%</div>
          <div class="stat-label">Tasa de Éxito</div>
        </div>
        <div class="stat-card">
          <div class="stat-value" style="color: #667eea">{{ stats.streakDays }}</div>
          <div class="stat-label">Racha Actual (días)</div>
        </div>
      </div>

      <!-- Gráfico de progreso semanal -->
      <div class="chart-card">
        <h3>Progreso de la Última Semana</h3>
        <div class="chart-bars">
          <div v-for="day in weeklyProgress" :key="day.date" class="bar-container">
            <div class="bar" :style="{ height: day.percentage + '%', backgroundColor: day.color }"></div>
            <div class="bar-label">{{ day.dayName }}</div>
          </div>
        </div>
      </div>

      <!-- Información detallada -->
      <div class="info-section">
        <div class="info-item">
          <span class="info-label">Última vez completado:</span>
          <span class="info-value">{{ stats.lastCompletedDate || 'Aún no' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Hábito activo:</span>
          <span class="info-value" :class="habit.isActive ? 'active' : 'inactive'">
            {{ habit.isActive ? 'Sí' : 'No' }}
          </span>
        </div>
        <div class="info-item">
          <span class="info-label">Categoría:</span>
          <span class="info-value">{{ getCategoryLabel(habit.category) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Días de repetición:</span>
          <span class="info-value">{{ getDaysLabel(habit.repeatDays) }}</span>
        </div>
      </div>

      <!-- Historial detallado -->
      <div class="history-section">
        <h3>Historial Detallado</h3>
        <div v-if="checkIns.length === 0" class="empty-history">
          No hay registros aún.
        </div>
        <div v-else class="history-list">
          <div
            v-for="checkIn in checkIns.slice(0, 30)"
            :key="checkIn.id"
            :class="['history-item', checkIn.completed ? 'completed' : 'incomplete']"
          >
            <span class="history-date">{{ formatDate(checkIn.date) }}</span>
            <span class="history-status">{{ checkIn.completed ? '✓ Completado' : '✗ No completado' }}</span>
            <span v-if="checkIn.notes" class="history-notes">{{ checkIn.notes }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHabits } from '../composables/useHabits';
import { useCheckIn } from '../composables/useCheckIn';
import { statsService } from '../services/firestoreService';
import type { Habit, HabitStats } from '../types';

const router = useRouter();
const route = useRoute();
const { getHabitById } = useHabits();
const { checkIns, loadCheckIns, loading } = useCheckIn();

const habitId = ref<string | null>(route.params.id as string);
const habit = ref<Habit | null>(null);
const stats = ref<HabitStats | null>(null);
const period = ref<'week' | 'month' | 'year'>('month');

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];

const periodLabel = computed(() => {
  const labels = { week: 'Última Semana', month: 'Último Mes', year: 'Último Año' };
  return labels[period.value];
});

const getCategoryLabel = (category: string): string => {
  const labels: { [key: string]: string } = {
    trabajo: 'Trabajo',
    ejercicio: 'Ejercicio',
    higiene: 'Higiene',
    hobbies: 'Hobbies',
    salud: 'Salud',
    educacion: 'Educación',
    otra: 'Otra',
  };
  return labels[category] || category;
};

const getDaysLabel = (repeatDays: number[]): string => {
  if (repeatDays.length === 7) return 'Todos los días';
  if (repeatDays.length === 0) return 'Sin días';
  return repeatDays.map((d) => days[d]).join(', ');
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const weeklyProgress = computed(() => {
  const lastSevenDays = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    const checkIn = checkIns.value.find((ci) => ci.date === dateString);
    const dayName = days[date.getDay()];
    const isCompleted = checkIn?.completed || false;

    lastSevenDays.push({
      date: dateString,
      dayName,
      percentage: isCompleted ? 100 : checkIn ? 50 : 0,
      color: isCompleted ? '#48bb78' : checkIn ? '#f6ad55' : '#cbd5e0',
    });
  }

  return lastSevenDays;
});

const togglePeriod = () => {
  const periods: Array<'week' | 'month' | 'year'> = ['week', 'month', 'year'];
  const currentIndex = periods.indexOf(period.value);
  period.value = periods[(currentIndex + 1) % periods.length] || 'month';
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  if (habitId.value) {
    const loadedHabit = await getHabitById(habitId.value);
    habit.value = loadedHabit;

    if (loadedHabit) {
      await loadCheckIns(habitId.value);
      const loadedStats = await statsService.calculateStats(habitId.value);
      stats.value = loadedStats;
    }
  }
});
</script>

<style scoped>
.stats-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 1rem;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.btn-back,
.btn-period {
  padding: 0.5rem 1rem;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.btn-back:hover,
.btn-period:hover {
  background: #d0d0d0;
}

.loading {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.stat-label {
  color: #666;
  font-size: 0.9rem;
}

.chart-card {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 1rem;
}

.chart-bars {
  display: flex;
  justify-content: space-around;
  align-items: flex-end;
  height: 200px;
}

.bar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  max-width: 60px;
}

.bar {
  width: 100%;
  min-height: 10px;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
}

.bar:hover {
  opacity: 0.8;
}

.bar-label {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
}

.info-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  border-bottom: 1px solid #eee;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #666;
  font-weight: 600;
}

.info-value {
  color: #333;
  font-weight: 500;
}

.info-value.active {
  color: #48bb78;
}

.info-value.inactive {
  color: #f56565;
}

.history-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.history-section h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 1rem;
}

.empty-history {
  text-align: center;
  color: #999;
  padding: 2rem;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.history-item {
  display: flex;
  gap: 1rem;
  padding: 0.75rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

.history-item.completed {
  background: #c6f6d5;
  color: #22543d;
}

.history-item.incomplete {
  background: #fed7d7;
  color: #742a2a;
}

.history-date {
  font-weight: 600;
  min-width: 120px;
}

.history-status {
  font-weight: 600;
  flex: 1;
}

.history-notes {
  color: #666;
  font-style: italic;
  flex: 1;
}
</style>
