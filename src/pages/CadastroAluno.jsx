import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Cadastro.module.css';
import { auth, db } from '../config/firebaseConfig'; // Certifique-se de ter configurado seu Firebase corretamente
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/authContext'; // Contexto de autenticação

const CadastroAluno = () => {
  const [formData, setFormData] = useState({
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
    tipo_pessoa: 'aluno',
  });
  const [errorMessage, setErrorMessage] = useState(null);
  const [professorId, setProfessorId] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setProfessorId(user.uid);
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCepChange = async (e) => {
    let cep = e.target.value.replace(/\D/g, '');
    if (cep.length > 5) {
      cep = `${cep.slice(0, 5)}-${cep.slice(5, 8)}`;
    }
    setFormData({ ...formData, cep });

    if (cep.length === 9) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep.replace('-', '')}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setFormData((prevState) => ({
            ...prevState,
            cidade: data.localidade,
            uf: data.uf,
            endereco: data.logradouro,
            bairro: data.bairro,
          }));
        } else {
          alert('CEP inválido!');
        }
      } catch (error) {
        console.error('Erro ao buscar o CEP:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Cadastro do aluno no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;

      // Registro do aluno na coleção "Pessoa"
      await setDoc(doc(db, 'Pessoa', user.uid), {
        nome_completo: formData.nome_completo,
        data_nascimento: formData.data_nascimento,
        genero: formData.genero,
        cep: formData.cep,
        cidade: formData.cidade,
        uf: formData.uf,
        endereco: formData.endereco,
        numero_casa: formData.numero_casa,
        bairro: formData.bairro,
        complemento: formData.complemento,
        telefone: formData.telefone,
        email: formData.email,
        tipo_pessoa: formData.tipo_pessoa,
        id_user: user.uid,
        id_professor: professorId,
        id_aluno: user.uid,
        data_criacao: serverTimestamp(), // Salvando a data de criação com o nome 'data_criacao'
      });

      alert('Aluno cadastrado com sucesso!');
      navigate('/dashboard-professor');
    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error.message);
      setErrorMessage(`Erro ao cadastrar aluno: ${error.message}`);
    }
  };

  const handleBack = () => {
    navigate('/dashboard-professor');
  };

  return (
    <div className={styles.cadastroPage}>
      <div className={styles.cadastroContainer}>
        <h1 className={styles.cadastroHeading}>Cadastrar Aluno</h1>
        {errorMessage && <p className={styles.errorMessage}>{errorMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nome Completo</label>
            <input
              type="text"
              name="nome_completo"
              placeholder="Nome Completo"
              value={formData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Data de Nascimento</label>
            <input
              type="date"
              name="data_nascimento"
              value={formData.data_nascimento}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Gênero</label>
            <select name="genero" value={formData.genero} onChange={handleChange} required>
              <option value="" disabled>Selecione o Gênero</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>CEP</label>
            <input
              type="text"
              name="cep"
              placeholder="CEP"
              value={formData.cep}
              onChange={handleCepChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Cidade</label>
            <input
              type="text"
              name="cidade"
              placeholder="Cidade"
              value={formData.cidade}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>UF</label>
            <input
              type="text"
              name="uf"
              placeholder="UF"
              value={formData.uf}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Endereço</label>
            <input
              type="text"
              name="endereco"
              placeholder="Endereço"
              value={formData.endereco}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Número da Residência</label>
            <input
              type="text"
              name="numero_casa"
              placeholder="Número da Residência"
              value={formData.numero_casa}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Bairro</label>
            <input
              type="text"
              name="bairro"
              placeholder="Bairro"
              value={formData.bairro}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Complemento</label>
            <input
              type="text"
              name="complemento"
              placeholder="Complemento"
              value={formData.complemento}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input
              type="text"
              name="telefone"
              placeholder="Telefone"
              value={formData.telefone}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>E-mail</label>
            <input
              type="email"
              name="email"
              placeholder="E-mail"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Senha</label>
            <input
              type="password"
              name="senha"
              placeholder="Senha"
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit">Cadastrar</button>
        </form>
        <button onClick={handleBack} className={styles.backButton}>Voltar</button>
      </div>
    </div>
  );
};

export default CadastroAluno;
