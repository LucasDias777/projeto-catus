import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import styles from '../styles/CadastroTreino.module.css';

const CadastroTreino = () => {
  const { control, handleSubmit, reset, setValue } = useForm();
  const { fields, append, remove } = useFieldArray({ control, name: 'equipamentos' });

  const [equipments, setEquipments] = useState([]);
  const [series, setSeries] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.uid;

      const equipamentosQuery = query(collection(db, 'Equipamento'), where('id_professor', '==', userId));
      const equipamentosSnapshot = await getDocs(equipamentosQuery);
      setEquipments(equipamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const seriesQuery = query(collection(db, 'Serie'), where('id_professor', '==', userId));
      const seriesSnapshot = await getDocs(seriesQuery);
      setSeries(seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const repetitionsQuery = query(collection(db, 'Repeticao'), where('id_professor', '==', userId));
      const repetitionsSnapshot = await getDocs(repetitionsQuery);
      setRepetitions(repetitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const trainingTypesQuery = query(collection(db, 'Tipo'), where('id_professor', '==', userId));
      const trainingTypesSnapshot = await getDocs(trainingTypesQuery);
      setTrainingTypes(trainingTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);

      const studentsQuery = query(collection(db, 'Pessoa'), where('id_professor', '==', userId), where('tipo_pessoa', '==', 'aluno'));
      const studentsSnapshot = await getDocs(studentsQuery);
      setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (data) => {
    if (!currentUser) return;

    try {
      const userId = currentUser.uid;

      const treinoData = {
        id_aluno: data.alunoId,
        id_professor: userId,
        id_tipo: data.tipoTreinoId,
        descricao: data.descricao, // Descrição geral do treino
        equipamentos: data.equipamentos.map(equip => ({
          id_equipamento: equip.equipamentoId,
          id_serie: equip.serieId,
          id_repeticao: equip.repeticaoId,
        })),
        data_criacao: serverTimestamp(),
      };

      await addDoc(collection(db, 'Treino'), treinoData);

      reset();
      setModalVisible(false);
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <h2>Cadastro de Treino</h2>
        <button onClick={() => setModalVisible(true)} className={styles.addButton}>
          Adicionar Treino
        </button>
        <button onClick={() => navigate('/dashboard-professor')} className={styles.backButton}>
          Voltar ao Dashboard
        </button>
      </div>

      {modalVisible && (
        <div className={`${styles.modal} ${styles.visible}`} onClick={() => setModalVisible(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit(onSubmit)}>
              <h3>Adicionar Treino</h3>
              <div>
                <Controller
                  name="alunoId"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <select {...field} required>
                      <option value="">Selecione um aluno</option>
                      {students.map(student => (
                        <option key={student.id} value={student.id}>
                          {student.nome_completo}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              <div>
                <Controller
                  name="tipoTreinoId"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <select {...field} required>
                      <option value="">Selecione um tipo</option>
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
                      <select {...field} required>
                        <option value="">Equipamento</option>
                        {equipments.map(equip => (
                          <option key={equip.id} value={equip.id}>
                            {equip.nome}
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
                      <select {...field} required>
                        <option value="">Série</option>
                        {series.map(serie => (
                          <option key={serie.id} value={serie.id}>
                            {serie.nome}
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
                      <select {...field} required>
                        <option value="">Repetição</option>
                        {repetitions.map(rep => (
                          <option key={rep.id} value={rep.id}>
                            {rep.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <button type="button" onClick={() => remove(index)}>
                    Remover
                  </button>
                </div>
              ))}

              <button type="button" onClick={() => append({ equipamentoId: '', serieId: '', repeticaoId: '' })}>
                Adicionar Equipamento
              </button>

              <div>
                <label>Descrição Geral</label>
                <Controller
                  name="descricao"
                  control={control}
                  defaultValue=""
                  render={({ field }) => <textarea {...field} placeholder="Informações adicionais do treino" />}
                />
              </div>

              <button type="submit">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroTreino;
