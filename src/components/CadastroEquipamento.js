import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, onSnapshot, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authContext'; // Importando o contexto de autenticação

const CadastroEquipamento = () => {
  const [nome, setNome] = useState('');
  const [equipamentos, setEquipamentos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Obtendo o usuário atual

  useEffect(() => {
    if (!currentUser) {
      return; // Se não houver usuário logado, interrompa a execução
    }

    const fetchEquipamentos = async () => {
      const equipamentosRef = collection(db, 'equipamentos');
      const q = query(equipamentosRef, where('professorId', '==', currentUser.uid)); // Filtrando pelo professorId
      const querySnapshot = await getDocs(q);
      const equipamentosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEquipamentos(equipamentosList);
    };

    // Monitorar mudanças em tempo real apenas para equipamentos do professor logado
    const unsubscribe = onSnapshot(
      query(collection(db, 'equipamentos'), where('professorId', '==', currentUser.uid)), 
      (snapshot) => {
        const updatedEquipamentos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEquipamentos(updatedEquipamentos);
      }
    );

    fetchEquipamentos();

    return () => unsubscribe();
  }, [currentUser]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar um equipamento');
      return;
    }

    try {
      await addDoc(collection(db, 'equipamentos'), {
        nome,
        professorId: currentUser.uid // Associando o equipamento ao professor que o criou
      });
      alert('Equipamento cadastrado com sucesso!');
      setNome('');
    } catch (error) {
      console.error('Erro ao cadastrar equipamento:', error);
      alert('Erro ao cadastrar equipamento');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'equipamentos', id);
      await updateDoc(docRef, { nome: editNome });
      alert('Equipamento atualizado com sucesso!');
      setEditId(null);
      setEditNome('');
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      alert('Erro ao atualizar equipamento');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir este equipamento?')) {
      try {
        await deleteDoc(doc(db, 'equipamentos', id));
        alert('Equipamento removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover equipamento:', error);
        alert('Erro ao remover equipamento');
      }
    }
  };

  return (
    <div>
      <h2>Cadastrar Equipamento</h2>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do Equipamento"
          required
        />
        <button type="submit">Cadastrar Equipamento</button>
      </form>
      
      <h3>Equipamentos Cadastrados:</h3>
      {equipamentos.map(e => (
        <div key={e.id}>
          {editId === e.id ? (
            <div>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome do Equipamento"
              />
              <button onClick={() => handleEdit(e.id)}>Salvar</button>
              <button onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>{e.nome}</span>
              <button onClick={() => { setEditId(e.id); setEditNome(e.nome); }}>Editar</button>
              <button onClick={() => handleDelete(e.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroEquipamento;
