import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const GerenciarRepeticoes = () => {
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

  const handleEdit = async (id) => {
    const docRef = doc(db, 'repeticoes', id);
    await updateDoc(docRef, { numeroRepeticoes: editNumeroRepeticoes });
    setEditId(null);
    setEditNumeroRepeticoes('');
    const updatedRepeticoes = repeticoes.map(r => r.id === id ? { ...r, numeroRepeticoes: editNumeroRepeticoes } : r);
    setRepeticoes(updatedRepeticoes);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'repeticoes', id));
    setRepeticoes(repeticoes.filter(r => r.id !== id));
  };

  return (
    <div>
      <h2>Gerenciar Repetições</h2>
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

export default GerenciarRepeticoes;
