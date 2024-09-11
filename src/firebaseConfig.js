import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDw6x7OIOTYrZdaiATfUQqDRNOJlJBGfvc",
  authDomain: "banco-striveflow.firebaseapp.com",
  projectId: "banco-striveflow",
  storageBucket: "banco-striveflow.appspot.com",
  messagingSenderId: "858180919500",
  appId: "1:858180919500:web:b28056ffebafb7f9b46269"
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
