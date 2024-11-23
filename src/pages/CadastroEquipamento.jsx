import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebaseConfig'; // Certifique-se de importar corretamente sua configuração do Firebase
import { useAuth } from '../contexts/authContext'; // Contexto de autenticação
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup'; // Biblioteca de validação
import styles from '../styles/Equipamento.module.css';

const CadastroEquipamento = () => {
  const [equipamentos, setEquipamentos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Usuário logado

  // Carregar os equipamentos do professor logado
  useEffect(() => {
    if (!currentUser) return;

    const fetchEquipamentos = async () => {
      try {
        const equipamentosRef = collection(db, 'Equipamento');
        const q = query(equipamentosRef, where('id_professor', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        const equipamentosList = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEquipamentos(equipamentosList);
      } catch (error) {
        console.error('Erro ao buscar equipamentos:', error);
      }
    };

    // Monitorar mudanças em tempo real na coleção
    const unsubscribe = onSnapshot(
      query(collection(db, 'Equipamento'), where('id_professor', '==', currentUser.uid)),
      (snapshot) => {
        const updatedEquipamentos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setEquipamentos(updatedEquipamentos);
      }
    );

    fetchEquipamentos();
    return () => unsubscribe();
  }, [currentUser]);

  // Adicionar equipamento
  const handleAdd = async (values, { resetForm }) => {
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar um equipamento.');
      return;
    }

    try {
      await addDoc(collection(db, 'Equipamento'), {
        nome: values.nome,
        id_professor: currentUser.uid, // Associando ao professor logado
        data_criacao: serverTimestamp(), // Usando o timestamp do servidor
      });
      alert('Equipamento cadastrado com sucesso!');
      resetForm();
    } catch (error) {
      console.error('Erro ao cadastrar equipamento:', error);
      alert('Erro ao cadastrar equipamento.');
    }
  };

  // Editar equipamento
  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'Equipamento', id);
      await updateDoc(docRef, { nome: editNome });
      alert('Equipamento atualizado com sucesso!');
      setEditId(null);
      setEditNome('');
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
      alert('Erro ao atualizar equipamento.');
    }
  };

  // Excluir equipamento
  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
      try {
        await deleteDoc(doc(db, 'Equipamento', id));
        alert('Equipamento removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover equipamento:', error);
        alert('Erro ao remover equipamento.');
      }
    }
  };

  // Validação com Yup
  const validationSchema = Yup.object({
    nome: Yup.string().required('Nome do equipamento é obrigatório').min(3, 'Nome deve ter no mínimo 3 caracteres'),
  });

  return (
    <div>
      <h2>Cadastrar Equipamento</h2>
      <Formik
        initialValues={{ nome: '' }}
        validationSchema={validationSchema}
        onSubmit={handleAdd}
      >
        {({ values, handleChange, handleBlur, errors, touched }) => (
          <Form>
            <div className={styles.formGroup}>
              <Field
                type="text"
                name="nome"
                placeholder="Nome do Equipamento"
                value={values.nome}
                onChange={handleChange}
                onBlur={handleBlur}
                className={errors.nome && touched.nome ? styles.errorInput : ''}
              />
              <ErrorMessage name="nome" component="div" className={styles.errorMessage} />
            </div>
            <button type="submit">Cadastrar Equipamento</button>
          </Form>
        )}
      </Formik>

      <h3>Equipamentos Cadastrados:</h3>
      {equipamentos.map((equipamento) => (
        <div key={equipamento.id}>
          {editId === equipamento.id ? (
            <div>
              <input
                type="text"
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Nome do Equipamento"
              />
              <button onClick={() => handleEdit(equipamento.id)}>Salvar</button>
              <button onClick={() => setEditId(null)}>Cancelar</button>
            </div>
          ) : (
            <div>
              <span>{equipamento.nome}</span>
              <button
                onClick={() => {
                  setEditId(equipamento.id);
                  setEditNome(equipamento.nome);
                }}
              >
                Editar
              </button>
              <button onClick={() => handleDelete(equipamento.id)}>Remover</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={() => navigate('/dashboard-professor')}>Voltar</button>
    </div>
  );
};

export default CadastroEquipamento;
