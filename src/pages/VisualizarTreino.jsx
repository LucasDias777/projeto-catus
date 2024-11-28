import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/VisualizarTreino.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const VisualizarTreino = () => {
  const [treinos, setTreinos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [inProgress, setInProgress] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTreinos = async () => {
      if (!currentUser) return;

      try {
        const alunoId = currentUser.uid;

        const treinosQuery = query(collection(db, 'Treino'), where('id_aluno', '==', alunoId));
        const querySnapshot = await getDocs(treinosQuery);

        const treinosDetalhados = await Promise.all(
          querySnapshot.docs.map(async (docTreino) => {
            const treinoData = docTreino.data();

            // Buscar informações do Treino_Tempo
            const treinoTempoQuery = query(
              collection(db, 'Treino_Tempo'),
              where('id_treino', '==', docTreino.id)
            );
            const treinoTempoSnapshot = await getDocs(treinoTempoQuery);

            const treinoTempoData = treinoTempoSnapshot.empty
              ? null
              : treinoTempoSnapshot.docs[0].data();

            const status = treinoTempoData?.status || 'Não Iniciado';

            // Buscar detalhes dos equipamentos, séries e repetições
            const equipamentosDetalhados = await Promise.all(
              (treinoData.equipamentos || []).map(async (equipamento) => {
                const equipDoc = await getDoc(doc(db, 'Equipamento', equipamento.id_equipamento));
                return equipDoc.exists() ? equipDoc.data().nome : 'Equipamento não encontrado';
              })
            );

            const seriesDetalhadas = await Promise.all(
              (treinoData.equipamentos || []).map(async (equipamento) => {
                const serieDoc = await getDoc(doc(db, 'Serie', equipamento.id_serie));
                return serieDoc.exists() ? serieDoc.data().nome : 'Série não encontrada';
              })
            );

            const repeticoesDetalhadas = await Promise.all(
              (treinoData.equipamentos || []).map(async (equipamento) => {
                const repeticaoDoc = await getDoc(doc(db, 'Repeticao', equipamento.id_repeticao));
                return repeticaoDoc.exists() ? repeticaoDoc.data().nome : 'Repetição não encontrada';
              })
            );

            const tipoDoc = treinoData.id_tipo
              ? await getDoc(doc(db, 'Tipo', treinoData.id_tipo))
              : null;

            return {
              id: docTreino.id,
              ...treinoData,
              status,
              data_inicio: treinoTempoData?.data_inicio,
              data_termino: treinoTempoData?.data_termino,
              equipamento: equipamentosDetalhados.join(', '),
              serie: seriesDetalhadas.join(', '),
              repeticao: repeticoesDetalhadas.join(', '),
              tipo: tipoDoc?.exists() ? tipoDoc.data().nome : 'Tipo não encontrado',
            };
          })
        );

        setTreinos(treinosDetalhados);
      } catch (error) {
        console.error('Erro ao buscar treinos:', error);
      }
    };

    fetchTreinos();
  }, [currentUser]);

  const filteredTreinos = treinos.filter((treino) =>
    treino.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const iniciarTreino = async (treinoId) => {
    if (!currentUser) return;

    try {
      const treinoTempoQuery = query(
        collection(db, 'Treino_Tempo'),
        where('id_treino', '==', treinoId)
      );
      const querySnapshot = await getDocs(treinoTempoQuery);

      if (querySnapshot.empty) {
        console.error('Documento correspondente em Treino_Tempo não encontrado.');
        return;
      }

      const treinoTempoDoc = querySnapshot.docs[0];
      const treinoTempoRef = doc(db, 'Treino_Tempo', treinoTempoDoc.id);

      await updateDoc(treinoTempoRef, {
        data_inicio: serverTimestamp(),
        status: 'Iniciado',
      });

      setTreinos((prevTreinos) =>
        prevTreinos.map((treino) =>
          treino.id === treinoId
            ? { ...treino, status: 'Iniciado', data_inicio: serverTimestamp(), }
            : treino
        )
      );

      setInProgress(treinoId);
    } catch (error) {
      console.error('Erro ao iniciar o treino:', error);
    }
  };

  const terminarTreino = async () => {
    if (!inProgress) return;
  
    try {
      const treinoTempoQuery = query(
        collection(db, 'Treino_Tempo'),
        where('id_treino', '==', inProgress)
      );
      const querySnapshot = await getDocs(treinoTempoQuery);
  
      if (querySnapshot.empty) {
        console.error('Documento correspondente em Treino_Tempo não encontrado.');
        return;
      }
  
      const treinoTempoDoc = querySnapshot.docs[0];
      const treinoTempoRef = doc(db, 'Treino_Tempo', treinoTempoDoc.id);
  
      // Atualizar no banco de dados
      await updateDoc(treinoTempoRef, {
        data_termino: serverTimestamp(),
        status: 'Concluído',
      });
  
      // Obter os dados atualizados
      const updatedTreinoDoc = await getDoc(treinoTempoRef);
      const updatedTreinoData = updatedTreinoDoc.data();
  
      // Atualizar o estado local
      setTreinos((prevTreinos) =>
        prevTreinos.map((treino) =>
          treino.id === inProgress
            ? {
                ...treino,
                status: updatedTreinoData.status,
                data_termino: new Date(updatedTreinoData.data_termino.seconds * 1000).toISOString(),
              }
            : treino
        )
      );
  
      setInProgress(null);
    } catch (error) {
      console.error('Erro ao terminar o treino:', error);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <h2>Seus Treinos</h2>
        <button className={styles.backButton} onClick={() => navigate('/dashboard-aluno')}>
          <i className="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>
      <div className={styles.pageContainer}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Pesquisar pelo Tipo de Treino"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={styles.treinoContainer}>
          {filteredTreinos.length === 0 ? (
            <p>Você ainda não tem treinos disponíveis.</p>
          ) : (
            filteredTreinos.map((treino) => (
              <div key={treino.id} className={styles.treinoCard}>
                <div>
                  <strong>Tipo de Treino:</strong> {treino.tipo}
                </div>
                <div>
                  <strong>Equipamentos:</strong> {treino.equipamento}
                </div>
                <div>
                  <strong>Séries:</strong> {treino.serie}
                </div>
                <div>
                  <strong>Repetições:</strong> {treino.repeticao}
                </div>
                <div>
                  <strong>Descrição Geral:</strong> {treino.descricao}
                </div>
                <div>
                  {treino.status === 'Concluído' ? (
                    <span>
                      <i className="fa-solid fa-check"></i> Treino Concluído
                    </span>
                  ) : treino.status === 'Iniciado' ? (
                    <>
                      {treino.status === 'Iniciado' && (
                      <button onClick={terminarTreino} className={styles.terminateButton}>
                      <i className="fa-solid fa-medal"></i> Terminar Treino
                      </button>
                      )}
                      <span>
                        <i className="fa-solid fa-spinner fa-spin"></i> Em Progresso
                      </span>
                    </>
                  ) : (
                    <button
                      onClick={() => iniciarTreino(treino.id)}
                      disabled={inProgress !== null}
                      className={styles.startButton}
                    >
                      <i className="fa-solid fa-play"></i> Iniciar Treino
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default VisualizarTreino;
