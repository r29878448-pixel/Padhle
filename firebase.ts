
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

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

// Initialize Firestore with robust settings for unstable networks
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Fixes "Could not reach backend" in restricted networks
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});
