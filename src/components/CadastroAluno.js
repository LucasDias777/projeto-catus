import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Cadastro.module.css';

const CadastroAluno = () => {
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    dataNascimento: '',
    genero: '',
    cep: '',
    cidade: '',
    uf: '',
    endereco: '',
    numeroCasa: '',
    bairro: '',
    telefone: '',
    email: '',
    senha: '',
    repetirSenha: '',
    tipoPessoa: 'aluno'
  });

  const [errorMessage, setErrorMessage] = useState(null);
  const [professorId, setProfessorId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setProfessorId(user.uid);
      }
    });

    return () => unsubscribe();
  }, []);

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
            bairro: data.bairro
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

    if (formData.senha !== formData.repetirSenha) {
      setErrorMessage('As senhas não coincidem!');
      return;
    }

    try {
      const professorEmail = auth.currentUser.email; // Salva email do professor
      //const professorPassword = 123456;//auth.currentUser.senha;
      const professorPassword = prompt('Digite sua senha para confirmar o cadastro:'); 
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;

      await setDoc(doc(db, 'pessoa', user.uid), {
        nomeCompleto: formData.nomeCompleto,
        dataNascimento: formData.dataNascimento,
        genero: formData.genero,
        cep: Number(formData.cep.replace('-', '')),
        cidade: formData.cidade,
        uf: formData.uf,
        endereco: formData.endereco,
        numeroCasa: Number(formData.numeroCasa),
        bairro: formData.bairro,
        telefone: formData.telefone,
        email: formData.email,
        tipoPessoa: formData.tipoPessoa,
        userId: user.uid,
        professorId: professorId
      });
      await signInWithEmailAndPassword(auth, professorEmail, professorPassword);
      alert('Aluno cadastrado com sucesso!');
    
      
      
      setFormData({
        nomeCompleto: '',
        dataNascimento: '',
        genero: '',
        cep: '',
        cidade: '',
        uf: '',
        endereco: '',
        numeroCasa: '',
        bairro: '',
        telefone: '',
        email: '',
        senha: '',
        repetirSenha: '',
        tipoPessoa: 'aluno'
      });
      setErrorMessage(null);

    } catch (error) {
      console.error('Erro ao cadastrar aluno:', error.message);
      setErrorMessage(`Erro ao cadastrar aluno: ${error.message}`);
    }
  };

  const handleBack = () => {
    if (auth.currentUser) {
      navigate('/dashboard-professor');
    } else {
      // Forçar redirecionamento para o dashboard mesmo sem autenticação
      navigate('/dashboard-professor');
    }
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
              name="nomeCompleto"
              placeholder="Nome Completo"
              value={formData.nomeCompleto}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Data de Nascimento</label>
            <input
              type="date"
              name="dataNascimento"
              value={formData.dataNascimento}
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
              onBlur={handleCepChange}
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
              name="numeroCasa"
              placeholder="Número da Residência"
              value={formData.numeroCasa}
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
          <div className={styles.formGroup}>
            <label>Confirme sua senha</label>
            <input
              type="password"
              name="repetirSenha"
              placeholder="Confirme sua senha"
              value={formData.repetirSenha}
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
