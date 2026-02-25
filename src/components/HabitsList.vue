<template>
  <div class="habits-container">
    <div class="habits-header">
      <h2>Mis Hábitos</h2>
      <div class="header-buttons">
        <router-link to="/calendar" class="btn btn-secondary">📅 Calendario</router-link>
        <router-link to="/habits/new" class="btn btn-primary">+ Nuevo Hábito</router-link>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="loading">Cargando hábitos...</div>

    <!-- Error state -->
    <div v-if="error && !loading" class="error-message">{{ error }}</div>

    <!-- Empty state -->
    <div v-if="!loading && habits.length === 0" class="empty-state">
      <p>No has creado ningún hábito aún.</p>
      <router-link to="/habits/new" class="btn btn-primary">Crear tu primer hábito</router-link>
    </div>

    <!-- Habits grid -->
    <div v-if="!loading && habits.length > 0" class="habits-grid">
      <div
        v-for="habit in habits"
        :key="habit.id"
        class="habit-card"
        :style="{ borderLeftColor: habit.color }"
      >
        <div class="habit-header">
          <h3>{{ habit.name }}</h3>
          <span class="habit-category">{{ getCategoryLabel(habit.category) }}</span>
        </div>

        <p v-if="habit.description" class="habit-description">{{ habit.description }}</p>

        <div class="habit-details">
          <div class="detail-item">
            <span class="detail-label">Días:</span>
            <span class="detail-value">{{ getDaysLabel(habit.repeatDays) }}</span>
          </div>

          <div v-if="habit.scheduleTimes.length > 0" class="detail-item">
            <span class="detail-label">Horarios:</span>
            <span class="detail-value">{{ habit.scheduleTimes.join(', ') }}</span>
          </div>

          <div class="detail-item">
            <span class="detail-label">Estado:</span>
            <span :class="['detail-value', habit.isActive ? 'active' : 'inactive']">
              {{ habit.isActive ? 'Activo' : 'Inactivo' }}
            </span>
          </div>
        </div>

        <div class="habit-actions">
          <router-link :to="`/habits/${habit.id}`" class="btn-action btn-edit">Editar</router-link>
          <router-link :to="`/habits/${habit.id}/checkin`" class="btn-action btn-checkin">
            Check-in
          </router-link>
          <router-link :to="`/habits/${habit.id}/timer`" class="btn-action btn-timer">
            ⏱️ Timer
          </router-link>
          <router-link :to="`/habits/${habit.id}/stats`" class="btn-action btn-stats">
            Estadísticas
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useHabits } from '../composables/useHabits';

const { habits, loading, error, loadHabits } = useHabits();

const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sab'];

const getDaysLabel = (repeatDays: number[]): string => {
  if (repeatDays.length === 7) return 'Todos los días';
  if (repeatDays.length === 0) return 'Sin días';
  return repeatDays.map((d) => days[d]).join(', ');
};

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

onMounted(() => {
  loadHabits();
});
</script>

<style scoped>
.habits-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.habits-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.habits-header h2 {
  color: #333;
  margin: 0;
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

.btn {
  padding: 0.75rem 1.5rem;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  text-decoration: none;
  display: inline-block;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.3s ease;
}

.btn:hover {
  background: #5568d3;
}

.btn-primary {
  background: #667eea;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #48bb78;
}

.btn-secondary:hover {
  background: #38a169;
}

.loading,
.empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.empty-state {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state p {
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.habits-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.habit-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  border-left: 4px solid #667eea;
  display: flex;
  flex-direction: column;
}

.habit-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.habit-header {
  padding: 1.5rem;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.habit-header h3 {
  color: #333;
  margin: 0;
  flex: 1;
}

.habit-category {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #f0f0ff;
  color: #667eea;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  white-space: nowrap;
}

.habit-description {
  padding: 0 1.5rem;
  margin-top: 0.75rem;
  color: #666;
  font-size: 0.95rem;
}

.habit-details {
  padding: 1rem 1.5rem;
  flex: 1;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
}

.detail-label {
  color: #999;
  font-weight: 600;
}

.detail-value {
  color: #333;
}

.detail-value.active {
  color: #48bb78;
  font-weight: 600;
}

.detail-value.inactive {
  color: #f56565;
  font-weight: 600;
}

.habit-actions {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid #eee;
}

.btn-action {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  text-decoration: none;
  color: #667eea;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s ease;
  display: inline-block;
}

.btn-action:hover {
  background: #f5f5ff;
}

.btn-edit {
  border-color: #667eea;
}

.btn-checkin {
  border-color: #48bb78;
  color: #48bb78;
}

.btn-timer {
  border-color: #ed8936;
  color: #ed8936;
}

.btn-stats {
  border-color: #9f7aea;
  color: #9f7aea;
}
</style>
