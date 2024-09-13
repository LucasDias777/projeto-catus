import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/AlunoCadastrado.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTrash } from '@fortawesome/free-solid-svg-icons';

const AlunoCadastrado = () => {
  const [alunos, setAlunos] = useState([]);
  const [editAlunoId, setEditAlunoId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    nomeCompleto: '',
    email: '',
    senha: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [isEmailInUse, setIsEmailInUse] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const professorId = user.uid;
        const alunosRef = collection(db, 'pessoas');
        const querySnapshot = await getDocs(alunosRef);
        const alunosList = querySnapshot.docs
          .filter(doc => doc.data().professorId === professorId && doc.data().tipoPessoa === 'aluno')
          .map(doc => ({ id: doc.id, ...doc.data() }));

        setAlunos(alunosList);
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleEditClick = (aluno) => {
    setEditAlunoId(aluno.id);
    setEditFormData({
      nomeCompleto: aluno.nomeCompleto,
      email: aluno.email,
      senha: ''
    });
    setShowPasswordField(false);
    setIsModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
    setIsEmailInUse(false);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Verificar se o email já está em uso por outro aluno
    const existingAluno = alunos.find(aluno => aluno.email === editFormData.email && aluno.id !== editAlunoId);
    if (existingAluno) {
      setIsEmailInUse(true);
      return;
    }

    try {
      const alunoRef = doc(db, 'pessoas', editAlunoId);

      // Atualizar os dados; se senha estiver vazia, não atualizá-la
      const updatedData = { ...editFormData };
      if (!editFormData.senha) {
        delete updatedData.senha; // Remove a senha do update se estiver vazia
      }

      await updateDoc(alunoRef, updatedData);
      alert('Dados atualizados com sucesso!');
      setEditAlunoId(null);
      setEditFormData({ nomeCompleto: '', email: '', senha: '' });
      setIsModalOpen(false);

      setAlunos(alunos.map(aluno =>
        aluno.id === editAlunoId ? { ...aluno, ...updatedData } : aluno
      ));
    } catch (error) {
      console.error("Erro ao atualizar dados do aluno:", error);
    }
  };

  const confirmDelete = (id) => {
    const isConfirmed = window.confirm("Você tem certeza que deseja excluir este aluno?");
    handleDeleteClick(id, isConfirmed);
  };

  const handleDeleteClick = async (id, confirm) => {
    if (confirm) {
      try {
        await deleteDoc(doc(db, 'pessoas', id));
        alert('Aluno excluído com sucesso!');
        setAlunos(alunos.filter(aluno => aluno.id !== id));
      } catch (error) {
        console.error("Erro ao excluir aluno:", error);
      }
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredAlunos = alunos.filter(aluno =>
    aluno.nomeCompleto.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeModal = () => {
    setIsModalOpen(false);
    setEditAlunoId(null);
    setIsEmailInUse(false);
  };

  return (
    <div className={styles.page}>
      <div className={styles.topbar}>
        <h1>Alunos Cadastrados</h1>
        <button onClick={() => navigate('/dashboard-professor')} className={styles.backButton}>Voltar ao Dashboard</button>
      </div>
      <input
        type="text"
        placeholder="Pesquisar aluno"
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
              <th>Senha</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredAlunos.map(aluno => (
              <tr key={aluno.id}>
                <td>{aluno.nomeCompleto}</td>
                <td>{aluno.email}</td>
                <td>******</td>
                <td>
                  <button onClick={() => handleEditClick(aluno)} className={styles.iconButton}>
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button onClick={() => confirmDelete(aluno.id)} className={styles.iconButton}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.modalClose} onClick={closeModal}>×</button>
            <h2>Editar Aluno</h2>
            <form onSubmit={handleEditSubmit}>
              <div className={styles.formGroup}>
                <label>Nome Completo</label>
                <input type="text" name="nomeCompleto" value={editFormData.nomeCompleto} onChange={handleEditChange} required />
              </div>
              <div className={styles.formGroup}>
                <label>E-mail</label>
                <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} required />
                {isEmailInUse && <p className={styles.errorText}>Este email já está em uso por outro aluno.</p>}
              </div>
              <div className={styles.formGroup}>
                <label>Senha (deixe em branco se não quiser alterar)</label>
                <input
                  type="password"
                  name="senha"
                  value={editFormData.senha}
                  onChange={handleEditChange}
                  placeholder="Digite nova senha (opcional)"
                  onFocus={() => setShowPasswordField(true)}
                />
              </div>
              <div className={styles.modalFooter}>
                <button type="submit">Salvar</button>
                <button type="button" onClick={closeModal}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlunoCadastrado;
