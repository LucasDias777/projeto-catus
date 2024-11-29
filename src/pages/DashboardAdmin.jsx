import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import styles from '../styles/DashboardAdmin.module.css';
import { Chart, registerables } from 'chart.js';
import '@fortawesome/fontawesome-free/css/all.min.css';

Chart.register(...registerables);

const DashboardAdmin = () => {
  const { currentUser, userType, logout } = useAuth();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState(null);
  const [collectionCounts, setCollectionCounts] = useState({});
  const [monthlyData, setMonthlyData] = useState([]);
  const donutChartRef = useRef(null);
  const barChartRef = useRef(null);
  const donutChartInstance = useRef(null);
  const barChartInstance = useRef(null);
  const [loading, setLoading] = useState(true);

  const collections = ['Equipamento', 'Pessoa', 'Repeticao', 'Serie', 'Tipo', 'Treino', 'Treino_Tempo'];

  useEffect(() => {
    if (!currentUser || userType !== 'admin') {
      navigate('/login');
    } else {
      fetchCollectionCounts();
      fetchMonthlyData();
    }
  }, [currentUser, userType, navigate]);

  const fetchCollectionCounts = async () => {
    try {
      const counts = {};
      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col));
        counts[col] = snapshot.size;
      }
      setCollectionCounts(counts);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao buscar contagens:', error);
    }
  };

  const fetchMonthlyData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const monthCounts = Array(12).fill(0);

      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col));
        snapshot.forEach((doc) => {
          const dataCriacao = doc.data().data_criacao?.toDate?.();
          if (dataCriacao && dataCriacao instanceof Date && dataCriacao.getFullYear() === currentYear) {
            monthCounts[dataCriacao.getMonth()]++;
          }
        });
      }
      setMonthlyData(monthCounts);
    } catch (error) {
      console.error('Erro ao buscar dados mensais:', error);
    }
  };

  useEffect(() => {
    if (!loading) {
      renderDonutChart();
      renderBarChart();
    }
  }, [loading, collectionCounts, monthlyData]);

  const renderDonutChart = () => {
    if (donutChartInstance.current) {
      donutChartInstance.current.destroy();
    }

    if (donutChartRef.current) {
      const ctx = donutChartRef.current.getContext('2d');
      const total = Object.values(collectionCounts).reduce((sum, count) => sum + count, 0);
      donutChartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Total de Registros'],
          datasets: [
            {
              data: [total],
              backgroundColor: ['#FF6384'],
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { display: true } } },
      });
    }
  };

  const renderBarChart = () => {
    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    if (barChartRef.current) {
      const ctx = barChartRef.current.getContext('2d');
      barChartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
          datasets: [
            {
              label: 'Registros Mensais',
              data: monthlyData,
              backgroundColor: '#36A2EB',
            },
          ],
        },
        options: { responsive: true, plugins: { legend: { display: false } } },
      });
    }
  };

  const handleBackup = async () => {
    try {
      const backupData = {};
      for (const col of collections) {
        const snapshot = await getDocs(collection(db, col));
        backupData[col] = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${new Date().toISOString()}.json`;
      link.click();
      alert('Backup realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao realizar backup:', error);
      alert('Erro ao realizar backup!');
    }
  };

  const toggleSubmenu = (menu) => {
    setActiveMenu((prevMenu) => (prevMenu === menu ? null : menu));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao deslogar:', error);
    }
  };

  if (loading) return <p>Carregando...</p>;

  return (
    <div className={styles.dashboardPage}>
      {/* Sidebar */}
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.painelName}>Painel do Administrador</div>
        </div>
        <ul className={styles.sidebarMenu}>
          <li
            className={`${styles.menuItem} ${activeMenu === 'backup' ? styles.active : ''}`}
            onClick={() => toggleSubmenu('backup')}
          >
            Backup
            <ul className={`${styles.submenu} ${activeMenu === 'backup' ? styles.show : ''}`}>
              <li>
                <button onClick={() => navigate('/dashboard-admin/backup')}> Fazer Backup</button>
              </li>
            </ul>
          </li>
        </ul>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Topbar */}
        <div className={styles.topbar}>
          <div className={styles.topbarContent}>
            <div>Bem-vindo, {currentUser?.nome_completo || 'Usuário'}</div>
            <button className={styles.logoutButton} onClick={handleLogout}>
              <i className="fa-solid fa-right-from-bracket"></i> Logout
            </button>
          </div>
        </div>

        {/* Condicional para exibir backup ou dashboard */}
        {activeMenu === 'backup' ? (
          <div className={styles.backupContainer}>
            <h2 className={styles.backupTitle}>Backup de Dados</h2>
            <div className={styles.backupBlock}>
              <button className={styles.backupButton} onClick={handleBackup}>
              <i class="fa-solid fa-floppy-disk"></i> Fazer Backup
              </button>
            </div>
            <button
              className={styles.backButton}
              onClick={() => {
                toggleSubmenu(null);
                navigate('/dashboard-admin');
              }}
            >
             <i class="fa-solid fa-rotate-left"></i> Voltar 
            </button>
          </div>
        ) : (
          <>
            {/* Cards */}
            <div className={styles.cardsContainer}>
              {Object.entries(collectionCounts).map(([col, count]) => (
                <div key={col} className={styles.card}>
                  <h3>{col}</h3>
                  <p>{count} registros</p>
                </div>
              ))}
            </div>

            {/* Gráficos */}
            <div className={styles.chartContainer}>
              <div className={styles.chartBlock}>
                <h3>Total de Registros</h3>
                <canvas ref={donutChartRef}></canvas>
              </div>
              <div className={styles.chartBlock}>
                <h3>Total de Registros por Mês</h3>
                <canvas ref={barChartRef}></canvas>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;
