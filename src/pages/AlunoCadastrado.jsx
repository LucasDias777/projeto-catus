import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Importação dos ícones
import styles from '../styles/AlunoCadastrado.module.css';

const AlunoCadastrado = () => {
  const [alunos, setAlunos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cidadeFiltro, setCidadeFiltro] = useState('');
  const [ufFiltro, setUfFiltro] = useState('');
  const [emailFiltro, setEmailFiltro] = useState('');
  const [ufs, setUfs] = useState([]);
  const navigate = useNavigate();

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
        const q = query(
          alunosRef,
          where('id_professor', '==', professorId),
          where('tipo_pessoa', '==', 'aluno')
        );
        const querySnapshot = await getDocs(q);

        const alunosList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          nome_completo: doc.data().nome_completo,
          email: doc.data().email,
          telefone: doc.data().telefone,
          cidade: doc.data().cidade,
          uf: doc.data().uf,
        }));

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

  const filteredAlunos = alunos.filter(
    (aluno) =>
      aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (cidadeFiltro ? aluno.cidade?.toLowerCase().includes(cidadeFiltro.toLowerCase()) : true) &&
      (ufFiltro ? aluno.uf === ufFiltro : true) &&
      (emailFiltro ? aluno.email?.toLowerCase().includes(emailFiltro.toLowerCase()) : true)
  );

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
    ]);

    doc.autoTable({
      startY: 20,
      head: [['Nome', 'Email', 'Telefone', 'Cidade', 'UF']],
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
        <input
          type="text"
          placeholder="Filtrar pelo Nome do Aluno"
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <input
          type="text"
          placeholder="Filtrar pelo Nome da Cidade"
          value={cidadeFiltro}
          onChange={handleCidadeFiltroChange}
          className={styles.searchInput}
        />
        <input
          type="text"
          placeholder="Filtrar pelo Email"
          value={emailFiltro}
          onChange={handleEmailFiltroChange}
          className={styles.searchInput}
        />
        <select value={ufFiltro} onChange={handleUfFiltroChange} className={styles.searchInput}>
          <option value="" disabled>
            Filtrar por Estado
          </option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>
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
              <th>Celular</th>
              <th>Telefone</th>
              <th>UF</th>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AlunoCadastrado;
