import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext'; // Importando o contexto de autenticação
import { db } from '../config/firebaseConfig'; // Importa a configuração do Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, doc } from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore'; // Importando o serverTimestamp
import styles from '../styles/Tipo.module.css';

const CadastroTipo = () => {
  const [nome, setNome] = useState('');
  const [tipos, setTipos] = useState([]); // Alterado para tipos
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Obtendo o usuário atual

  useEffect(() => {
    if (!currentUser) return;

    // Escuta em tempo real para atualizar a lista de tipos de treino
    const unsubscribe = onSnapshot(
      query(collection(db, 'Tipo'), where('id_professor', '==', currentUser.uid)),
      (snapshot) => {
        const tiposList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTipos(tiposList);
      },
      (error) => {
        console.error('Erro ao escutar tipos de treino:', error);
      }
    );

    return () => unsubscribe(); // Cleanup ao desmontar o componente
  }, [currentUser]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar um tipo de treino');
      return;
    }

    try {
      await addDoc(collection(db, 'Tipo'), {
        nome,
        id_professor: currentUser.uid, // Associando o tipo de treino ao professor que o criou
        data_criacao: serverTimestamp(), // Adicionando a data de criação
      });
      alert('Tipo de treino cadastrado com sucesso!');
      setNome('');
    } catch (error) {
      console.error('Erro ao cadastrar tipo de treino:', error);
      alert('Erro ao cadastrar tipo de treino');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'Tipo', id);
      await updateDoc(docRef, { nome: editNome });
      alert('Tipo de treino atualizado com sucesso!');
      setEditId(null);
      setEditNome('');
    } catch (error) {
      console.error('Erro ao atualizar tipo de treino:', error);
      alert('Erro ao atualizar tipo de treino');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir este tipo de treino?')) {
      try {
        await deleteDoc(doc(db, 'Tipo', id));
        alert('Tipo de treino removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover tipo de treino:', error);
        alert('Erro ao remover tipo de treino');
      }
    }
  };

  return (
    <div>
      <h2>Cadastrar Tipo de Treino</h2>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do Tipo de Treino"
          required
        />
        <button type="submit">Cadastrar Tipo de Treino</button>
      </form>

      <h3>Tipos de Treino Cadastrados:</h3>
      {tipos.map((t) => (
        <div key={t.id}>
          {editId === t.id ? (
            <div>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome do Tipo de Treino"
              />
              <button onClick={() => handleEdit(t.id)}>Salvar</button>
              <button onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>{t.nome}</span>
              <button
                onClick={() => {
                  setEditId(t.id);
                  setEditNome(t.nome);
                }}
              >
                Editar
              </button>
              <button onClick={() => handleDelete(t.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroTipo;
