<template>
  <div class="timer-container">
    <div class="timer-header">
      <button @click="goBack" class="btn-back">← Atrás</button>
      <h2 v-if="habit">{{ habit.name }} - Temporizador</h2>
      <div class="timer-tabs">
        <button
          :class="['tab', { active: activeTab === 'timer' }]"
          @click="activeTab = 'timer'"
        >
          ⏱️ Temporizador
        </button>
        <button
          :class="['tab', { active: activeTab === 'pomodoro' }]"
          @click="activeTab = 'pomodoro'"
        >
          🍅 Pomodoro
        </button>
        <button
          :class="['tab', { active: activeTab === 'distraction' }]"
          @click="activeTab = 'distraction'"
        >
          💭 Distracciones
        </button>
      </div>
    </div>

    <!-- TAB: Temporizador Simple -->
    <section v-if="activeTab === 'timer'" class="timer-content">
      <div class="timer-display">
        <div class="time">{{ timeDisplay }}</div>
        <div class="controls">
          <button
            @click="toggleTimer"
            :class="['btn btn-primary', { running: isRunning }]"
          >
            {{ isRunning ? 'Pausar' : 'Iniciar' }}
          </button>
          <button @click="resetTimer" class="btn btn-secondary">Reset</button>
          <button @click="markAsCompleted" class="btn btn-success">Marcar como Hecho</button>
        </div>
      </div>

      <div class="timer-settings">
        <label>
          Duración (minutos):
          <input
            v-model.number="timerMinutes"
            type="number"
            min="1"
            max="120"
            :disabled="isRunning"
          />
        </label>
      </div>

      <div class="timer-info">
        <p>⏱️ Usa este temporizador para medir cuánto tiempo dedicas a tu hábito.</p>
      </div>
    </section>

    <!-- TAB: Pomodoro -->
    <section v-if="activeTab === 'pomodoro'" class="timer-content">
      <div class="pomodoro-display">
        <div class="time">{{ pomodoroTimeDisplay }}</div>
        <div class="pomodoro-status">
          {{ pomodoroSession.isWorkSession ? 'Trabajo' : 'Descanso' }} - Pomodoro
          {{ pomodoroSession.completedPomodoros + 1 }}
        </div>

        <div class="controls">
          <button
            @click="togglePomodoro"
            :class="['btn btn-primary', { running: isPomodoroRunning }]"
          >
            {{ isPomodoroRunning ? 'Pausar' : 'Iniciar' }}
          </button>
          <button @click="resetPomodoro" class="btn btn-secondary">Reset</button>
          <button @click="completePomodoro" class="btn btn-success">Pomodoro Completado</button>
        </div>
      </div>

      <div class="pomodoro-info">
        <h4>Técnica Pomodoro</h4>
        <ul>
          <li>Trabaja intensamente durante 25 minutos</li>
          <li>Descansa 5 minutos</li>
          <li>Después de 4 pomodoros, descansa 15 minutos</li>
        </ul>
        <p>Pomodoros completados: {{ pomodoroSession.completedPomodoros }}</p>
      </div>
    </section>

    <!-- TAB: Pantalla de Distracciones -->
    <section v-if="activeTab === 'distraction'" class="distraction-content">
      <div class="distraction-card">
        <h3>💭 Bloc de Distracciones</h3>
        <p>Anota aquí cualquier pensamiento o tarea que se cruce en tu mente mientras trabajas en
          tu hábito. Esto te ayuda a mantener la concentración.</p>

        <textarea
          v-model="distractionNote"
          placeholder="Escriba su pensamiento aquí... Ej: 'Debo llamar a mamá cuando termine'"
          class="distraction-input"
        ></textarea>

        <div class="distraction-buttons">
          <button @click="addDistraction" class="btn btn-primary">Agregar Distracción</button>
          <button @click="clearDistraction" class="btn btn-secondary">Limpiar</button>
        </div>

        <!-- Lista de distracciones guardadas -->
        <div v-if="distractions.length > 0" class="distractions-list">
          <h4>Distracciones Guardadas</h4>
          <div
            v-for="distraction in distractions"
            :key="distraction.id"
            class="distraction-item"
          >
            <p>{{ distraction.content }}</p>
            <small>{{ formatDate(distraction.createdAt) }}</small>
            <button @click="deleteDistraction(distraction.id)" class="btn-delete">×</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Resumen de sesión -->
    <section class="session-summary">
      <h3>Resumen de Sesión</h3>
      <div class="summary-stats">
        <div class="summary-item">
          <span>Tiempo en temporizador:</span>
          <span>{{ sessionStats.timerTime }} minutos</span>
        </div>
        <div class="summary-item">
          <span>Pomodoros completados:</span>
          <span>{{ sessionStats.pomodoros }}</span>
        </div>
        <div class="summary-item">
          <span>Distracciones anotadas:</span>
          <span>{{ distractions.length }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHabits } from '../composables/useHabits';
