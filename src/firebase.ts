import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/* Configuración desde variables de entorno Vite (ver .env.example)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};*/

const firebaseConfig = {
  apiKey: "AIzaSyCrFHRk5Ssm9G-EjAHXNIimG_gwOerg91o",
  authDomain: "habit-to-do-71af2.firebaseapp.com",
  projectId: "habit-to-do-71af2",
  storageBucket: "habit-to-do-71af2.firebasestorage.app",
  messagingSenderId: "31339181288",
  appId: "1:31339181288:web:be1989070ca46d2937855d",
  measurementId: "G-FHTD1PMSTG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Nota: añade las variables en un archivo .env.local con el prefijo VITE_
