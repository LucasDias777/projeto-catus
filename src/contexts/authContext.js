import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  // Armazena as credenciais no localStorage
  const saveCredentials = (email, password) => {
    localStorage.setItem('authCredentials', JSON.stringify({ email, password }));
  };

  // Recupera as credenciais do localStorage
  const getStoredCredentials = () => {
    const storedData = localStorage.getItem('authCredentials');
    if (storedData) {
      return JSON.parse(storedData);
    }
    return null;
  };

  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Busca o documento no Firestore com base no email
      const userQuery = query(
        collection(db, 'Pessoa'),
        where('email', '==', email)
      );
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        setUserType(userData.tipo_pessoa);
        setCurrentUser({
          uid: user.uid,
          ...userData,
        });

        // Salva as credenciais no localStorage
        saveCredentials(email, password);

        return userData.tipo_pessoa;
      } else {
        throw new Error('Usuário não encontrado no Banco de Dados.');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserType(null);
      localStorage.removeItem('authCredentials'); // Remove as credenciais armazenadas
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userQuery = query(
          collection(db, 'Pessoa'),
          where('email', '==', user.email)
        );

        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserType(userData.tipo_pessoa);
          setCurrentUser({
            uid: user.uid,
            ...userData,
          });
        }
      } else {
        setCurrentUser(null);
        setUserType(null);
      }
      setLoading(false);
    });

    // Verificar as credenciais armazenadas e reautenticar automaticamente se necessário
    const storedCredentials = getStoredCredentials();
    if (storedCredentials) {
      login(storedCredentials.email, storedCredentials.password);
    }

    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, userType, login, logout, getStoredCredentials }}>
      {children}
    </AuthContext.Provider>
  );
};
