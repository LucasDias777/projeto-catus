import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { app } from '../config/firebaseConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/RelatorioTreino.module.css';

const RelatorioTreino = ({ userId }) => {
  const [relatorio, setRelatorio] = useState([]);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [statusTreino, setStatusTreino] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState('');

  const db = getFirestore(app);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const fetchTipoPessoa = async (uid) => {
    try {
      const pessoaDoc = await getDoc(doc(db, 'Pessoa', uid));
      if (pessoaDoc.exists()) {
        setTipoPessoa(pessoaDoc.data().tipo_pessoa);
      }
    } catch (error) {
      console.error('Erro ao buscar tipo de pessoa:', error);
    }
  };

  const fetchRelatorio = async () => {
    try {
      const treinosQuery = query(
        collection(db, 'Treino'),
        where('id_professor', '==', userId)
      );

      const treinosSnapshot = await getDocs(treinosQuery);
      const treinos = await Promise.all(
        treinosSnapshot.docs.map(async (doc) => {
          const treinoData = doc.data();
          const alunoDoc = await getDoc(doc(db, 'Pessoa', treinoData.id_aluno));
          const tipoDoc = await getDoc(doc(db, 'Tipo', treinoData.id_tipo));
          const treinoTempoQuery = query(
            collection(db, 'Treino_Tempo'),
            where('id_treino', '==', doc.id)
          );

          const treinoTempoSnapshot = await getDocs(treinoTempoQuery);
          const tempos = treinoTempoSnapshot.docs.map((tempoDoc) => tempoDoc.data());

          const statusConcluido = tempos.some((tempo) => tempo.data_termino);
          const primeiroTempo = tempos[0] || {};

          if (statusTreino === 'concluido' && !statusConcluido) return null;
          if (statusTreino === 'nao_concluido' && statusConcluido) return null;

          return {
            aluno: alunoDoc.exists() ? alunoDoc.data().nome_completo : 'Não informado',
            tipo: tipoDoc.exists() ? tipoDoc.data().nome : 'Não informado',
            status: statusConcluido ? 'Concluído' : 'Não Concluído',
            dataInicio: primeiroTempo.data_inicio || 'Não informado',
            dataTermino: statusConcluido ? primeiroTempo.data_termino : 'Não informado',
            dataCriacao: treinoData.data_criacao || 'Não informado',
          };
        })
      );

      setRelatorio(treinos.filter((treino) => treino !== null));
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
    }
  };

  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text('Relatório de Treinos', 10, 10);

    const tableData = relatorio.map((treino) => [
      treino.aluno,
      treino.tipo,
      treino.status,
      treino.dataInicio,
      treino.dataTermino,
      treino.dataCriacao,
    ]);

    doc.autoTable({
      head: [['Aluno', 'Tipo do Treino', 'Status', 'Data de Início', 'Data de Término', 'Data de Criação']],
      body: tableData,
    });

    doc.save('Relatorio_Treinos.pdf');
  };

  const gerarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      relatorio.map((treino) => ({
        Aluno: treino.aluno,
        Tipo: treino.tipo,
        Status: treino.status,
        'Data de Início': treino.dataInicio,
        'Data de Término': treino.dataTermino,
        'Data de Criação': treino.dataCriacao,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, 'Relatorio_Treinos.xlsx');
  };

  const voltarDashboard = () => {
    if (tipoPessoa === 'aluno') {
      navigate('/dashboard-aluno');
    } else if (tipoPessoa === 'professor') {
      navigate('/dashboard-professor');
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchTipoPessoa(currentUser.uid);
    }
    fetchRelatorio();
  }, [currentUser, filtroAluno, dataInicio, dataFim, statusTreino, tipoPessoa]);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Relatório de Treinos</h2>
        <button className={styles.backButton} onClick={voltarDashboard}>
          Voltar ao Dashboard
        </button>
      </div>
      <div className={styles.filters}>
  <label>
    Filtrar por Aluno:
    <input
      type="text"
      value={filtroAluno}
      onChange={(e) => setFiltroAluno(e.target.value)}
      placeholder="Nome do Aluno"
    />
  </label>
  <label>
    Data de Início:
    <input
      type="date"
      value={dataInicio}
      onChange={(e) => setDataInicio(e.target.value)}
    />
  </label>
  <label>
    Data de Fim:
    <input
      type="date"
      value={dataFim}
      onChange={(e) => setDataFim(e.target.value)}
    />
  </label>
  <label>
    Status:
    <select value={statusTreino} onChange={(e) => setStatusTreino(e.target.value)}>
      <option value="">Todos</option>
      <option value="concluido">Concluídos</option>
      <option value="nao_concluido">Não Concluídos</option>
    </select>
  </label>
  <button onClick={fetchRelatorio}>Filtrar</button>
  <button className={styles.pdfButton} onClick={gerarPDF}>
    Gerar PDF
  </button>
  <button className={styles.excelButton} onClick={gerarExcel}>
    Gerar Excel
  </button>
</div>

      {relatorio.length > 0 ? (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Aluno</th>
              <th>Tipo do Treino</th>
              <th>Status</th>
              <th>Data de Início</th>
              <th>Data de Término</th>
              <th>Data de Criação</th>
            </tr>
          </thead>
          <tbody>
            {relatorio.map((treino, index) => (
              <tr key={index}>
                <td>{treino.aluno}</td>
                <td>{treino.tipo}</td>
                <td>{treino.status}</td>
                <td>{treino.dataInicio}</td>
                <td>{treino.dataTermino}</td>
                <td>{treino.dataCriacao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>Nenhum treino encontrado.</p>
      )}
    </div>
  );
};

export default RelatorioTreino;
