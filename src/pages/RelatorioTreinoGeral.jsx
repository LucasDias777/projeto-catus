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

  const db = getFirestore(app);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const formatarTempo = (segundos) => {
    const horas = String(Math.floor(segundos / 3600)).padStart(2, '0');
    const minutos = String(Math.floor((segundos % 3600) / 60)).padStart(2, '0');
    const segs = String(segundos % 60).padStart(2, '0');
    return `${horas}:${minutos}:${segs}`;
  };

  const fetchAlunosVinculados = async () => {
    try {
      if (currentUser) {
        const alunosQuery = query(
          collection(db, 'Pessoa'),
          where('id_professor', '==', currentUser.uid),
          where('tipo_pessoa', '==', 'aluno')
        );
        const alunosSnapshot = await getDocs(alunosQuery);
        const alunosData = alunosSnapshot.docs.map((doc) => ({
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
  
      let treinosQuery = query(
        collection(db, 'Treino_Tempo'),
        where('id_professor', '==', currentUser.uid)
      );
  
      // Aplicar filtros
      if (filtroAluno) {
        treinosQuery = query(treinosQuery, where('id_aluno', '==', filtroAluno));
      }
      if (dataInicio) {
        treinosQuery = query(treinosQuery, where('data_inicio', '>=', new Date(dataInicio)));
      }
      if (dataFim) {
        treinosQuery = query(treinosQuery, where('data_termino', '<=', new Date(dataFim)));
      }
      if (statusTreino && statusTreino !== 'Todos') {
        treinosQuery = query(treinosQuery, where('status', '==', statusTreino));
      }
  
      const treinosSnapshot = await getDocs(treinosQuery);
      const alunoIdToNome = alunos.reduce((map, aluno) => {
        map[aluno.id] = aluno.nome_completo;
        return map;
      }, {});
  
      const alunoStats = {};
  
      treinosSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const alunoId = data.id_aluno;
        const status = data.status;
  
        // Inicializar estatísticas do aluno
        if (!alunoStats[alunoId]) {
          alunoStats[alunoId] = {
            nome: alunoIdToNome[alunoId] || 'Aluno não identificado',
            naoIniciado: 0,
            iniciado: 0,
            concluido: 0,
            tempoTotal: 0,
            treinosConcluidos: 0,
          };
        }
  
        // Atualizar estatísticas com base no status
        if (status === 'Não Iniciado') alunoStats[alunoId].naoIniciado++;
        else if (status === 'Iniciado') alunoStats[alunoId].iniciado++;
        else if (status === 'Concluído') {
          alunoStats[alunoId].concluido++;
          const inicio = data.data_inicio?.toDate();
          const termino = data.data_termino?.toDate();
          if (inicio && termino) {
            const duracao = (termino - inicio) / 1000; // duração em segundos
            alunoStats[alunoId].tempoTotal += duracao;
            alunoStats[alunoId].treinosConcluidos++;
          }
        }
      });
  
      const relatorioData = Object.keys(alunoStats).map((alunoId) => {
        const stats = alunoStats[alunoId];
        const tempoMedio =
          stats.treinosConcluidos > 0
            ? formatarTempo(Math.round(stats.tempoTotal / stats.treinosConcluidos))
            : 'N/A';
  
        return {
          aluno: stats.nome,
          naoIniciado: stats.naoIniciado,
          iniciado: stats.iniciado,
          concluido: stats.concluido,
          tempoMedio,
        };
      });
  
      setRelatorio(relatorioData);
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
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
