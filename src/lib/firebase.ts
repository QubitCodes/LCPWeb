// src/lib/firebase.ts
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDJURF9B9Sp865e7i3BjD52UZyFdinwvTE",
  authDomain: "payement-da78c.firebaseapp.com",
  projectId: "payement-da78c",
  storageBucket: "payement-da78c.firebasestorage.app",
  messagingSenderId: "1079118817672",
  appId: "1:1079118817672:web:dc3294e61026b8b5b0323d",
  measurementId: "G-QR33L8S0G2",
};

// Prevent double initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);

export { app, RecaptchaVerifier };
