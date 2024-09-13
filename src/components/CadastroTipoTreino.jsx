import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext'; // Importando o contexto de autenticação

const CadastroTipoTreino = () => {
  const [nome, setNome] = useState('');
  const [tipoTreinos, setTipoTreinos] = useState([]); // Alterado para tipoTreinos
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Obtendo o usuário atual

  useEffect(() => {
    const fetchTipoTreinos = async () => {
      if (!currentUser) return;

      // Filtrando os tipos de treino pelo professorId (userId do professor logado)
      const q = query(collection(db, 'tipoTreinos'), where('professorId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTipoTreinos(tiposList); // Atualizado para refletir o nome correto
    };

    fetchTipoTreinos();
  }, [currentUser]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar um tipo de treino');
      return;
    }

    try {
      await addDoc(collection(db, 'tipoTreinos'), {
        nome,
        professorId: currentUser.uid // Associando o tipo de treino ao professor que o criou
      });
      alert('Tipo de treino cadastrado com sucesso!');
      setNome('');

      // Atualiza a lista de tipos de treino após o cadastro
      const q = query(collection(db, 'tipoTreinos'), where('professorId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTipoTreinos(tiposList); // Atualizado
    } catch (error) {
      console.error('Erro ao cadastrar tipo de treino:', error);
      alert('Erro ao cadastrar tipo de treino');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'tipoTreinos', id);
      await updateDoc(docRef, { nome: editNome });
      alert('Tipo de treino atualizado com sucesso!');
      setEditId(null);
      setEditNome('');

      // Atualiza a lista de tipos de treino após a edição
      const q = query(collection(db, 'tipoTreinos'), where('professorId', '==', currentUser.uid));
      const querySnapshot = await getDocs(q);
      const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTipoTreinos(tiposList); // Atualizado
    } catch (error) {
      console.error('Erro ao atualizar tipo de treino:', error);
      alert('Erro ao atualizar tipo de treino');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir este tipo de treino?')) {
      try {
        await deleteDoc(doc(db, 'tipoTreinos', id)); // Atualizado
        alert('Tipo de treino removido com sucesso!');

        // Atualiza a lista de tipos de treino após a remoção
        const q = query(collection(db, 'tipoTreinos'), where('professorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setTipoTreinos(tiposList); // Atualizado
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
      {tipoTreinos.map(t => ( // Atualizado para tipoTreinos
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
