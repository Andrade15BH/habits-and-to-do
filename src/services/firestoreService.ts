import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  doc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import type {
  Habit,
  HabitNote,
  HabitCheckIn,
  Category,
  HabitStats,
  DistractionNote,
  PomodoroSession,
} from '../types';

// ============ HÁBITOS ============
export const habitService = {
  // Crear un nuevo hábito
  async createHabit(
    userId: string,
    data: Omit<Habit, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'habits'), {
      ...data,
      userId,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Obtener todos los hábitos del usuario
  async getUserHabits(userId: string): Promise<Habit[]> {
    const q = query(
      collection(db, 'habits'),
      where('userId', '==', userId)
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({ 
      id: doc.id,
       ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      })) as Habit[];


  },

  // Obtener un hábito específico
  async getHabit(habitId: string): Promise<Habit | null> {
    const docRef = doc(db, 'habits', habitId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate() || new Date(),
      updatedAt: docSnap.data().updatedAt?.toDate() || new Date(),
    } as Habit;
  },

  // Actualizar un hábito
  async updateHabit(habitId: string, data: Partial<Habit>): Promise<void> {
    const docRef = doc(db, 'habits', habitId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now(),
    });
  },

  // Eliminar un hábito
  async deleteHabit(habitId: string): Promise<void> {
    const docRef = doc(db, 'habits', habitId);
    await deleteDoc(docRef);
  },

  // Obtener hábitos por categoría
  async getHabitsByCategory(userId: string, category: string): Promise<Habit[]> {
    const q = query(
      collection(db, 'habits'),
      where('userId', '==', userId),
      where('category', '==', category),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
      updatedAt: doc.data().updatedAt?.toDate() || new Date(),
    })) as Habit[];
  },
};

// ============ CATEGORÍAS ============

