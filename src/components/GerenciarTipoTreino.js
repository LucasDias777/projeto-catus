import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const GerenciarTipoTreino = () => {
  const [tiposTreino, setTiposTreino] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editTipo, setEditTipo] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTiposTreino = async () => {
      const querySnapshot = await getDocs(collection(db, 'tiposTreino'));
      const tiposList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTiposTreino(tiposList);
    };

    fetchTiposTreino();
  }, []);

  const handleEdit = async (id) => {
    const docRef = doc(db, 'tiposTreino', id);
    await updateDoc(docRef, { tipo: editTipo });
    setEditId(null);
    setEditTipo('');
    const updatedTipos = tiposTreino.map(t => t.id === id ? { ...t, tipo: editTipo } : t);
    setTiposTreino(updatedTipos);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'tiposTreino', id));
    setTiposTreino(tiposTreino.filter(t => t.id !== id));
  };

  return (
    <div>
      <h2>Gerenciar Tipos de Treino</h2>
      {tiposTreino.map(t => (
        <div key={t.id}>
          {editId === t.id ? (
            <div>
              <input
                type="text"
                value={editTipo}
                onChange={(e) => setEditTipo(e.target.value)}
                placeholder="Tipo de Treino"
              />
              <button onClick={() => handleEdit(t.id)}>Salvar</button>
              <button onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>{t.tipo}</span>
              <button onClick={() => { setEditId(t.id); setEditTipo(t.tipo); }}>Editar</button>
              <button onClick={() => handleDelete(t.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard')}>Voltar</button>
    </div>
  );
};

export default GerenciarTipoTreino;
