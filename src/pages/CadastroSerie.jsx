import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/authContext';
import { db } from '../config/firebaseConfig';
import { collection, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from '../styles/Serie.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Validação com Yup
const validationSchema = Yup.object({
  numeroSeries: Yup.number()
    .required('Número de séries é obrigatório')
    .positive('Deve ser um número positivo')
    .integer('Deve ser um número inteiro')
    .min(1, 'O número de séries deve ser pelo menos 1'),
});

const CadastroSerie = () => {
  const [series, setSeries] = useState([]);
  const [filteredSeries, setFilteredSeries] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editNumeroSeries, setEditNumeroSeries] = useState('');
  const [filter, setFilter] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = onSnapshot(
      query(collection(db, 'Serie'), where('id_professor', '==', currentUser.uid)),
      (snapshot) => {
        const updatedSeries = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setSeries(updatedSeries);
        setFilteredSeries(updatedSeries);
      },
      (error) => console.error('Erro ao escutar séries:', error)
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleAdd = async (values, { resetForm }) => {
    if (!currentUser) {
      alert('Você precisa estar logado para cadastrar uma série.');
      return;
    }

    try {
      await addDoc(collection(db, 'Serie'), {
        nome: values.numeroSeries,
        id_professor: currentUser.uid,
        data_criacao: serverTimestamp(),
      });
      alert('Série cadastrada com sucesso!');
      resetForm();
    } catch (error) {
      console.error('Erro ao cadastrar série:', error);
      alert('Erro ao cadastrar série.');
    }
  };

  const handleEdit = async (id) => {
    if (!editNumeroSeries || editNumeroSeries.trim().length < 1) {
      alert('O número de séries deve ter no mínimo 1 número.');
      return;
    }
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
        // Buscar todos os treinos do professor logado
        const treinoQuery = query(
          collection(db, 'Treino'),
          where('id_professor', '==', currentUser.uid)
        );
        const treinoSnapshot = await getDocs(treinoQuery);
  
        // Log do número de documentos encontrados
        console.log(`Treinos encontrados: ${treinoSnapshot.size}`);
  
        // Caso não existam treinos, permitir exclusão
        if (treinoSnapshot.empty) {
          console.log('Nenhum treino encontrado. Prosseguindo com a exclusão.');
          await deleteDoc(doc(db, 'Serie', id));
          alert('Série removida com sucesso!');
          return;
        }
  
        let isAssociated = false;
  
        // Verificar associação à série
        treinoSnapshot.forEach((doc) => {
          const treinoData = doc.data();
          const equipamentos = Array.isArray(treinoData.equipamentos) ? treinoData.equipamentos : [];
          console.log(`Treino ${doc.id} contém os equipamentos:`, equipamentos);
  
          if (equipamentos.some((equip) => equip.id_serie === id)) {
            console.log(`Série ${id} está associada ao treino ${doc.id}.`);
            isAssociated = true;
          }
        });
  
        if (isAssociated) {
          alert('Esta série não pode ser excluída porque já está associada a um treino.');
          return;
        }
  
        // Excluir a série
        await deleteDoc(doc(db, 'Serie', id));
        alert('Série removida com sucesso!');
      } catch (error) {
        console.error('Erro ao remover série:', error);
        alert('Erro ao remover série.');
      }
    }
  };
  

  const handleFilter = (e) => {
    const searchTerm = e.target.value.toLowerCase();
    setFilter(searchTerm);
    setFilteredSeries(
      series.filter((s) => s.nome.toString().toLowerCase().includes(searchTerm))
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Cadastrar Série</h2>
        <button
          className={styles.backButton}
          onClick={() => navigate('/dashboard-professor')}
        >
         <i class="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>

      <div className={styles.formContainer}>
        <Formik
          initialValues={{ numeroSeries: '' }}
          validationSchema={validationSchema}
          onSubmit={handleAdd}
        >
          {() => (
            <Form className={styles.formGroup}>
              <Field
                type="number"
                name="numeroSeries"
                className={styles.inputField}
                placeholder="Número de Séries"
                min="1"
              />
              <ErrorMessage name="numeroSeries" component="div" className={styles.error} />
              <button type="submit" className={styles.addButton}>
                <i className="fa-solid fa-plus"></i> Cadastrar Série
              </button>
            </Form>
          )}
        </Formik>
      </div>

      <input
        type="text"
        className={styles.filterInput}
        placeholder="Filtrar pelo Número de Séries"
        value={filter}
        onChange={handleFilter}
      />

      <div className={styles.list}>
        {filteredSeries.map((s) => (
          <div key={s.id} className={styles.listItem}>
            {editId === s.id ? (
              <div className={styles.editGroup}>
                <input
                  type="number"
                  value={editNumeroSeries}
                  onChange={(e) => setEditNumeroSeries(e.target.value)}
                  className={styles.inputField}
                  placeholder="Número de Séries"
                  min="1"
                />
                <button className={`${styles.saveButton}`} onClick={() => handleEdit(s.id)}>
                  <i className="fa-solid fa-check"></i> Salvar
                </button>
                <button className={`${styles.cancelButton}`} onClick={() => setEditId(null)}>
                  <i className="fa-solid fa-xmark"></i> Cancelar
                </button>
              </div>
            ) : (
              <>
                <span>{s.nome}</span>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => {
                      setEditId(s.id);
                      setEditNumeroSeries(s.nome);
                    }}
                  >
                    <i className="fa-solid fa-pencil"></i> Editar
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(s.id)}
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

export default CadastroSerie;
