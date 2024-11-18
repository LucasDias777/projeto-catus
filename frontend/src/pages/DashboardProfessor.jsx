import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css';

const DashboardProfessor = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 767);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'pessoas', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.tipoPessoa === 'professor') {
              setUserData(data);
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
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

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
      console.error("Erro ao deslogar:", error);
    }
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

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
            <div className={styles.welcomeText}>Bem-vindo, {userData?.nomeCompleto}</div>
            <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
          </div>
        </div>
        {/* Conteúdo principal do dashboard */}
      </div>
    </div>
  );
};

export default DashboardProfessor;