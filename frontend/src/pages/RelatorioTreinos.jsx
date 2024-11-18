import React, { useEffect, useState } from 'react';


const RelatorioTreinos = ({ userId }) => {
  const [relatorio, setRelatorio] = useState([]);

  useEffect(() => {
    const fetchRelatorio = async () => {
      const q = query(collection(db, "treino_aluno"), where("userId", "==", userId));
      const querySnapshot = await getDocs(q);
      setRelatorio(querySnapshot.docs.map(doc => doc.data()));
    };

    fetchRelatorio();
  }, [userId]);

  return (
    <div>
      <h2>Relatório de Treinos</h2>
      {relatorio.map((treino, index) => (
        <div key={index}>
          <h3>{treino.nomeTreino}</h3>
          <p>Status: {treino.concluido ? "Concluído" : "Não Concluído"}</p>
        </div>
      ))}
    </div>
  );
};

export default RelatorioTreinos;
