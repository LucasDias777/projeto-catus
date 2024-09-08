import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CadastroRepeticoes = () => {
  const [numeroRepeticoes, setNumeroRepeticoes] = useState('');
  const [repeticoes, setRepeticoes] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNumeroRepeticoes, setEditNumeroRepeticoes] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRepeticoes = async () => {
      const querySnapshot = await getDocs(collection(db, 'repeticoes'));
      const repeticoesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRepeticoes(repeticoesList);
    };

    fetchRepeticoes();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'repeticoes'), { numeroRepeticoes });
      alert('Repetição cadastrada com sucesso!');
      setNumeroRepeticoes('');
      const querySnapshot = await getDocs(collection(db, 'repeticoes'));
      const repeticoesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRepeticoes(repeticoesList);
    } catch (error) {
      console.error('Erro ao cadastrar repetições:', error);
      alert('Erro ao cadastrar repetições');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'repeticoes', id);
      await updateDoc(docRef, { numeroRepeticoes: editNumeroRepeticoes });
      alert('Repetição atualizada com sucesso!');
      setEditId(null);
      setEditNumeroRepeticoes('');
      const querySnapshot = await getDocs(collection(db, 'repeticoes'));
      const repeticoesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRepeticoes(repeticoesList);
    } catch (error) {
      console.error('Erro ao atualizar repetições:', error);
      alert('Erro ao atualizar repetições');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir esta repetição?')) {
      try {
        await deleteDoc(doc(db, 'repeticoes', id));
        alert('Repetição removida com sucesso!');
        const querySnapshot = await getDocs(collection(db, 'repeticoes'));
        const repeticoesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setRepeticoes(repeticoesList);
      } catch (error) {
        console.error('Erro ao remover repetições:', error);
        alert('Erro ao remover repetições');
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
      {repeticoes.map(r => (
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
              <span>{r.numeroRepeticoes}</span>
              <button onClick={() => { setEditId(r.id); setEditNumeroRepeticoes(r.numeroRepeticoes); }}>Editar</button>
              <button onClick={() => handleDelete(r.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroRepeticoes;
