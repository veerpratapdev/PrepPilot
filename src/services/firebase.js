import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCFhYbC--dFxY-KtnxhDq8Z8yNAtLvVo0E",
    authDomain: "preppilot-2b99b.firebaseapp.com",
    projectId: "preppilot-2b99b",
    storageBucket: "preppilot-2b99b.firebasestorage.app",
    messagingSenderId: "168512555113",
    appId: "1:168512555113:web:755efda5987e717be53af8",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;