import { useAuth } from '../composables/useAuth';
import { distractionService, pomodoroService, checkInService } from '../services/firestoreService';
import type { Habit, DistractionNote } from '../types';

const router = useRouter();
const route = useRoute();
const { getHabitById } = useHabits();
const { currentUser } = useAuth();

const habitId = ref<string | null>(route.params.id as string);
const habit = ref<Habit | null>(null);

// Tabs
const activeTab = ref<'timer' | 'pomodoro' | 'distraction'>('timer');

// Timer simple
const timerMinutes = ref(25);
const timerSeconds = ref(0);
const isRunning = ref(false);
let timerInterval: number | null = null;

// Pomodoro
const WORK_TIME = 25 * 60; // 25 minutos en segundos
const BREAK_TIME = 5 * 60; // 5 minutos
const LONG_BREAK_TIME = 15 * 60; // 15 minutos

const pomodoroSeconds = ref(WORK_TIME);
const isPomodoroRunning = ref(false);
let pomodoroInterval: number | null = null;

const pomodoroSession = ref({
  completedPomodoros: 0,
  isWorkSession: true,
});

// Distracciones
const distractionNote = ref('');
const distractions = ref<DistractionNote[]>([]);

// Sesión
const sessionStats = ref({
  timerTime: 0,
  pomodoros: 0,
});

const timeDisplay = computed(() => {
  const mins = String(timerMinutes.value).padStart(2, '0');
  const secs = String(timerSeconds.value).padStart(2, '0');
  return `${mins}:${secs}`;
});

const pomodoroTimeDisplay = computed(() => {
  const totalSeconds = pomodoroSeconds.value;
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
});

const toggleTimer = () => {
  if (isRunning.value) {
    clearInterval(timerInterval!);
    isRunning.value = false;
  } else {
    isRunning.value = true;
    timerInterval = window.setInterval(() => {
      if (timerSeconds.value > 0) {
        timerSeconds.value--;
      } else if (timerMinutes.value > 0) {
        timerMinutes.value--;
        timerSeconds.value = 59;
      } else {
        clearInterval(timerInterval!);
        isRunning.value = false;
        alert('¡Tiempo completado!');
      }
    }, 1000);
  }
};

const resetTimer = () => {
  clearInterval(timerInterval!);
  timerMinutes.value = 25;
  timerSeconds.value = 0;
  isRunning.value = false;
};

const togglePomodoro = () => {
  if (isPomodoroRunning.value) {
    clearInterval(pomodoroInterval!);
    isPomodoroRunning.value = false;
  } else {
    isPomodoroRunning.value = true;
    pomodoroInterval = window.setInterval(() => {
      if (pomodoroSeconds.value > 0) {
        pomodoroSeconds.value--;
      } else {
        clearInterval(pomodoroInterval!);
        isPomodoroRunning.value = false;

        if (pomodoroSession.value.isWorkSession) {
          alert('¡Tiempo de trabajo completado! Descansa.');
          const shouldLongBreak = pomodoroSession.value.completedPomodoros % 4 === 3;
          pomodoroSeconds.value = shouldLongBreak ? LONG_BREAK_TIME : BREAK_TIME;
          pomodoroSession.value.isWorkSession = false;
        } else {
          alert('¡Descansa completado! Vuelve al trabajo.');
          pomodoroSeconds.value = WORK_TIME;
          pomodoroSession.value.isWorkSession = true;
        }
      }
    }, 1000);
  }
};

const resetPomodoro = () => {
  clearInterval(pomodoroInterval!);
  pomodoroSeconds.value = WORK_TIME;
  isPomodoroRunning.value = false;
  pomodoroSession.value = { completedPomodoros: 0, isWorkSession: true };
};

const completePomodoro = () => {
  if (pomodoroSession.value.isWorkSession) {
    pomodoroSession.value.completedPomodoros++;
    sessionStats.value.pomodoros++;
    alert(
      `¡Pomodoro ${pomodoroSession.value.completedPomodoros} completado! Descansa un poco.`
    );
  } else {
    alert('Debes completar el tiempo de trabajo primero.');
  }
};

