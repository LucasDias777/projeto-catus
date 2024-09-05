import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBNqXumR0WVPn0hUhXAnydBDTxvEeaddTU",
  authDomain: "banco-catus.firebaseapp.com",
  projectId: "banco-catus",
  storageBucket: "banco-catus.appspot.com",
  messagingSenderId: "574154916215",
  appId: "1:574154916215:web:b8db639f3c5494bbb46172"
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
