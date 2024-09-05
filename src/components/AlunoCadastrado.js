import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig'; // Ajuste o caminho se necessário
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/AlunoCadastrado.module.css'; // Importa como módulo CSS

const AlunoCadastrado = () => {
  const [alunos, setAlunos] = useState([]);
  const [editAlunoId, setEditAlunoId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nomeCompleto: '',
    email: '',
    senha: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login'); // Redireciona para a tela de login se não estiver autenticado
        return;
      }

      try {
        const professorId = user.uid; // ID do professor logado
        const alunosRef = collection(db, 'pessoa');
        const querySnapshot = await getDocs(alunosRef);
        const alunosList = querySnapshot.docs
          .filter(doc => doc.data().professorId === professorId && doc.data().tipoPessoa === 'aluno')
          .map(doc => ({ id: doc.id, ...doc.data() }));

        setAlunos(alunosList);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
      }
    });

    // Limpeza do listener quando o componente desmontar
    return () => unsubscribe();
  }, [navigate]);

  const handleEditClick = (aluno) => {
    setEditAlunoId(aluno.id);
    setEditFormData({
      nomeCompleto: aluno.nomeCompleto,
      email: aluno.email,
      senha: aluno.senha
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const alunoRef = doc(db, 'pessoa', editAlunoId);
      await updateDoc(alunoRef, editFormData);
      alert('Dados atualizados com sucesso!');
      setEditAlunoId(null);
      setEditFormData({ nomeCompleto: '', email: '', senha: '' });

      // Atualiza a lista de alunos localmente
      setAlunos(alunos.map(aluno =>
        aluno.id === editAlunoId ? { ...aluno, ...editFormData } : aluno
      ));
    } catch (error) {
      console.error("Erro ao atualizar dados do aluno:", error);
    }
  };

  const handleDeleteClick = async (id) => {
    try {
      await deleteDoc(doc(db, 'pessoa', id));
      alert('Aluno excluído com sucesso!');
      setAlunos(alunos.filter(aluno => aluno.id !== id));
    } catch (error) {
      console.error("Erro ao excluir aluno:", error);
    }
  };

  return (
    <div className={styles.page}>
      <h1>Alunos Cadastrados</h1>
      <button onClick={() => navigate('/dashboard-professor')} className={styles.backButton}>Voltar ao Dashboard</button>
      {alunos.length === 0 ? (
        <p>Nenhum aluno cadastrado encontrado.</p>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Senha</th> {/* Considere ocultar ou mascarar a senha */}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunos.map(aluno => (
              <tr key={aluno.id}>
                <td>{aluno.nomeCompleto}</td>
                <td>{aluno.email}</td>
                <td>****</td> {/* Ocultar a senha */}
                <td>
                  <button onClick={() => handleEditClick(aluno)}>Editar</button>
                  <button onClick={() => handleDeleteClick(aluno.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editAlunoId && (
        <div className={styles.editForm}>
          <h2>Editar Aluno</h2>
          <form onSubmit={handleEditSubmit}>
            <div className={styles.formGroup}>
              <label>Nome Completo</label>
              <input type="text" name="nomeCompleto" value={editFormData.nomeCompleto} onChange={handleEditChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>E-mail</label>
              <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} required />
            </div>
            <div className={styles.formGroup}>
              <label>Senha</label>
              <input type="password" name="senha" value={editFormData.senha} onChange={handleEditChange} required />
            </div>
            <button type="submit">Salvar</button>
            <button type="button" onClick={() => setEditAlunoId(null)}>Cancelar</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AlunoCadastrado;
