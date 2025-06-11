// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your config from Firebase Console:
const firebaseConfig = {
  apiKey: "AIzaSyCoZdXBvRcvbVw_NVnNBj5hpDY2KgQPzZw",
  authDomain: "token-manager-db556.firebaseapp.com",
  projectId: "token-manager-db556",
  storageBucket: "token-manager-db556.firebasestorage.app",
  messagingSenderId: "689777749275",
  appId: "1:689777749275:web:3b68976e1e0699f81fb7be",
  measurementId: "G-572P3Q028V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth and Firestore services
export const auth = getAuth(app);
export const db = getFirestore(app);
