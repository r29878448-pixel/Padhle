import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA6PnAaf-88DuVVY9oOdKLLTAEZ12Akq74",
  authDomain: "study-portal-a054a.firebaseapp.com",
  projectId: "study-portal-a054a",
  storageBucket: "study-portal-a054a.firebasestorage.app",
  messagingSenderId: "463373408496",
  appId: "1:463373408496:web:09b81a98b2d17249c18a35",
  measurementId: "G-MD7CY07WG0"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);