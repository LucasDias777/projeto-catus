import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext'; // Importando o contexto de autenticação

const CadastroTipoTreino = () => {
  const [nome, setNome] = useState('');
  const [tiposTreino, setTiposTreino] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Obtendo o usuário atual

  useEffect(() => {
    const fetchTiposTreino = async () => {
      const querySnapshot = await getDocs(collection(db, 'tiposTreino'));
      const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTiposTreino(tiposList);
    };

    fetchTiposTreino();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar um tipo de treino');
      return;
    }

    try {
      await addDoc(collection(db, 'tiposTreino'), {
        nome,
        professorId: currentUser.uid // Associando o tipo de treino ao professor que o criou
      });
      alert('Tipo de treino cadastrado com sucesso!');
      setNome('');
      const querySnapshot = await getDocs(collection(db, 'tiposTreino'));
      const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTiposTreino(tiposList);
    } catch (error) {
      console.error('Erro ao cadastrar tipo de treino:', error);
      alert('Erro ao cadastrar tipo de treino');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'tiposTreino', id);
      await updateDoc(docRef, { nome: editNome });
      alert('Tipo de treino atualizado com sucesso!');
      setEditId(null);
      setEditNome('');
      const querySnapshot = await getDocs(collection(db, 'tiposTreino'));
      const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTiposTreino(tiposList);
    } catch (error) {
      console.error('Erro ao atualizar tipo de treino:', error);
      alert('Erro ao atualizar tipo de treino');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir este tipo de treino?')) {
      try {
        await deleteDoc(doc(db, 'tiposTreino', id));
        alert('Tipo de treino removido com sucesso!');
        const querySnapshot = await getDocs(collection(db, 'tiposTreino'));
        const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTiposTreino(tiposList);
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
      {tiposTreino.map(t => (
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
              <button onClick={() => { setEditId(t.id); setEditNome(t.nome); }}>Editar</button>
              <button onClick={() => handleDelete(t.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroTipoTreino;
