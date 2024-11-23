import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormik, Formik, Field, Form } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { auth, db } from '../config/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/Cadastro.module.css';

const CadastroAluno = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Redirecionar para login caso o usuário não esteja autenticado
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Validação com Yup
  const validationSchema = Yup.object({
    nome_completo: Yup.string().required('Nome completo é obrigatório'),
    data_nascimento: Yup.date().required('Data de nascimento é obrigatória'),
    genero: Yup.string().required('Gênero é obrigatório'),
    cep: Yup.string()
      .matches(/^\d{5}-?\d{3}$/, 'CEP inválido')
      .notRequired(),
    numero_casa: Yup.string().required('Número da residência é obrigatório'),
    telefone: Yup.string()
      .matches(
        /^\(\d{2}\) \d{4,5}-\d{4}$/,
        'Telefone inválido. Use o formato (xx) xxxx-xxxx ou (xx) xxxxx-xxxx'
      )
      .required('Telefone é obrigatório'),
    email: Yup.string().email('E-mail inválido').required('E-mail é obrigatório'),
    senha: Yup.string().required('Senha é obrigatória'),
  });

  // Envio do formulário
  const onSubmit = async (values, { resetForm }) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.senha);
      const user = userCredential.user;

      // Registro do aluno na coleção "Pessoa"
      await setDoc(doc(db, 'Pessoa', user.uid), {
        ...values,
        id_aluno: user.uid,
        id_professor: currentUser.uid,
        tipo_pessoa: 'aluno',
        data_criacao: serverTimestamp(),
      });

      alert('Aluno cadastrado com sucesso!');
      resetForm();
    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error.message);
      alert(`Erro ao cadastrar aluno: ${error.message}`);
    }
  };

  // Função para buscar informações pelo CEP
  const fetchAddressByCep = async (cep, setFieldValue) => {
    if (!cep) return;
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
      const data = response.data;

      if (!data.erro) {
        setFieldValue('cidade', data.localidade || '');
        setFieldValue('uf', data.uf || '');
        setFieldValue('endereco', data.logradouro || '');
        setFieldValue('bairro', data.bairro || '');
      } else {
        alert('CEP inválido!');
      }
    } catch (error) {
      console.error('Erro ao buscar o CEP:', error);
      alert('Erro ao buscar informações do CEP.');
    }
  };

  return (
    <div className={styles.cadastroPage}>
      <div className={styles.cadastroContainer}>
        <h1 className={styles.cadastroHeading}>Cadastrar Aluno</h1>
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
          onSubmit={onSubmit}
        >
          {({ errors, touched, values, setFieldValue }) => (
            <Form>
              <div className={styles.formGroup}>
                <label>Nome Completo</label>
                <Field name="nome_completo" type="text" placeholder="Nome Completo" />
                {errors.nome_completo && touched.nome_completo && (
                  <p className={styles.errorMessage}>{errors.nome_completo}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Data de Nascimento</label>
                <Field name="data_nascimento" type="date" />
                {errors.data_nascimento && touched.data_nascimento && (
                  <p className={styles.errorMessage}>{errors.data_nascimento}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Gênero</label>
                <Field as="select" name="genero">
                  <option value="" disabled>
                    Selecione o Gênero
                  </option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                  <option value="Outros">Outros</option>
                </Field>
                {errors.genero && touched.genero && (
                  <p className={styles.errorMessage}>{errors.genero}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>CEP</label>
                <Field
                  name="cep"
                  type="text"
                  placeholder="CEP"
                  onBlur={(e) => fetchAddressByCep(e.target.value, setFieldValue)}
                />
                {errors.cep && touched.cep && (
                  <p className={styles.errorMessage}>{errors.cep}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Cidade</label>
                <Field name="cidade" type="text" placeholder="Cidade" disabled />
              </div>

              <div className={styles.formGroup}>
                <label>UF</label>
                <Field name="uf" type="text" placeholder="UF" disabled />
              </div>

              <div className={styles.formGroup}>
                <label>Endereço</label>
                <Field name="endereco" type="text" placeholder="Endereço" />
              </div>

              <div className={styles.formGroup}>
                <label>Número da Residência</label>
                <Field name="numero_casa" type="text" placeholder="Número da Residência" />
                {errors.numero_casa && touched.numero_casa && (
                  <p className={styles.errorMessage}>{errors.numero_casa}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Bairro</label>
                <Field name="bairro" type="text" placeholder="Bairro" />
              </div>

              <div className={styles.formGroup}>
                <label>Complemento</label>
                <Field name="complemento" type="text" placeholder="Complemento" />
              </div>

              <div className={styles.formGroup}>
                <label>Telefone</label>
                <Field name="telefone" type="text" placeholder="Telefone" />
                {errors.telefone && touched.telefone && (
                  <p className={styles.errorMessage}>{errors.telefone}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>E-mail</label>
                <Field name="email" type="email" placeholder="E-mail" />
                {errors.email && touched.email && (
                  <p className={styles.errorMessage}>{errors.email}</p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Senha</label>
                <Field name="senha" type="password" placeholder="Senha" />
                {errors.senha && touched.senha && (
                  <p className={styles.errorMessage}>{errors.senha}</p>
                )}
              </div>

              <button type="submit">Cadastrar</button>
            </Form>
          )}
        </Formik>
        <button onClick={() => navigate('/dashboard-professor')} className={styles.backButton}>
          Voltar
        </button>
      </div>
    </div>
  );
};

export default CadastroAluno;
