import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { Chart, registerables } from 'chart.js';
import styles from '../styles/Dashboard.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';


Chart.register(...registerables);

const DashboardAluno = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [totalTreinos, setTotalTreinos] = useState(0);
  const navigate = useNavigate();
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const docRef = doc(db, 'Pessoa', user.uid);
          const docSnap = await getDoc(docRef);

          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.tipo_pessoa === 'aluno') {
              setUserData(data);
              fetchChartData(user.uid);
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

    const fetchChartData = async (alunoId) => {
      try {
        const treinoQuery = query(
          collection(db, 'Treino'),
          where('id_aluno', '==', alunoId)
        );
        const treinoDocs = await getDocs(treinoQuery);

        const treinoData = {};
        let total = 0;

        for (const treinoDoc of treinoDocs.docs) {
          const treino = treinoDoc.data();
          total += 1;

          if (!treinoData[treino.id_tipo]) {
            const tipoDoc = await getDoc(doc(db, 'Tipo', treino.id_tipo));
            treinoData[treino.id_tipo] = {
              nome: tipoDoc.exists() ? tipoDoc.data().nome : 'Desconhecido',
              count: 0,
            };
          }
          treinoData[treino.id_tipo].count += 1;
        }

        setTotalTreinos(total);
        setChartData(treinoData);
      } catch (error) {
        console.error('Erro ao buscar dados dos gráficos:', error);
      }
    };

    fetchData();
  }, [navigate, auth]);

  useEffect(() => {
    if (chartData) {
      const ctxBar = document.getElementById('barChart').getContext('2d');
      const ctxPie = document.getElementById('pieChart').getContext('2d');

      new Chart(ctxBar, {
        type: 'bar',
        data: {
          labels: Object.values(chartData).map((tipo) => tipo.nome),
          datasets: [
            {
              label: 'Quantidade de Treinos',
              data: Object.values(chartData).map((tipo) => tipo.count),
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });

      new Chart(ctxPie, {
        type: 'pie',
        data: {
          labels: ['Treinos Criados'],
          datasets: [
            {
              label: 'Treinos Totais',
              data: [totalTreinos],
              backgroundColor: ['rgba(255, 99, 132, 0.6)'],
              borderColor: ['rgba(255, 99, 132, 1)'],
              borderWidth: 1,
            },
          ],
        },
      });
    }
  }, [chartData, totalTreinos]);

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
              <li><button onClick={() => navigate('/relatorio-treino-aluno')}>Relatório de Treinos</button></li>
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
            <button className={styles.logoutButton} onClick={handleLogout}>
            <i class="fa-solid fa-right-from-bracket"></i> Logout</button>
          </div>
        </div>
        <div className={styles.contentArea}>
          <div className={styles.row}>
            <div className={styles.chartContainer}>
              <h3>Quantidade de Treinos por Tipo</h3>
              <canvas id="barChart"></canvas>
            </div>
            <div className={styles.chartContainer}>
              <h3>Total de Treinos</h3>
              <canvas id="pieChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAluno;
