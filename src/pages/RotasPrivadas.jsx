import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';

const RotasPrivadas = () => {
  const { currentUser } = useAuth(); // Obtendo o usuário atual do contexto
  console.log('Estado do usuário atual em RotasPrivadas:', currentUser);

  if (!currentUser) {
    // Se o usuário não estiver autenticado, redireciona para o login
    return <Navigate to="/login" />;
  }

  // Renderiza as rotas protegidas se o usuário estiver autenticado
  return <Outlet />;
};

export default RotasPrivadas;
