import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebaseConfig'; // Certifique-se de importar corretamente
import { useAuth } from '../contexts/authContext'; // Importa o hook de autenticação
import styles from '../styles/VisualizarTreino.module.css'; // Ajuste o caminho se necessário

const VisualizarTreino = () => {
  const [treinos, setTreinos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inProgress, setInProgress] = useState(null); // Estado para controle de treino em andamento
  const { currentUser } = useAuth(); // Usa o hook useAuth para acessar o currentUser
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTreinos = async () => {
      if (!currentUser) return;

      try {
        const alunoId = currentUser.uid;
        // Consulta para buscar treinos do aluno atual
        const treinosQuery = query(collection(db, 'Treino'), where('id_aluno', '==', alunoId));
        const querySnapshot = await getDocs(treinosQuery);

        const treinosDetalhados = querySnapshot.docs.map(docTreino => ({
          id: docTreino.id,
          ...docTreino.data() // Spread para obter os campos diretamente
        }));

        setTreinos(treinosDetalhados);
      } catch (error) {
        console.error('Erro ao buscar treinos:', error);
      }
    };

    fetchTreinos();
  }, [currentUser]);

  // Filtragem de treinos pelo termo de pesquisa
  const filteredTreinos = treinos.filter(treino =>
    treino.descricao_tipo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Função para iniciar o treino
  const iniciarTreino = async (treinoId) => {
    if (!currentUser) return;

    try {
      const novoTreinoTempo = {
        id_treino: treinoId,
        id_aluno: currentUser.uid,
        id_professor: treinos.find(treino => treino.id === treinoId)?.id_professor || '',
        data_inicio: new Date().toISOString(),
        data_termino: null
      };

      const treinoTempoRef = await addDoc(collection(db, 'Treino_Tempo'), novoTreinoTempo);
      setInProgress(treinoTempoRef.id);
    } catch (error) {
      console.error('Erro ao iniciar o treino:', error);
    }
  };

  // Função para terminar o treino
  const terminarTreino = async () => {
    if (!inProgress) return;

    try {
      const treinoTempoRef = doc(db, 'Treino_Tempo', inProgress);
      await updateDoc(treinoTempoRef, {
        data_termino: new Date().toISOString(),
      });

      setInProgress(null);
    } catch (error) {
      console.error('Erro ao terminar o treino:', error);
    }
  };

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
              <div><strong>Tipo de Treino:</strong> {treino.descricao_tipo}</div>
              <div><strong>Equipamento:</strong> {treino.descricao_equipamento}</div>
              <div><strong>Série:</strong> {treino.descricao_serie}</div>
              <div><strong>Repetição:</strong> {treino.descricao_repeticao}</div>
              <button 
                onClick={() => iniciarTreino(treino.id)} 
                disabled={!!inProgress}
              >
                {inProgress ? 'Treino em Progresso' : 'Iniciar Treino'}
              </button>
              {inProgress && (
                <button onClick={terminarTreino}>
                  Terminar Treino
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VisualizarTreino;
