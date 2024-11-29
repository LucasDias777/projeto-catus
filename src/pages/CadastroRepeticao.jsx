import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/authContext';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from '../styles/Repeticao.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // FontAwesome para ícones

const CadastroRepeticao = () => {
  const [repeticoes, setRepeticoes] = useState([]);
  const [filter, setFilter] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNumero, setEditNumero] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const fetchRepeticoes = async () => {
      try {
        const q = query(
          collection(db, 'Repeticao'),
          where('id_professor', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const repeticoesList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRepeticoes(repeticoesList);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Erro ao buscar repetições:', error);
      }
    };

    fetchRepeticoes();
  }, [currentUser]);

  const handleAdd = async (values, { resetForm }) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'Repeticao'), {
        nome: values.numeroRepeticoes,  // Alterado para 'nome' ao invés de 'numero'
        id_professor: currentUser.uid,
        data_criacao: serverTimestamp(),
      });
      alert('Repetição cadastrada com sucesso!');
      resetForm();
    } catch (error) {
      console.error('Erro ao cadastrar repetição:', error);
    }
  };

  const handleEdit = async (id) => {
    
    try {
      if (!editNumero || editNumero.trim().length < 1) {
        alert('O número de repetições deve ter no mínimo 1 número.');
        return;
      }
      const docRef = doc(db, 'Repeticao', id);
      await updateDoc(docRef, { nome: editNumero }); // Alterado para 'nome' ao invés de 'numero'
      alert('Repetição atualizada com sucesso!');
      setEditId(null);
      setEditNumero('');
    } catch (error) {
      console.error('Erro ao atualizar repetição:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir esta repetição?')) {
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
          await deleteDoc(doc(db, 'Repeticao', id));
          alert('Repetição removida com sucesso!');
          return;
        }
  
        let isAssociated = false;
  
        // Verificar associação à repetição
        treinoSnapshot.forEach((doc) => {
          const treinoData = doc.data();
          const equipamentos = Array.isArray(treinoData.equipamentos) ? treinoData.equipamentos : [];
          console.log(`Treino ${doc.id} contém os equipamentos:`, equipamentos);
  
          if (equipamentos.some((equip) => equip.id_repeticao === id)) {
            console.log(`Repetição ${id} está associada ao treino ${doc.id}.`);
            isAssociated = true;
          }
        });
  
        if (isAssociated) {
          alert('Esta repetição não pode ser excluída porque já está associada a um treino.');
          return;
        }
  
        // Excluir a repetição
        await deleteDoc(doc(db, 'Repeticao', id));
        alert('Repetição removida com sucesso!');
      } catch (error) {
        console.error('Erro ao remover repetição:', error);
      }
    }
  };

  const validationSchema = Yup.object({
    numeroRepeticoes: Yup.number()
      .required('Número de repetições é obrigatório')
      .positive('Deve ser um número positivo')
      .integer('Deve ser um número inteiro')
      .min(1, 'Deve ser pelo menos 1'),
  });

  const filteredRepeticoes = repeticoes.filter((repeticao) =>
    String(repeticao.nome).includes(filter) // Alterado para 'nome' ao invés de 'numero'
  );

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Cadastrar Repetição</h2>
        <button
          className={styles.backButton}
          onClick={() => navigate('/dashboard-professor')}
        >
         <i class="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>

      <div className={styles.formContainer}>
        <Formik
          initialValues={{ numeroRepeticoes: '' }}
          validationSchema={validationSchema}
          onSubmit={handleAdd}
        >
          {() => (
            <Form className={styles.formGroup}>
              <Field
                type="number"
                name="numeroRepeticoes"
                className={styles.inputField}
                placeholder="Número de Repetições"
                min="1"
              />
              <ErrorMessage name="numeroRepeticoes" component="div" />
              <button type="submit" className={styles.addButton}>
                <i className="fa-solid fa-plus"></i> Cadastrar Repetição
              </button>
            </Form>
          )}
        </Formik>
      </div>

      <input
        type="text"
        className={styles.filterInput}
        placeholder="Filtrar pelo Número de Repetições"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className={styles.list}>
        {filteredRepeticoes.map((repeticao) => (
          <div key={repeticao.id} className={styles.listItem}>
            {editId === repeticao.id ? (
              <div className={styles.editGroup}>
                <input
                  type="number"
                  value={editNumero}
                  onChange={(e) => setEditNumero(e.target.value)}
                  className={styles.inputField}
                  min="1"
                />
                <button
                  className={styles.saveButton}
                  onClick={() => handleEdit(repeticao.id)}
                >
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
                <span>{repeticao.nome}</span> {/* Alterado para 'nome' ao invés de 'numero' */}
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => {
                      setEditId(repeticao.id);
                      setEditNumero(repeticao.nome); // Alterado para 'nome' ao invés de 'numero'
                    }}
                  >
                    <i className="fa-solid fa-pencil"></i> Editar
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(repeticao.id)}
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

export default CadastroRepeticao;
