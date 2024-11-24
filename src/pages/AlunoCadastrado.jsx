import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import styles from '../styles/AlunoCadastrado.module.css';

const AlunoCadastrado = () => {
  const [alunos, setAlunos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
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
        const professorId = user.uid; // Obtém o ID do professor autenticado

        // Cria a referência à coleção 'Pessoa' e faz a consulta para filtrar pelos alunos do professor
        const alunosRef = collection(db, 'Pessoa');
        const q = query(
          alunosRef,
          where('id_professor', '==', professorId), // Corrigido para usar 'id_professor'
          where('tipo_pessoa', '==', 'aluno')
        );
        const querySnapshot = await getDocs(q);

        // Filtra e mapeia os dados necessários
        const alunosList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          nome_completo: doc.data().nome_completo,
          email: doc.data().email,
          telefone: doc.data().telefone,
          cidade: doc.data().cidade,
        }));

        setAlunos(alunosList);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome_completo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <h1>Alunos Cadastrados</h1>
        <button onClick={() => navigate('/dashboard-professor')} className={styles.backButton}>
          Voltar ao Dashboard
        </button>
      </div>
      <input
        type="text"
        placeholder="Pesquisar pelo Nome do Aluno"
        value={searchTerm}
        onChange={handleSearchChange}
        className={styles.searchInput}
      />
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
            </tr>
          </thead>
          <tbody>
            {filteredAlunos.map((aluno) => (
              <tr key={aluno.id}>
                <td>{aluno.nome_completo}</td>
                <td>{aluno.email}</td>
                <td>{aluno.telefone || 'Não informado'}</td>
                <td>{aluno.cidade || 'Não informado'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AlunoCadastrado;
