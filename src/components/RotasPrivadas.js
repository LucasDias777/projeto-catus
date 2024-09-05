// RotasPrivadas.js
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebaseConfig'; // Ajuste o caminho conforme necessário

const RotasPrivadas = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Usuário está autenticado
        console.log('Usuário autenticado:', user); // Log do usuário autenticado
        setAuthenticated(true);
      } else {
        // Usuário não está autenticado
        console.log('Usuário não autenticado'); // Log de usuário não autenticado
        setAuthenticated(false);
      }
      setLoading(false); // Carregamento concluído
    });

    // Limpeza do listener quando o componente desmontar
    return () => unsubscribe();
  }, []);

  // Enquanto o estado de autenticação está carregando, não renderize nada
  if (loading) {
    return <div>Carregando...</div>; // Ou algum indicador de carregamento
  }

  console.log('Estado de carregamento:', loading); // Log do estado de carregamento
  console.log('Autenticado:', authenticated); // Log do estado de autenticação

  return authenticated ? <Outlet /> : <Navigate to="/login" />;
};

export default RotasPrivadas;
