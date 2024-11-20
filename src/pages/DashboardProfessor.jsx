import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import styles from '../styles/Dashboard.module.css';

const DashboardProfessor = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);  // Mantenha o loading como true até os dados serem carregados
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 767);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          // Ajuste para buscar dados na coleção "Pessoa"
          const docRef = doc(db, 'Pessoa', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            // Verifica se o tipo de usuário é 'professor'
            if (data.tipo_pessoa === 'professor') {
              setUserData(data); // Armazena os dados do professor
            } else {
              setError('Acesso negado. Tipo de usuário inválido.');
              navigate('/login');
            }
          } else {
            setError('Documento não encontrado.');
            navigate('/login');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        setError('Erro ao buscar dados do usuário!');
      } finally {
        setLoading(false);  // Define loading como false após a execução da função
      }
    };

    fetchData();
  }, [navigate, auth]);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth > 767);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSubmenu = (menu) => {
    setActiveMenu((prevMenu) => (prevMenu === menu ? null : menu));
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  // Garantir que a tela de carregamento ou erro seja exibida enquanto os dados não estão prontos
  if (loading) return <p>Carregando...</p>;  // Exibe carregando até o estado estar pronto
  if (error) return <p>{error}</p>;  // Exibe mensagem de erro caso ocorra algum erro

  return (
    <div className={styles.dashboardPage}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.painelName}>Painel do Professor</div>
        </div>
        <ul className={styles.sidebarMenu}>
          <li 
            className={`${styles.menuItem} ${activeMenu === 'aluno' ? styles.active : ''}`} 
            onClick={() => toggleSubmenu('aluno')}
          >
            Aluno
            <ul className={`${styles.submenu} ${activeMenu === 'aluno' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/cadastro-aluno')}>Cadastrar Aluno</button></li>
              <li><button onClick={() => navigate('/aluno-cadastrado')}>Alunos Cadastrados</button></li>
            </ul>
          </li>
          <li 
            className={`${styles.menuItem} ${activeMenu === 'treino' ? styles.active : ''}`} 
            onClick={() => toggleSubmenu('treino')}
          >
            Treino
            <ul className={`${styles.submenu} ${activeMenu === 'treino' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/cadastro-equipamento')}>Cadastrar Equipamento</button></li>
              <li><button onClick={() => navigate('/cadastro-series')}>Cadastrar Séries</button></li>
              <li><button onClick={() => navigate('/cadastro-repeticoes')}>Cadastrar Repetições</button></li>
              <li><button onClick={() => navigate('/cadastro-tipo-treino')}>Cadastrar Tipo de Treino</button></li>
              <li><button onClick={() => navigate('/Pagina-treino')}>Criar Treino</button></li>
            </ul>
          </li>
          <li 
            className={`${styles.menuItem} ${activeMenu === 'relatorio' ? styles.active : ''}`} 
            onClick={() => toggleSubmenu('relatorio')}
          >
            Relatórios
            <ul className={`${styles.submenu} ${activeMenu === 'relatorio' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/relatorio-treinos')}>Relatório de Treinos</button></li>
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
      </div>
    </div>
  );
};

export default DashboardProfessor;
