import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../config/firebaseConfig'; // Importa Firebase Auth e Firestore
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import styles from '../styles/Cadastro.module.css';

const CadastroProfessor = () => {
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
    tipo_pessoa: 'professor',
  });

  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Atualiza os campos do formulário conforme o usuário digita
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Formata o CEP e faz a busca na API ViaCEP
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
          setError('CEP inválido!');
        }
      } catch (error) {
        console.error('Erro ao buscar o CEP:', error);
        setError('Erro ao buscar o CEP.');
      }
    }
  };

  // Formata o telefone
  const handleTelefoneChange = (e) => {
    let telefone = e.target.value.replace(/\D/g, '');
    if (telefone.length > 11) {
      telefone = telefone.slice(0, 11);
    }
    if (telefone.length > 6) {
      telefone = `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7, 11)}`;
    } else if (telefone.length > 2) {
      telefone = `(${telefone.slice(0, 2)}) ${telefone.slice(2)}`;
    }
    setFormData({ ...formData, telefone });
  };

  // Valida o formato do e-mail
  const isEmailValid = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  // Submissão do formulário
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailValid(formData.email)) {
      setError('O e-mail fornecido é inválido.');
      return;
    }

    try {
      // Cria o professor no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;
      console.log('Usuário criado no Firebase Auth com sucesso:', user.uid);

      // Cria o professor na coleção Firestore usando o uid do Firebase Auth
      const pessoaRef = doc(collection(db, 'Pessoa'), user.uid); // Usando o UID do Firebase Auth para definir o ID no Firestore
      await setDoc(pessoaRef, {
        ...formData,
        id_professor: user.uid, // Definindo o id_professor como o UID gerado
        data_criacao: serverTimestamp(),
      });

      console.log('Professor cadastrado no Firestore com sucesso.');

      // Sucesso, redireciona para login
      alert('Usuário cadastrado com sucesso!');
      navigate('/login');
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);

      // Exibe mensagem de erro dependendo do tipo de falha
      if (error.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está em uso. Tente outro.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha fornecida é muito fraca.');
      } else {
        setError('Erro ao cadastrar usuário. Tente novamente.');
      }

      // Rollback no caso de falha
      if (auth.currentUser) {
        try {
          await deleteUser(auth.currentUser);
        } catch (deleteError) {
          console.error('Erro ao excluir usuário no Firebase Auth:', deleteError);
        }
      }
    }
  };

  return (
    <div className={styles.cadastroPage}>
      <div className={styles.cadastroContainer}>
        <h1 className={styles.cadastroHeading}>Cadastre-se</h1>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nome Completo</label>
            <input
              type="text"
              name="nome_completo"
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
              <option value="" disabled>
                Selecione
              </option>
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
              value={formData.complemento}
              onChange={handleChange}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleTelefoneChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>E-mail</label>
            <input
              type="email"
              name="email"
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
              value={formData.senha}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Cadastrar
          </button>
        </form>
        <button onClick={() => navigate('/login')} className={styles.backButton}>
          Voltar
        </button>
      </div>
    </div>
  );
};

export default CadastroProfessor;
