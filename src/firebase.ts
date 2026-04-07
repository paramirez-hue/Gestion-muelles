import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, where, getDocs, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

// TODO: Reemplaza esto con tu configuración real de Firebase Console
// Ve a https://console.firebase.google.com/
// Crea un proyecto, añade una Web App y copia los valores aquí.
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId: "TU_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { signInWithPopup, onAuthStateChanged, collection, doc, onSnapshot, addDoc, updateDoc, deleteDoc, query, where, getDocs, getDoc, setDoc, serverTimestamp };
export type { User };
