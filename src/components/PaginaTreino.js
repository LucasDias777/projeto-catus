import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { db } from '../firebaseConfig';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';

const PaginaTreino = ({ professorId }) => { // Retornando para professorId
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
      const equipmentsSnapshot = await getDocs(collection(db, 'equipamentos'));
      const seriesSnapshot = await getDocs(collection(db, 'series'));
      const repetitionsSnapshot = await getDocs(collection(db, 'repeticoes'));
      const trainingTypesSnapshot = await getDocs(collection(db, 'tiposTreino'));

      // Filtrar alunos com base no professorId
      const studentsSnapshot = await getDocs(collection(db, 'pessoa'));
      const filteredStudents = studentsSnapshot.docs
        
      //.filter(doc => doc.data().tipoPessoa == 'aluno')
      .filter(doc => doc.data().tipoPessoa == 'aluno' && doc.data().professorId == professorId) // Retornando para professorId
      .map(doc => ({ id: doc.id, ...doc.data() }));

      const treinosSnapshot = await getDocs(collection(db, 'treinos'));

      setEquipments(equipmentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSeries(seriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setRepetitions(repetitionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTrainingTypes(trainingTypesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStudents(filteredStudents);
      setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, [professorId]); // Retornando para professorId

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

  const handleRemoveItem = async (treinoId, itemType, itemId) => {
    if (window.confirm('Você realmente deseja remover este item do treino?')) {
      try {
        const treinoRef = doc(db, 'treinos', treinoId);
        const treinoDoc = await getDoc(treinoRef);
        const treinoData = treinoDoc.data();

        if (itemType === 'equipamento') {
          await updateDoc(treinoRef, {
            equipamentos: treinoData.equipamentos.filter(e => e !== itemId),
          });
        } else if (itemType === 'serie') {
          await updateDoc(treinoRef, {
            series: treinoData.series.filter(s => s !== itemId),
          });
        } else if (itemType === 'repeticao') {
          await updateDoc(treinoRef, {
            repeticões: treinoData.repeticoes.filter(r => r !== itemId),
          });
        } else if (itemType === 'tipoTreino') {
          await updateDoc(treinoRef, {
            tipoTreino: treinoData.tipoTreino.filter(t => t !== itemId),
          });
        }
        
        alert('Item removido com sucesso!');
        const treinosSnapshot = await getDocs(collection(db, 'treinos'));
        setTreinos(treinosSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Erro ao remover item:', error);
        alert('Erro ao remover item');
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
                    {student.nome}
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

      <h2>Treinos Cadastrados</h2>
      {treinos.map(t => (
        <div key={t.id}>
          {editTreino && editTreino.id === t.id ? (
            <div>
              <label>Aluno</label>
              <Controller
                name="alunoId"
                control={control}
                defaultValue={t.alunoId}
                render={({ field }) => (
                  <select {...field} required>
                    <option value="">Selecione um aluno</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.nome}
                      </option>
                    ))}
                  </select>
                )}
              />
              
              <label>Equipamento</label>
              <Controller
                name="equipamentoId"
                control={control}
                defaultValue={t.equipamentoId}
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
              
              <label>Séries</label>
              <Controller
                name="serieId"
                control={control}
                defaultValue={t.serieId}
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
              
              <label>Repetições</label>
              <Controller
                name="repeticaoId"
                control={control}
                defaultValue={t.repeticaoId}
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
              
              <label>Tipo de Treino</label>
              <Controller
                name="tipoTreinoId"
                control={control}
                defaultValue={t.tipoTreinoId}
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

              <button onClick={() => handleEdit(t.id)}>Salvar</button>
              <button onClick={() => setEditTreino(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>Aluno: {students.find(s => s.id === t.alunoId)?.nome}</span>
              <span>Equipamento: {equipments.find(e => e.id === t.equipamentoId)?.nome}</span>
              <span>Série: {series.find(s => s.id === t.serieId)?.numeroSeries}</span>
              <span>Repetição: {repetitions.find(r => r.id === t.repeticaoId)?.numeroRepeticoes}</span>
              <span>Tipo: {trainingTypes.find(tt => tt.id === t.tipoTreinoId)?.nome}</span>
              <button onClick={() => setEditTreino({ id: t.id, alunoId: t.alunoId, equipamentoId: t.equipamentoId, serieId: t.serieId, repeticaoId: t.repeticaoId, tipoTreinoId: t.tipoTreinoId })}>Editar</button>
              <button onClick={() => handleDelete(t.id)}>Remover</button>
              <button onClick={() => handleRemoveItem(t.id, 'equipamento', t.equipamentoId)}>Remover Equipamento</button>
              <button onClick={() => handleRemoveItem(t.id, 'serie', t.serieId)}>Remover Série</button>
              <button onClick={() => handleRemoveItem(t.id, 'repeticao', t.repeticaoId)}>Remover Repetição</button>
              <button onClick={() => handleRemoveItem(t.id, 'tipoTreino', t.tipoTreinoId)}>Remover Tipo de Treino</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default PaginaTreino;
