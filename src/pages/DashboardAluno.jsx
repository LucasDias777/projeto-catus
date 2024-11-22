import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import styles from '../styles/Dashboard.module.css';

const DashboardAluno = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Busca os dados na coleção "Pessoa"
          const docRef = doc(db, 'Pessoa', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.tipo_pessoa === 'aluno') {
              setUserData(data); // Armazena os dados do aluno
            } else {
              setError('Acesso negado. Tipo de usuário inválido.');
              navigate('/login');
            }
          } else {
            setError('Usuário não encontrado.');
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setError('Erro ao buscar os dados do usuário!');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, auth]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
    }
  };

  const toggleMenu = (menuName) => {
    setActiveMenu(activeMenu === menuName ? null : menuName);
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.painelName}>Painel do Aluno</div>
        </div>
        <ul className={styles.sidebarMenu}>
          <li
            className={`${styles.menuItem} ${activeMenu === 'treino' ? styles.active : ''}`}
            onClick={() => toggleMenu('treino')}
          >
            Treino
            <ul className={`${styles.submenu} ${activeMenu === 'treino' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/visualizar-treino')}>Ver Treino</button></li>
            </ul>
          </li>
          <li
            className={`${styles.menuItem} ${activeMenu === 'relatorios' ? styles.active : ''}`}
            onClick={() => toggleMenu('relatorios')}
          >
            Relatórios
            <ul className={`${styles.submenu} ${activeMenu === 'relatorios' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/relatorio-treino')}>Relatório de Treinos</button></li>
            </ul>
          </li>
          <li
            className={`${styles.menuItem} ${activeMenu === 'perfil' ? styles.active : ''}`}
            onClick={() => toggleMenu('perfil')}
          >
            Perfil
            <ul className={`${styles.submenu} ${activeMenu === 'perfil' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/editar-usuario')}>Editar Perfil</button></li>
            </ul>
          </li>
          
        </ul>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.topbar}>
          <div className={styles.topbarContent}>
            <div className={styles.welcomeText}>Bem-vindo, {userData?.nome_completo}</div>
            <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
          </div>
        </div>
        {/* Conteúdo principal do dashboard */}
      </div>
    </div>
  );
};

export default DashboardAluno;
