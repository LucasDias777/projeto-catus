import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext'; // Importando o contexto de autenticação
import { db } from '../config/firebaseConfig'; // Importa a configuração do Firebase
import { collection, addDoc, getDocs, updateDoc, deleteDoc, query, where, onSnapshot, doc, serverTimestamp } from 'firebase/firestore';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from '../styles/Serie.module.css';

// Validação com Yup
const validationSchema = Yup.object({
  numeroSeries: Yup.string()
    .required('Número de séries é obrigatório')
    .min(1, 'O número de séries deve ter pelo menos 1 caractere')
    .max(10, 'O número de séries não pode ter mais que 10 caracteres'),
});

const CadastroSerie = () => {
  const [series, setSeries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNumeroSeries, setEditNumeroSeries] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Obtendo o usuário atual

  useEffect(() => {
    if (!currentUser) return;

    // Listener para atualizações em tempo real
    const unsubscribe = onSnapshot(
      query(collection(db, 'Serie'), where('id_professor', '==', currentUser.uid)),
      (snapshot) => {
        const updatedSeries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSeries(updatedSeries);
      },
      (error) => {
        console.error('Erro ao escutar séries:', error);
      }
    );

    return () => unsubscribe(); // Cleanup ao desmontar o componente
  }, [currentUser]);

  const handleAdd = async (values, { resetForm }) => {
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar uma série.');
      return;
    }

    try {
      await addDoc(collection(db, 'Serie'), {
        nome: values.numeroSeries,
        id_professor: currentUser.uid, // Associando a série ao professor que a criou
        data_criacao: serverTimestamp(), // Adicionando data de criação
      });
      alert('Série cadastrada com sucesso!');
      resetForm(); // Resetando o formulário
    } catch (error) {
      console.error('Erro ao cadastrar série:', error);
      alert('Erro ao cadastrar série.');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'Serie', id);
      await updateDoc(docRef, { nome: editNumeroSeries });
      alert('Série atualizada com sucesso!');
      setEditId(null);
      setEditNumeroSeries('');
    } catch (error) {
      console.error('Erro ao atualizar série:', error);
      alert('Erro ao atualizar série.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir esta série?')) {
      try {
        await deleteDoc(doc(db, 'Serie', id));
        alert('Série removida com sucesso!');
      } catch (error) {
        console.error('Erro ao remover série:', error);
        alert('Erro ao remover série.');
      }
    }
  };

  return (
    <div>
      <h2>Cadastrar Séries</h2>
      <Formik
        initialValues={{ numeroSeries: '' }}
        validationSchema={validationSchema}
        onSubmit={handleAdd}
      >
        {({ touched, errors }) => (
          <Form>
            <div>
              <Field
                type="text"
                name="numeroSeries"
                placeholder="Número de Séries"
                className={styles.input}
              />
              <ErrorMessage name="numeroSeries" component="div" className={styles.error} />
            </div>
            <button type="submit" className={styles.submitButton}>Cadastrar Séries</button>
          </Form>
        )}
      </Formik>

      <h3>Séries Cadastradas:</h3>
      {series.map((s) => (
        <div key={s.id}>
          {editId === s.id ? (
            <div>
              <input
                type="text"
                value={editNumeroSeries}
                onChange={(e) => setEditNumeroSeries(e.target.value)}
                placeholder="Número de Séries"
              />
              <button onClick={() => handleEdit(s.id)}>Salvar</button>
              <button onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>{s.nome}</span>
              <button
                onClick={() => {
                  setEditId(s.id);
                  setEditNumeroSeries(s.nome);
                }}
              >
                Editar
              </button>
              <button onClick={() => handleDelete(s.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroSerie;
