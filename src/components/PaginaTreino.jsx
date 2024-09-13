import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, query, where, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import styles from '../styles/PaginaTreino.module.css'; // Importa o CSS

const PaginaTreino = () => {
  const { control, handleSubmit, reset, setValue, watch } = useForm();
  const { fields, append, remove } = useFieldArray({ control, name: 'equipamentos' });

  const [equipments, setEquipments] = useState([]);
  const [series, setSeries] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [treinos, setTreinos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.uid;

      // Consultas para equipamentos, séries, repetições, tipos de treino e alunos do professor logado
      const equipamentosQuery = query(collection(db, 'equipamentos'), where('professorId', '==', userId));
      const equipamentosSnapshot = await getDocs(equipamentosQuery);
      setEquipments(equipamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const seriesQuery = query(collection(db, 'series'), where('professorId', '==', userId));
      const seriesSnapshot = await getDocs(seriesQuery);
      setSeries(seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const repetitionsQuery = query(collection(db, 'repeticoes'), where('professorId', '==', userId));
      const repetitionsSnapshot = await getDocs(repetitionsQuery);
      setRepetitions(repetitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const trainingTypesQuery = query(collection(db, 'tipoTreinos'), where('professorId', '==', userId));
      const trainingTypesSnapshot = await getDocs(trainingTypesQuery);
      setTrainingTypes(trainingTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const studentsQuery = query(collection(db, 'pessoas'), where('tipoPessoa', '==', 'aluno'), where('professorId', '==', userId));
      const studentsSnapshot = await getDocs(studentsQuery);
      setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      // Consulta de treinos criados pelo professor logado
      const treinosQuery = query(collection(db, 'treinos'), where('professorId', '==', userId));
      const treinosSnapshot = await getDocs(treinosQuery);

      const treinosDetalhados = await Promise.all(treinosSnapshot.docs.map(async (docTreino) => {
        const treinoData = docTreino.data();
        const alunoSnap = await getDoc(doc(db, 'pessoas', treinoData.alunoId));
        const tipoTreinoSnap = await getDoc(doc(db, 'tipoTreinos', treinoData.tipoTreinoId));

        // Obter detalhes de equipamentos, séries e repetições
        const equipamentosDetalhes = await Promise.all(
          treinoData.equipamentos.map(async (equipamento) => {
            const equipamentoData = await getDoc(doc(db, 'equipamentos', equipamento.equipamentoId));
            const serieData = await getDoc(doc(db, 'series', equipamento.serieId));
            const repeticaoData = await getDoc(doc(db, 'repeticoes', equipamento.repeticaoId));

            return {
              nomeEquipamento: equipamentoData.data()?.nome || 'Equipamento não disponível',
              numeroSeries: serieData.data()?.numeroSeries || 'Série não disponível',
              numeroRepeticoes: repeticaoData.data()?.numeroRepeticoes || 'Repetição não disponível'
            };
          })
        );

        return {
          id: docTreino.id,
          aluno: alunoSnap.data()?.nomeCompleto || 'Nome não disponível',
          tipoTreino: tipoTreinoSnap.data()?.nome || 'Tipo de treino não disponível',
          equipamentos: equipamentosDetalhes
        };
      }));

      setTreinos(treinosDetalhados || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData();
    document.body.classList.add(styles.pageTreino);
    return () => document.body.classList.remove(styles.pageTreino);
  }, []);

  const onSubmit = async (data) => {
    if (!currentUser) return;

    try {
      const userId = currentUser.uid;

      await addDoc(collection(db, 'treinos'), {
        alunoId: data.alunoId,
        tipoTreinoId: data.tipoTreinoId,
        equipamentos: data.equipamentos,
        professorId: userId,
      });

      reset();
      fetchData(); // Atualiza a lista de treinos
      setModalVisible(false); // Fecha o modal após salvar
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
    }
  };

  const handleEquipmentChange = (index, equipamentoId) => {
    setValue(`equipamentos[${index}].equipamentoId`, equipamentoId);
  };

  const handleSeriesChange = (index, serieId) => {
    setValue(`equipamentos[${index}].serieId`, serieId);
  };

  const handleRepetitionsChange = (index, repeticaoId) => {
    setValue(`equipamentos[${index}].repeticaoId`, repeticaoId);
  };

  return (
    <>
     <div className={styles.pageContainer}>
  <div className={styles.topBar}>
    <div className={styles.topBarTitle}>Criação de Treinos</div>
    <div className={styles.headerBar}>
      <button className={styles.addButton} onClick={() => setModalVisible(true)}>Adicionar Treino</button>
      <button className={styles.backButton} onClick={() => navigate('/dashboard-professor')}>Voltar ao Dashboard</button>
    </div>
  </div>

        <div className={styles.treinosContainer}>
          {treinos.map(treino => (
            <div key={treino.id} className={styles.treinoCard}>
              <h3>Aluno: {treino.aluno}</h3>
              <h4>Tipo de Treino: {treino.tipoTreino}</h4>
              <div>
                {treino.equipamentos.map((equipamento, index) => (
                  <div key={index} className={styles.equipmentGroup}>
                    <span>Equipamento: {equipamento.nomeEquipamento}</span>
                    <span>Série: {equipamento.numeroSeries}</span>
                    <span>Repetição: {equipamento.numeroRepeticoes}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {modalVisible && (
          <div className={`${styles.modal} ${styles.visible}`} onClick={() => setModalVisible(false)}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <h2 className={styles.modalTitle}>Adicionar Novo Treino</h2>
                <button className={styles.modalClose} onClick={() => setModalVisible(false)}>&times;</button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.formGroup}>
                  <Controller
                    name="alunoId"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <select {...field} required>
                        <option value="">Selecione um aluno</option>
                        {students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.nomeCompleto}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div className={styles.formGroup}>
                  <Controller
                    name="tipoTreinoId"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <select {...field} required>
                        <option value="">Selecione um tipo de treino</option>
                        {trainingTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                {fields.map((item, index) => (
                  <div key={item.id} className={styles.equipmentGroup}>
                    <Controller
                      name={`equipamentos[${index}].equipamentoId`}
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => handleEquipmentChange(index, e.target.value)}
                          required
                        >
                          <option value="">Selecione um equipamento</option>
                          {equipments.map(equipment => (
                            <option key={equipment.id} value={equipment.id}>
                              {equipment.nome}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <Controller
                      name={`equipamentos[${index}].serieId`}
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => handleSeriesChange(index, e.target.value)}
                          required
                        >
                          <option value="">Selecione uma série</option>
                          {series.map(serie => (
                            <option key={serie.id} value={serie.id}>
                              {serie.numeroSeries}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <Controller
                      name={`equipamentos[${index}].repeticaoId`}
                      control={control}
                      defaultValue=""
                      render={({ field }) => (
                        <select
                          {...field}
                          onChange={(e) => handleRepetitionsChange(index, e.target.value)}
                          required
                        >
                          <option value="">Selecione uma repetição</option>
                          {repetitions.map(repetition => (
                            <option key={repetition.id} value={repetition.id}>
                              {repetition.numeroRepeticoes}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    <button type="button" className={styles.removeButton} onClick={() => remove(index)}>Remover Equipamento</button>
                  </div>
                ))}

                <button
                  type="button"
                  className={styles.addButton}
                  onClick={() => append({ equipamentoId: '', serieId: '', repeticaoId: '' })}
                >
                  Adicionar Equipamento
                </button>

                <button type="submit" className={styles.submitButton}>Salvar Treino</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PaginaTreino;
