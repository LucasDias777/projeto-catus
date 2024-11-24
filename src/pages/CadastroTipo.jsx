import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext'; // Importando o contexto de autenticação
import { db } from '../config/firebaseConfig'; // Importa a configuração do Firebase
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import { serverTimestamp } from 'firebase/firestore'; // Importando o serverTimestamp
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from '../styles/Tipo.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Validação com Yup
const validationSchema = Yup.object({
  nome: Yup.string()
    .required('Nome do tipo de treino é obrigatório')
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(50, 'O nome não pode ter mais que 50 caracteres'),
});

const CadastroTipo = () => {
  const [tipos, setTipos] = useState([]);
  const [filteredTipos, setFilteredTipos] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // Obtendo o usuário atual

  useEffect(() => {
    if (!currentUser) return;

    // Escuta em tempo real para atualizar a lista de tipos de treino
    const unsubscribe = onSnapshot(
      query(collection(db, 'Tipo'), where('id_professor', '==', currentUser.uid)),
      (snapshot) => {
        const tiposList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTipos(tiposList);
        setFilteredTipos(tiposList);
      },
      (error) => {
        console.error('Erro ao escutar tipos de treino:', error);
      }
    );

    return () => unsubscribe(); // Cleanup ao desmontar o componente
  }, [currentUser]);

  const handleAdd = async (values, { resetForm }) => {
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar um tipo de treino');
      return;
    }

    try {
      await addDoc(collection(db, 'Tipo'), {
        nome: values.nome,
        id_professor: currentUser.uid, // Associando o tipo de treino ao professor que o criou
        data_criacao: serverTimestamp(), // Adicionando a data de criação
      });
      alert('Tipo de treino cadastrado com sucesso!');
      resetForm(); // Resetando o formulário após o envio
    } catch (error) {
      console.error('Erro ao cadastrar tipo de treino:', error);
      alert('Erro ao cadastrar tipo de treino');
    }
  };

  const handleEdit = async (id) => {
    try {
      const docRef = doc(db, 'Tipo', id);
      await updateDoc(docRef, { nome: editNome });
      alert('Tipo de treino atualizado com sucesso!');
      setEditId(null);
      setEditNome('');
    } catch (error) {
      console.error('Erro ao atualizar tipo de treino:', error);
      alert('Erro ao atualizar tipo de treino');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Você tem certeza que deseja excluir este tipo de treino?')) {
      try {
        await deleteDoc(doc(db, 'Tipo', id));
        alert('Tipo de treino removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover tipo de treino:', error);
        alert('Erro ao remover tipo de treino');
      }
    }
  };

  const handleFilter = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setFilter(searchTerm);
    setFilteredTipos(
      tipos.filter((t) => t.nome.toLowerCase().includes(searchTerm))
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Cadastrar Tipo de Treino</h2>
        <button
          className={styles.backButton}
          onClick={() => navigate('/dashboard-professor')}
        >
          Voltar ao Dashboard
        </button>
      </div>

      <div className={styles.formContainer}>
        <Formik
          initialValues={{ nome: '' }}
          validationSchema={validationSchema}
          onSubmit={handleAdd}
        >
          {() => (
            <Form className={styles.formGroup}>
              <Field
                type="text"
                name="nome"
                placeholder="Nome do Tipo de Treino"
                className={styles.inputField}
              />
              <ErrorMessage name="nome" component="div" className={styles.error} />
              <button type="submit" className={styles.addButton}>
                <i className="fa-solid fa-plus"></i> Cadastrar Tipo de Treino
              </button>
            </Form>
          )}
        </Formik>
      </div>

      <input
        type="text"
        className={styles.filterInput}
        placeholder="Filtrar pelo Nome do Tipo de Treino"
        value={filter}
        onChange={handleFilter}
      />

      <div className={styles.list}>
        {filteredTipos.map((t) => (
          <div key={t.id} className={styles.listItem}>
            {editId === t.id ? (
              <div className={styles.editGroup}>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className={styles.inputField}
                />
                <button className={styles.saveButton} onClick={() => handleEdit(t.id)}>
                  <i className="fa-solid fa-check"></i> Salvar
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => setEditId(null)}
                >
                  <i className="fa-solid fa-xmark"></i> Cancelar
                </button>
              </div>
            ) : (
              <>
                <span>{t.nome}</span>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => {
                      setEditId(t.id);
                      setEditNome(t.nome);
                    }}
                  >
                    <i className="fa-solid fa-pencil"></i> Editar
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(t.id)}
                  >
                    <i className="fa-solid fa-trash-can"></i> Remover
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CadastroTipo;
