// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuAFhFM3VXH0nDepkn6diVAOyHXf95cV8",
  authDomain: "hack-63b2d.firebaseapp.com",
  projectId: "hack-63b2d",
  storageBucket: "hack-63b2d.firebasestorage.app",
  messagingSenderId: "142488682996",
  appId: "1:142488682996:web:1b7b89674e31077201f9a1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export default app;