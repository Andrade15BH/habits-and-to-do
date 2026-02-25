import { ref, computed } from 'vue';
import { useAuth } from './useAuth';

interface Notification {
  id: string;
  title: string;
  body: string;
  habitName: string;
  habitId: string;
  timestamp: Date;
}

const state = ref({
  notifications: [] as Notification[],
  supported: 'Notification' in window,
  permission: 'default' as NotificationPermission,
});

export function useNotifications() {
  const { currentUser } = useAuth();
  const notifications = computed(() => state.value.notifications);
  const isSupported = computed(() => state.value.supported);
  const hasPermission = computed(() => state.value.permission === 'granted');

  const requestPermission = async () => {
    if (!isSupported.value) {
      console.warn('Notificaciones del navegador no soportadas');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      state.value.permission = permission;
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  };

  const sendBrowserNotification = (
    title: string,
    options: NotificationOptions & { habitName: string; habitId: string }
  ) => {
    if (!hasPermission.value) {
      console.warn('No tienes permiso para enviar notificaciones');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });

      // Agregar a la lista local
      state.value.notifications.push({
        id: `${Date.now()}-${Math.random()}`,
        title,
        body: options.body || '',
        habitName: options.habitName,
        habitId: options.habitId,
        timestamp: new Date(),
      });

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);

      return notification;
    } catch (err) {
      console.error('Error sending browser notification:', err);
    }
  };

  // Programar notificación para un tiempo específico
  const scheduleNotification = (
    habitName: string,
    habitId: string,
    scheduledTime: Date,
    minutesBefore: number = 0
  ) => {
    const now = new Date();
    const notificationTime = new Date(scheduledTime);
    notificationTime.setMinutes(notificationTime.getMinutes() - minutesBefore);

    const timeUntilNotification = notificationTime.getTime() - now.getTime();

    if (timeUntilNotification > 0) {
      setTimeout(() => {
        sendBrowserNotification(`Recordatorio: ${habitName}`, {
          body: `Es hora de realizar tu hábito: ${habitName}`,
          habitName,
          habitId,
          tag: habitId,
        });
      }, timeUntilNotification);

      return true;
    }

    return false;
  };

  // Limpiar notificaciones antiguas
  const clearOldNotifications = (minutesOld: number = 5) => {
    const now = new Date();
    state.value.notifications = state.value.notifications.filter(
      (notif) => now.getTime() - notif.timestamp.getTime() < minutesOld * 60 * 1000
    );
  };

  // Simular notificación de email (en producción usarías backend)
  const sendEmailNotification = async (
    email: string,
    habitName: string,
    message: string
  ): Promise<boolean> => {
    try {
      // Aquí conectarías con tu backend que envía emails
      // Por ahora solo simulamos el envío
      console.log(`Email notification sent to ${email}: ${habitName} - ${message}`);
      return true;
    } catch (err) {
      console.error('Error sending email notification:', err);
      return false;
    }
  };

  // Simular notificación de WhatsApp (requiere backend)
  const sendWhatsAppNotification = async (
    phoneNumber: string,
    habitName: string,
    message: string
  ): Promise<boolean> => {
    try {
      // Aquí conectarías con un servicio de WhatsApp (Twilio, etc)
      // Por ahora solo simulamos el envío
      console.log(`WhatsApp notification sent to ${phoneNumber}: ${habitName} - ${message}`);
      return true;
    } catch (err) {
      console.error('Error sending WhatsApp notification:', err);
      return false;
    }
  };

  // Inicializar notificaciones al cargar
  const initializeNotifications = async () => {
    if (isSupported.value) {
      if (Notification.permission === 'granted') {
        state.value.permission = 'granted';
      } else if (Notification.permission === 'denied') {
        state.value.permission = 'denied';
      } else {
        state.value.permission = 'default';
      }
    }
  };

  return {
    notifications,
    isSupported,
    hasPermission,
    requestPermission,
    sendBrowserNotification,
    scheduleNotification,
    clearOldNotifications,
    sendEmailNotification,
    sendWhatsAppNotification,
    initializeNotifications,
  };
}