export const categoryService = {
  // Crear una categoría
  async createCategory(
    userId: string,
    data: Omit<Category, 'id' | 'userId' | 'createdAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...data,
      userId,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Obtener todas las categorías del usuario
  async getUserCategories(userId: string): Promise<Category[]> {
    const q = query(
      collection(db, 'categories'),
      where('userId', '==', userId),
      orderBy('createdAt', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as Category[];
  },

  // Actualizar una categoría
  async updateCategory(categoryId: string, data: Partial<Category>): Promise<void> {
    const docRef = doc(db, 'categories', categoryId);
    await updateDoc(docRef, data);
  },

  // Eliminar una categoría
  async deleteCategory(categoryId: string): Promise<void> {
    const docRef = doc(db, 'categories', categoryId);
    await deleteDoc(docRef);
  },
};

// ============ CHECK-INS (marca de días realizados) ============

export const checkInService = {
  // Registrar un check-in
  async createCheckIn(
    userId: string,
    habitId: string,
    data: Omit<HabitCheckIn, 'id' | 'userId' | 'habitId' | 'timestamp'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'checkIns'), {
      ...data,
      userId,
      habitId,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  },

  // Obtener todos los check-ins de un hábito
  async getHabitCheckIns(habitId: string): Promise<HabitCheckIn[]> {
    const q = query(
      collection(db, 'checkIns'),
      where('habitId', '==', habitId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as HabitCheckIn[];
  },

  // Obtener check-in de un día específico
  async getDayCheckIn(habitId: string, date: string): Promise<HabitCheckIn | null> {
    const q = query(
      collection(db, 'checkIns'),
      where('habitId', '==', habitId),
      where('date', '==', date)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0]!;
    return {
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    } as HabitCheckIn;
  },

  // Actualizar un check-in
  async updateCheckIn(checkInId: string, data: Partial<HabitCheckIn>): Promise<void> {
    const docRef = doc(db, 'checkIns', checkInId);
    await updateDoc(docRef, data);
  },

  // Eliminar un check-in
  async deleteCheckIn(checkInId: string): Promise<void> {
    const docRef = doc(db, 'checkIns', checkInId);
    await deleteDoc(docRef);
  },

  // Obtener check-ins en un rango de fechas
  async getCheckInsInRange(habitId: string, startDate: string, endDate: string): Promise<HabitCheckIn[]> {
    const q = query(
      collection(db, 'checkIns'),
      where('habitId', '==', habitId),
      where('date', '>=', startDate),
      where('date', '<=', endDate),
      orderBy('date', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || new Date(),
    })) as HabitCheckIn[];
  },
};

// ============ NOTAS DE HÁBITOS ============

export const noteService = {
  // Crear una nota
  async createNote(
    userId: string,
    habitId: string,
    content: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'habitNotes'), {
      habitId,
      userId,
      content,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Obtener todas las notas de un hábito
  async getHabitNotes(habitId: string): Promise<HabitNote[]> {
    const q = query(
      collection(db, 'habitNotes'),
      where('habitId', '==', habitId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as HabitNote[];
  },

  // Actualizar una nota
  async updateNote(noteId: string, content: string): Promise<void> {
    const docRef = doc(db, 'habitNotes', noteId);
    await updateDoc(docRef, { content });
  },

  // Eliminar una nota
  async deleteNote(noteId: string): Promise<void> {
    const docRef = doc(db, 'habitNotes', noteId);
    await deleteDoc(docRef);
  },
};

// ============ NOTAS DE DISTRACCIÓN ============

export const distractionService = {
  // Crear una nota de distracción
  async createDistraction(
    userId: string,
    habitId: string,
    content: string
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'distractions'), {
      habitId,
      userId,
      content,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Obtener todas las distracciones de un hábito
  async getHabitDistractions(habitId: string): Promise<DistractionNote[]> {
    const q = query(
      collection(db, 'distractions'),
      where('habitId', '==', habitId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date(),
    })) as DistractionNote[];
  },

  // Eliminar una distracción
  async deleteDistraction(distractionId: string): Promise<void> {
    const docRef = doc(db, 'distractions', distractionId);
    await deleteDoc(docRef);
  },
};

// ============ SESIONES POMODORO ============

export const pomodoroService = {
  // Crear una sesión pomodoro
  async createSession(
    userId: string,
    habitId: string,
    data: Omit<PomodoroSession, 'id' | 'userId' | 'habitId' | 'startedAt'>
  ): Promise<string> {
    const docRef = await addDoc(collection(db, 'pomodoroSessions'), {
      ...data,
      userId,
      habitId,
      startedAt: Timestamp.now(),
    });
    return docRef.id;
  },

  // Obtener sesiones pomodoro de un hábito
  async getHabitSessions(habitId: string): Promise<PomodoroSession[]> {
    const q = query(
      collection(db, 'pomodoroSessions'),
      where('habitId', '==', habitId),
      orderBy('startedAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      startedAt: doc.data().startedAt?.toDate() || new Date(),
      endedAt: doc.data().endedAt?.toDate(),
    })) as PomodoroSession[];
  },

  // Finalizar una sesión pomodoro
  async endSession(sessionId: string): Promise<void> {
    const docRef = doc(db, 'pomodoroSessions', sessionId);
    await updateDoc(docRef, {
      endedAt: Timestamp.now(),
    });
  },
};

// ============ ESTADÍSTICAS ============

export const statsService = {
  // Calcular estadísticas de un hábito
  async calculateStats(habitId: string): Promise<HabitStats> {
    const checkIns = await checkInService.getHabitCheckIns(habitId);

    const totalCompleted = checkIns.filter((ci) => ci.completed).length;
    const totalIncomplete = checkIns.filter((ci) => !ci.completed).length;

    // Calcular streak (días consecutivos completados)
    let streakDays = 0;
    const sortedByDate = checkIns.sort((a, b) => b.date.localeCompare(a.date));

    if (sortedByDate.length > 0 && sortedByDate[0]?.completed) {
      for (const checkIn of sortedByDate) {
        if (checkIn.completed) {
          streakDays++;
        } else {
          break;
        }
      }
    }

    const total = totalCompleted + totalIncomplete;
    const completionRate = total === 0 ? 0 : (totalCompleted / total) * 100;
    const lastCompleted = sortedByDate.find((ci) => ci.completed)?.date;

    return {
      habitId,
      totalDaysCompleted: totalCompleted,
      totalDaysIncomplete: totalIncomplete,
      streakDays,
      completionRate: Math.round(completionRate),
      lastCompletedDate: lastCompleted,
    };
  },
};
