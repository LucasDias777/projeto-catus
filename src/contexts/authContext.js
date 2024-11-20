import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebaseConfig'; // Certifique-se de configurar o arquivo firebase.js
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, browserLocalPersistence, setPersistence } from 'firebase/auth';

// Criação do contexto de autenticação
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para login com Firebase
  const login = async (email, password) => {
    try {
      await setPersistence(auth, browserLocalPersistence);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Erro ao fazer login:', error.message);
      throw error; // Opcional: lançar erro para tratar no componente que chama.
    }
  };

  // Função para logout com Firebase
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error.message);
    }
  };

  // Observa mudanças no estado de autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Usuário autenticado:', user);
      setCurrentUser(user); // Define o usuário autenticado
      setLoading(false); // Quando o estado de autenticação for verificado, atualiza o estado
    });

    return unsubscribe; // Remove o observador ao desmontar o componente
  }, []);

  // Renderiza um indicador de carregamento enquanto aguarda a verificação de autenticação
  if (loading) {
    return <div>Carregando...</div>; // Você pode customizar com um spinner ou outro componente
  }

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
