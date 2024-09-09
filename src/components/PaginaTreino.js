import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom'; 
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, query, where, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const PaginaTreino = () => {
  const { control, handleSubmit, reset } = useForm();
  const [equipments, setEquipments] = useState([]);
  const [series, setSeries] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [treinos, setTreinos] = useState([]);
  const [editTreino, setEditTreino] = useState(null);
  const navigate = useNavigate();
  const auth = getAuth();
  const currentUser = auth.currentUser; // Obtém o usuário logado

  // Função para buscar dados do Firebase vinculados ao professor logado
  const fetchData = async () => {
    if (!currentUser) {
      return; // Se não houver usuário logado, interrompa a execução
    }

    try {
      const userId = currentUser.uid;

      // Buscar Equipamentos
      const equipamentosQuery = query(collection(db, 'equipamento'), where('professorId', '==', userId));
      const equipamentosSnapshot = await getDocs(equipamentosQuery);
      setEquipments(equipamentosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar Séries
      const seriesQuery = query(collection(db, 'series'), where('professorId', '==', userId));
      const seriesSnapshot = await getDocs(seriesQuery);
      setSeries(seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar Repetições
      const repetitionsQuery = query(collection(db, 'repeticoes'), where('professorId', '==', userId));
      const repetitionsSnapshot = await getDocs(repetitionsQuery);
      setRepetitions(repetitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar Tipos de Treino
      const trainingTypesQuery = query(collection(db, 'tiposTreino'), where('professorId', '==', userId));
      const trainingTypesSnapshot = await getDocs(trainingTypesQuery);
      setTrainingTypes(trainingTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar Alunos
      const studentsQuery = query(collection(db, 'pessoa'), where('tipoPessoa', '==', 'aluno'), where('professorId', '==', userId));
      const studentsSnapshot = await getDocs(studentsQuery);
      setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      // Buscar Treinos
      const treinosQuery = query(collection(db, 'treinos'), where('professorId', '==', userId));
      const treinosSnapshot = await getDocs(treinosQuery);
      setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    }
  };

  useEffect(() => {
    fetchData(); // Chama a função ao carregar a página
  }, [currentUser]);

  // Função para criar um novo treino
  const onSubmit = async (data) => {
    if (!currentUser) {
      return; // Se não houver usuário logado, interrompa a execução
    }

    try {
      await addDoc(collection(db, 'treinos'), {
        ...data,
        professorId: currentUser.uid, // Inclui o professorId ao criar o treino
        createdAt: new Date(),
      });
      alert('Treino criado com sucesso!');
      reset();
      fetchData(); // Atualiza os treinos após a criação
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      alert('Erro ao criar treino');
    }
  };

  const handleEdit = (treino) => {
    setEditTreino(treino);
  };

  const saveEdit = async () => {
    if (!currentUser) {
      return; // Se não houver usuário logado, interrompa a execução
    }

    try {
      const docRef = doc(db, 'treinos', editTreino.id);
      await updateDoc(docRef, { ...editTreino });
      alert('Treino atualizado com sucesso!');
      setEditTreino(null);
      fetchData(); // Atualiza os treinos após a edição
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      alert('Erro ao atualizar treino');
    }
  };

  const handleDelete = async (id) => {
    if (!currentUser) {
      return; // Se não houver usuário logado, interrompa a execução
    }

    if (window.confirm('Você realmente deseja remover este treino?')) {
      try {
        await deleteDoc(doc(db, 'treinos', id));
        alert('Treino removido com sucesso!');
        fetchData(); // Atualiza os treinos após a remoção
      } catch (error) {
        console.error('Erro ao remover treino:', error);
        alert('Erro ao remover treino');
      }
    }
  };

  return (
    <div>
      <h2>Criar Treino</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label>Aluno</label>
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

        <div>
          <label>Tipo de Treino</label>
          <Controller
            name="tipoTreinoId"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <select {...field} required>
                <option value="">Selecione o tipo de treino</option>
                {trainingTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.nome}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label>Equipamento</label>
          <Controller
            name="equipamentoId"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <select {...field} required>
                <option value="">Selecione um equipamento</option>
                {equipments.map(equipment => (
                  <option key={equipment.id} value={equipment.id}>
                    {equipment.nome}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label>Séries</label>
          <Controller
            name="serieId"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <select {...field} required>
                <option value="">Selecione a série</option>
                {series.map(serie => (
                  <option key={serie.id} value={serie.id}>
                    {serie.numeroSeries}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <div>
          <label>Repetições</label>
          <Controller
            name="repeticaoId"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <select {...field} required>
                <option value="">Selecione as repetições</option>
                {repetitions.map(repetition => (
                  <option key={repetition.id} value={repetition.id}>
                    {repetition.numeroRepeticoes}
                  </option>
                ))}
              </select>
            )}
          />
        </div>

        <button type="submit">Criar Treino</button>
      </form>

      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>

      <h3>Treinos Cadastrados</h3>
      {treinos.map(treino => (
        <div key={treino.id}>
          {editTreino?.id === treino.id ? (
            <div>
              <input
                type="text"
                value={editTreino.alunoId}
                onChange={(e) => setEditTreino({ ...editTreino, alunoId: e.target.value })}
              />
              <input
                type="text"
                value={editTreino.tipoTreinoId}
                onChange={(e) => setEditTreino({ ...editTreino, tipoTreinoId: e.target.value })}
              />
              <button onClick={saveEdit}>Salvar</button>
              <button onClick={() => setEditTreino(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <p>Aluno: {treino.alunoId}</p>
              <p>Tipo de Treino: {treino.tipoTreinoId}</p>
              <button onClick={() => handleEdit(treino)}>Editar</button>
              <button onClick={() => handleDelete(treino.id)}>Excluir</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PaginaTreino;
