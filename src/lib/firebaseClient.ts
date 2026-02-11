import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDTa0iLB6bezaSqgJAfq0j3UW7TVwuyngc",
    authDomain: "lcpapp-acbc3.firebaseapp.com",
    databaseURL: "https://lcpapp-acbc3-default-rtdb.firebaseio.com",
    projectId: "lcpapp-acbc3",
    storageBucket: "lcpapp-acbc3.firebasestorage.app",
    messagingSenderId: "722709599910",
    appId: "1:722709599910:web:5ce1ca5574c59f883dc667",
    measurementId: "G-KBZW9KGQJH"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
