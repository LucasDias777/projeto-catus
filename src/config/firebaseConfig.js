import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDPMlNxsL-mNr_saot5EALt78Yu4E_7x1k",
    authDomain: "banco-striveflow-feaef.firebaseapp.com",
    projectId: "banco-striveflow-feaef",
    storageBucket: "banco-striveflow-feaef.firebasestorage.app",
    messagingSenderId: "824896717288",
    appId: "1:824896717288:web:8bf3ef9c6397ed7200e45d"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };
