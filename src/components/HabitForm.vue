<template>
  <div class="habit-form-container">
    <div class="form-card">
      <h2>{{ isEditing ? 'Editar Hábito' : 'Crear Nuevo Hábito' }}</h2>

      <form @submit.prevent="handleSubmit">
        <!-- Nombre del hábito -->
        <div class="form-group">
          <label for="name">Nombre del Hábito *</label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            placeholder="Ej: Hacer ejercicio"
            required
          />
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label for="description">Descripción</label>
          <textarea
            id="description"
            v-model="form.description"
            placeholder="Describe tu hábito..."
            rows="3"
          ></textarea>
        </div>

        <!-- Categoría -->
        <div class="form-group">
          <label for="category">Categoría *</label>
          <div class="category-section">
            <select v-model="form.category" id="category" required>
              <option value="">Selecciona una categoría</option>
              <option value="trabajo">Trabajo</option>
              <option value="ejercicio">Ejercicio</option>
              <option value="higiene">Higiene Personal</option>
              <option value="hobbies">Hobbies</option>
              <option value="salud">Salud</option>
              <option value="educacion">Educación</option>
              <option value="otra">Otra</option>
            </select>
          </div>
        </div>

        <!-- Repetición de días -->
        <div class="form-group">
          <label>Días de repetición *</label>
          <div class="days-grid">
            <label v-for="day in days" :key="day.value" class="day-checkbox">
              <input
                type="checkbox"
                :value="day.value"
                :checked="form.repeatDays.includes(day.value)"
                @change="toggleDay"
              />
              <span>{{ day.label }}</span>
            </label>
          </div>
        </div>

        <!-- Horarios -->
        <div class="form-group">
          <label>Horarios del Hábito</label>
          <div class="times-section">
            <div v-for="(time, index) in form.scheduleTimes" :key="index" class="time-input">
              <input v-model="form.scheduleTimes[index]" type="time" />
              <button
                v-if="form.scheduleTimes.length > 1"
                type="button"
                @click="removeTime(index)"
                class="btn-small"
              >
                ✕
              </button>
            </div>
            <button type="button" @click="addTime" class="btn-add-time">+ Agregar Horario</button>
          </div>
        </div>

        <!-- Color -->
        <div class="form-group">
          <label for="color">Color del Hábito</label>
          <div class="color-picker">
            <input
              id="color"
              v-model="form.color"
              type="color"
              class="color-input"
            />
            <span class="color-value">{{ form.color }}</span>
          </div>
        </div>

        <!-- Estado -->
        <div class="form-group">
          <label class="checkbox-label">
            <input v-model="form.isActive" type="checkbox" />
            <span>Hábito Activo</span>
          </label>
        </div>

        <!-- Errores -->
        <p v-if="error" class="error-message">{{ error }}</p>

        <!-- Botones -->
        <div class="form-buttons">
          <button type="submit" :disabled="loading" class="btn btn-primary">
            {{ loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear Hábito' }}
          </button>
          <button type="button" @click="goBack" class="btn btn-secondary">
            Cancelar
          </button>
          <button
            v-if="isEditing"
            type="button"
            @click="handleDelete"
            :disabled="loading"
            class="btn btn-danger"
          >
            {{ loading ? 'Eliminando...' : 'Eliminar Hábito' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useHabits } from '../composables/useHabits';

const router = useRouter();
const route = useRoute();
const { createHabit, updateHabit, deleteHabit, getHabitById, loading, error } = useHabits();

const isEditing = ref(false);
const habitId = ref<string | null>(null);

const days = [
  { label: 'Dom', value: 0 },
  { label: 'Lun', value: 1 },
  { label: 'Mar', value: 2 },
  { label: 'Mié', value: 3 },
  { label: 'Jue', value: 4 },
  { label: 'Vie', value: 5 },
  { label: 'Sab', value: 6 },
];

const form = ref({
  name: '',
  description: '',
  category: '',
  repeatDays: [] as number[],
  scheduleTimes: [''] as string[],
  color: '#667eea',
  isActive: true,
});

const toggleDay = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const dayValue = parseInt(target.value);
  if (target.checked) {
    if (!form.value.repeatDays.includes(dayValue)) {
      form.value.repeatDays.push(dayValue);
      form.value.repeatDays.sort();
    }
  } else {
    form.value.repeatDays = form.value.repeatDays.filter((d) => d !== dayValue);
  }
};

const addTime = () => {
  form.value.scheduleTimes.push('');
};

const removeTime = (index: number) => {
  form.value.scheduleTimes.splice(index, 1);
};

const handleSubmit = async () => {
  if (form.value.repeatDays.length === 0) {
    alert('Selecciona al menos un día de repetición');
    return;
  }

  try {
    const habitData = {
      name: form.value.name,
      description: form.value.description,
      category: form.value.category,
      repeatDays: form.value.repeatDays,
      scheduleTimes: form.value.scheduleTimes.filter((t) => t !== ''),
      color: form.value.color,
      isActive: form.value.isActive,
    };

    if (isEditing.value && habitId.value) {
      await updateHabit(habitId.value, habitData as any);
      router.push('/habits');
    } else {
      await createHabit(habitData as any);
      router.push('/habits');
    }
  } catch (err) {
    console.error('Error al guardar hábito:', err);
  }
};

const handleDelete = async () => {
  if (!habitId.value) return;
  if (!confirm('¿Está seguro de que desea eliminar este hábito?')) return;

  try {
    await deleteHabit(habitId.value);
    router.push('/habits');
  } catch (err) {
    console.error('Error al eliminar hábito:', err);
  }
};

const goBack = () => {
  router.back();
};

onMounted(async () => {
  if (route.params.id) {
    habitId.value = route.params.id as string;
    isEditing.value = true;
    const habit = await getHabitById(habitId.value);
    if (habit) {
      form.value.name = habit.name;
      form.value.description = habit.description;
      form.value.category = habit.category;
      form.value.repeatDays = [...habit.repeatDays];
      form.value.scheduleTimes = [...habit.scheduleTimes];
      form.value.color = habit.color;
      form.value.isActive = habit.isActive;
    }
  }
});
</script>

<style scoped>
.habit-form-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 0 1rem;
}

.form-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h2 {
  color: #333;
  margin-top: 0;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

input[type='text'],
input[type='email'],
input[type='password'],
input[type='time'],
textarea,
select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  font-family: inherit;
  box-sizing: border-box;
}

input[type='text']:focus,
input[type='email']:focus,
input[type='password']:focus,
input[type='time']:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 0.5rem;
}

.day-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: all 0.2s ease;
}

.day-checkbox input[type='checkbox'] {
  width: auto;
  margin: 0;
}

.day-checkbox input[type='checkbox']:checked + span {
  font-weight: 600;
  color: #667eea;
}

.day-checkbox:has(input:checked) {
  background: rgba(102, 126, 234, 0.1);
  border-color: #667eea;
}

.times-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.time-input {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.time-input input {
  flex: 1;
}

.btn-small {
  padding: 0.5rem;
  background: #f56565;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-small:hover {
  background: #e53e3e;
}

.btn-add-time {
  padding: 0.5rem 1rem;
  background: #48bb78;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-add-time:hover {
  background: #38a169;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.color-input {
  width: 80px;
  height: 40px;
  padding: 2px;
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  color: #666;
  font-family: monospace;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  margin-bottom: 0;
}

.checkbox-label input[type='checkbox'] {
  width: auto;
  margin: 0;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 0.75rem;
  border-radius: 4px;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.form-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

.btn {
  flex: 1;
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
}

.btn-primary:hover:not(:disabled) {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover:not(:disabled) {
  background: #d0d0d0;
}

.btn-danger {
  background: #f56565;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #e53e3e;
}
</style>
