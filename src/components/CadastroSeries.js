import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CadastroSeries = () => {
  const [numeroSeries, setNumeroSeries] = useState('');
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

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'series'), { numeroSeries });
      alert('Série cadastrada com sucesso!');
      setNumeroSeries('');
      const querySnapshot = await getDocs(collection(db, 'series'));
      const seriesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSeries(seriesList);
    } catch (error) {
      console.error('Erro ao cadastrar série:', error);
      alert('Erro ao cadastrar série');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'series', id);
      await updateDoc(docRef, { numeroSeries: editNumeroSeries });
      alert('Série atualizada com sucesso!');
      setEditId(null);
      setEditNumeroSeries('');
      const querySnapshot = await getDocs(collection(db, 'series'));
      const seriesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSeries(seriesList);
    } catch (error) {
      console.error('Erro ao atualizar série:', error);
      alert('Erro ao atualizar série');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir esta série?')) {
      try {
        await deleteDoc(doc(db, 'series', id));
        alert('Série removida com sucesso!');
        const querySnapshot = await getDocs(collection(db, 'series'));
        const seriesList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSeries(seriesList);
      } catch (error) {
        console.error('Erro ao remover série:', error);
        alert('Erro ao remover série');
      }
    }
  };

  return (
    <div>
      <h2>Cadastrar Séries</h2>
      <form onSubmit={handleAdd}>
        <input
          type="text"
          value={numeroSeries}
          onChange={(e) => setNumeroSeries(e.target.value)}
          placeholder="Número de Séries"
          required
        />
        <button type="submit">Cadastrar Séries</button>
      </form>
      
      <h3>Séries Cadastradas:</h3>
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
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroSeries;
