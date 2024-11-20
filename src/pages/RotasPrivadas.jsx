import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/authContext';


const RotasPrivadas = () => {
  const { currentUser } = useAuth(); // Obtendo o usuário atual do contexto
  console.log('Estado do usuário atual em RotasPrivadas:', currentUser);

  // Se o usuário não estiver autenticado, redireciona para a página de login
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default RotasPrivadas;
