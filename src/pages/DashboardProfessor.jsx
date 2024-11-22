import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import styles from '../styles/Dashboard.module.css';

const DashboardProfessor = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 767);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      console.log('Iniciando fetchData para buscar dados do professor.');
      try {
        const user = auth.currentUser;
        if (user) {
          console.log('Usuário autenticado:', user.uid);
          const docRef = doc(db, 'Pessoa', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            console.log('Dados do usuário:', data);
            if (data.tipo_pessoa === 'professor') {
              setUserData(data);
            } else {
              console.warn('Tipo de usuário inválido:', data.tipo_pessoa);
              setError('Acesso negado. Tipo de usuário inválido.');
              navigate('/login');
            }
          } else {
            console.warn('Documento do usuário não encontrado no Firestore.');
            setError('Documento não encontrado.');
            navigate('/login');
          }
        } else {
          console.warn('Nenhum usuário autenticado encontrado.');
          navigate('/login');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setError('Erro ao buscar dados do usuário!');
      } finally {
        setLoading(false);
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
      console.log('Usuário deslogado com sucesso.');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
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
              <li><button onClick={() => navigate('/cadastro-serie')}>Cadastrar Séries</button></li>
              <li><button onClick={() => navigate('/cadastro-repeticao')}>Cadastrar Repetições</button></li>
              <li><button onClick={() => navigate('/cadastro-tipo')}>Cadastrar Tipo de Treino</button></li>
              <li><button onClick={() => navigate('/cadastro-treino')}>Criar Treino</button></li>
            </ul>
          </li>
          <li
            className={`${styles.menuItem} ${activeMenu === 'relatorio' ? styles.active : ''}`}
            onClick={() => toggleSubmenu('relatorio')}
          >
            Relatórios
            <ul className={`${styles.submenu} ${activeMenu === 'relatorio' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/relatorio-treino')}>Relatório de Treinos</button></li>
            </ul>
          </li>
          <li
            className={`${styles.menuItem} ${activeMenu === 'perfil' ? styles.active : ''}`}
            onClick={() => toggleSubmenu('perfil')}
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
            <div className={styles.welcomeText}>Bem-vindo, {userData?.nome_completo || 'Usuário'}</div>
            <button className={styles.logoutButton} onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardProfessor;
