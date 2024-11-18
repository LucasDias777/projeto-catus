import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/VisualizarTreino.module.css'; // Ajuste o caminho do CSS se necessário

const VisualizarTreino = () => {
  const [treinos, setTreinos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const auth = getAuth();
  const currentUser = auth.currentUser;
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTreinos = async () => {
      if (!currentUser) return;

      try {
        const alunoId = currentUser.uid; // Assume que o ID do aluno é o mesmo que o UID do usuário autenticado

        // Consulta para buscar apenas os treinos associados ao aluno atual
        const treinosQuery = query(collection(db, 'treinos'), where('alunoId', '==', alunoId));
        const querySnapshot = await getDocs(treinosQuery);

        console.log("Query Snapshot:", querySnapshot.docs.map(doc => doc.data())); // Verificar os dados retornados

        const treinosDetalhados = await Promise.all(querySnapshot.docs.map(async (docTreino) => {
          const treinoData = docTreino.data();
          console.log("Treino Data:", treinoData); // Verificar dados do treino

          // Obter o tipo de treino usando o tipoTreinoId
          let tipoTreinoNome = 'Tipo de treino não disponível';
          if (treinoData.tipoTreinoId) {
            try {
              const tipoTreinoDoc = await getDoc(doc(db, 'tipoTreinos', treinoData.tipoTreinoId));
              const tipoTreinoData = tipoTreinoDoc.data();
              if (tipoTreinoData) {
                tipoTreinoNome = tipoTreinoData.nome || 'Tipo de treino não disponível';
              }
            } catch (err) {
              console.error('Erro ao buscar tipo de treino:', err);
            }
          }

          // Obter detalhes de equipamentos, séries e repetições
          const equipamentosDetalhes = await Promise.all(
            treinoData.equipamentos.map(async (equipamento) => {
              try {
                const equipamentoDoc = await getDoc(doc(db, 'equipamentos', equipamento.equipamentoId));
                const serieDoc = await getDoc(doc(db, 'series', equipamento.serieId));
                const repeticaoDoc = await getDoc(doc(db, 'repeticoes', equipamento.repeticaoId));

                return {
                  nomeEquipamento: equipamentoDoc.data()?.nome || 'Equipamento não disponível',
                  numeroSeries: serieDoc.data()?.numeroSeries || 'Série não disponível',
                  numeroRepeticoes: repeticaoDoc.data()?.numeroRepeticoes || 'Repetição não disponível'
                };
              } catch (err) {
                console.error('Erro ao buscar detalhes do equipamento:', err);
                return {
                  nomeEquipamento: 'Equipamento não disponível',
                  numeroSeries: 'Série não disponível',
                  numeroRepeticoes: 'Repetição não disponível'
                };
              }
            })
          );

          return {
            id: docTreino.id,
            tipoTreino: tipoTreinoNome,
            equipamentos: equipamentosDetalhes || [],
          };
        }));

        console.log("Treinos Detalhados:", treinosDetalhados); // Verificar dados detalhados dos treinos

        setTreinos(treinosDetalhados || []);
      } catch (error) {
        console.error('Erro ao buscar treinos:', error);
      }
    };

    fetchTreinos();
  }, [currentUser]);

  // Filtrar os treinos com base no termo de pesquisa
  const filteredTreinos = treinos.filter(treino =>
    treino.tipoTreino.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h2>Seus Treinos</h2>
        <button 
          className={styles.backButton} 
          onClick={() => navigate('/dashboard-aluno')}
        >
          Voltar ao Dashboard
        </button>
      </div>
      <div className={styles.searchContainer}>
        <input 
          type="text" 
          className={styles.searchInput} 
          placeholder="Pesquisar tipo de treino" 
          value={searchTerm} 
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className={styles.treinoContainer}>
        {filteredTreinos.length === 0 ? (
          <p>Você ainda não tem treinos disponíveis.</p>
        ) : (
          filteredTreinos.map(treino => (
            <div key={treino.id} className={styles.treinoCard}>
              <div><strong>Tipo de Treino:</strong> {treino.tipoTreino}</div>
              <div><strong>Equipamentos:</strong>
                {treino.equipamentos.length > 0 ? (
                  treino.equipamentos.map((equipamento, index) => (
                    <div key={index}>
                      <strong>Equipamento:</strong> {equipamento.nomeEquipamento}<br />
                      <strong>Séries:</strong> {equipamento.numeroSeries}<br />
                      <strong>Repetições:</strong> {equipamento.numeroRepeticoes}
                    </div>
                  ))
                ) : (
                  <p>Nenhum equipamento disponível.</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisualizarTreino;
