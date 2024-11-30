import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/authContext';
import { Formik, Field, Form, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import styles from '../styles/Equipamento.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css'; // Importando o FontAwesome para os ícones

const CadastroEquipamento = () => {
  const [equipamentos, setEquipamentos] = useState([]);
  const [filter, setFilter] = useState('');
  const [editId, setEditId] = useState(null);
  const [editNome, setEditNome] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) return;

    const fetchEquipamentos = async () => {
      try {
        const q = query(
          collection(db, 'Equipamento'),
          where('id_professor', '==', currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const equipamentosList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setEquipamentos(equipamentosList);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Erro ao buscar equipamentos:', error);
      }
    };

    fetchEquipamentos();
  }, [currentUser]);

  const handleAdd = async (values, { resetForm }) => {
    if (!currentUser) return;

    try {
    // Verificar se o equipamento já existe no Firestore
    const equipamentoQuery = query(
      collection(db, 'Equipamento'),
      where('id_professor', '==', currentUser.uid),
      where('nome', '==', values.nome) // Comparar pelo nome do equipamento
    );

    const querySnapshot = await getDocs(equipamentoQuery);

    if (!querySnapshot.empty) {
      alert('Já existe um equipamento com este nome cadastrado.');
      return;
    }
      await addDoc(collection(db, 'Equipamento'), {
        nome: values.nome,
        id_professor: currentUser.uid,
        data_criacao: serverTimestamp(),
      });
      alert('Equipamento cadastrado com sucesso!');
      resetForm();
    } catch (error) {
      console.error('Erro ao cadastrar equipamento:', error);
    }
  };

  const handleEdit = async (id) => {
    if (!editNome || editNome.trim().length < 2) {
      alert('O nome do equipamento deve ter no mínimo 2 caracteres.');
      return;
    }
    try {
      const docRef = doc(db, 'Equipamento', id);
      await updateDoc(docRef, { nome: editNome });
      alert('Equipamento atualizado com sucesso!');
      setEditId(null);
      setEditNome('');
    } catch (error) {
      console.error('Erro ao atualizar equipamento:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este equipamento?')) {
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
          await deleteDoc(doc(db, 'Equipamento', id));
          alert('Equipamento removido com sucesso!');
          return;
        }
  
        let isAssociated = false;
  
        // Verificar associação ao equipamento
        treinoSnapshot.forEach((doc) => {
          const treinoData = doc.data();
          const equipamentos = Array.isArray(treinoData.equipamentos) ? treinoData.equipamentos : [];
          console.log(`Treino ${doc.id} contém os equipamentos:`, equipamentos);
  
          if (equipamentos.some((equip) => equip.id_equipamento === id)) {
            console.log(`Equipamento ${id} está associado ao treino ${doc.id}.`);
            isAssociated = true;
          }
        });
  
        if (isAssociated) {
          alert('Este equipamento não pode ser excluído porque já está associado a um treino.');
          return;
        }
  
        // Excluir o equipamento
        await deleteDoc(doc(db, 'Equipamento', id));
        alert('Equipamento removido com sucesso!');
      } catch (error) {
        console.error('Erro ao remover equipamento:', error);
      }
    }
  };

  const validationSchema = Yup.object({
    nome: Yup.string().required('Campo obrigatório').min(3, 'Mínimo 3 caracteres'),
  });

  const filteredEquipamentos = equipamentos.filter((equipamento) =>
    equipamento.nome.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.topBar}>
        <h2>Cadastrar Equipamento</h2>
        <button
          className={styles.backButton}
          onClick={() => navigate('/dashboard-professor')}
        >
         <i class="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
          
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
                className={styles.inputField}
                placeholder="Nome do Equipamento"
              />
              <ErrorMessage name="nome" component="div" />
              <button type="submit" className={styles.addButton}>
                <i className="fa-solid fa-plus"></i> Cadastrar Equipamento
              </button>
            </Form>
          )}
        </Formik>
      </div>

      <input
        type="text"
        className={styles.filterInput}
        placeholder="Filtrar pelo Nome do Equipamento"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <div className={styles.list}>
        {filteredEquipamentos.map((equipamento) => (
          <div key={equipamento.id} className={styles.listItem}>
            {editId === equipamento.id ? (
              <div className={styles.editGroup}>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  className={styles.inputField}
                />
                <button
                  className={styles.saveButton}
                  onClick={() => handleEdit(equipamento.id)}
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
                <span>{equipamento.nome}</span>
                <div className={styles.actionButtons}>
                  <button
                    className={styles.editButton}
                    onClick={() => {
                      setEditId(equipamento.id);
                      setEditNome(equipamento.nome);
                    }}
                  >
                    <i className="fa-solid fa-pencil"></i> Editar
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(equipamento.id)}
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

export default CadastroEquipamento;
