import React, { useState } from 'react';
import { auth, db } from '../firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Cadastro.module.css'; // Importa como módulo CSS

const CadastroProfessor = () => {
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
    tipoPessoa: 'professor'
  });

  const [error, setError] = useState(null); // Estado para armazenar mensagens de erro
  const navigate = useNavigate();

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
          setError('CEP inválido!');
        }
      } catch (error) {
        console.error('Erro ao buscar o CEP:', error);
        setError('Erro ao buscar o CEP.');
      }
    }
  };

  const handleTelefoneChange = (e) => {
    let telefone = e.target.value.replace(/\D/g, ''); // Remove caracteres não numéricos
    if (telefone.length > 11) {
      telefone = telefone.slice(0, 11); // Limita o número de dígitos a 11
    }
    if (telefone.length > 6) {
      telefone = `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7, 11)}`;
    } else if (telefone.length > 2) {
      telefone = `(${telefone.slice(0, 2)}) ${telefone.slice(2)}`;
    }
    setFormData({ ...formData, telefone });
  };

  const isEmailValid = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificação de e-mail
    if (!isEmailValid(formData.email)) {
      setError('O e-mail fornecido é inválido.');
      return;
    }

    // Verificação de senha
    if (formData.senha !== formData.repetirSenha) {
      setError('As senhas não coincidem!');
      return;
    }

    try {
      // Cria um usuário com email e senha no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.senha);
      const user = userCredential.user;

      // Cria um documento no Firestore com o ID do documento gerado pelo Firebase
      const userDocRef = doc(db, 'pessoa', user.uid);

      await setDoc(userDocRef, {
        nomeCompleto: formData.nomeCompleto,
        dataNascimento: formData.dataNascimento,
        genero: formData.genero,
        cep: Number(formData.cep.replace('-', '')), // Armazena como número
        cidade: formData.cidade,
        uf: formData.uf,
        endereco: formData.endereco,
        numeroCasa: Number(formData.numeroCasa), // Armazena como número
        bairro: formData.bairro,
        telefone: formData.telefone,
        email: formData.email,
        tipoPessoa: formData.tipoPessoa,
        userId: user.uid, // Usa o ID do usuário gerado pelo Firebase Authentication
      });

      alert('Usuário cadastrado com sucesso!');
      navigate('/login'); // Navega para a página de login após o cadastro
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      // Trata diferentes tipos de erros retornados pelo Firebase
      switch (error.code) {
        case 'auth/email-already-in-use':
          setError('Este e-mail já está em uso.');
          break;
        case 'auth/invalid-email':
          setError('O e-mail fornecido é inválido.');
          break;
        case 'auth/weak-password':
          setError('A senha deve ter pelo menos 6 caracteres.');
          break;
        case 'auth/network-request-failed':
          setError('Erro de conexão com a rede. Tente novamente.');
          break;
        default:
          setError('Erro ao cadastrar usuário. Tente novamente.');
          break;
      }
    }
  };

  return (
    <div className={styles.cadastroPage}>
      <div className={styles.cadastroContainer}>
        <h1 className={styles.cadastroHeading}>Cadastre-se</h1>
        {error && <p className={styles.error}>{error}</p>} {/* Exibe mensagens de erro */}
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nome Completo</label>
            <input type="text" name="nomeCompleto" placeholder="Nome Completo" value={formData.nomeCompleto} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Data de Nascimento</label>
            <input type="date" name="dataNascimento" value={formData.dataNascimento} onChange={handleChange} required />
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
            <input type="text" name="cep" placeholder="CEP" value={formData.cep} onChange={handleCepChange} onBlur={handleCepChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Cidade</label>
            <input type="text" name="cidade" placeholder="Cidade" value={formData.cidade} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>UF</label>
            <input type="text" name="uf" placeholder="UF" value={formData.uf} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Endereço</label>
            <input type="text" name="endereco" placeholder="Endereço" value={formData.endereco} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Número da Residência</label>
            <input type="text" name="numeroCasa" placeholder="Número da Residência" value={formData.numeroCasa} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Bairro</label>
            <input type="text" name="bairro" placeholder="Bairro" value={formData.bairro} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input type="text" name="telefone" placeholder="Telefone" value={formData.telefone} onChange={handleTelefoneChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>E-mail</label>
            <input type="email" name="email" placeholder="E-mail" value={formData.email} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Senha</label>
            <input type="password" name="senha" placeholder="Senha" value={formData.senha} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Repita a Senha</label>
            <input type="password" name="repetirSenha" placeholder="Repita a Senha" value={formData.repetirSenha} onChange={handleChange} required />
          </div>
          <button type="submit" className={styles.submitButton}>Cadastrar</button>
        </form>
        <button onClick={() => navigate('/login')} className={styles.backButton}>Voltar</button>
      </div>
    </div>
  );
};

export default CadastroProfessor;
