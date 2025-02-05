import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { getDocs, collection, writeBatch, doc } from 'firebase/firestore';
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
                const dataCriacao = doc.data().data_criacao;

                let dateObj;
                if (dataCriacao?.toDate) {
                    // Trata Timestamp do Firestore
                    dateObj = dataCriacao.toDate();
                } else if (typeof dataCriacao === 'string') {
                    // Trata datas no formato ISO
                    dateObj = new Date(dataCriacao);
                }

                if (dateObj && dateObj instanceof Date && dateObj.getFullYear() === currentYear) {
                    monthCounts[dateObj.getMonth()]++;
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
          labels: ['Total de Cadastros'],
          datasets: [
            {
              data: [total],
              backgroundColor: ['#00ffff'],
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
              label: 'Total de Cadastros',
              data: monthlyData,
              backgroundColor: '#daa520',
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
            backupData[col] = snapshot.docs.map((doc) => {
                const data = doc.data();

                // Converte campos de data para o formato desejado
                const formatDate = (firebaseTimestamp) => {
                    if (!firebaseTimestamp || !firebaseTimestamp.toDate) return null;
                    const dateObj = firebaseTimestamp.toDate();
                    return dateObj.toLocaleDateString('pt-BR', {
                        day: 'numeric', month: 'long', year: 'numeric',
                        hour: 'numeric', minute: 'numeric', second: 'numeric',
                        timeZoneName: 'short'
                    });
                };

                if (data.data_criacao) {
                    data.data_criacao = formatDate(data.data_criacao);
                }
                if (data.data_inicio) {
                    data.data_inicio = formatDate(data.data_inicio);
                }
                if (data.data_termino) {
                    data.data_termino = formatDate(data.data_termino);
                }

                return { id: doc.id, ...data };
            });
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

  const handleRestoreBackup = async () => {
    try {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
  
        const fileContent = await file.text();
        let backupData;
        try {
          backupData = JSON.parse(fileContent);
        } catch {
          alert('Arquivo inválido! O formato JSON está incorreto.');
          return;
        }
  
        // Validar estrutura do backup
        const backupCollections = Object.keys(backupData);
        const isValidStructure = collections.every((col) => backupCollections.includes(col));
        if (!isValidStructure) {
          alert('Arquivo inválido! Estrutura de backup não é compatível.');
          return;
        }
  
        if (!window.confirm('Tem certeza que deseja restaurar o backup? Isso apagará todos os dados atuais.')) {
          return;
        }
  
        // Excluir coleções existentes e restaurar backup
        for (const col of collections) {
          const colRef = collection(db, col);
          const snapshot = await getDocs(colRef);
          const deleteBatch = writeBatch(db); // Substituindo db.batch() por writeBatch(db)
          
          snapshot.forEach((docSnap) => {
            deleteBatch.delete(doc(colRef, docSnap.id));
          });
          await deleteBatch.commit();
  
          // Inserir novos dados
          const insertBatch = writeBatch(db); // Novo batch para inserções
          for (const docData of backupData[col]) {
            const newDocRef = doc(colRef, docData.id); // Referência ao documento
            insertBatch.set(newDocRef, docData);
          }
          await insertBatch.commit();
        }
  
        alert('Restauração do backup concluída com sucesso, você precirá logar novamente!');
        await logout();
        navigate('/login');
      };
  
      input.click();
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      alert('Erro ao restaurar o backup!');
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
        <i className="fa-solid fa-floppy-disk"></i> Fazer Backup
      </button>
      <button
        className={`${styles.restoreButton} ${styles.greenButton}`}
        onClick={handleRestoreBackup}
      >
        <i className="fa-solid fa-upload"></i> Restaurar Backup
      </button>
    </div>
    <button
      className={styles.backButton}
      onClick={() => {
        toggleSubmenu(null);
        navigate('/dashboard-admin');
      }}
    >
      <i className="fa-solid fa-rotate-left"></i> Voltar
    </button>
  </div>
        ) : (
          <>
            {/* Cards */}
            <div className={styles.cardsSection}>
              <h2 className={styles.cardsTitle}>Total de Cadastros no Banco de Dados por Tabela</h2>
              <div className={styles.cardsContainer}>
                {Object.entries(collectionCounts).map(([col, count]) => (
                  <div key={col} className={styles.card}>
                    <h3>{col}</h3>
                    <p>{count} Cadastros</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Gráficos */}
            <div className={styles.chartContainer}>
              <div className={styles.chartBlock}>
                <h3>Total de Cadastros no Banco de Dados</h3>
                <canvas ref={donutChartRef}></canvas>
              </div>
              <div className={styles.chartBlock}>
                <h3>Total de Cadastros no Banco de Dados Por Mês</h3>
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
