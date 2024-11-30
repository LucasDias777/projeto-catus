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

  const formatarData = (data) => {
    return data
      ? `${data.toLocaleDateString('pt-BR')} às ${data.toLocaleTimeString('pt-BR')}`
      : 'Não informado';
  };

  const fetchRelatorio = async () => {
    try {
      if (!currentUser) return;

      let treinosQuery = query(
        collection(db, 'Treino'),
        where('id_professor', '==', currentUser.uid)
      );

      if (filtroAluno) {
        treinosQuery = query(treinosQuery, where('id_aluno', '==', filtroAluno));
      }

      const treinosSnapshot = await getDocs(treinosQuery);

      const treinos = await Promise.all(
        treinosSnapshot.docs.map(async (treinoDoc) => {
          const treinoData = treinoDoc.data();

          const dataCriacao = treinoData.data_criacao
            ? treinoData.data_criacao.toDate
              ? treinoData.data_criacao.toDate()
              : new Date(treinoData.data_criacao)
            : null;

          const dataInicioFilter = dataInicio
            ? new Date(`${dataInicio}T00:00:00`)
            : null;
          const dataFimFilter = dataFim
            ? new Date(`${dataFim}T23:59:59`)
            : null;

          if (
            dataCriacao &&
            ((dataInicioFilter && dataCriacao < dataInicioFilter) ||
              (dataFimFilter && dataCriacao > dataFimFilter))
          ) {
            return null;
          }

          const alunoDoc = await getDoc(doc(db, 'Pessoa', treinoData.id_aluno));
          const tipoDoc = treinoData.id_tipo
            ? await getDoc(doc(db, 'Tipo', treinoData.id_tipo))
            : null;

          const alunoNome = alunoDoc.exists() ? alunoDoc.data().nome_completo : 'Não informado';
          const tipoNome = tipoDoc?.exists() ? tipoDoc.data().nome : 'Não informado';

          const treinoTempoQuery = query(
            collection(db, 'Treino_Tempo'),
            where('id_treino', '==', treinoDoc.id),
            ...(statusTreino && statusTreino !== 'Todos' ? [where('status', '==', statusTreino)] : [])
          );

          const treinoTempoSnapshot = await getDocs(treinoTempoQuery);
          if (statusTreino && treinoTempoSnapshot.empty) return null;

          const tempos = treinoTempoSnapshot.docs.map((tempoDoc) => {
            const tempoData = tempoDoc.data();
            const dataInicio = tempoData.data_inicio
              ? tempoData.data_inicio.toDate
                ? tempoData.data_inicio.toDate()
                : new Date(tempoData.data_inicio)
              : null;
            const dataTermino = tempoData.data_termino
              ? tempoData.data_termino.toDate
                ? tempoData.data_termino.toDate()
                : new Date(tempoData.data_termino)
              : null;
          
              let duracao = 'Não informado';
              if (dataInicio && dataTermino) {
                const diff = dataTermino.getTime() - dataInicio.getTime(); // Diferença em milissegundos
                if (diff === 0) {
                  // Caso as datas e horários sejam exatamente iguais
                  duracao = '00:00:00';
                } else {
                  const segundosTotais = Math.floor(diff / 1000);
                  const horas = Math.floor(segundosTotais / 3600);
                  const minutos = Math.floor((segundosTotais % 3600) / 60);
                  const segundos = segundosTotais % 60;
              
                  duracao = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
                }
              }
            
              return {
                status: tempoData.status || 'Não informado',
                dataInicio: formatarData(dataInicio),
                dataTermino: formatarData(dataTermino),
                duracao,
              };
            });

          return {
            aluno: alunoNome,
            tipo: tipoNome,
            status: tempos[0]?.status || 'Não informado',
            dataInicio: tempos[0]?.dataInicio || 'Não informado',
            dataTermino: tempos[0]?.dataTermino || 'Não informado',
            duracao: tempos[0]?.duracao || 'Não informado',
            dataCriacao: formatarData(dataCriacao),
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

  doc.text(title, titleX, 10);

  const tableData = relatorio.map((treino) => [
    treino.aluno,
    treino.tipo,
    treino.status,
    treino.dataInicio,
    treino.dataTermino,
    treino.duracao,
    treino.dataCriacao,
  ]);

  doc.autoTable({
    startY: 20,
    head: [
      [
        'Aluno',
        'Tipo do Treino',
        'Status',
        'Data de Início',
        'Data de Término',
        'Duração',
        'Data de Criação',
      ],
    ],
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
      Duração: treino.duracao,
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

  useEffect(() => {
    fetchRelatorio();
  }, [filtroAluno, dataInicio, dataFim, statusTreino]);

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Relatório de Treinos</h2>
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
      <th>Tipo do Treino</th>
      <th>Status</th>
      <th>Data de Início</th>
      <th>Data de Término</th>
      <th>Duração</th>
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
        <td>{treino.duracao}</td>
        <td>{treino.dataCriacao}</td>

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

export default RelatorioTreinoProfessor;
