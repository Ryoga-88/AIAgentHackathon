import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Firebase Admin SDK初期化
let adminApp;
let adminDb;

try {
  if (getApps().length === 0) {
    const firebaseAdminConfig = {
      projectId: "hack-63b2d",
    };

    adminApp = initializeApp(firebaseAdminConfig);
  } else {
    adminApp = getApps()[0];
  }

  adminDb = getFirestore(adminApp);
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
  adminDb = null;
}

export { adminDb };
