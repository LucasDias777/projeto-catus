import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom'; 
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
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const equipmentsSnapshot = await getDocs(query(collection(db, 'equipamento'), where('professorId', '==', professorId)));
        const seriesSnapshot = await getDocs(query(collection(db, 'series'), where('professorId', '==', professorId)));
        const repetitionsSnapshot = await getDocs(query(collection(db, 'repeticoes'), where('professorId', '==', professorId)));
        const trainingTypesSnapshot = await getDocs(query(collection(db, 'tiposTreino'), where('professorId', '==', professorId)));

        const alunosRef = collection(db, 'pessoa');
        const q = query(alunosRef,  where('tipoPessoa', '==', 'aluno'));
        //const q = query(alunosRef, where('professorId', '==', professorId), where('tipoPessoa', '==', 'aluno'));
        const studentsSnapshot = await getDocs(q);
        const filteredStudents = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const treinosSnapshot = await getDocs(query(collection(db, 'treinos'), where('professorId', '==', professorId)));

        setEquipments(equipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setSeries(seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setRepetitions(repetitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTrainingTypes(trainingTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setStudents(filteredStudents);
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
        professorId, // Inclui o professorId ao criar o treino
        createdAt: new Date(),
      });
      alert('Treino criado com sucesso!');
      reset();
      const treinosSnapshot = await getDocs(query(collection(db, 'treinos'), where('professorId', '==', professorId)));
      setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Erro ao criar treino:', error);
      alert('Erro ao criar treino');
    }
  };

  const handleEdit = (treino) => {
    setEditTreino(treino);
  };

  const saveEdit = async () => {
    try {
      const docRef = doc(db, 'treinos', editTreino.id);
      await updateDoc(docRef, { ...editTreino });
      alert('Treino atualizado com sucesso!');
      setEditTreino(null);
      const treinosSnapshot = await getDocs(query(collection(db, 'treinos'), where('professorId', '==', professorId)));
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
        const treinosSnapshot = await getDocs(query(collection(db, 'treinos'), where('professorId', '==', professorId)));
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
              <input
                type="text"
                value={editTreino.equipamentoId}
                onChange={(e) => setEditTreino({ ...editTreino, equipamentoId: e.target.value })}
              />
              <input
                type="text"
                value={editTreino.serieId}
                onChange={(e) => setEditTreino({ ...editTreino, serieId: e.target.value })}
              />
              <input
                type="text"
                value={editTreino.repeticaoId}
                onChange={(e) => setEditTreino({ ...editTreino, repeticaoId: e.target.value })}
              />
              <button onClick={saveEdit}>Salvar</button>
            </div>
          ) : (
            <div>
              <p>Aluno: {treino.alunoId}</p>
              <p>Tipo de Treino: {treino.tipoTreinoId}</p>
              <p>Equipamento: {treino.equipamentoId}</p>
              <p>Séries: {treino.serieId}</p>
              <p>Repetições: {treino.repeticaoId}</p>
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
