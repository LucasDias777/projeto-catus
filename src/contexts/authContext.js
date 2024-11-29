import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  const saveCredentials = (email, password) => {
    localStorage.setItem('authCredentials', JSON.stringify({ email, password }));
  };

  const getStoredCredentials = () => {
    const storedData = localStorage.getItem('authCredentials');
    return storedData ? JSON.parse(storedData) : null;
  };

  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userQuery = query(collection(db, 'Pessoa'), where('email', '==', email));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();
        if (userData.tipo_pessoa === 'admin' && userData.id_admin === user.uid) {
        setUserType(userData.tipo_pessoa);
        setCurrentUser({
          uid: user.uid,
          ...userData,
        });
        saveCredentials(email, password);
        return userData.tipo_pessoa; // Retorna 'admin'
      }

      setUserType(userData.tipo_pessoa);
      setCurrentUser({
        uid: user.uid,
        ...userData,
      });

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
      localStorage.removeItem('authCredentials');
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log('Usuário autenticado:', user);
        const userQuery = query(collection(db, 'Pessoa'), where('email', '==', user.email));
        const querySnapshot = await getDocs(userQuery);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          console.log('Dados do usuário no Firestore:', userData);
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

    const storedCredentials = getStoredCredentials();
    if (storedCredentials) {
      login(storedCredentials.email, storedCredentials.password).catch(() => {
        setCurrentUser(null);
        setUserType(null);
      });
    }

    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ currentUser, userType, login, logout, getStoredCredentials }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
