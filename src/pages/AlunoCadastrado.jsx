import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '@fortawesome/fontawesome-free/css/all.min.css';
import styles from '../styles/AlunoCadastrado.module.css';

const AlunoCadastrado = () => {
  const [alunos, setAlunos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [ufFiltro, setUfFiltro] = useState('');
  const [emailFiltro, setEmailFiltro] = useState('');
  const [ufs, setUfs] = useState([]);
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const navigate = useNavigate();

  // Função para tratar diferentes formatos de data
  const parseDataCriacao = (data) => {
    if (!data) return null;

    // Caso seja um Timestamp (Firebase)
    if (typeof data.toDate === 'function') {
      return data.toDate();
    }

    // Caso seja uma string ISO
    if (typeof data === 'string' && !isNaN(Date.parse(data))) {
      return new Date(data);
    }

    // Caso seja uma string no formato "30 de novembro de 2024 às 19:42:14 UTC-3"
    if (typeof data === 'string') {
      const regex = /(\d{1,2}) de (\w+) de (\d{4})/;
      const meses = {
        janeiro: 0,
        fevereiro: 1,
        março: 2,
        abril: 3,
        maio: 4,
        junho: 5,
        julho: 6,
        agosto: 7,
        setembro: 8,
        outubro: 9,
        novembro: 10,
        dezembro: 11,
      };

      const match = data.match(regex);
      if (match) {
        const dia = parseInt(match[1], 10);
        const mes = meses[match[2].toLowerCase()];
        const ano = parseInt(match[3], 10);
        return new Date(ano, mes, dia);
      }
    }

    return null; // Caso nenhum formato seja reconhecido
  };

  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const professorId = user.uid;

        // Consulta inicial para obter as UFs disponíveis
        const alunosRef = collection(db, 'Pessoa');
        const ufsSnapshot = await getDocs(query(alunosRef, where('id_professor', '==', professorId)));
        const uniqueUfs = [...new Set(ufsSnapshot.docs.map((doc) => doc.data().uf))].filter(Boolean);
        setUfs(uniqueUfs);

        // Consulta para buscar alunos
        const alunosQuery = query(
          alunosRef,
          where('id_professor', '==', professorId),
          where('tipo_pessoa', '==', 'aluno')
        );

        const querySnapshot = await getDocs(alunosQuery);

        // Aplicar a lógica de tratamento de data ao mapear os alunos
        const alunosList = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            nome_completo: data.nome_completo,
            email: data.email,
            telefone: data.telefone,
            cidade: data.cidade,
            uf: data.uf,
            data_criacao: parseDataCriacao(data.data_criacao),
          };
        });

        setAlunos(alunosList);
      } catch (error) {
        console.error('Erro ao buscar alunos:', error);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSearchChange = (e) => setSearchTerm(e.target.value);
  const handleCidadeFiltroChange = (e) => setCidadeFiltro(e.target.value);
  const handleUfFiltroChange = (e) => setUfFiltro(e.target.value);
  const handleEmailFiltroChange = (e) => setEmailFiltro(e.target.value);
  const handleDataInicioChange = (e) => setDataInicio(e.target.value);
  const handleDataFimChange = (e) => setDataFim(e.target.value);

  const filteredAlunos = alunos.filter((aluno) => {
    const dataCriacao = aluno.data_criacao;

    return (
      aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (cidadeFiltro ? aluno.cidade?.toLowerCase().includes(cidadeFiltro.toLowerCase()) : true) &&
      (ufFiltro ? aluno.uf === ufFiltro : true) &&
      (emailFiltro ? aluno.email?.toLowerCase().includes(emailFiltro.toLowerCase()) : true) &&
      (!dataInicio || (dataCriacao && dataCriacao >= new Date(`${dataInicio}T00:00:00`))) &&
      (!dataFim || (dataCriacao && dataCriacao <= new Date(`${dataFim}T23:59:59`)))
    );
  });

  const formatarData = (data) => {
    return data
      ? `${data.getDate().toString().padStart(2, '0')}/${(data.getMonth() + 1)
          .toString()
          .padStart(2, '0')}/${data.getFullYear()}`
      : 'Não informado';
  };

const generatePDF = () => {
    const doc = new jsPDF();
  
    const pageWidth = doc.internal.pageSize.getWidth();
    const title = 'Relatório de Alunos';
    const titleWidth = doc.getTextWidth(title);
    const titleX = (pageWidth - titleWidth) / 2;
  
    doc.text(title, titleX, 10);
  
    const tableData = filteredAlunos.map((aluno) => [
      aluno.nome_completo,
      aluno.email,
      aluno.telefone || 'Não informado',
      aluno.cidade || 'Não informado',
      aluno.uf || 'Não informado',
      aluno.data_criacao
        ? `${aluno.data_criacao.getDate().toString().padStart(2, '0')}/${(aluno.data_criacao.getMonth() + 1)
            .toString()
            .padStart(2, '0')}/${aluno.data_criacao.getFullYear()}`
        : 'Não informado',
    ]);
  
    doc.autoTable({
      startY: 20,
      head: [['Nome', 'Email', 'Telefone', 'Cidade', 'UF', 'Data de Criação']],
      body: tableData,
    });
  
    doc.save('Relatório de Alunos.pdf');
  };
  
  const generateExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredAlunos.map((aluno) => ({
        Nome: aluno.nome_completo,
        Email: aluno.email,
        Telefone: aluno.telefone || 'Não informado',
        Cidade: aluno.cidade || 'Não informado',
        UF: aluno.uf || 'Não informado',
        'Data de Criação': aluno.data_criacao
          ? `${aluno.data_criacao.getDate().toString().padStart(2, '0')}/${(aluno.data_criacao.getMonth() + 1)
              .toString()
              .padStart(2, '0')}/${aluno.data_criacao.getFullYear()}`
          : 'Não informado',
      }))
    );
  
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Alunos');
    XLSX.writeFile(workbook, 'Relatório de Alunos.xlsx');
  };
  

  return (
  <div className={styles.page}>
    <div className={styles.topbar}>
      <h1>Alunos Cadastrados</h1>
      <button onClick={() => navigate('/dashboard-professor')} className={styles.backButton}>
        <i className="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
      </button>
    </div>
    <div className={styles.filters}>
      <div className={styles.filterItemm}>
        <label>Nome:</label>
        <input
          type="text"
          placeholder="Filtrar pelo Nome do Aluno"
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.filterItemm}>
        <label>Cidade:</label>
        <input
          type="text"
          placeholder="Filtrar pelo Nome da Cidade"
          value={cidadeFiltro}
          onChange={handleCidadeFiltroChange}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.filterItemm}>
        <label>Email:</label>
        <input
          type="text"
          placeholder="Filtrar pelo Email"
          value={emailFiltro}
          onChange={handleEmailFiltroChange}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.filterItemm}>
        <label>Estado:</label>
        <select value={ufFiltro} onChange={handleUfFiltroChange} className={styles.searchInput}>
          <option value="">Filtrar por Estado</option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
      </div>
      <div className={styles.filterItem}>
        <label>Data Inicial:</label>
        <input type="date" value={dataInicio} onChange={handleDataInicioChange} />
      </div>
      <div className={styles.filterItem}>
        <label>Data Final:</label>
        <input type="date" value={dataFim} onChange={handleDataFimChange} />
      </div>
      <button
        onClick={generatePDF}
        className={`${styles.generateButton} ${styles.pdfButton}`}
      >
        <i className="fa-solid fa-file-pdf"></i> Gerar PDF
      </button>
      <button
        onClick={generateExcel}
        className={`${styles.generateButton} ${styles.excelButton}`}
      >
        <i className="fa-solid fa-file-excel"></i> Gerar Excel
      </button>
    </div>
    {filteredAlunos.length === 0 ? (
      <p>Nenhum aluno encontrado.</p>
    ) : (
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>Telefone</th>
            <th>Cidade</th>
            <th>UF</th>
            <th>Data do Cadastro</th>
          </tr>
        </thead>
        <tbody>
          {filteredAlunos.map((aluno) => (
            <tr key={aluno.id}>
              <td>{aluno.nome_completo}</td>
              <td>{aluno.email}</td>
              <td>{aluno.telefone || 'Não informado'}</td>
              <td>{aluno.cidade || 'Não informado'}</td>
              <td>{aluno.uf || 'Não informado'}</td>
              <td>{formatarData(aluno.data_criacao)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
 );
};

export default AlunoCadastrado;
