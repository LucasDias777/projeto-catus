import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext'; // Importando o contexto de autenticação
import { db } from '../config/firebaseConfig'; // Importa a configuração do Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, query, where, doc, serverTimestamp } from 'firebase/firestore';
import styles from '../styles/Repeticao.module.css';

const CadastroRepeticao = () => {
  const [numeroRepeticoes, setNumeroRepeticoes] = useState('');
  const [repeticoes, setRepeticoes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNumeroRepeticoes, setEditNumeroRepeticoes] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Obtendo o usuário atual do contexto

  useEffect(() => {
    const fetchRepeticoes = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'Repeticao'),
          where('id_professor', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const repeticoesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRepeticoes(repeticoesList);
      } catch (error) {
        console.error('Erro ao buscar repetições:', error);
      }
    };

    fetchRepeticoes();
  }, [currentUser]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Você precisa estar autenticado para adicionar repetições.');
      return;
    }

    try {
      await addDoc(collection(db, 'Repeticao'), {
        nome: numeroRepeticoes,
        id_professor: currentUser.uid,
        data_criacao: serverTimestamp(),
      });
      alert('Repetição cadastrada com sucesso!');
      setNumeroRepeticoes('');

      // Atualizar lista de repetições
      const q = query(
        collection(db, 'Repeticao'),
        where('id_professor', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const repeticoesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRepeticoes(repeticoesList);
    } catch (error) {
      console.error('Erro ao cadastrar repetição:', error);
      alert('Erro ao cadastrar repetição.');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'Repeticao', id);
      await updateDoc(docRef, { nome: editNumeroRepeticoes });
      alert('Repetição atualizada com sucesso!');
      setEditId(null);
      setEditNumeroRepeticoes('');

      // Atualizar lista de repetições
      const q = query(
        collection(db, 'Repeticao'),
        where('id_professor', '==', currentUser.uid)
      );
      const querySnapshot = await getDocs(q);
      const repeticoesList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRepeticoes(repeticoesList);
    } catch (error) {
      console.error('Erro ao atualizar repetição:', error);
      alert('Erro ao atualizar repetição.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir esta repetição?')) {
      try {
        await deleteDoc(doc(db, 'Repeticao', id));
        alert('Repetição removida com sucesso!');

        // Atualizar lista de repetições
        const q = query(
          collection(db, 'Repeticao'),
          where('id_professor', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const repeticoesList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRepeticoes(repeticoesList);
      } catch (error) {
        console.error('Erro ao remover repetição:', error);
        alert('Erro ao remover repetição.');
      }
    }
  };

  return (
    <div>
      <h2>Cadastrar Repetições</h2>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={numeroRepeticoes}
          onChange={(e) => setNumeroRepeticoes(e.target.value)}
          placeholder="Número de Repetições"
          required
        />
        <button type="submit">Cadastrar Repetições</button>
      </form>

      <h3>Repetições Cadastradas:</h3>
      {repeticoes.map((r) => (
        <div key={r.id}>
          {editId === r.id ? (
            <div>
              <input
                type="text"
                value={editNumeroRepeticoes}
                onChange={(e) => setEditNumeroRepeticoes(e.target.value)}
                placeholder="Número de Repetições"
              />
              <button onClick={() => handleEdit(r.id)}>Salvar</button>
              <button onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>{r.nome}</span>
              <button
                onClick={() => {
                  setEditId(r.id);
                  setEditNumeroRepeticoes(r.nome);
                }}
              >
                Editar
              </button>
              <button onClick={() => handleDelete(r.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroRepeticao;
