import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const GerenciarSeries = () => {
  const [series, setSeries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNumeroSeries, setEditNumeroSeries] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSeries = async () => {
      const querySnapshot = await getDocs(collection(db, 'series'));
      const seriesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSeries(seriesList);
    };

    fetchSeries();
  }, []);

  const handleEdit = async (id) => {
    const docRef = doc(db, 'series', id);
    await updateDoc(docRef, { numeroSeries: editNumeroSeries });
    setEditId(null);
    setEditNumeroSeries('');
    const updatedSeries = series.map(s => s.id === id ? { ...s, numeroSeries: editNumeroSeries } : s);
    setSeries(updatedSeries);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, 'series', id));
    setSeries(series.filter(s => s.id !== id));
  };

  return (
    <div>
      <h2>Gerenciar Séries</h2>
      {series.map(s => (
        <div key={s.id}>
          {editId === s.id ? (
            <div>
              <input
                type="text"
                value={editNumeroSeries}
                onChange={(e) => setEditNumeroSeries(e.target.value)}
                placeholder="Número de Séries"
              />
              <button onClick={() => handleEdit(s.id)}>Salvar</button>
              <button onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>{s.numeroSeries}</span>
              <button onClick={() => { setEditId(s.id); setEditNumeroSeries(s.numeroSeries); }}>Editar</button>
              <button onClick={() => handleDelete(s.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard')}>Voltar</button>
    </div>
  );
};

export default GerenciarSeries;
