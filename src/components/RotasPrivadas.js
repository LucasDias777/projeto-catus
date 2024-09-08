import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../authContext'; // Importando o contexto de autenticação

const RotasPrivadas = () => {
  const { currentUser } = useAuth(); // Obtendo o usuário atual do contexto

  // Se o usuário não estiver autenticado, redireciona para a página de login
  return currentUser ? <Outlet /> : <Navigate to="/login" />;
};

export default RotasPrivadas;
