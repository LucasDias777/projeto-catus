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

      const equipamentosQuery = query(collection(db, 'equipamento'), where('professorId', '==', userId));
      const equipamentosSnapshot = await getDocs(equipamentosQuery);
      setEquipments(equipamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const seriesQuery = query(collection(db, 'series'), where('professorId', '==', userId));
      const seriesSnapshot = await getDocs(seriesQuery);
      setSeries(seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const repetitionsQuery = query(collection(db, 'repeticoes'), where('professorId', '==', userId));
      const repetitionsSnapshot = await getDocs(repetitionsQuery);
      setRepetitions(repetitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const trainingTypesQuery = query(collection(db, 'tiposTreino'), where('professorId', '==', userId));
      const trainingTypesSnapshot = await getDocs(trainingTypesQuery);
      setTrainingTypes(trainingTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const studentsQuery = query(collection(db, 'pessoa'), where('tipoPessoa', '==', 'aluno'), where('professorId', '==', userId));
      const studentsSnapshot = await getDocs(studentsQuery);
      setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const treinosQuery = query(collection(db, 'treinos'), where('professorId', '==', userId));
      const treinosSnapshot = await getDocs(treinosQuery);
      
      const treinosDetalhados = await Promise.all(treinosSnapshot.docs.map(async (docTreino) => {
        const treinoData = docTreino.data();
        const alunoSnap = await getDoc(doc(db, 'pessoa', treinoData.alunoId));
        const tipoTreinoSnap = await getDoc(doc(db, 'tiposTreino', treinoData.tipoTreinoId));

        return {
          id: docTreino.id,
          aluno: alunoSnap.data()?.nomeCompleto || 'Nome não disponível',
          tipoTreino: tipoTreinoSnap.data()?.nome || 'Tipo não disponível',
          equipamentos: treinoData.equipamentos || [],
        };
      }));

      setTreinos(treinosDetalhados || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  useEffect(() => {
    document.body.classList.add(styles.pageTreino);

    return () => {
      document.body.classList.remove(styles.pageTreino);
    };
  }, []);

  const handleEquipmentChange = (index, selectedEquipment) => {
    setValue(`equipamentos[${index}].equipamentoId`, selectedEquipment);

    // Atualiza os valores de série e repetição com base no equipamento selecionado
    if (selectedEquipment) {
      setValue(`equipamentos[${index}].serieId`, ''); // Limpa série
      setValue(`equipamentos[${index}].repeticaoId`, ''); // Limpa repetição
    }
  };

  const handleSeriesChange = (index, selectedSeries) => {
    setValue(`equipamentos[${index}].serieId`, selectedSeries);
  };

  const handleRepetitionsChange = (index, selectedRepetition) => {
    setValue(`equipamentos[${index}].repeticaoId`, selectedRepetition);
  };

  const onSubmit = async (data) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'treinos'), {
        ...data,
        professorId: currentUser.uid,
        createdAt: new Date(),
      });
      alert('Treino criado com sucesso!');
      reset();
      fetchData();
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      alert('Erro ao criar treino');
    }
  };

  const handleOpenModal = () => {
    reset(); // Resetar os campos do formulário ao abrir o modal
    setModalVisible(true);
  };

  const handleCloseModal = () => setModalVisible(false);

  const watchedEquipamentos = watch('equipamentos', []);

  return (
    <div className={styles.pageContainer}>
      <div className={styles.headerBar}>
        <div className={styles.headerTitle}>Página de Treino</div>
        <button className={styles.backButton} onClick={() => navigate('/dashboard-professor')}>
          Voltar ao Dashboard
        </button>
      </div>

      <button onClick={handleOpenModal} className={styles.button}>Adicionar Treino</button>

      <div className={styles.treinosContainer}>
        {treinos.length === 0 ? (
          <p>Nenhum treino cadastrado.</p>
        ) : (
          treinos.map(treino => (
            <div key={treino.id} className={styles.treinoCard}>
              <div><strong>Aluno:</strong> {treino.aluno}</div>
              <div><strong>Tipo de Treino:</strong> {treino.tipoTreino}</div>
              <div><strong>Equipamentos:</strong> {treino.equipamentos.map(equipamento => {
                const equipment = equipments.find(e => e.id === equipamento.equipamentoId);
                const serie = series.find(s => s.id === equipamento.serieId);
                const repeticao = repetitions.find(r => r.id === equipamento.repeticaoId);
                return (
                  <div key={equipamento.equipamentoId}>
                    {equipment ? equipment.nome : 'Equipamento não disponível'} - 
                    {serie ? serie.nome : 'Série não disponível'} - 
                    {repeticao ? repeticao.nome : 'Repetição não disponível'}
                  </div>
                );
              })}
              </div>
            </div>
          ))
        )}
      </div>

      {modalVisible && (
        <div className={`${styles.modal} ${modalVisible ? styles.visible : ''}`} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>Criar Treino</div>
              <button className={styles.modalClose} onClick={handleCloseModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className={styles.formGroup}>
                  <label>Aluno</label>
                  <Controller
                    name="alunoId"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <select {...field} required>
                        <option value="">Selecione um aluno</option>
                        {students && students.map(student => (
                          <option key={student.id} value={student.id}>
                            {student.nomeCompleto}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Tipo de Treino</label>
                  <Controller
                    name="tipoTreinoId"
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <select {...field} required>
                        <option value="">Selecione um tipo de treino</option>
                        {trainingTypes && trainingTypes.map(type => (
                          <option key={type.id} value={type.id}>
                            {type.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Equipamentos</label>
                  {fields.map((item, index) => (
                    <div key={item.id} className={styles.equipmentGroup}>
                      <Controller
                        name={`equipamentos[${index}].equipamentoId`}
                        control={control}
                        defaultValue=""
                        render={({ field }) => (
                          <select {...field} onChange={(e) => handleEquipmentChange(index, e.target.value)} value={watch(`equipamentos[${index}].equipamentoId`)} required>
                            <option value="">Selecione um equipamento</option>
                            {equipments && equipments.map(equipment => (
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
                          <select {...field} onChange={(e) => handleSeriesChange(index, e.target.value)} value={watch(`equipamentos[${index}].serieId`)} required>
                            <option value="">Selecione uma série</option>
                            {series && series.map(serie => (
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
                          <select {...field} onChange={(e) => handleRepetitionsChange(index, e.target.value)} value={watch(`equipamentos[${index}].repeticaoId`)} required>
                            <option value="">Selecione uma repetição</option>
                            {repetitions && repetitions.map(repetition => (
                              <option key={repetition.id} value={repetition.id}>
                                {repetition.numeroRepeticoes}
                              </option>
                            ))}
                          </select>
                        )}
                      />

                      <button type="button" onClick={() => remove(index)}>Remover Equipamento</button>
                    </div>
                  ))}
                  <button type="button" onClick={() => append({ equipamentoId: '', serieId: '', repeticaoId: '' })}>
                    Adicionar Equipamento
                  </button>
                </div>

                <div className={styles.formGroup}>
                  <button type="submit" className={styles.submitButton}>Criar Treino</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaginaTreino;
