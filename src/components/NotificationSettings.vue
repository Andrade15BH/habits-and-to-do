<template>
  <div class="notification-settings">
    <div class="settings-header">
      <h2>Configurar Notificaciones</h2>
      <button @click="goBack" class="btn-back">← Atrás</button>
    </div>

    <div class="settings-content">
      <!-- Notificaciones del Navegador -->
      <section class="settings-section">
        <h3>🔔 Notificaciones del Navegador</h3>
        <div v-if="!isSupported" class="warning">
          <p>Tu navegador no soporta notificaciones push.</p>
        </div>
        <div v-else class="setting-item">
          <div class="setting-control">
            <label>
              <input
                type="checkbox"
                v-model="enableBrowser"
                @change="updateBrowserNotifications"
              />
              <span>Habilitar notificaciones del navegador</span>
            </label>
            <p class="setting-help">
              Recibirás notificaciones emergentes en tu navegador cuando sea hora de realizar tus
              hábitos.
            </p>
          </div>

          <div v-if="enableBrowser && !hasPermission" class="permission-request">
            <button @click="requestBrowserPermission" class="btn btn-primary">
              Habilitar Notificaciones del Navegador
            </button>
            <p style="color: #666; font-size: 0.9rem">
              Se te pedirá permiso para enviar notificaciones.
            </p>
          </div>

          <div v-if="enableBrowser && hasPermission" class="permission-granted">
            <p style="color: #48bb78">✓ Permisos concedidos</p>
          </div>
        </div>
      </section>

      <!-- Notificaciones por Email -->
      <section class="settings-section">
        <h3>📧 Notificaciones por Email</h3>
        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              v-model="enableEmail"
              @change="updateEmailNotifications"
            />
            <span>Habilitar notificaciones por email</span>
          </label>
          <p class="setting-help">
            Recibirás recordatorios diarios por email con tus hábitos pendientes.
          </p>

          <div v-if="enableEmail" class="email-settings">
            <label>Correo electrónico:</label>
            <input
              v-model="emailAddress"
              type="email"
              placeholder="tu@email.com"
              disabled
              class="email-display"
            />
            <p style="color: #999; font-size: 0.85rem">
              Se usará el email de tu cuenta de Firebase.
            </p>
          </div>
        </div>

        <!-- En desarrollo -->
        <div class="beta-feature">
          <span class="badge">Próximamente</span>
          <p>Las notificaciones por email requieren configuración en el backend.</p>
        </div>
      </section>

      <!-- Notificaciones por WhatsApp -->
      <section class="settings-section">
        <h3>💬 Notificaciones por WhatsApp</h3>
        <div class="setting-item">
          <label>
            <input
              type="checkbox"
              v-model="enableWhatsApp"
              @change="updateWhatsAppNotifications"
            />
            <span>Habilitar notificaciones por WhatsApp</span>
          </label>
          <p class="setting-help">
            Recibe recordatorios directamente en WhatsApp.
          </p>

          <div v-if="enableWhatsApp" class="whatsapp-settings">
            <label for="whatsapp-number">Número de WhatsApp (con código de país):</label>
            <input
              id="whatsapp-number"
              v-model="whatsAppNumber"
              type="text"
              placeholder="+34612345678"
              class="form-input"
            />
            <p style="color: #999; font-size: 0.85rem">
              Formato: +[código de país][número sin espacios]. Ej: +34612345678
            </p>
          </div>
        </div>

        <!-- En desarrollo -->
        <div class="beta-feature">
          <span class="badge">Próximamente</span>
          <p>Las notificaciones por WhatsApp requieren integración con Twilio u otro servicio.</p>
        </div>
      </section>

      <!-- Resumen -->
      <section class="settings-section summary">
        <h3>Resumen de Preferencias</h3>
        <ul>
          <li>
            <span>Navegador:</span>
            <span :class="enableBrowser ? 'status-enabled' : 'status-disabled'">
              {{ enableBrowser ? 'Habilitado' : 'Deshabilitado' }}
            </span>
          </li>
          <li>
            <span>Email:</span>
            <span :class="enableEmail ? 'status-enabled' : 'status-disabled'">
              {{ enableEmail ? 'Habilitado' : 'Deshabilitado' }}
            </span>
          </li>
          <li>
            <span>WhatsApp:</span>
            <span :class="enableWhatsApp ? 'status-enabled' : 'status-disabled'">
              {{ enableWhatsApp ? 'Habilitado' : 'Deshabilitado' }}
            </span>
          </li>
        </ul>
      </section>

      <!-- Botones de acción -->
      <div class="settings-actions">
        <button @click="saveSettings" class="btn btn-primary">Guardar Cambios</button>
        <button @click="goBack" class="btn btn-secondary">Cancelar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { useNotifications } from '../composables/useNotifications';

