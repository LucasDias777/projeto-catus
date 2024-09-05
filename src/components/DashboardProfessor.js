import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Dashboard.module.css'; // Importa o CSS

const DashboardProfessor = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true); // Ajuste para iniciar a barra aberta
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'pessoa', user.uid);
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

  const toggleSubmenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) return <p>Carregando...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className={styles.dashboardPage}>
      <div className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.painelName}>Painel do Professor</div>
        </div>
        <ul className={`${styles.sidebarMenu} ${sidebarOpen ? styles.scroll : ''}`}>
          <li 
            className={`${styles.menuItem} ${activeMenu === 'aluno' ? styles.active : ''}`} 
            onClick={() => toggleSubmenu('aluno')}
          >
            {/* Texto do menu de Aluno */}
            Aluno
            <i className={`${styles.arrow} bx bx-chevron-right`}></i>
            <ul className={`${styles.submenu} ${activeMenu === 'aluno' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/cadastro-aluno')}>Cadastrar Aluno</button></li>
              <li><button onClick={() => navigate('/aluno-cadastrado')}>Alunos Cadastrados</button></li>
            </ul>
          </li>
          <li 
           className={`${styles.menuItem} ${activeMenu === 'treino' ? styles.active : ''}`} 
           onClick={() => toggleSubmenu('treino')}
          >
            {/* Texto do menu de Treino */}
            Treino
            <i className={`${styles.arrow} bx bx-chevron-right`}></i>
            <ul className={`${styles.submenu} ${activeMenu === 'treino' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/cadastro-equipamento')}>Cadastrar Equipamento</button></li>
              <li><button onClick={() => navigate('/cadastro-series')}>Cadastrar Séries</button></li>
              <li><button onClick={() => navigate('/cadastro-repeticoes')}>Cadastrar Repetições</button></li>
              <li><button onClick={() => navigate('/cadastro-tipo-treino')}>Cadastrar Tipo de Treino</button></li>
              <li><button onClick={() => navigate('/treino')}>Criar Treino</button></li>
            </ul>
          </li>

          <li 
            className={`${styles.menuItem} ${activeMenu === 'relatorios' ? styles.active : ''}`} 
            onClick={() => toggleSubmenu('relatorios')}
          >
            {/* Texto do menu de Relatórios */}
            Relatórios
            <i className={`${styles.arrow} bx bx-chevron-right`}></i>
            <ul className={`${styles.submenu} ${activeMenu === 'relatorios' ? styles.show : ''}`}>
              <li><button onClick={() => navigate('/relatorio-treinos')}>Treinos</button></li>
            </ul>
          </li>
        </ul>
      </div>
      <div className={styles.mainContent}>
        <div className={styles.topbar}>
          <div className={styles.topbarContent}>
            <div className={styles.logoContainer}>
              <img src="" alt="Logo da Empresa" className={styles.logo} />
              <h1 className={styles.topbarTitle}>Catus</h1>
            </div>
            <h1 className={styles.welcomeText}>Bem-vindo, {userData?.nomeCompleto}</h1>
            <button className={styles.logoutButton} onClick={handleLogout}>Deslogar</button>
          </div>
        </div>
        <div className={styles.content}>
          {/* Conteúdo principal do dashboard */}
        </div>
      </div>
    </div>
  );
};

export default DashboardProfessor;
