import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase only if a valid-looking API key is present to prevent build failures
let app, auth, db, storage, secondaryAuth;

const isValidApiKey = (key) => {
  return key && key !== 'undefined' && key.length > 10 && !key.includes('YOUR_');
};

if (isValidApiKey(firebaseConfig.apiKey)) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Secondary App for Admin creations
    const secondaryApp = getApps().find(a => a.name === "Secondary") || 
                         initializeApp(firebaseConfig, "Secondary");
    secondaryAuth = getAuth(secondaryApp);
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase API Key is missing or invalid. Firebase services will not be initialized.");
}

export { app, auth, db, storage, secondaryAuth };


