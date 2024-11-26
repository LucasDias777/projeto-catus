import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, query, where, getDocs, collection } from 'firebase/firestore';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { useAuth } from '../contexts/authContext';
import styles from '../styles/EditarUsuario.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

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

  const [originalData, setOriginalData] = useState({});
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
          setFormData({ ...data, senha: '' });
          setOriginalData(data);
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

  const handleCEPChange = async (e) => {
    const cep = e.target.value.replace(/\D/g, '');
    setFormData({ ...formData, cep });

    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await response.json();
        if (data.erro) throw new Error('CEP não encontrado.');

        setFormData({
          ...formData,
          cep,
          cidade: data.localidade || '',
          uf: data.uf || '',
          endereco: data.logradouro || '',
          bairro: data.bairro || '',
          complemento: data.complemento || '',
        });
      } catch (error) {
        console.error('Erro ao buscar informações do CEP:', error);
        setError('CEP inválido ou não encontrado.');
      }
    }
  };

  const reauthenticateUser = async (senhaAtual) => {
    const user = auth.currentUser;
    const credential = EmailAuthProvider.credential(user.email, senhaAtual);

    try {
      await reauthenticateWithCredential(user, credential);
    } catch (error) {
      throw new Error('Senha atual incorreta.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const userDoc = doc(db, 'Pessoa', currentUser.uid);

      // Verificação de senha e e-mail antes de qualquer atualização
      if (formData.email !== originalData.email || formData.senha) {
        const senhaAtual = prompt('Confirme sua senha atual para continuar.');
        if (!senhaAtual) {
          setError('Senha atual é obrigatória para alterar email ou senha.');
          return;
        }
        await reauthenticateUser(senhaAtual);
      }

      // Verificação do e-mail antes de atualizar
      if (formData.email !== originalData.email) {
        const emailQuery = query(
          collection(db, 'Pessoa'),
          where('email', '==', formData.email)
        );
        const emailSnapshot = await getDocs(emailQuery);

        if (!emailSnapshot.empty) {
          setError('Este email já está em uso por outro usuário.');
          return;
        }

        try {
          // Atualizar e-mail
          await updateEmail(auth.currentUser, formData.email);
          await sendEmailVerification(auth.currentUser);
          alert('Um e-mail de verificação foi enviado para o novo endereço. Por favor, verifique sua caixa de entrada.');
        } catch (error) {
          if (error.code === 'auth/email-already-in-use') {
            setError('Este e-mail já está em uso.');
          } else if (error.code === 'auth/requires-recent-login') {
            setError('Sessão expirada. Faça login novamente para alterar o e-mail.');
          } else {
            setError('Erro desconhecido ao tentar alterar o e-mail.');
          }
          return;
        }
      }

      // Atualizar senha, caso fornecida
      if (formData.senha) {
        await updatePassword(auth.currentUser, formData.senha);
      }

      // Atualizar os dados no Firestore
      const updatedData = { ...formData };
      delete updatedData.senha;  // Remover a senha do objeto
      await updateDoc(userDoc, updatedData);

      alert('Informações atualizadas com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar informações:', error);
      setError(error.message || 'Erro ao atualizar informações.');
    }
  };

  const handleBackToDashboard = () => {
    navigate(tipoPessoa === 'professor' ? '/dashboard-professor' : '/dashboard-aluno');
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Editar Informações</h1>
        <button onClick={handleBackToDashboard} className={styles.backButton}>
        <i class="fa-solid fa-rotate-left"></i> Voltar ao Dashboard
        </button>
      </div>

      <div className={styles.container}>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Nome Completo</label>
              <input
                type="text"
                name="nome_completo"
                value={formData.nome_completo}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Data de Nascimento</label>
              <input
                type="date"
                name="data_nascimento"
                value={formData.data_nascimento}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Gênero</label>
              <select
                name="genero"
                value={formData.genero}
                onChange={handleChange}
                className={styles.formControl}
              >
                <option value="">Selecione</option>
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
                onChange={handleCEPChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Cidade</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>UF</label>
              <input
                type="text"
                name="uf"
                value={formData.uf}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Endereço</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Número da Residência</label>
              <input
                type="text"
                name="numero_casa"
                value={formData.numero_casa}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Bairro</label>
              <input
                type="text"
                name="bairro"
                value={formData.bairro}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Complemento</label>
              <input
                type="text"
                name="complemento"
                value={formData.complemento}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
            <div className={styles.formGroup}>
              <label>E-mail</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Nova Senha</label>
              <input
                type="password"
                name="senha"
                value={formData.senha}
                onChange={handleChange}
                className={styles.formControl}
              />
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <button type="submit">
            <i class="fa-solid fa-pen-to-square"></i> Atualizar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarUsuario;
