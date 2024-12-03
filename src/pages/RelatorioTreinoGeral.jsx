import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../config/firebaseConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/RelatorioTreino.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const RelatorioTreinoGeral = () => {
  const [relatorio, setRelatorio] = useState([]);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [statusTreino, setStatusTreino] = useState('');
  const [alunos, setAlunos] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // Estado para controlar o carregamento.

  const db = getFirestore(app);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const carregarAlunos = async () => {
    try {
      console.log('Carregando lista de alunos...');
      const alunosSnapshot = await getDocs(collection(db, 'Alunos'));
      const alunosData = alunosSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAlunos(alunosData);
    } catch (error) {
      console.error('Erro ao carregar lista de alunos:', error);
    }
  };

  const formatarTempo = (segundos) => {
    const horas = String(Math.floor(segundos / 3600)).padStart(2, '0');
    const minutos = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    const segs = String(segundos % 60).padStart(2, '0');
    return `${horas}:${minutos}:${segs}`;
  };

  const fetchAlunosVinculados = async () => {
    try {
      if (currentUser) {
        const treinosSnapshot = await getDocs(
          query(collection(db, 'Treino'), where('id_professor', '==', currentUser.uid))
        );
        const alunosIds = new Set(treinosSnapshot.docs.map((doc) => doc.data().id_aluno));
        const alunosQuery = query(
          collection(db, 'Pessoa'),
          where('id_professor', '==', currentUser.uid),
          where('tipo_pessoa', '==', 'aluno')
        );
        const alunosSnapshot = await getDocs(alunosQuery);
        const alunosData = alunosSnapshot.docs
          .filter((doc) => alunosIds.has(doc.id))
          .map((doc) => ({
            id: doc.id,
            nome_completo: doc.data().nome_completo,
          }));
        setAlunos(alunosData);
      }
    } catch (error) {
      console.error('Erro ao buscar alunos vinculados:', error);
    }
  };

  
  const fetchRelatorio = async () => {
    try {
      if (!currentUser) return;
  
    
      // Inicializar a consulta com filtro pelo professor
      let treinosQuery = query(
        collection(db, "Treino"),
        where("id_professor", "==", currentUser.uid)
      );
  
      // Filtro por aluno específico
      if (filtroAluno) {
        treinosQuery = query(treinosQuery, where("id_aluno", "==", filtroAluno));
      }
  
      // Filtros de data
      const dataInicioFilter = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null;
      const dataFimFilter = dataFim ? new Date(`${dataFim}T23:59:59`) : null;
  
      const treinosSnapshot = await getDocs(treinosQuery);
      const treinosData = treinosSnapshot.docs.filter((doc) => {
        const dataCriacao = doc.data().data_criacao?.toDate();
        if (dataInicioFilter && dataCriacao < dataInicioFilter) return false;
        if (dataFimFilter && dataCriacao > dataFimFilter) return false;
        return true;
      });
  
      // Mapear IDs de alunos para nomes
      const alunosIds = Array.from(new Set(treinosData.map((doc) => doc.data().id_aluno)));
      const alunoIdToNome = alunos.reduce((map, aluno) => {
        map[aluno.id] = aluno.nome_completo;
        return map;
      }, {});
  
      // Inicializar estatísticas dos alunos
      const alunoStats = {};
  
      // Processar cada treino
      for (const treinoDoc of treinosData) {
        const treino = treinoDoc.data();
        const alunoId = treino.id_aluno;
  
        if (!alunoStats[alunoId]) {
          alunoStats[alunoId] = {
            nome: alunoIdToNome[alunoId] || "Aluno não identificado",
            naoIniciado: 0,
            iniciado: 0,
            concluido: 0,
            tempoTotal: 0,
            treinosConcluidos: 0,
          };
        }
  
        const treinoTempoQuery = query(
          collection(db, "Treino_Tempo"),
          where("id_treino", "==", treinoDoc.id),
          ...(statusTreino && statusTreino !== "Todos" ? [where("status", "==", statusTreino)] : [])
        );
  
        const treinoTempoSnapshot = await getDocs(treinoTempoQuery);
        treinoTempoSnapshot.docs.forEach((tempoDoc) => {
          const tempoData = tempoDoc.data();
          const status = tempoData.status;
  
          if (status === "Não Iniciado") alunoStats[alunoId].naoIniciado++;
          if (status === "Iniciado") alunoStats[alunoId].iniciado++;
          if (status === "Concluído") {
            alunoStats[alunoId].concluido++;
            const inicio = tempoData.data_inicio?.toDate();
            const termino = tempoData.data_termino?.toDate();
            if (inicio && termino) {
              const duracao = (termino - inicio) / 1000;
              alunoStats[alunoId].tempoTotal += duracao;
              alunoStats[alunoId].treinosConcluidos++;
            }
          }
        });
      }
  
      const relatorioData = Object.keys(alunoStats).map((alunoId) => {
        const stats = alunoStats[alunoId];
        const tempoMedio =
          stats.treinosConcluidos > 0
            ? formatarTempo(Math.round(stats.tempoTotal / stats.treinosConcluidos))
            : "N/A";
  
        return {
          aluno: stats.nome,
          naoIniciado: stats.naoIniciado,
          iniciado: stats.iniciado,
          concluido: stats.concluido,
          tempoMedio,
        };
      });
  
      // Filtrar para exibir apenas alunos com treinos
      setRelatorio(
        relatorioData.filter(
          (relatorio) => relatorio.naoIniciado > 0 || relatorio.iniciado > 0 || relatorio.concluido > 0
        )
      );
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
    }
  };
  

const gerarPDF = () => {
    const doc = new jsPDF();
    const title = 'Relatório de Treinos';
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
  
    doc.text(title, titleX, 10);
  
    const tableData = relatorio.map((treino) => [
      treino.aluno,
      treino.naoIniciado,
      treino.iniciado,
      treino.concluido,
      treino.tempoMedio,
    ]);
  
    doc.autoTable({
      startY: 20,
      head: [['Aluno', 'Não Iniciado', 'Iniciado', 'Concluído', 'Tempo Médio']],
      body: tableData,
    });
  
    doc.save('Relatorio_Treinos.pdf');
  };
  
  const gerarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      relatorio.map((treino) => ({
        Aluno: treino.aluno,
        'Não Iniciado': treino.naoIniciado,
        Iniciado: treino.iniciado,
        Concluído: treino.concluido,
        'Tempo Médio': treino.tempoMedio,
      }))
    );
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, 'Relatorio_Treinos.xlsx');
  };


  const voltarDashboard = () => {
    navigate('/dashboard-professor');
  };

  useEffect(() => {
    fetchAlunosVinculados();
  }, [currentUser]);

  useEffect(() => {
    fetchRelatorio();
  }, [filtroAluno, dataInicio, dataFim, statusTreino]);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Relatório de Treinos Geral</h2>
        <button className={styles.backButton} onClick={voltarDashboard}>
          <i className="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>
      <div className={styles.filters}>
        <label>
          Filtrar por Aluno:
          <select value={filtroAluno} onChange={(e) => setFiltroAluno(e.target.value)}>
            <option value="">Todos</option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome_completo}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data Inicial:
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </label>
        <label>
          Data Final:
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        <label>
          Status:
          <select value={statusTreino} onChange={(e) => setStatusTreino(e.target.value)}>
          <option value="">Todos</option>
          <option value="Não Iniciado">Não Iniciado</option>
          <option value="Iniciado">Iniciado</option>
          <option value="Concluído">Concluído</option>
          </select>
        </label>
        <button className={styles.pdfButton} onClick={gerarPDF}>
          <i className="fa-solid fa-file-pdf"></i> Gerar PDF
        </button>
        <button className={styles.excelButton} onClick={gerarExcel}>
          <i className="fa-solid fa-file-excel"></i> Gerar Excel
        </button>
</div>

      {relatorio.length > 0 ? (
        <table className={styles.table}>
        <thead>
          <tr>
            <th>Aluno</th>
            <th>Não Iniciado</th>
            <th>Iniciado</th>
            <th>Concluído</th>
            <th>Tempo Médio</th>
          </tr>
        </thead>
        <tbody>
          {relatorio.map((treino, index) => (
            <tr key={index}>
              <td>{treino.aluno}</td>
              <td>{treino.naoIniciado}</td>
              <td>{treino.iniciado}</td>
              <td>{treino.concluido}</td>
              <td>{treino.tempoMedio}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
        
      ) : (
        <p className={styles.noData}>Nenhum Treino encontrado.</p>
      )}
    </div>
  );
};

export default RelatorioTreinoGeral;
