import React, { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, getDocs, query, where, serverTimestamp, updateDoc, deleteDoc, doc, getDoc, onSnapshot } from 'firebase/firestore';
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
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [alunoFilter, setAlunoFilter] = useState('');
  const [tipoTreinoFilter, setTipoTreinoFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [studentsWithTrainings, setStudentsWithTrainings] = useState([]);

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

      // Função genérica para buscar documentos
      const fetchCollection = async (collectionName, conditions = []) => {
        const baseQuery = query(collection(db, collectionName), ...conditions);
        const snapshot = await getDocs(baseQuery);
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      };

      // Coletar os dados iniciais
      setEquipments(await fetchCollection('Equipamento', [where('id_professor', '==', userId)]));
      setSeries(await fetchCollection('Serie', [where('id_professor', '==', userId)]));
      setRepetitions(await fetchCollection('Repeticao', [where('id_professor', '==', userId)]));
      setTrainingTypes(await fetchCollection('Tipo', [where('id_professor', '==', userId)]));

      // Buscar todos os alunos do professor
      const alunos = await fetchCollection('Pessoa', [
        where('id_professor', '==', userId),
        where('tipo_pessoa', '==', 'aluno'),
      ]);
      setStudents(alunos);

      // Filtrar alunos que possuem treinos cadastrados
      const alunosComTreinos = await fetchAlunosComTreinos(alunos);
      setStudentsWithTrainings(alunosComTreinos);

      // Aplicar filtros para `Treino`
      const baseConditions = [where('id_professor', '==', userId)];
      if (alunoFilter) baseConditions.push(where('id_aluno', '==', alunoFilter));
      if (tipoTreinoFilter) baseConditions.push(where('id_tipo', '==', tipoTreinoFilter));

      const treinosSnapshot = await getDocs(query(collection(db, 'Treino'), ...baseConditions));
      const treinosFiltrados = await processTrainings(treinosSnapshot);

      setTrainings(treinosFiltrados);
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  // Função para filtrar alunos com treinos
  const fetchAlunosComTreinos = async (alunos) => {
    const alunosComTreinos = [];
    for (const aluno of alunos) {
      const treinos = await getDocs(
        query(collection(db, 'Treino'), where('id_aluno', '==', aluno.id))
      );
      if (!treinos.empty) alunosComTreinos.push(aluno);
    }
    return alunosComTreinos;
  };

  // Função para processar os treinos
  const processTrainings = async (snapshot) => {
    const trainings = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const treinoData = doc.data();
        const dataCriacao = treinoData.data_criacao?.toDate
          ? treinoData.data_criacao.toDate()
          : treinoData.data_criacao
          ? new Date(treinoData.data_criacao)
          : null;

        // Filtro por data
        const dataInicioFilter = dataInicio ? new Date(`${dataInicio}T00:00:00`) : null;
        const dataFimFilter = dataFim ? new Date(`${dataFim}T23:59:59`) : null;

        if (
          dataCriacao &&
          ((dataInicioFilter && dataCriacao < dataInicioFilter) ||
            (dataFimFilter && dataCriacao > dataFimFilter))
        ) {
          return null;
        }

        // Obter status do treino
        const treinoTempoSnapshot = await getDocs(
          query(collection(db, 'Treino_Tempo'), where('id_treino', '==', doc.id))
        );

        const status = !treinoTempoSnapshot.empty
          ? treinoTempoSnapshot.docs[0].data().status
          : 'Não informado';

        return { id: doc.id, ...treinoData, status };
      })
    );

    // Filtros adicionais
    return trainings
      .filter((treino) => treino !== null)
      .filter((training) => {
        if (statusFilter && training.status !== statusFilter) return false;
        if (alunoFilter && training.id_aluno !== alunoFilter) return false;
        if (tipoTreinoFilter && training.id_tipo !== tipoTreinoFilter) return false;
        return true;
      });
  };
  
    

  const onSubmit = async (data) => {
    if (!currentUser) return;
  
    try {
      const userId = currentUser.uid;
  
      // Ajustar a data fornecida ou usar a data atual
      const dataTreino = data.dataTreino 
        ? new Date(`${data.dataTreino}T00:00:00`) // Adiciona horário para evitar alterações de fuso horário
        : new Date();
  
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
        data_criacao: dataTreino,
      };
  
      let treinoDocRef;
  
      if (modalType === 'edit' && selectedTraining) {
        await updateDoc(doc(db, 'Treino', selectedTraining.id), treinoData);
        treinoDocRef = doc(db, 'Treino', selectedTraining.id);
      } else {
        treinoDocRef = await addDoc(collection(db, 'Treino'), treinoData);
  
        const treinoTempoData = {
          id_aluno: data.alunoId,
          id_professor: userId,
          id_treino: treinoDocRef.id,
          data_inicio: null,
          data_termino: null,
          status: 'Não Iniciado',
          data_criacao: serverTimestamp(),
        };
  
        await addDoc(collection(db, 'Treino_Tempo'), treinoTempoData);
      }
  
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
      const alunoDoc = await getDoc(doc(db, 'Pessoa', training.id_aluno));
      const tipoDoc = await getDoc(doc(db, 'Tipo', training.id_tipo));
  
      const equipamentosFormatados = training.equipamentos.map((equip) => ({
        equipamentoId: equip.id_equipamento || '',
        serieId: equip.id_serie || '',
        repeticaoId: equip.id_repeticao || '',
      }));
  
      reset({
        alunoId: training.id_aluno,
        tipoTreinoId: training.id_tipo,
        descricao: training.descricao || '',
        equipamentos: equipamentosFormatados,
        dataTreino: training.data_criacao ? formatDate(training.data_criacao.toDate(), true) : '',
      });
  
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

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, 'Treino_Tempo'), where('id_professor', '==', currentUser?.uid)),
      (snapshot) => {
        const updates = snapshot.docs.map((doc) => ({
          id_treino: doc.data().id_treino,
          status: doc.data().status,
        }));
        setTrainings((prevTrainings) =>
          prevTrainings.map((training) => {
            const updatedStatus = updates.find((update) => update.id_treino === training.id);
            return updatedStatus ? { ...training, status: updatedStatus.status } : training;
          })
        );
      }
    );
    return () => unsubscribe();
  }, [currentUser]);

  const handleView = (training) => {
    setSelectedTraining(training);
    setModalType('view');
    
  
    const equipamentosFormatados = training.equipamentos.map((equip) => ({
      equipamentoId: equip.id_equipamento || '',
      serieId: equip.id_serie || '',
      repeticaoId: equip.id_repeticao || '',
    }));
  
    reset({
      alunoId: training.id_aluno,
      tipoTreinoId: training.id_tipo,
      descricao: training.descricao || '',
      equipamentos: equipamentosFormatados,
      dataTreino: training.data_criacao ? formatDate(training.data_criacao.toDate(), true) : '',
    });
  };

  const formatDate = (date, forInput = false) => {
    if (!date) return 'Não informado';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
  
    return forInput ? `${year}-${month}-${day}` : `${day}/${month}/${year}`;
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
        <i className="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
      </button>
    </div>

    <div className={styles.filterContainer}>
      <label>
        Data Inicial:
        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
      </label>
      <label>
        Data Final:
        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
        />
      </label>
      <label>
        Aluno:
        <select
          value={alunoFilter}
          onChange={(e) => setAlunoFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {studentsWithTrainings.map((student) => (
            <option key={student.id} value={student.id}>
              {student.nome_completo}
            </option>
          ))}
        </select>
      </label>
      <label>
        Tipo de Treino:
        <select
          value={tipoTreinoFilter}
          onChange={(e) => setTipoTreinoFilter(e.target.value)}
        >
          <option value="">Todos</option>
          {trainingTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.nome}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status:
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Todos</option>
          <option value="Não Iniciado">Não Iniciado</option>
          <option value="Iniciado">Iniciado</option>
          <option value="Concluído">Concluído</option>
        </select>
      </label>
      <button onClick={fetchData}>Aplicar Filtros</button>
    </div>

    <div className={styles.treinosContainer}>
      {trainings.length === 0 ? (
        <p className={styles.noTrainingsMessage}>
          Nenhum treino encontrado com os filtros selecionados.
        </p>
      ) : (
        trainings.map((training) => (
          <div key={training.id} className={styles.treinoCard}>
            <h3>Treino</h3>
            <p>
              Data do Treino:{' '}
              {training.data_criacao
                ? formatDate(training.data_criacao.toDate())
                : 'Não informado'}
            </p>
            <p>Aluno: {getStudentName(training.id_aluno)}</p>
            <p>Tipo de Treino: {getTrainingTypeName(training.id_tipo)}</p>
            <p>Descrição: {training.descricao}</p>
            <p>Status: {training.status}</p>

            <div className={styles.treinoButtons}>
              {training.status === 'Iniciado' || training.status === 'Concluído' ? (
                <button
                  onClick={() => handleEdit(training)}
                  className={styles.viewButton}
                >
                  <i className="fa-solid fa-eye"></i> Ver Treino
                </button>
              ) : (
                <>
                  <button
                    onClick={() => handleEdit(training)}
                    className={styles.editButton}
                  >
                    <i className="fa-solid fa-pencil"></i> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(training.id)}
                    className={styles.deleteButton}
                  >
                    <i className="fa-solid fa-trash-can"></i> Remover
                  </button>
                </>
              )}
            </div>
          </div>
        ))
      )}
    </div>

    {modalType && (
  <div className={`${styles.modal} ${styles.visible}`}>
    <div className={styles.modalContent}>
      <h3>{modalType === 'create' ? 'Adicionar Treino' : modalType === 'edit' ? 'Editar Treino' : 'Visualizar Treino'}</h3>
      {modalType !== 'view' && (
        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Selecione uma Data */}
<div className={styles.formGroup}>
  <label>Selecione uma Data:</label>
  <Controller
    name="dataTreino"
    control={control}
    defaultValue={selectedTraining?.data_criacao ? formatDate(selectedTraining.data_criacao) : ''}
    render={({ field }) => <input type="date" {...field} />}
  />
</div>

          {/* Selecione um Aluno */}
          <div className={styles.formGroup}>
            <label>Aluno:</label>
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

          {/* Selecione um Tipo de Treino */}
          <div className={styles.formGroup}>
            <label>Tipo de Treino:</label>
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

          {/* Equipamentos, Séries e Repetições */}
          {fields.map((item, index) => (
            <div key={item.id} className={styles.equipmentRow}>
              <div className={styles.formGroup}>
                <label>Equipamento:</label>
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
              </div>
              <div className={styles.formGroup}>
                <label>Série:</label>
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
              </div>
              <div className={styles.formGroup}>
                <label>Repetições:</label>
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
              </div>
              <button
                type="button"
                className={styles.removeEquipmentButton}
                onClick={() => remove(index)}
              >
                <i className="fa-solid fa-trash-can"></i>
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

          {/* Descrição Geral */}
          <div className={styles.formGroup}>
            <label>Descrição Geral:</label>
            <textarea
              {...register('descricao', { required: true })}
              className={styles.descricaoGeral}
            ></textarea>
          </div>

          {/* Botões de Ação */}
          <div className={styles.modalFooter}>
            <button type="submit" className={styles.saveButton}>
              <i className="fa-solid fa-save"></i> Salvar
            </button>
            <button type="button" onClick={handleCloseModal} className={styles.cancelButton}>
              <i className="fa-solid fa-xmark"></i> Fechar
            </button>
          </div>
        </form>
      )}
    </div>
  </div>
)}
    </div>
  );
};

export default CadastroTreino;