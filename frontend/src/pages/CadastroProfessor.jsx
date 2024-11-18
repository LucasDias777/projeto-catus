import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Cadastro.module.css'; // Importa como módulo CSS

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
    complemento: '',
    bairro: '',
    telefone: '',
    email: '',
    senha: '',
    tipo_pessoa: 'professor',
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

  const isEmailValid = (email) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isEmailValid(formData.email)) {
      setError('O e-mail fornecido é inválido.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/cadastrar', formData);

      if (response.status === 200) {
        alert('Usuário cadastrado com sucesso!');
        navigate('/login');
      } else {
        throw new Error('Erro no cadastro.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar usuário:', error);
      setError('Erro ao cadastrar usuário. Tente novamente.');
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
            <input type="text" name="nome_completo" value={formData.nome_completo} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Data de Nascimento</label>
            <input type="date" name="data_nascimento" value={formData.data_nascimento} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Gênero</label>
            <select name="genero" value={formData.genero} onChange={handleChange} required>
              <option value="" disabled>Selecione</option>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>CEP</label>
            <input type="text" name="cep" value={formData.cep} onChange={handleCepChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Cidade</label>
            <input type="text" name="cidade" value={formData.cidade} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>UF</label>
            <input type="text" name="uf" value={formData.uf} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Endereço</label>
            <input type="text" name="endereco" value={formData.endereco} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Número</label>
            <input type="text" name="numero_casa" value={formData.numero_casa} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Complemento</label>
            <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} />
          </div>
          <div className={styles.formGroup}>
            <label>Bairro</label>
            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Telefone</label>
            <input type="text" name="telefone" value={formData.telefone} onChange={handleTelefoneChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>E-mail</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Senha</label>
            <input type="password" name="senha" value={formData.senha} onChange={handleChange} required />
          </div>
          <button type="submit" className={styles.submitButton}>Cadastrar</button>
        </form>
        <button onClick={() => navigate('/login')} className={styles.backButton}>Voltar</button>
      </div>
    </div>
  );
};

export default CadastroProfessor;
