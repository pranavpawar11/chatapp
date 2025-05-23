// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJdNU6LYvRVGanS_yH4EXsm6p8lOR_uLM",
  authDomain: "chat-app-d1347.firebaseapp.com",
  projectId: "chat-app-d1347",
  storageBucket: "chat-app-d1347.firebasestorage.app",
  messagingSenderId: "690882150034",
  appId: "1:690882150034:web:b34adc91b17598dedf704b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);