const markAsCompleted = async () => {
  if (!habitId.value || !currentUser.value) return;

  try {
    const today = new Date().toISOString().split('T')[0] || '';
    await checkInService.createCheckIn(currentUser.value.uid, habitId.value, {
      date: today,
      completed: true,
    });
    alert('¡Hábito marcado como completado!');
    router.push(`/habits/${habitId.value}/checkin`);
  } catch (err) {
    console.error('Error marking as completed:', err);
  }
};

const addDistraction = async () => {
  if (!distractionNote.value || !habitId.value || !currentUser.value) return;

  try {
    await distractionService.createDistraction(
      currentUser.value.uid,
      habitId.value,
      distractionNote.value
    );
    distractions.value.push({
      id: `${Date.now()}`,
      habitId: habitId.value,
      userId: currentUser.value.uid,
      content: distractionNote.value,
      createdAt: new Date(),
    });
    distractionNote.value = '';
  } catch (err) {
    console.error('Error adding distraction:', err);
  }
};

const deleteDistraction = async (distractionId: string) => {
  try {
    await distractionService.deleteDistraction(distractionId);
    distractions.value = distractions.value.filter((d) => d.id !== distractionId);
  } catch (err) {
    console.error('Error deleting distraction:', err);
  }
};

const clearDistraction = () => {
  distractionNote.value = '';
};

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleTimeString('es-ES');
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  if (habitId.value) {
    const loadedHabit = await getHabitById(habitId.value);
    habit.value = loadedHabit;
  }
});

// Cleanup
window.addEventListener('beforeunload', () => {
  if (timerInterval) clearInterval(timerInterval);
  if (pomodoroInterval) clearInterval(pomodoroInterval);
});
</script>

<style scoped>
.timer-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 1rem;
}

.timer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
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

.timer-header h2 {
  color: #333;
  margin: 0;
  flex: 1;
}

.timer-tabs {
  display: flex;
  gap: 0.5rem;
}

.tab {
  padding: 0.5rem 1rem;
  background: #e0e0e0;
  color: #333;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
}

.tab.active {
  background: #667eea;
  color: white;
}

.timer-content,
.distraction-content,
.session-summary {
  background: white;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.timer-display,
.pomodoro-display {
  text-align: center;
  margin-bottom: 2rem;
}

.time {
  font-size: 4rem;
  font-weight: 700;
  color: #667eea;
  font-family: monospace;
  margin-bottom: 1rem;
}

.pomodoro-status {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 1rem;
}

.controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-primary.running {
  background: #f56565;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.btn-success {
  background: #48bb78;
  color: white;
}

.btn-success:hover {
  background: #38a169;
}

.timer-settings,
.pomodoro-info {
  margin-top: 2rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.timer-settings label {
  display: flex;
  align-items: center;
  gap: 1rem;
  font-weight: 600;
}

.timer-settings input {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  width: 80px;
}

.timer-settings input:disabled {
  background: #e0e0e0;
  color: #666;
}

.timer-info,
.pomodoro-info {
  color: #666;
}

.pomodoro-info ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.pomodoro-info li {
  margin-bottom: 0.5rem;
}

.distraction-card {
  background: #f9f5f0;
  padding: 2rem;
  border-radius: 8px;
  border-left: 4px solid #ed8936;
}

.distraction-card h3 {
  color: #333;
  margin-top: 0;
}

.distraction-input {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 150px;
  margin-bottom: 1rem;
  box-sizing: border-box;
}

.distraction-input:focus {
  outline: none;
  border-color: #ed8936;
  box-shadow: 0 0 0 3px rgba(237, 137, 54, 0.1);
}

.distraction-buttons {
  display: flex;
  gap: 1rem;
}

.distraction-buttons .btn {
  flex: 1;
}

.distractions-list {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #ddd;
}

.distractions-list h4 {
  color: #333;
  margin-top: 0;
}

.distraction-item {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  border-left: 3px solid #ed8936;
  position: relative;
}

.distraction-item p {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.distraction-item small {
  color: #999;
}

.btn-delete {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: #f56565;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.btn-delete:hover {
  color: #e53e3e;
}

.session-summary {
  background: #f5f5f5;
}

.session-summary h3 {
  color: #333;
  margin-top: 0;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  background: white;
  padding: 1rem;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-item span:first-child {
  color: #666;
  font-weight: 600;
}

.summary-item span:last-child {
  color: #667eea;
  font-size: 1.5rem;
  font-weight: 700;
}
</style>
