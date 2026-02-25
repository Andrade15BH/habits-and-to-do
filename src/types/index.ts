// Interfaces y tipos para la aplicación

export interface Habit {
  id: string;
  userId: string;
  name: string;
  description: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
  // Repetición
  repeatDays: number[]; // [0=Domingo, 1=Lunes, ... 6=Sábado]
  // Horarios
  scheduleTimes: string[]; // ["09:00", "18:00", etc]
  // Estado
  isActive: boolean;
  // Color para visualización
  color: string;
  // Notificaciones
  notificationMinutesBefore?: number; // minutos antes de la hora programada
}

export interface HabitNote {
  id: string;
  habitId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface HabitCheckIn {
  id: string;
  habitId: string;
  userId: string;
  date: string; // "YYYY-MM-DD"
  completed: boolean;
  timeSpent?: number; // en minutos
  notes?: string;
  timestamp: Date;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  createdAt: Date;
}

export interface HabitStats {
  habitId: string;
  totalDaysCompleted: number;
  totalDaysIncomplete: number;
  streakDays: number;
  completionRate: number; // porcentaje 0-100
  lastCompletedDate?: string;
}

export interface DistractionNote {
  id: string;
  habitId: string;
  userId: string;
  content: string;
  createdAt: Date;
}

export interface PomodoroSession {
  id: string;
  habitId: string;
  userId: string;
  duration: number; // en minutos
  completedPomodoros: number;
  startedAt: Date;
  endedAt?: Date;
}

export interface NotificationPreferences {
  id: string;
  userId: string;
  enableBrowserNotifications: boolean;
  enableEmailNotifications: boolean;
  enableWhatsAppNotifications: boolean;
  whatsAppNumber?: string;
  emailAddress: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  habitId: string;
  scheduledFor: Date;
  type: 'browser' | 'email' | 'whatsapp';
  sent: boolean;
  sentAt?: Date;
}

