import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';

const VisualizarTreino = () => {
  const [treinos, setTreinos] = useState([]);

  useEffect(() => {
    const fetchTreinos = async () => {
      const querySnapshot = await getDocs(collection(db, "treino"));
      setTreinos(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    };

    fetchTreinos();
  }, []);

  return (
    <div>
      <h2>Seus Treinos</h2>
      {treinos.map(treino => (
        <div key={treino.id}>
          <h3>{treino.nome}</h3>
          <p>{treino.descricao}</p>
          <button>Iniciar Treino</button>
        </div>
      ))}
    </div>
  );
};

export default VisualizarTreino;
