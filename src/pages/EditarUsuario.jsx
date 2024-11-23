import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updateEmail, updatePassword } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/EditarUsuario.module.css';

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
  const [originalSenha, setOriginalSenha] = useState('');
  const [tipoPessoa, setTipoPessoa] = useState('');
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const fetchUserData = async () => {
      try {
        const userDoc = doc(db, 'Pessoa', currentUser.uid);
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
            senha: '', // Não exibe a senha, apenas um campo vazio
          });
          setOriginalEmail(data.email || '');
          setOriginalSenha(data.senha || '');
          setTipoPessoa(data.tipo_pessoa || '');
        } else {
          setError('Dados do usuário não encontrados.');
        }
      } catch (error) {
        console.error('Erro ao buscar informações do usuário:', error);
        setError('Erro ao carregar informações do usuário.');
      }
    };

    fetchUserData();
  }, [currentUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCepChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData((prev) => ({ ...prev, cep }));

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();

        if (!data.erro) {
          setFormData((prev) => ({
            ...prev,
            cidade: data.localidade || '',
            uf: data.uf || '',
            endereco: data.logradouro || '',
            bairro: data.bairro || '',
            complemento: data.complemento || '',
          }));
        } else {
          setError('CEP inválido ou não encontrado.');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const handleTelefoneChange = (e) => {
    let telefone = e.target.value.replace(/\D/g, '');
    if (telefone.length > 11) telefone = telefone.slice(0, 11);
    telefone = telefone.length > 6
      ? `(${telefone.slice(0, 2)}) ${telefone.slice(2, 7)}-${telefone.slice(7)}`
      : telefone.length > 2
      ? `(${telefone.slice(0, 2)}) ${telefone.slice(2)}`
      : telefone;
    setFormData((prev) => ({ ...prev, telefone }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userDoc = doc(db, 'Pessoa', currentUser.uid);
      let requiresReLogin = false;

      // Atualizar e-mail
      if (formData.email !== originalEmail) {
        await updateEmail(auth.currentUser, formData.email);
        await updateDoc(userDoc, { email: formData.email });
        requiresReLogin = true;
      }

      // Atualizar senha
      if (formData.senha && formData.senha !== originalSenha) {
        await updatePassword(auth.currentUser, formData.senha);
        await updateDoc(userDoc, { senha: formData.senha });
        requiresReLogin = true;
      }

      // Atualizar outros campos
      const updatedData = { ...formData };
      delete updatedData.senha; // Não armazenar senha diretamente
      await updateDoc(userDoc, updatedData);

      if (requiresReLogin) {
        alert('Alterações salvas com sucesso. Você precisará fazer login novamente.');
        auth.signOut();
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
    navigate(tipoPessoa === 'professor' ? '/dashboard-professor' : '/dashboard-aluno');
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
          <select
            name="genero"
            value={formData.genero}
            onChange={handleChange}
            required
          >
            <option value="">Selecione</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="outro">Outro</option>
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
          <label>Número</label>
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
          <label>Email</label>
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
          />
        </div>
        <div className={styles.formGroup}>
          <button type="submit">Atualizar</button>
        </div>
      </form>
      <button onClick={handleBackToDashboard} className={styles.backButton}>Voltar ao Dashboard</button>
    </div>
  );
};

export default EditarUsuario;
