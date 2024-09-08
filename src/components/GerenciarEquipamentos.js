import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, updateDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore'; // Importar onSnapshot
import { useNavigate } from 'react-router-dom';

const GerenciarEquipamentos = () => {
  const [equipamentos, setEquipamentos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEquipamentos = async () => {
      const querySnapshot = await getDocs(collection(db, 'equipamentos'));
      const equipamentosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEquipamentos(equipamentosList);
    };

    fetchEquipamentos();

    // Listener para atualizações em tempo real
    const unsubscribe = onSnapshot(collection(db, 'equipamentos'), (snapshot) => {
      const updatedEquipamentos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setEquipamentos(updatedEquipamentos);
    });

    return () => unsubscribe();
  }, []);

  const handleEdit = async (id) => {
    if (!editNome.trim()) {
      alert('O nome do equipamento não pode estar vazio.');
      return;
    }
    const docRef = doc(db, 'equipamentos', id);
    await updateDoc(docRef, { nome: editNome });
    setEditId(null);
    setEditNome('');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você realmente deseja remover este equipamento?')) {
      await deleteDoc(doc(db, 'equipamentos', id));
      setEquipamentos(equipamentos.filter(e => e.id !== id));
    }
  };

  return (
    <div>
      <h2>Gerenciar Equipamentos</h2>
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
      <button onClick={() => navigate('/dashboard')}>Voltar</button>
    </div>
  );
};

export default GerenciarEquipamentos;
