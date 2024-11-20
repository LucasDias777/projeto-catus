import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig'; // Ajuste o caminho conforme necessário
import { AuthContext } from '../contexts/authContext';
import styles from './EditarUsuario.module.css'; // Certifique-se de criar o arquivo CSS correspondente

const EditarUsuario = () => {
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
  });

  const [originalEmail, setOriginalEmail] = useState('');
  const [error, setError] = useState(null);
  const [tipoPessoa, setTipoPessoa] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const fetchUserData = async () => {
      try {
        const userDoc = doc(db, 'Pessoa', user.uid);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setFormData({
            nome_completo: data.nome_completo || '',
            data_nascimento: data.data_nascimento || '',
            genero: data.genero || '',
            cep: data.cep || '',
            cidade: data.cidade || '',
            uf: data.uf || '',
            endereco: data.endereco || '',
            numero_casa: data.numero_casa || '',
            bairro: data.bairro || '',
            complemento: data.complemento || '',
            telefone: data.telefone || '',
            email: data.email || '',
            senha: '', // Não carregar senha por segurança
          });
          setOriginalEmail(data.email || '');
          setTipoPessoa(data.tipo_pessoa || null);
        } else {
          setError('Dados do usuário não encontrados.');
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        setError('Erro ao carregar informações do usuário.');
      }
    };

    fetchUserData();
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTelefoneChange = (e) => {
    const telefone = e.target.value;
    setFormData({ ...formData, telefone });
  };
  
  const handleCepChange = async (e) => {
    const cep = e.target.value;
    setFormData({ ...formData, cep });

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData({
            ...formData,
            cep,
            cidade: data.localidade || '',
            uf: data.uf || '',
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            complemento: data.complemento || '',
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        setError('CEP inválido ou não encontrado.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const userDoc = doc(db, 'Pessoa', user.uid);

      await updateDoc(userDoc, {
        ...formData,
        senha: undefined, // Não salvar a senha no Firestore
      });

      let requiresReLogin = false;

      if (formData.email !== originalEmail) {
        await updateEmail(auth.currentUser, formData.email);
        requiresReLogin = true;
      }

      if (formData.senha) {
        await updatePassword(auth.currentUser, formData.senha);
        requiresReLogin = true;
      }

      if (requiresReLogin) {
        alert('As alterações foram salvas com sucesso. Por favor, faça login novamente.');
        navigate('/login');
        return;
      }

      alert('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      setError('Erro ao atualizar informações. Tente novamente.');
    }
  };

  const handleBackToDashboard = () => {
    if (tipoPessoa === 'professor') {
      navigate('/dashboard-professor');
    } else if (tipoPessoa === 'aluno') {
      navigate('/dashboard-aluno');
    } else {
      navigate('/');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Editar Informações</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
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
            <label>Bairro</label>
            <input type="text" name="bairro" value={formData.bairro} onChange={handleChange} required />
          </div>
          <div className={styles.formGroup}>
            <label>Complemento</label>
            <input type="text" name="complemento" value={formData.complemento} onChange={handleChange} />
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
        
        <button type="submit" className={styles.button}>Salvar</button>
        <button type="button" className={styles.buttonSecondary} onClick={handleBackToDashboard}>
          Voltar ao Dashboard
        </button>
      </form>
    </div>
  );
};

export default EditarUsuario;
