import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import styles from '../styles/CadastroTreino.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const CadastroTreino = () => {
  const { control, handleSubmit, reset, setValue, register } = useForm();
  const { fields, append, remove } = useFieldArray({ control, name: 'equipamentos' });
  const [equipments, setEquipments] = useState([]);
  const [series, setSeries] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [modalType, setModalType] = useState(null);

  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!currentUser) return;

    try {
      const userId = currentUser.uid;

      const fetchCollection = async (collectionName, conditions = []) => {
        const baseQuery = query(collection(db, collectionName), ...conditions);
        const snapshot = await getDocs(baseQuery);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      };

      setEquipments(await fetchCollection('Equipamento', [where('id_professor', '==', userId)]));
      setSeries(await fetchCollection('Serie', [where('id_professor', '==', userId)]));
      setRepetitions(await fetchCollection('Repeticao', [where('id_professor', '==', userId)]));
      setTrainingTypes(await fetchCollection('Tipo', [where('id_professor', '==', userId)]));
      setStudents(
        await fetchCollection('Pessoa', [
          where('id_professor', '==', userId),
          where('tipo_pessoa', '==', 'aluno'),
        ])
      );
      setTrainings(await fetchCollection('Treino', [where('id_professor', '==', userId)]));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  const onSubmit = async (data) => {
    if (!currentUser) return;
  
    try {
      const userId = currentUser.uid;
  
      // Dados do treino
      const treinoData = {
        id_aluno: data.alunoId,
        id_professor: userId,
        id_tipo: data.tipoTreinoId,
        descricao: data.descricao,
        equipamentos: data.equipamentos.map((equip) => ({
          id_equipamento: equip.equipamentoId,
          id_serie: equip.serieId,
          id_repeticao: equip.repeticaoId,
        })),
        data_criacao: serverTimestamp(), // Garantir que este campo é atualizado sempre
      };
  
      let treinoDocRef;
  
      // Atualizar ou criar treino
      if (modalType === 'edit' && selectedTraining) {
        // Atualiza o treino existente
        await updateDoc(doc(db, 'Treino', selectedTraining.id), treinoData);
        treinoDocRef = doc(db, 'Treino', selectedTraining.id);
      } else {
        // Cria um novo treino
        treinoDocRef = await addDoc(collection(db, 'Treino'), treinoData);
  
        // Criação de documento na coleção Treino_Tempo (apenas para novos treinos)
        const treinoTempoData = {
          id_aluno: data.alunoId,
          id_professor: userId,
          id_treino: treinoDocRef.id, // Referência ao ID do treino criado
          data_inicio: null,
          data_termino: null,
          status: 'Não Iniciado',
          data_criacao: serverTimestamp(), // Adicionar data de criação aqui
        };
  
        await addDoc(collection(db, 'Treino_Tempo'), treinoTempoData);
      }
  
      // Atualiza a lista de treinos e fecha o modal
      fetchData();
      reset();
      handleCloseModal();
    } catch (error) {
      console.error('Erro ao salvar treino:', error);
    }
  };

  const handleEdit = async (training) => {
    setSelectedTraining(training);
    setModalType('edit');
  
    try {
      // Busca os nomes dos alunos e tipos de treino, se necessário
      const alunoDoc = await getDoc(doc(db, 'Pessoa', training.id_aluno));
      const tipoDoc = await getDoc(doc(db, 'Tipo', training.id_tipo));
  
      const equipamentosFormatados = training.equipamentos.map((equip) => ({
        equipamentoId: equip.id_equipamento || '',
        serieId: equip.id_serie || '',
        repeticaoId: equip.id_repeticao || '',
      }));
  
      // Atualiza o estado do formulário com os dados do treino
      reset({
        alunoId: training.id_aluno,
        tipoTreinoId: training.id_tipo,
        descricao: training.descricao || '',
        equipamentos: equipamentosFormatados,
      });
  
      // Opcional: Atualizar valores adicionais para exibição
      setValue('alunoNome', alunoDoc.exists() ? alunoDoc.data().nome_completo : 'Desconhecido');
      setValue('tipoTreinoNome', tipoDoc.exists() ? tipoDoc.data().nome : 'Desconhecido');
    } catch (error) {
      console.error('Erro ao buscar informações adicionais para edição:', error);
    }
  };

  const handleCreate = () => {
    reset({ alunoId: '', tipoTreinoId: '', descricao: '', equipamentos: [] });
    setSelectedTraining(null);
    setModalType('create');
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, 'Treino', id));
      fetchData();
    } catch (error) {
      console.error('Erro ao excluir treino:', error);
    }
  };

  const handleCloseModal = () => {
    reset();
    setModalType(null);
    setSelectedTraining(null);
  };

  const getStudentName = (id) =>
    students.find((student) => student.id === id)?.nome_completo || 'Desconhecido';
  const getTrainingTypeName = (id) =>
    trainingTypes.find((type) => type.id === id)?.nome || 'Desconhecido';

  return (
    <div className={styles.pageContainer}>
      <div className={styles.topBar}>
        <h2>Cadastro de Treino</h2>
        <button onClick={handleCreate} className={styles.addButton}>
        <i className="fa-solid fa-plus"></i> Adicionar Treino
        </button>
        <button
          onClick={() => navigate('/dashboard-professor')}
          className={styles.backToDashboardButton}
        >
         <i class="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>
  
      <div className={styles.treinosContainer}>
        {trainings.map((training) => (
          <div key={training.id} className={styles.treinoCard}>
            <h3>Treino</h3>
            <p>Aluno: {getStudentName(training.id_aluno)}</p>
            <p>Tipo de Treino: {getTrainingTypeName(training.id_tipo)}</p>
            <p>Descrição: {training.descricao}</p>
            <div className={styles.treinoButtons}>
              <button onClick={() => handleEdit(training)} className={styles.editButton}>
              <i className="fa-solid fa-pencil"></i> Editar
              </button>
              <button onClick={() => handleDelete(training.id)} className={styles.deleteButton}>
              <i className="fa-solid fa-trash-can"></i> Remover
              </button>
            </div>
          </div>
        ))}
      </div>
  
      {modalType && (
        <div className={`${styles.modal} ${styles.visible}`}>
          <div className={styles.modalContent}>
            <h3>{modalType === 'create' ? 'Adicionar Treino' : 'Editar Treino'}</h3>
            <form onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Controller
                  name="alunoId"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <select {...field} required>
                      <option value="" disabled>
                        Selecione um aluno
                      </option>
                      {students.map((student) => (
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
                      <option value="" disabled>
                        Selecione um tipo de treino
                      </option>
                      {trainingTypes.map((type) => (
                        <option key={type.id} value={type.id}>
                          {type.nome}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>
              {fields.map((item, index) => (
                <div key={item.id} className={styles.equipmentContainer}>
                  <Controller
                    name={`equipamentos[${index}].equipamentoId`}
                    control={control}
                    defaultValue=""
                    render={({ field }) => (
                      <select {...field} required>
                        <option value="" disabled>
                          Selecione um equipamento
                        </option>
                        {equipments.map((equip) => (
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
                        <option value="" disabled>
                          Selecione uma série
                        </option>
                        {series.map((serie) => (
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
                        <option value="" disabled>
                          Selecione uma repetição
                        </option>
                        {repetitions.map((rep) => (
                          <option key={rep.id} value={rep.id}>
                            {rep.nome}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <button
                    type="button"
                    className={styles.removeEquipmentButton}
                    onClick={() => remove(index)}
                  >
                  <i className="fa-solid fa-trash-can"></i>  Remover Equipamento
                  </button>
                </div>
              ))}
              <button
                type="button"
                className={styles.addEquipmentButton}
                onClick={() => append({ equipamentoId: '', serieId: '', repeticaoId: '' })}
              >
               <i className="fa-solid fa-plus"></i> Adicionar Equipamento
              </button>
              <div>
                <label>Descrição Geral:</label>
                <textarea
                  {...register('descricao', { required: true })}
                  className={styles.descricaoGeral}
                ></textarea>
              </div>
              <div className={styles.modalFooter}>
                <button type="submit" className={styles.saveButton}>
                <i className="fa-solid fa-check"></i>  Salvar
                </button>
                <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
                <i class="fa-solid fa-xmark"></i> Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CadastroTreino;