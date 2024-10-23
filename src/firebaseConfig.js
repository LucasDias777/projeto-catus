import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAs4nfvj6V8TJJ56J6aTxTwoIp4ZXl3Omw",
  authDomain: "banco-striveflow-bb588.firebaseapp.com",
  projectId: "banco-striveflow-bb588",
  storageBucket: "banco-striveflow-bb588.appspot.com",
  messagingSenderId: "718597450146",
  appId: "1:718597450146:web:ecba3ca065ca41f3e6aafb"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Obtém instâncias do Auth e Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Configura a persistência de sessão para 'local'
setPersistence(auth, browserLocalPersistence)
  .then(() => {
    // Persistência configurada com sucesso
    console.log('Persistência da sessão configurada para local.');
  })
  .catch((error) => {
    // Manipula erros, se houver
    console.error("Erro ao definir persistência:", error);
  });

export { auth, db };
