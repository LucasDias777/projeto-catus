import React, { useEffect, useState } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { app } from '../config/firebaseConfig'; // Importa a configuração do Firebase
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const RelatorioTreino = ({ userId }) => {
  const [relatorio, setRelatorio] = useState([]);
  const [filtroAluno, setFiltroAluno] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [statusTreino, setStatusTreino] = useState('');

  const db = getFirestore(app);

  const fetchRelatorio = async () => {
    try {
      const treinosQuery = query(
        collection(db, 'Treino'),
        where('id_professor', '==', userId),
        filtroAluno && where('id_aluno', '==', filtroAluno)
      );
      const treinosSnapshot = await getDocs(treinosQuery);

      const treinos = await Promise.all(
        treinosSnapshot.docs.map(async (doc) => {
          const treinoData = doc.data();

          const treinoTempoQuery = query(
            collection(db, 'Treino_Tempo'),
            where('id_treino', '==', doc.id),
            dataInicio && where('data_inicio', '>=', dataInicio),
            dataFim && where('data_inicio', '<=', dataFim)
          );
          const treinoTempoSnapshot = await getDocs(treinoTempoQuery);

          const tempos = treinoTempoSnapshot.docs.map((tempoDoc) => tempoDoc.data());
          const statusConcluido = tempos.some((tempo) => tempo.data_termino);

          if (statusTreino === 'concluido' && !statusConcluido) return null;
          if (statusTreino === 'nao_concluido' && statusConcluido) return null;

          return {
            ...treinoData,
            status: statusConcluido ? 'Concluído' : 'Não Concluído',
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
      treino.descricao_tipo,
      treino.id_aluno,
      treino.descricao_equipamento,
      treino.status,
    ]);

    doc.autoTable({
      head: [['Tipo', 'Aluno', 'Equipamento', 'Status']],
      body: tableData,
    });

    doc.save('Relatorio_Treinos.pdf');
  };

  const gerarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      relatorio.map((treino) => ({
        Tipo: treino.descricao_tipo,
        Aluno: treino.id_aluno,
        Equipamento: treino.descricao_equipamento,
        Status: treino.status,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, 'Relatorio_Treinos.xlsx');
  };

  useEffect(() => {
    fetchRelatorio();
  }, [filtroAluno, dataInicio, dataFim, statusTreino]);

  return (
    <div>
      <h2>Relatório de Treinos</h2>
      <div>
        <label>
          Filtrar por Aluno:
          <input
            type="text"
            value={filtroAluno}
            onChange={(e) => setFiltroAluno(e.target.value)}
            placeholder="ID do Aluno"
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
        <button onClick={gerarPDF}>Gerar PDF</button>
        <button onClick={gerarExcel}>Gerar Excel</button>
      </div>
      {relatorio.length > 0 ? (
        relatorio.map((treino, index) => (
          <div key={index}>
            <h3>{treino.descricao_tipo}</h3>
            <p>Aluno: {treino.id_aluno}</p>
            <p>Equipamento: {treino.descricao_equipamento}</p>
            <p>Status: {treino.status}</p>
          </div>
        ))
      ) : (
        <p>Nenhum treino encontrado.</p>
      )}
    </div>
  );
};

export default RelatorioTreino;
