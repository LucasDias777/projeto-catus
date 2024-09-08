import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, query, where, doc } from 'firebase/firestore'; 

const PaginaTreino = ({ professorId }) => {
  const { control, handleSubmit, reset } = useForm();
  const [equipments, setEquipments] = useState([]);
  const [series, setSeries] = useState([]);
  const [repetitions, setRepetitions] = useState([]);
  const [trainingTypes, setTrainingTypes] = useState([]);
  const [students, setStudents] = useState([]);
  const [treinos, setTreinos] = useState([]);
  const [editTreino, setEditTreino] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Equipments, Series, Repetitions, and Training Types
        const equipmentsSnapshot = await getDocs(collection(db, 'equipamento'));
        const seriesSnapshot = await getDocs(collection(db, 'series'));
        const repetitionsSnapshot = await getDocs(collection(db, 'repeticoes'));
        const trainingTypesSnapshot = await getDocs(collection(db, 'tiposTreino'));

        // Fetch students linked to the professor
        const alunosRef = collection(db, 'pessoa');
        const querySnapshot = await getDocs(alunosRef);
        const studentsSnapshot = querySnapshot.docs
          .filter(doc =>  doc.data().tipoPessoa === 'aluno')
          .filter(doc => doc.data().professorId == professorId && doc.data().tipoPessoa == 'aluno')
          .map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch treinos
        const treinosSnapshot = await getDocs(collection(db, 'treinos'));

        // Set state with fetched data
        setEquipments(equipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSeries(seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setRepetitions(repetitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTrainingTypes(trainingTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setStudents(studentsSnapshot);
        setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
      }
    };

    fetchData();
  }, [professorId]);

  const onSubmit = async (data) => {
    try {
      await addDoc(collection(db, 'treinos'), {
        ...data,
        createdAt: new Date(),
      });
      alert('Treino criado com sucesso!');
      reset();
      const treinosSnapshot = await getDocs(collection(db, 'treinos'));
      setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      alert('Erro ao criar treino');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'treinos', id);
      await updateDoc(docRef, { ...editTreino });
      alert('Treino atualizado com sucesso!');
      setEditTreino(null);
      const treinosSnapshot = await getDocs(collection(db, 'treinos'));
      setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao atualizar treino:', error);
      alert('Erro ao atualizar treino');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você realmente deseja remover este treino?')) {
      try {
        await deleteDoc(doc(db, 'treinos', id));
        alert('Treino removido com sucesso!');
        const treinosSnapshot = await getDocs(collection(db, 'treinos'));
        setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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

        <button type="submit">Criar Treino</button>
      </form>

      <h3>Treinos Cadastrados</h3>
      {treinos.map(treino => (
        <div key={treino.id}>
          {/* Renderização e edição de treino */}
        </div>
      ))}
    </div>
  );
};

export default PaginaTreino;
