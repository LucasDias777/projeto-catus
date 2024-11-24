import React from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebaseConfig'; // Importa Firebase Auth e Firestore
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import axios from 'axios'; // Para realizar a requisição à API ViaCEP
import styles from '../styles/Cadastro.module.css';

const CadastroProfessor = () => {
  const navigate = useNavigate();

  // Schema de validação com Yup
  const validationSchema = Yup.object({
    nome_completo: Yup.string().required('Nome completo é obrigatório'),
    data_nascimento: Yup.date().required('Data de nascimento é obrigatória'),
    genero: Yup.string().required('Gênero é obrigatório'),
    cep: Yup.string()
      .matches(/^\d{5}-?\d{3}$/, 'CEP inválido')
      .nullable(), // CEP não obrigatório
    cidade: Yup.string().required('Cidade é obrigatória'),
    uf: Yup.string().length(2, 'UF deve ter 2 caracteres').required('UF é obrigatório'),
    endereco: Yup.string().required('Endereço é obrigatório'),
    numero_casa: Yup.string().required('Número da residência é obrigatório'),
    bairro: Yup.string().required('Bairro é obrigatório'),
    telefone: Yup.string()
      .matches(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'Telefone inválido')
      .required('Telefone é obrigatório'),
    email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
    senha: Yup.string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .required('Senha é obrigatória'),
  });

  // Submissão do formulário
  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.senha);
      const user = userCredential.user;

      const pessoaRef = doc(collection(db, 'Pessoa'), user.uid);
      await setDoc(pessoaRef, {
        ...values,
        id_professor: user.uid,
        tipo_pessoa: 'professor',
        data_criacao: serverTimestamp(),
      });

      alert('Usuário cadastrado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);

      if (error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Este e-mail já está em uso. Tente outro.' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ senha: 'A senha fornecida é muito fraca.' });
      } else {
        alert('Erro ao cadastrar usuário. Tente novamente.');
      }

      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (deleteError) {
          console.error('Erro ao excluir usuário no Firebase Auth:', deleteError);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Função para buscar informações do CEP
  const buscarEnderecoPorCep = async (cep, setFieldValue) => {
    if (!cep) return;

    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      if (response.data.erro) {
        alert('CEP não encontrado.');
        return;
      }

      // Atualiza os campos do formulário
      setFieldValue('endereco', response.data.logradouro || '');
      setFieldValue('bairro', response.data.bairro || '');
      setFieldValue('cidade', response.data.localidade || '');
      setFieldValue('uf', response.data.uf || '');
    } catch (error) {
      console.error('Erro ao buscar o CEP:', error);
      alert('Erro ao buscar o CEP. Tente novamente.');
    }
  };

  return (
    <div className={styles.cadastroPage}>
      <div className={styles.cadastroContainer}>
        <h1 className={styles.cadastroHeading}>Cadastre-se</h1>
        <Formik
          initialValues={{
            nome_completo: '',
            data_nascimento: '',
            genero: '',
            cep: '',
            cidade: '',
            uf: '',
            endereco: '',
            numero_casa: '',
            bairro: '',
            complemento: '',
            telefone: '',
            email: '',
            senha: '',
          }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, setFieldValue, values }) => (
            <Form>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Nome Completo</label>
                  <Field name="nome_completo" type="text" className={styles.formControl} />
                  <ErrorMessage name="nome_completo" component="div" className={styles.error} />
                </div>
  
                <div className={styles.formGroup}>
                  <label>Data de Nascimento</label>
                  <Field name="data_nascimento" type="date" className={styles.formControl} />
                  <ErrorMessage name="data_nascimento" component="div" className={styles.error} />
                </div>
              </div>
  
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Gênero</label>
                  <Field name="genero" as="select" className={styles.formControl}>
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outros">Outros</option>
                  </Field>
                  <ErrorMessage name="genero" component="div" className={styles.error} />
                </div>
  
                <div className={styles.formGroup}>
                  <label>CEP</label>
                  <Field
                    name="cep"
                    type="text"
                    className={styles.formControl}
                    onBlur={() => buscarEnderecoPorCep(values.cep, setFieldValue)}
                  />
                  <ErrorMessage name="cep" component="div" className={styles.error} />
                </div>
              </div>
  
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Cidade</label>
                  <Field name="cidade" type="text" className={styles.formControl} />
                  <ErrorMessage name="cidade" component="div" className={styles.error} />
                </div>
  
                <div className={styles.formGroup}>
                  <label>UF</label>
                  <Field name="uf" type="text" className={styles.formControl} />
                  <ErrorMessage name="uf" component="div" className={styles.error} />
                </div>
              </div>
  
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Endereço</label>
                  <Field name="endereco" type="text" className={styles.formControl} />
                  <ErrorMessage name="endereco" component="div" className={styles.error} />
                </div>
  
                <div className={styles.formGroup}>
                  <label>Número da Residência</label>
                  <Field name="numero_casa" type="text" className={styles.formControl} />
                  <ErrorMessage name="numero_casa" component="div" className={styles.error} />
                </div>
              </div>
  
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Bairro</label>
                  <Field name="bairro" type="text" className={styles.formControl} />
                  <ErrorMessage name="bairro" component="div" className={styles.error} />
                </div>
  
                <div className={styles.formGroup}>
                  <label>Complemento</label>
                  <Field name="complemento" type="text" className={styles.formControl} />
                  <ErrorMessage name="complemento" component="div" className={styles.error} />
                </div>
              </div>
  
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Telefone</label>
                  <Field name="telefone" type="text" className={styles.formControl} />
                  <ErrorMessage name="telefone" component="div" className={styles.error} />
                </div>
  
                <div className={styles.formGroup}>
                  <label>E-mail</label>
                  <Field name="email" type="email" className={styles.formControl} />
                  <ErrorMessage name="email" component="div" className={styles.error} />
                </div>
              </div>
  
              <div className={styles.formGroup}>
                <label>Senha</label>
                <Field name="senha" type="password" className={styles.formControl} />
                <ErrorMessage name="senha" component="div" className={styles.error} />
              </div>
  
              <div className={styles.formGroup}>
                <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
                  {isSubmitting ? 'Cadastrando...' : 'Cadastrar'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
	<button onClick={() => navigate('/login')} className={styles.backButton}>
          Voltar
        </button>
      </div>
    </div>
  );
};

export default CadastroProfessor;
