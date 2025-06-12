// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDuAFhFM3VXH0nDepkn6diVAOyHXf95cV8",
  authDomain: "hack-63b2d.firebaseapp.com",
  projectId: "hack-63b2d",
  storageBucket: "hack-63b2d.firebasestorage.app",
  messagingSenderId: "142488682996",
  appId: "1:142488682996:web:1b7b89674e31077201f9a1"
};

// Initialize Firebase only if it hasn't been initialized
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const db = getFirestore(app);

// Firebase本番環境を使用（エミュレータは無効化）
// 開発環境でエミュレータを使用したい場合は下記のコメントを外してください
/*
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Only connect to emulators on client side and in development
  if (!auth._delegate?._config?.emulator) {
    try {
      connectAuthEmulator(auth, "http://localhost:9000", {
        disableWarnings: true,
      });
    } catch (error) {
      console.log("Auth emulator connection failed:", error.message);
    }
  }

  if (!db._delegate?._settings?.host?.includes("localhost")) {
    try {
      connectFirestoreEmulator(db, "localhost", 8080);
    } catch (error) {
      console.log("Firestore emulator connection failed:", error.message);
    }
  }
}
*/

export default app;