const router = useRouter();
const { currentUser } = useAuth();
const { isSupported, hasPermission, requestPermission, initializeNotifications } =
  useNotifications();

const enableBrowser = ref(false);
const enableEmail = ref(false);
const enableWhatsApp = ref(false);
const emailAddress = ref('');
const whatsAppNumber = ref('');

const updateBrowserNotifications = async () => {
  if (enableBrowser.value && !hasPermission.value) {
    // Pedir permiso automáticamente
    const granted = await requestPermission();
    if (!granted) {
      enableBrowser.value = false;
    }
  }
};

const updateEmailNotifications = () => {
  // Validar que haya email
  if (enableEmail.value && !emailAddress.value) {
    alert('Por favor, configura un email');
    enableEmail.value = false;
  }
};

const updateWhatsAppNotifications = () => {
  // Validar formato del número
  if (enableWhatsApp.value && whatsAppNumber.value) {
    if (!whatsAppNumber.value.startsWith('+') || whatsAppNumber.value.length < 10) {
      alert('Por favor, ingresa un número válido con formato internacional (ej: +34612345678)');
      enableWhatsApp.value = false;
    }
  }
};

const requestBrowserPermission = async () => {
  const granted = await requestPermission();
  if (granted) {
    enableBrowser.value = true;
  }
};

const saveSettings = () => {
  // Aquí guardarías las preferencias en Firestore
  alert('Configuración guardada correctamente');
  router.back();
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  initializeNotifications();
  if (currentUser.value) {
    emailAddress.value = currentUser.value.email || '';
  }
});
</script>

<style scoped>
.notification-settings {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 1rem;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.settings-header h2 {
  color: #333;
  margin: 0;
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

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  background: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-section h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 1rem;
}

.warning {
  background: #ffeaa7;
  color: #d63031;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.warning p {
  margin: 0;
}

.setting-item {
  margin-bottom: 1.5rem;
}

.setting-item label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 500;
}

.setting-item input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.setting-help {
  margin-top: 0.5rem;
  color: #666;
  font-size: 0.9rem;
  margin-left: 2rem;
}

.setting-control {
  margin-bottom: 1rem;
}

.permission-request,
.permission-granted {
  margin-top: 1rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.permission-granted {
  background: #c6f6d5;
  color: #22543d;
}

.email-settings,
.whatsapp-settings {
  margin-left: 2rem;
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 4px;
}

.email-settings label,
.whatsapp-settings label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.email-display,
.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}

.email-display {
  background: #f5f5f5;
  color: #666;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.beta-feature {
  margin-top: 1rem;
  padding: 1rem;
  background: #efe9f5;
  border-left: 4px solid #667eea;
  border-radius: 4px;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.beta-feature p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

.summary {
  background: #f5f5f5;
}

.summary ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.summary li {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #ddd;
}

.summary li:last-child {
  border-bottom: none;
}

.summary span:first-child {
  font-weight: 600;
  color: #333;
}

.status-enabled {
  color: #48bb78;
  font-weight: 600;
}

.status-disabled {
  color: #f56565;
  font-weight: 600;
}

.settings-actions {
  display: flex;
  gap: 1rem;
}

.btn {
  flex: 1;
  padding: 0.75rem;
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

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}
</style>
