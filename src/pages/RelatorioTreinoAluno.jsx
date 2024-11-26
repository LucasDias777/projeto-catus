import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { app } from '../config/firebaseConfig';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/RelatorioTreino.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const RelatorioTreinoProfessor = () => {
  const [relatorio, setRelatorio] = useState([]);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [statusTreino, setStatusTreino] = useState('');
  const [alunos, setAlunos] = useState([]);

  const db = getFirestore(app);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const fetchAlunosVinculados = async () => {
    try {
      if (currentUser) {
        const alunosQuery = query(
          collection(db, 'Pessoa'),
          where('id_aluno', '==', currentUser.uid),
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

      const treinosQuery = query(
        collection(db, 'Treino'),
        where('id_professor', '==', currentUser.uid)
      );

      const treinosSnapshot = await getDocs(treinosQuery);

      const treinos = await Promise.all(
        treinosSnapshot.docs.map(async (doc) => {
          const treinoData = doc.data();

          // Filtro por aluno
          if (filtroAluno && treinoData.id_aluno !== filtroAluno) return null;

          // Obter dados adicionais
          const alunoDoc = await getDoc(doc(db, 'Pessoa', treinoData.id_aluno));
          const tipoDoc = await getDoc(doc(db, 'Tipo', treinoData.id_tipo));
          const treinoTempoQuery = query(
            collection(db, 'Treino_Tempo'),
            where('id_treino', '==', doc.id)
          );
          const treinoTempoSnapshot = await getDocs(treinoTempoQuery);
          const tempos = treinoTempoSnapshot.docs.map((tempoDoc) => tempoDoc.data());

          // Filtro de status
          const statusConcluido = tempos.some((tempo) => tempo.data_termino);
          if (statusTreino === 'concluido' && !statusConcluido) return null;
          if (statusTreino === 'nao_concluido' && statusConcluido) return null;

          // Filtro por período
          const dataCriacao = treinoData.data_criacao.toDate();
          const dentroPeriodo =
            (!dataInicio || new Date(dataInicio) <= dataCriacao) &&
            (!dataFim || new Date(dataFim) >= dataCriacao);
          if (!dentroPeriodo) return null;

          return {
            aluno: alunoDoc.exists() ? alunoDoc.data().nome_completo : 'Não informado',
            tipo: tipoDoc.exists() ? tipoDoc.data().nome : 'Não informado',
            status: statusConcluido ? 'Concluído' : 'Não Concluído',
            dataInicio: tempos[0]?.data_inicio?.toDate() || 'Não informado',
            dataTermino: statusConcluido ? tempos[0]?.data_termino?.toDate() : 'Não informado',
            dataCriacao,
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
    const title = 'Relatório de Treinos';
    const pageWidth = doc.internal.pageSize.getWidth();
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;

    // Adiciona o título
    doc.text(title, titleX, 10);
    const tableData = relatorio.map((treino) => [
      treino.aluno,
      treino.tipo,
      treino.status,
      treino.dataInicio,
      treino.dataTermino,
      treino.dataCriacao,
    ]);

    doc.autoTable({
        startY: 20,
      head: [['Tipo do Treino', 'Status', 'Data de Início', 'Data de Término', 'Data de Criação']],
      body: tableData,
    });

    doc.save('Relatório de Treinos.pdf');
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
    XLSX.writeFile(wb, 'Relatório de Treinos.xlsx');
  };

  const voltarDashboard = () => {
    navigate('/dashboard-professor');
  };

  useEffect(() => {
    fetchAlunosVinculados();
  }, [currentUser]);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Relatório de Treinos</h2>
        <button className={styles.backButton} onClick={voltarDashboard}>
        <i class="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>
      <div className={styles.filters}>
        <label>
          Filtrar por Aluno:
          <select value={filtroAluno} onChange={(e) => setFiltroAluno(e.target.value)}>
            <option value=""disabled>Selecione o seu Nome</option>
            {alunos.map((aluno) => (
              <option key={aluno.id} value={aluno.id}>
                {aluno.nome_completo}
              </option>
            ))}
          </select>
        </label>
        <label>
          Data de Início:
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
        </label>
        <label>
          Data de Fim:
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        <label>
          Status:
          <select value={statusTreino} onChange={(e) => setStatusTreino(e.target.value)}>
            <option value="">Todos</option>
            <option value="concluido">Concluídos</option>
            <option value="nao_concluido">Não Concluídos</option>
          </select>
        </label>
        <button onClick={fetchRelatorio}><i class="fa-solid fa-magnifying-glass"></i> Filtrar</button>
        <button className={styles.pdfButton} onClick={gerarPDF}>
        <i class="fa-solid fa-file-pdf"></i> Gerar PDF
        </button>
        <button className={styles.excelButton} onClick={gerarExcel}>
        <i class="fa-solid fa-file-excel"></i> Gerar Excel
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

export default RelatorioTreinoProfessor;
