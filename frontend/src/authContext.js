import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

// Criação do contexto de autenticação
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para login
  const login = async (username, password) => {
    try {
      const response = await axios.post('http://localhost:3001/api/login', { username, password });

      // Armazenar o token JWT no localStorage ou em um contexto global
      localStorage.setItem('authToken', response.data.token);
      setCurrentUser({ username });
    } catch (error) {
      console.error('Erro ao fazer login:', error);
    }
  };

  // Função para logout
  const logout = () => {
    localStorage.removeItem('authToken');
    setCurrentUser(null);
  };

  // Checando o status do usuário (se há token)
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Aqui você pode validar o token com o backend, mas por enquanto vamos apenas definir o usuário
      setCurrentUser({ username: 'usuário' });
    }

    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
